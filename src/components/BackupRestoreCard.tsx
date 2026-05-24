import { useRef, useState } from 'react';
import { db } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Upload, AlertTriangle, Share2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { useTranslation } from 'react-i18next';

/** Ritorna true se siamo dentro una WebView Capacitor (Android/iOS) */
function isCapacitor() {
  return typeof (window as unknown as Record<string, unknown>).Capacitor !== 'undefined';
}

// Formato di backup corrente. v1 = solo plants/tasks/harvests/notes (bug storico).
// v2 = tutte le 9 tabelle del DB.
const BACKUP_FORMAT_VERSION = 2;

// Helper: revives ISO date strings into Date objects on specified fields.
function reviveDates<T extends Record<string, unknown>>(row: T, dateFields: string[]): T {
  const out: Record<string, unknown> = { ...row };
  for (const f of dateFields) {
    if (out[f] != null) out[f] = new Date(out[f] as string);
  }
  // Revive nested dates in plants.attachments[].addedAt if present.
  const attachments = (out as { attachments?: Array<Record<string, unknown>> }).attachments;
  if (Array.isArray(attachments)) {
    (out as { attachments: Array<Record<string, unknown>> }).attachments = attachments.map(a => ({
      ...a,
      addedAt: a.addedAt ? new Date(a.addedAt as string) : a.addedAt,
    }));
  }
  return out as T;
}

export default function BackupRestoreCard() {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [pendingData, setPendingData] = useState<Record<string, unknown[]> | null>(null);
  const [pendingVersion, setPendingVersion] = useState<number>(BACKUP_FORMAT_VERSION);

  const buildBackupJson = async () => {
    const [plantTypes, plants, tasks, recipes, harvests, notes, settings, plantPhotos, gardenLayout] =
      await Promise.all([
        db.plantTypes.toArray(),
        db.plants.toArray(),
        db.tasks.toArray(),
        db.recipes.toArray(),
        db.harvests.toArray(),
        db.notes.toArray(),
        db.settings.toArray(),
        db.plantPhotos.toArray(),
        db.gardenLayout.toArray(),
      ]);
    return JSON.stringify({
      version: BACKUP_FORMAT_VERSION,
      exportedAt: new Date().toISOString(),
      appVersion: __APP_VERSION__,
      data: { plantTypes, plants, tasks, recipes, harvests, notes, settings, plantPhotos, gardenLayout },
    }, null, 2);
  };

  // Promise.race timeout wrapper — protegge dai deadlock silenziosi di Capacitor
  // su alcuni device Android.
  function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout ${label} (>${ms / 1000}s)`)), ms)
      ),
    ]);
  }

  // ── PRIMARIO: salva il file in cartella visibile dal File Manager. Niente Share API.
  // Approccio "safe path" che funziona indipendentemente da FileProvider e plugin Share.
  const handleSaveToDevice = async () => {
    setIsExporting(true);
    try {
      let json: string;
      try {
        json = await buildBackupJson();
      } catch (err) {
        toast.error(t('backup.export_error_detail', { message: (err as Error).message }));
        console.error('[backup] buildBackupJson failed', err);
        return;
      }
      const date = new Date().toISOString().slice(0, 10);
      const filename = `ortomanager-backup-${date}.json`;

      if (isCapacitor()) {
        // Directory.Documents su Android mappa a getExternalFilesDir(DIRECTORY_DOCUMENTS)
        // che è visibile dal File Manager dell'utente alla cartella
        // /Android/data/it.ortomanager.app/files/Documents/ (Android 11+) o
        // /storage/emulated/0/Documents/ (vecchi Android). Non serve Share API.
        try {
          await withTimeout(
            Filesystem.writeFile({
              path: filename,
              data: json,
              directory: Directory.Documents,
              encoding: Encoding.UTF8,
              recursive: true,
            }),
            15000,
            'writeFile Documents'
          );
        } catch (err) {
          toast.error(t('backup.export_error_detail', { message: (err as Error).message }), { duration: 8000 });
          console.error('[backup] writeFile Documents failed', err);
          return;
        }

        let displayPath = `Documents/${filename}`;
        try {
          const uriResult = await Filesystem.getUri({
            path: filename,
            directory: Directory.Documents,
          });
          displayPath = uriResult.uri.replace(/^file:\/\//, '');
        } catch { /* path display fallback già impostato */ }

        toast.success(t('backup.save_success_path', { path: displayPath }), { duration: 10000 });
        toast.info(t('backup.save_hint'), { duration: 8000 });
      } else {
        // Web: download tramite blob anchor
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        toast.success(t('backup.export_success_web'));
      }
    } finally {
      setIsExporting(false);
    }
  };

  // ── SECONDARIO: tenta la Share API. Comodo quando funziona, ma può fallire.
  const handleShareBackup = async () => {
    setIsExporting(true);
    try {
      const json = await buildBackupJson();
      const date = new Date().toISOString().slice(0, 10);
      const filename = `ortomanager-backup-${date}.json`;

      if (!isCapacitor()) {
        // In web il comportamento è lo stesso del salvataggio
        await handleSaveToDevice();
        return;
      }

      try {
        await withTimeout(
          Filesystem.writeFile({
            path: filename,
            data: json,
            directory: Directory.Cache,
            encoding: Encoding.UTF8,
          }),
          15000,
          'writeFile Cache'
        );
      } catch (err) {
        toast.error(t('backup.export_error_detail', { message: `writeFile: ${(err as Error).message}` }), { duration: 8000 });
        console.error('[backup] share/writeFile failed', err);
        return;
      }

      let uri: string;
      try {
        const uriResult = await Filesystem.getUri({
          path: filename,
          directory: Directory.Cache,
        });
        uri = uriResult.uri;
      } catch (err) {
        toast.error(t('backup.export_error_detail', { message: `getUri: ${(err as Error).message}` }), { duration: 8000 });
        console.error('[backup] share/getUri failed', err);
        return;
      }

      try {
        await withTimeout(
          Share.share({
            title: 'OrtoManager Backup',
            text: `Backup OrtoManager del ${date}`,
            url: uri,
            dialogTitle: 'Salva o condividi il backup',
          }),
          20000,
          'Share.share'
        );
        toast.success(t('backup.export_success_cap', { filename }));
      } catch (err) {
        const msg = (err as Error).message || '';
        if (msg.includes('cancel') || msg.includes('abort')) {
          toast.info(t('backup.share_cancelled'));
        } else if (msg.startsWith('Timeout')) {
          toast.error(t('backup.timeout'), { duration: 10000 });
        } else {
          toast.error(t('backup.export_error_detail', { message: `share: ${msg}` }), { duration: 8000 });
          console.error('[backup] Share.share failed', err);
        }
      }
    } finally {
      setIsExporting(false);
    }
  };

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
        setPendingData(parsed.data);
        setPendingVersion(typeof parsed.version === 'number' ? parsed.version : 1);
        setShowRestoreConfirm(true);
      } catch {
        toast.error(t('backup.corrupt_file'));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmRestore = async () => {
    if (!pendingData) return;
    setIsRestoring(true);
    try {
      await db.transaction(
        'rw',
        [db.plantTypes, db.plants, db.tasks, db.recipes, db.harvests, db.notes, db.settings, db.plantPhotos, db.gardenLayout],
        async () => {
          // Tabelle senza campi Date.
          if (pendingData.plantTypes?.length) {
            await db.plantTypes.clear();
            await db.plantTypes.bulkPut(pendingData.plantTypes as Parameters<typeof db.plantTypes.bulkPut>[0]);
          }
          if (pendingData.recipes?.length) {
            await db.recipes.clear();
            await db.recipes.bulkPut(pendingData.recipes as Parameters<typeof db.recipes.bulkPut>[0]);
          }
          if (pendingData.settings?.length) {
            await db.settings.clear();
            await db.settings.bulkPut(pendingData.settings as Parameters<typeof db.settings.bulkPut>[0]);
          }
          if (pendingData.gardenLayout?.length) {
            await db.gardenLayout.clear();
            await db.gardenLayout.bulkPut(pendingData.gardenLayout as Parameters<typeof db.gardenLayout.bulkPut>[0]);
          }

          // Tabelle con campi Date — sempre clear+restore (anche v1).
          if (pendingData.plants?.length) {
            await db.plants.clear();
            await db.plants.bulkPut(
              (pendingData.plants as Record<string, unknown>[]).map(p =>
                reviveDates(p, ['plantedDate', 'lastWatered'])
              ) as Parameters<typeof db.plants.bulkPut>[0]
            );
          }
          if (pendingData.tasks?.length) {
            await db.tasks.clear();
            await db.tasks.bulkPut(
              (pendingData.tasks as Record<string, unknown>[]).map(r =>
                reviveDates(r, ['dueDate', 'createdAt'])
              ) as Parameters<typeof db.tasks.bulkPut>[0]
            );
          }
          if (pendingData.harvests?.length) {
            await db.harvests.clear();
            await db.harvests.bulkPut(
              (pendingData.harvests as Record<string, unknown>[]).map(r =>
                reviveDates(r, ['date'])
              ) as Parameters<typeof db.harvests.bulkPut>[0]
            );
          }
          if (pendingData.notes?.length) {
            await db.notes.clear();
            await db.notes.bulkPut(
              (pendingData.notes as Record<string, unknown>[]).map(r =>
                reviveDates(r, ['date'])
              ) as Parameters<typeof db.notes.bulkPut>[0]
            );
          }
          if (pendingData.plantPhotos?.length) {
            await db.plantPhotos.clear();
            await db.plantPhotos.bulkPut(
              (pendingData.plantPhotos as Record<string, unknown>[]).map(r =>
                reviveDates(r, ['date'])
              ) as Parameters<typeof db.plantPhotos.bulkPut>[0]
            );
          }
        }
      );

      if (pendingVersion < BACKUP_FORMAT_VERSION) {
        toast.success(t('backup.legacy_v1_imported'));
      } else {
        toast.success(t('backup.import_success'));
      }
      setShowRestoreConfirm(false);
      setPendingData(null);
    } catch (err) {
      toast.error(t('backup.import_error'));
      console.error(err);
    } finally {
      setIsRestoring(false);
    }
  };

  const plantsCount = (pendingData?.plants as unknown[])?.length ?? 0;
  const tasksCount = (pendingData?.tasks as unknown[])?.length ?? 0;
  const harvestsCount = (pendingData?.harvests as unknown[])?.length ?? 0;

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
        {showRestoreConfirm && pendingData ? (
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">
                  {t('backup.confirm_title')}
                </p>
                <p className="text-xs text-amber-800 dark:text-amber-400 mt-1">
                  {t('backup.confirm_desc')}
                  {plantsCount > 0 ? ` ${t('backup.confirm_plants', { count: plantsCount })},` : ''}
                  {tasksCount > 0 ? ` ${t('backup.confirm_tasks', { count: tasksCount })},` : ''}
                  {harvestsCount > 0 ? ` ${t('backup.confirm_harvests', { count: harvestsCount })}` : ''}
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
                onClick={() => { setShowRestoreConfirm(false); setPendingData(null); }}
                disabled={isRestoring}
              >
                {t('backup.cancel')}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Button onClick={handleSaveToDevice} className="w-full" variant="default" disabled={isExporting}>
              <Save className="w-4 h-4 mr-2" />
              {isExporting ? t('backup.preparing') : t('backup.save_to_device')}
            </Button>
            {isCapacitor() && (
              <Button onClick={handleShareBackup} className="w-full" variant="secondary" disabled={isExporting}>
                <Share2 className="w-4 h-4 mr-2" />
                {t('backup.export_share_btn')}
              </Button>
            )}
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
              variant="outline"
            >
              <Upload className="w-4 h-4 mr-2" />
              {t('backup.import')}
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
