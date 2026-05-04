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

export default function BackupRestoreCard() {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [pendingData, setPendingData] = useState<Record<string, unknown[]> | null>(null);

  const buildBackupJson = async () => {
    const [plants, tasks, harvests, notes] = await Promise.all([
      db.plants.toArray(),
      db.tasks.toArray(),
      db.harvests.toArray(),
      db.notes.toArray(),
    ]);
    return JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      data: { plants, tasks, harvests, notes },
    }, null, 2);
  };

  const handleBackup = async () => {
    setIsExporting(true);
    try {
      const json = await buildBackupJson();
      const date = new Date().toISOString().slice(0, 10);
      const filename = `ortomanager-backup-${date}.json`;

      if (isCapacitor()) {
        await Filesystem.writeFile({
          path: filename,
          data: json,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });

        const uriResult = await Filesystem.getUri({
          path: filename,
          directory: Directory.Documents,
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
      await db.transaction('rw', [db.plants, db.tasks, db.harvests, db.notes], async () => {
        await db.plants.clear();
        await db.tasks.clear();
        await db.harvests.clear();
        await db.notes.clear();

        if (pendingData.plants?.length) {
          await db.plants.bulkPut(
            (pendingData.plants as Record<string, unknown>[]).map(p => ({
              ...p,
              plantedDate: new Date(p.plantedDate as string),
              lastWatered: p.lastWatered ? new Date(p.lastWatered as string) : undefined,
            })) as Parameters<typeof db.plants.bulkPut>[0]
          );
        }
        if (pendingData.tasks?.length) {
          await db.tasks.bulkPut(
            (pendingData.tasks as Record<string, unknown>[]).map(t => ({
              ...t,
              dueDate: new Date(t.dueDate as string),
              createdAt: new Date(t.createdAt as string),
            })) as Parameters<typeof db.tasks.bulkPut>[0]
          );
        }
        if (pendingData.harvests?.length) {
          await db.harvests.bulkPut(
            (pendingData.harvests as Record<string, unknown>[]).map(h => ({
              ...h,
              date: new Date(h.date as string),
            })) as Parameters<typeof db.harvests.bulkPut>[0]
          );
        }
        if (pendingData.notes?.length) {
          await db.notes.bulkPut(
            (pendingData.notes as Record<string, unknown>[]).map(n => ({
              ...n,
              date: new Date(n.date as string),
            })) as Parameters<typeof db.notes.bulkPut>[0]
          );
        }
      });

      toast.success(t('backup.import_success'));
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
