import { useRef, useState } from 'react';
import { db } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Upload, AlertTriangle, Share2 } from 'lucide-react';
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

  const handleBackup = async () => {
    setIsExporting(true);
    try {
      const json = await buildBackupJson();
      const date = new Date().toISOString().slice(0, 10);
      const filename = `ortomanager-backup-${date}.json`;

      if (isCapacitor()) {
        // Cache directory è esposta correttamente via FileProvider per la Share API
        // su Android 11+ (Documents può fallire con scoped storage).
        await Filesystem.writeFile({
          path: filename,
          data: json,
          directory: Directory.Cache,
          encoding: Encoding.UTF8,
        });

        const uriResult = await Filesystem.getUri({
          path: filename,
          directory: Directory.Cache,
        });

        await Share.share({
          title: 'OrtoManager Backup',
          text: `Backup OrtoManager del ${date}`,
          url: uriResult.uri,
          dialogTitle: 'Salva o condividi il backup',
        });

        toast.success(t('backup.export_success_cap', { filename }));
      } else {
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
    } catch (err) {
      if (err instanceof Error && (err.message.includes('cancel') || err.message.includes('abort'))) {
        toast.info(t('backup.share_cancelled'));
      } else {
        toast.error(t('backup.export_error'));
        console.error(err);
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
            <Button onClick={handleBackup} className="w-full" variant="default" disabled={isExporting}>
              {isCapacitor()
                ? <Share2 className="w-4 h-4 mr-2" />
                : <Download className="w-4 h-4 mr-2" />
              }
              {isExporting ? t('backup.preparing') : isCapacitor() ? t('backup.export_cap') : t('backup.export_web')}
            </Button>
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
