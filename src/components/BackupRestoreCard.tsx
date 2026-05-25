import { useRef, useState } from 'react';
import { db } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Upload, AlertTriangle, Share2, Clipboard } from 'lucide-react';
import { toast } from 'sonner';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { useTranslation } from 'react-i18next';

/** Ritorna true se siamo dentro una WebView Capacitor (Android/iOS) */
function isCapacitor() {
  return typeof (window as unknown as Record<string, unknown>).Capacitor !== 'undefined';
}

// v1 = solo plants/tasks/harvests/notes (bug storico).
// v2 = tutte le 9 tabelle in un unico file (crash WebView su Android con molte foto base64).
// v3 = backup splittato. kind: 'data' (8 tabelle senza foto) | 'photos' (solo plantPhotos).
const BACKUP_FORMAT_VERSION = 3;

function reviveDates<T extends Record<string, unknown>>(row: T, dateFields: string[]): T {
  const out: Record<string, unknown> = { ...row };
  for (const f of dateFields) {
    if (out[f] != null) out[f] = new Date(out[f] as string);
  }
  const attachments = (out as { attachments?: Array<Record<string, unknown>> }).attachments;
  if (Array.isArray(attachments)) {
    (out as { attachments: Array<Record<string, unknown>> }).attachments = attachments.map(a => ({
      ...a,
      addedAt: a.addedAt ? new Date(a.addedAt as string) : a.addedAt,
    }));
  }
  return out as T;
}

type ParsedBackup = {
  version: number;
  kind?: 'data' | 'photos';
  data: Record<string, unknown[]>;
};

export default function BackupRestoreCard() {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [pending, setPending] = useState<ParsedBackup | null>(null);

  // ─── BUILD PAYLOAD ─────────────────────────────────────────────────────────
  // Niente pretty-print (null,2): risparmia ~30% memoria sulla stringa.

  const buildDataJson = async () => {
    const [plantTypes, plants, tasks, recipes, harvests, notes, settings, gardenLayout] =
      await Promise.all([
        db.plantTypes.toArray(),
        db.plants.toArray(),
        db.tasks.toArray(),
        db.recipes.toArray(),
        db.harvests.toArray(),
        db.notes.toArray(),
        db.settings.toArray(),
        db.gardenLayout.toArray(),
      ]);
    return JSON.stringify({
      version: BACKUP_FORMAT_VERSION,
      kind: 'data',
      exportedAt: new Date().toISOString(),
      appVersion: __APP_VERSION__,
      data: { plantTypes, plants, tasks, recipes, harvests, notes, settings, gardenLayout },
    });
  };

  const buildPhotosJson = async () => {
    const plantPhotos = await db.plantPhotos.toArray();
    return {
      json: JSON.stringify({
        version: BACKUP_FORMAT_VERSION,
        kind: 'photos',
        exportedAt: new Date().toISOString(),
        appVersion: __APP_VERSION__,
        data: { plantPhotos },
      }),
      count: plantPhotos.length,
    };
  };

  // Promise.race timeout — protegge dai deadlock silenziosi di Capacitor.
  function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout ${label} (>${ms / 1000}s)`)), ms)
      ),
    ]);
  }

  // ─── SAVE / SHARE ──────────────────────────────────────────────────────────
  // Scrive su Directory.Cache (no permessi) e apre la dialog di sistema Share,
  // così l'utente sceglie "Salva nei File" → Download / Drive / WhatsApp ecc.

  async function writeAndShare(filename: string, json: string, dialogTitle: string) {
    await withTimeout(
      Filesystem.writeFile({
        path: filename,
        data: json,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      }),
      30000,
      `writeFile ${filename}`
    );
    const uriResult = await Filesystem.getUri({
      path: filename,
      directory: Directory.Cache,
    });
    await withTimeout(
      Share.share({
        title: 'OrtoManager Backup',
        text: filename,
        url: uriResult.uri,
        dialogTitle,
      }),
      60000,
      `Share ${filename}`
    );
  }

  const handleSaveBackup = async () => {
    setIsExporting(true);
    try {
      const date = new Date().toISOString().slice(0, 10);

      // 1) FILE DATI
      let dataJson: string;
      try {
        dataJson = await buildDataJson();
      } catch (err) {
        toast.error(t('backup.export_error_detail', { message: (err as Error).message }));
        console.error('[backup] buildDataJson failed', err);
        return;
      }

      const dataFilename = `ortomanager-backup-${date}.json`;

      if (!isCapacitor()) {
        // Web: download via blob anchor
        triggerDownload(dataFilename, dataJson);
        toast.success(t('backup.export_success_web'));
      } else {
        try {
          await writeAndShare(dataFilename, dataJson, t('backup.dialog_title_data'));
        } catch (err) {
          const msg = (err as Error).message || '';
          if (msg.includes('cancel') || msg.includes('abort')) {
            toast.info(t('backup.share_cancelled'));
            return;
          }
          toast.error(t('backup.export_error_detail', { message: msg }), { duration: 8000 });
          console.error('[backup] data share failed', err);
          return;
        }
      }

      // libera la memoria della stringa dati prima di costruire quella delle foto
      dataJson = '';

      // 2) FILE FOTO (solo se presenti)
      let photosResult: { json: string; count: number };
      try {
        photosResult = await buildPhotosJson();
      } catch (err) {
        toast.error(t('backup.export_error_detail', { message: (err as Error).message }));
        console.error('[backup] buildPhotosJson failed', err);
        return;
      }

      if (photosResult.count === 0) {
        toast.success(t('backup.data_only_done'), { duration: 8000 });
        return;
      }

      const photosFilename = `ortomanager-foto-${date}.json`;

      if (!isCapacitor()) {
        triggerDownload(photosFilename, photosResult.json);
        toast.success(t('backup.photos_done_web', { count: photosResult.count }));
      } else {
        toast.info(t('backup.photos_next', { count: photosResult.count }), { duration: 5000 });
        try {
          await writeAndShare(photosFilename, photosResult.json, t('backup.dialog_title_photos'));
          toast.success(t('backup.photos_done', { count: photosResult.count }));
        } catch (err) {
          const msg = (err as Error).message || '';
          if (msg.includes('cancel') || msg.includes('abort')) {
            toast.info(t('backup.photos_share_cancelled'));
          } else {
            toast.error(t('backup.export_error_detail', { message: msg }), { duration: 8000 });
            console.error('[backup] photos share failed', err);
          }
        }
      }
    } finally {
      setIsExporting(false);
    }
  };

  function triggerDownload(filename: string, json: string) {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ─── FALLBACK: clipboard. Solo dati, MAI le foto (clipboard si rompe). ──
  const handleCopyBackup = async () => {
    setIsExporting(true);
    try {
      let json: string;
      try {
        json = await buildDataJson();
      } catch (err) {
        toast.error(t('backup.copy_error', { message: (err as Error).message }));
        return;
      }

      try {
        await navigator.clipboard.writeText(json);
        toast.success(t('backup.copy_success'), { duration: 10000 });
        return;
      } catch {
        // legacy fallback
      }

      try {
        const ta = document.createElement('textarea');
        ta.value = json;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        if (ok) {
          toast.success(t('backup.copy_success'), { duration: 10000 });
        } else {
          toast.error(t('backup.copy_error', { message: 'execCommand returned false' }));
        }
      } catch (err) {
        toast.error(t('backup.copy_error', { message: (err as Error).message }));
        console.error('[backup] copy fallback failed', err);
      }
    } finally {
      setIsExporting(false);
    }
  };

  // ─── IMPORT ────────────────────────────────────────────────────────────────

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (!parsed.data || !parsed.version) {
          toast.error(t('backup.invalid_file'));
          return;
        }
        // kind è opzionale per backward compat (v1/v2 = sempre data).
        const kind: 'data' | 'photos' = parsed.kind === 'photos' ? 'photos' : 'data';
        setPending({ version: typeof parsed.version === 'number' ? parsed.version : 1, kind, data: parsed.data });
        setShowRestoreConfirm(true);
      } catch {
        toast.error(t('backup.corrupt_file'));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmRestore = async () => {
    if (!pending) return;
    setIsRestoring(true);
    try {
      const d = pending.data;

      if (pending.kind === 'photos') {
        // Solo foto: clear + restore plantPhotos. NON tocca le altre tabelle.
        await db.transaction('rw', db.plantPhotos, async () => {
          await db.plantPhotos.clear();
          if (d.plantPhotos?.length) {
            await db.plantPhotos.bulkPut(
              (d.plantPhotos as Record<string, unknown>[]).map(r =>
                reviveDates(r, ['date'])
              ) as Parameters<typeof db.plantPhotos.bulkPut>[0]
            );
          }
        });
        toast.success(t('backup.import_photos_success', { count: d.plantPhotos?.length ?? 0 }));
      } else {
        // Dati: ripristina tutte le tabelle presenti tranne plantPhotos.
        // Per i backup v2 (che includono plantPhotos) le foto restano ripristinate
        // se l'utente importa un vecchio file unificato — backward compat.
        await db.transaction(
          'rw',
          [db.plantTypes, db.plants, db.tasks, db.recipes, db.harvests, db.notes, db.settings, db.plantPhotos, db.gardenLayout],
          async () => {
            if (d.plantTypes?.length) {
              await db.plantTypes.clear();
              await db.plantTypes.bulkPut(d.plantTypes as Parameters<typeof db.plantTypes.bulkPut>[0]);
            }
            if (d.recipes?.length) {
              await db.recipes.clear();
              await db.recipes.bulkPut(d.recipes as Parameters<typeof db.recipes.bulkPut>[0]);
            }
            if (d.settings?.length) {
              await db.settings.clear();
              await db.settings.bulkPut(d.settings as Parameters<typeof db.settings.bulkPut>[0]);
            }
            if (d.gardenLayout?.length) {
              await db.gardenLayout.clear();
              await db.gardenLayout.bulkPut(d.gardenLayout as Parameters<typeof db.gardenLayout.bulkPut>[0]);
            }
            if (d.plants?.length) {
              await db.plants.clear();
              await db.plants.bulkPut(
                (d.plants as Record<string, unknown>[]).map(p =>
                  reviveDates(p, ['plantedDate', 'lastWatered'])
                ) as Parameters<typeof db.plants.bulkPut>[0]
              );
            }
            if (d.tasks?.length) {
              await db.tasks.clear();
              await db.tasks.bulkPut(
                (d.tasks as Record<string, unknown>[]).map(r =>
                  reviveDates(r, ['dueDate', 'createdAt'])
                ) as Parameters<typeof db.tasks.bulkPut>[0]
              );
            }
            if (d.harvests?.length) {
              await db.harvests.clear();
              await db.harvests.bulkPut(
                (d.harvests as Record<string, unknown>[]).map(r =>
                  reviveDates(r, ['date'])
                ) as Parameters<typeof db.harvests.bulkPut>[0]
              );
            }
            if (d.notes?.length) {
              await db.notes.clear();
              await db.notes.bulkPut(
                (d.notes as Record<string, unknown>[]).map(r =>
                  reviveDates(r, ['date'])
                ) as Parameters<typeof db.notes.bulkPut>[0]
              );
            }
            // Compat v2: file unificato → ripristina anche le foto.
            if (d.plantPhotos?.length) {
              await db.plantPhotos.clear();
              await db.plantPhotos.bulkPut(
                (d.plantPhotos as Record<string, unknown>[]).map(r =>
                  reviveDates(r, ['date'])
                ) as Parameters<typeof db.plantPhotos.bulkPut>[0]
              );
            }
          }
        );

        if (pending.version < 2) {
          toast.success(t('backup.legacy_v1_imported'));
        } else if (pending.version === 2) {
          toast.success(t('backup.import_success'));
        } else {
          toast.success(t('backup.import_data_success'));
        }
      }

      setShowRestoreConfirm(false);
      setPending(null);
    } catch (err) {
      toast.error(t('backup.import_error'));
      console.error(err);
    } finally {
      setIsRestoring(false);
    }
  };

  // ─── RENDER ────────────────────────────────────────────────────────────────

  const plantsCount = (pending?.data.plants as unknown[])?.length ?? 0;
  const tasksCount = (pending?.data.tasks as unknown[])?.length ?? 0;
  const harvestsCount = (pending?.data.harvests as unknown[])?.length ?? 0;
  const photosCount = (pending?.data.plantPhotos as unknown[])?.length ?? 0;
  const isPhotosFile = pending?.kind === 'photos';

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 dark:text-white">
          <Download className="w-5 h-5 text-garden-leaf" />
          {t('backup.title')}
        </CardTitle>
        <CardDescription>
          {t('backup.desc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {showRestoreConfirm && pending ? (
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">
                  {isPhotosFile ? t('backup.confirm_title_photos') : t('backup.confirm_title')}
                </p>
                <p className="text-xs text-amber-800 dark:text-amber-400 mt-1">
                  {isPhotosFile
                    ? t('backup.confirm_desc_photos', { count: photosCount })
                    : <>
                        {t('backup.confirm_desc')}
                        {plantsCount > 0 ? ` ${t('backup.confirm_plants', { count: plantsCount })},` : ''}
                        {tasksCount > 0 ? ` ${t('backup.confirm_tasks', { count: tasksCount })},` : ''}
                        {harvestsCount > 0 ? ` ${t('backup.confirm_harvests', { count: harvestsCount })}` : ''}
                      </>
                  }
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                className="flex-1"
                onClick={handleConfirmRestore}
                disabled={isRestoring}
              >
                {isRestoring ? t('backup.restoring') : t('backup.confirm_btn')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setShowRestoreConfirm(false); setPending(null); }}
                disabled={isRestoring}
              >
                {t('backup.cancel')}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Button onClick={handleSaveBackup} className="w-full" variant="default" disabled={isExporting}>
              <Share2 className="w-4 h-4 mr-2" />
              {isExporting ? t('backup.preparing') : t('backup.save_unified')}
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
              variant="outline"
            >
              <Upload className="w-4 h-4 mr-2" />
              {t('backup.import')}
            </Button>
            <Button
              onClick={handleCopyBackup}
              className="w-full"
              variant="outline"
              disabled={isExporting}
            >
              <Clipboard className="w-4 h-4 mr-2" />
              {t('backup.copy_to_clipboard')}
            </Button>
            <p className="text-xs text-muted-foreground">
              {isCapacitor() ? t('backup.export_hint_cap') : t('backup.export_hint_web')}
            </p>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={handleFileSelect}
        />
      </CardContent>
    </Card>
  );
}
