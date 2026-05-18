import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTranslation } from 'react-i18next';
import { db, type Plant, type Harvest } from '@/lib/db';
import {
  Dialog, DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X } from 'lucide-react';
import { computeAchievements } from '@/lib/achievements';
import { formatShortDate } from '@/lib/utils';

interface AnnualReportDialogProps {
  year: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORY_EMOJI: Record<Plant['category'], string> = {
  vegetables: '🥦', fruits: '🍓', herbs: '🌿', flowers: '🌸', trees: '🌳',
};

export default function AnnualReportDialog({ year, open, onOpenChange }: AnnualReportDialogProps) {
  const { t } = useTranslation();

  const plants = useLiveQuery(() => db.plants.toArray()) ?? [];
  const harvests = useLiveQuery(() => db.harvests.toArray()) ?? [];
  const tasks = useLiveQuery(() => db.tasks.toArray()) ?? [];
  const plantPhotos = useLiveQuery(() => db.plantPhotos.toArray()) ?? [];
  const notes = useLiveQuery(() => db.notes.toArray()) ?? [];
  const gardenLayout = useLiveQuery(() => db.gardenLayout.toArray().then(a => a[0]));
  const settings = useLiveQuery(() => db.settings.toArray().then(s => s[0]));

  const yearPlants = useMemo(() =>
    plants.filter(p => new Date(p.plantedDate).getFullYear() === year),
  [plants, year]);

  const yearHarvests = useMemo(() =>
    harvests.filter(h => new Date(h.date).getFullYear() === year),
  [harvests, year]);

  const yearTasks = useMemo(() =>
    tasks.filter(t => new Date(t.dueDate).getFullYear() === year),
  [tasks, year]);

  const yearNotes = useMemo(() =>
    notes.filter(n => new Date(n.date).getFullYear() === year)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  [notes, year]);

  const achievements = useMemo(() => computeAchievements({
    plants, tasks, harvests, plantPhotos, notes, gardenLayout,
  }), [plants, tasks, harvests, plantPhotos, notes, gardenLayout]);
  const unlocked = achievements.filter(a => a.unlocked);

  // Per categoria
  const byCategory = useMemo(() => {
    const m: Record<string, number> = {};
    yearPlants.forEach(p => { m[p.category] = (m[p.category] || 0) + 1; });
    return m;
  }, [yearPlants]);

  // Raccolti per pianta
  const harvestsByPlant = useMemo(() => {
    const plantMap = new Map<number, Plant>();
    plants.forEach(p => { if (p.id) plantMap.set(p.id, p); });
    const m = new Map<number, { plant: Plant; total: Record<string, number>; count: number }>();
    yearHarvests.forEach((h: Harvest) => {
      const plant = plantMap.get(h.plantId);
      if (!plant) return;
      if (!m.has(h.plantId)) m.set(h.plantId, { plant, total: {}, count: 0 });
      const entry = m.get(h.plantId)!;
      entry.total[h.unit] = (entry.total[h.unit] || 0) + h.quantity;
      entry.count++;
    });
    return Array.from(m.values()).sort((a, b) => b.count - a.count);
  }, [plants, yearHarvests]);

  const completedTasksCount = yearTasks.filter(t => t.completed).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[95vh] overflow-y-auto p-0 print:max-h-none print:max-w-none print:overflow-visible"
      >
        {/* Toolbar (nascosta in stampa) */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-3 flex items-center justify-between gap-2 print:hidden">
          <h2 className="font-bold text-lg">{t('report.title', { year })}</h2>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1" />
              {t('report.print_pdf')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onOpenChange(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Contenuto stampabile */}
        <div className="p-6 space-y-6 print:p-8" id="annual-report">
          <header className="text-center border-b pb-4">
            <h1 className="text-3xl font-bold text-garden-leaf">🌿 OrtoManager</h1>
            <p className="text-lg font-semibold mt-1">{t('report.title', { year })}</p>
            {settings?.city && (
              <p className="text-sm text-gray-500">{settings.city}</p>
            )}
          </header>

          {/* Riepilogo */}
          <section>
            <h3 className="font-bold text-sm uppercase tracking-wide text-garden-leaf mb-3">
              {t('report.summary')}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="border rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-garden-leaf">{yearPlants.length}</p>
                <p className="text-xs text-gray-600">{t('report.plants')}</p>
              </div>
              <div className="border rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-garden-leaf">{yearHarvests.length}</p>
                <p className="text-xs text-gray-600">{t('report.harvests')}</p>
              </div>
              <div className="border rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-garden-leaf">{completedTasksCount}</p>
                <p className="text-xs text-gray-600">{t('report.tasks_done')}</p>
              </div>
              <div className="border rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-garden-leaf">{yearNotes.length}</p>
                <p className="text-xs text-gray-600">{t('report.journal_entries')}</p>
              </div>
            </div>
          </section>

          {/* Per categoria */}
          {Object.keys(byCategory).length > 0 && (
            <section>
              <h3 className="font-bold text-sm uppercase tracking-wide text-garden-leaf mb-2">
                {t('report.by_category')}
              </h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(byCategory).map(([cat, count]) => (
                  <div key={cat} className="border rounded-lg px-3 py-1.5 text-sm">
                    {CATEGORY_EMOJI[cat as Plant['category']]} {t(`category.${cat}`)}: <strong>{count}</strong>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Top piante per raccolti */}
          {harvestsByPlant.length > 0 && (
            <section>
              <h3 className="font-bold text-sm uppercase tracking-wide text-garden-leaf mb-2">
                {t('report.top_harvests')}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-2">{t('report.plant')}</th>
                      <th className="text-right py-2 px-2 whitespace-nowrap">{t('report.harvests_count')}</th>
                      <th className="text-right py-2 pl-2">{t('report.totals')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {harvestsByPlant.slice(0, 15).map(({ plant, total, count }) => (
                      <tr key={plant.id} className="border-b">
                        <td className="py-2 pr-2 break-words">
                          {CATEGORY_EMOJI[plant.category]} {plant.name}
                        </td>
                        <td className="text-right py-2 px-2 whitespace-nowrap">{count}</td>
                        <td className="text-right py-2 pl-2 text-gray-600 break-words">
                          {Object.entries(total).map(([unit, q]) => `${q} ${unit}`).join(' · ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Achievements */}
          {unlocked.length > 0 && (
            <section>
              <h3 className="font-bold text-sm uppercase tracking-wide text-garden-leaf mb-2">
                🏆 {t('report.achievements')} ({unlocked.length}/{achievements.length})
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {unlocked.map(a => (
                  <div key={a.id} className="border rounded-lg p-2 text-center bg-amber-50">
                    <span className="text-xl">{a.icon}</span>
                    <p className="text-[11px] font-semibold mt-1">{t(a.titleKey)}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Diario eventi salienti */}
          {yearNotes.length > 0 && (
            <section>
              <h3 className="font-bold text-sm uppercase tracking-wide text-garden-leaf mb-2">
                📔 {t('report.events')}
              </h3>
              <ul className="space-y-1.5 text-sm">
                {yearNotes.slice(0, 30).map(n => (
                  <li key={n.id} className="border-b pb-1.5">
                    <strong>{formatShortDate(n.date)}</strong>{' — '}
                    {n.title}
                    {n.content && <span className="text-gray-600">: {n.content}</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <footer className="text-center text-xs text-gray-400 pt-6 border-t">
            {t('report.generated_by')} OrtoManager · {new Date().toLocaleDateString()}
          </footer>
        </div>

        {/* Print styles */}
        <style>{`
          @media print {
            body * { visibility: hidden; }
            #annual-report, #annual-report * { visibility: visible; }
            #annual-report { position: absolute; left: 0; top: 0; width: 100%; }
            @page { margin: 1.5cm; }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
