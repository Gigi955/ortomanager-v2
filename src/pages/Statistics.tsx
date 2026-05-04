import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { db, Harvest, Plant } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { ArrowLeft, Plus, TrendingUp, TrendingDown, Minus, Package, Trophy, FileText } from 'lucide-react';
import AddHarvestDialog from '@/components/AddHarvestDialog';
import { computeAchievements } from '@/lib/achievements';
import AnnualReportDialog from '@/components/AnnualReportDialog';

export default function StatisticsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [showAddHarvest, setShowAddHarvest] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [yearOffset, setYearOffset] = useState(0); // 0 = anno corrente

  const lang = i18n.language?.split('-')[0] || 'it';

  const MONTHS_SHORT = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => {
      const name = new Date(2000, i, 1).toLocaleDateString(lang, { month: 'short' });
      return name.charAt(0).toUpperCase() + name.slice(1).replace('.', '');
    })
  , [lang]);

  const harvests = useLiveQuery(() => db.harvests.orderBy('date').reverse().toArray());
  const plants = useLiveQuery(() => db.plants.toArray());
  const tasks = useLiveQuery(() => db.tasks.toArray());
  const plantPhotos = useLiveQuery(() => db.plantPhotos.toArray());
  const notes = useLiveQuery(() => db.notes.toArray());
  const gardenLayout = useLiveQuery(() => db.gardenLayout.toArray().then(a => a[0]));

  const achievements = useMemo(() => computeAchievements({
    plants: plants ?? [],
    tasks: tasks ?? [],
    harvests: harvests ?? [],
    plantPhotos: plantPhotos ?? [],
    notes: notes ?? [],
    gardenLayout,
  }), [plants, tasks, harvests, plantPhotos, notes, gardenLayout]);
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  const currentYear = new Date().getFullYear() - yearOffset;
  const prevYear = currentYear - 1;

  const plantMap = useMemo(() => {
    const m = new Map<number, Plant>();
    plants?.forEach(p => { if (p.id) m.set(p.id, p); });
    return m;
  }, [plants]);

  // Filtra raccolte per anno
  const currentYearHarvests = useMemo(() =>
    harvests?.filter(h => new Date(h.date).getFullYear() === currentYear) ?? []
  , [harvests, currentYear]);

  const prevYearHarvests = useMemo(() =>
    harvests?.filter(h => new Date(h.date).getFullYear() === prevYear) ?? []
  , [harvests, prevYear]);

  // Totali per pianta (anno corrente)
  const perPlantTotals = useMemo(() => {
    const map = new Map<number, { plant: Plant; byUnit: Record<string, number>; total: number }>();
    currentYearHarvests.forEach(h => {
      const plant = plantMap.get(h.plantId);
      if (!plant) return;
      if (!map.has(h.plantId)) map.set(h.plantId, { plant, byUnit: {}, total: 0 });
      const entry = map.get(h.plantId)!;
      entry.byUnit[h.unit] = (entry.byUnit[h.unit] || 0) + h.quantity;
      // Peso stimato per confronto (kg o g  kg, altrimenti pezzi)
      if (h.unit === 'kg') entry.total += h.quantity;
      else if (h.unit === 'g') entry.total += h.quantity / 1000;
      else entry.total += h.quantity * 0.1; // stima pezzi
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [currentYearHarvests, plantMap]);

  // Dati mensili per grafico
  const monthlyData = useMemo(() => {
    return MONTHS_SHORT.map((m, i) => {
      const curKg = currentYearHarvests
        .filter(h => new Date(h.date).getMonth() === i)
        .reduce((sum, h) => sum + (h.unit === 'kg' ? h.quantity : h.unit === 'g' ? h.quantity/1000 : h.quantity * 0.1), 0);
      const prevKg = prevYearHarvests
        .filter(h => new Date(h.date).getMonth() === i)
        .reduce((sum, h) => sum + (h.unit === 'kg' ? h.quantity : h.unit === 'g' ? h.quantity/1000 : h.quantity * 0.1), 0);
      return { mese: m, [currentYear]: parseFloat(curKg.toFixed(2)), [prevYear]: parseFloat(prevKg.toFixed(2)) };
    });
  }, [currentYearHarvests, prevYearHarvests, currentYear, prevYear, MONTHS_SHORT]);

  // Totale anno corrente vs precedente (kg equivalenti)
  const totalCurrent = currentYearHarvests.reduce((s, h) => s + (h.unit === 'kg' ? h.quantity : h.unit === 'g' ? h.quantity/1000 : h.quantity*0.1), 0);
  const totalPrev = prevYearHarvests.reduce((s, h) => s + (h.unit === 'kg' ? h.quantity : h.unit === 'g' ? h.quantity/1000 : h.quantity*0.1), 0);
  const diffPct = totalPrev > 0 ? ((totalCurrent - totalPrev) / totalPrev) * 100 : null;

  const hasPrevData = prevYearHarvests.length > 0;

  const harvestsCount = currentYearHarvests.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-garden-cream to-white dark:from-gray-900 dark:to-gray-800 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-garden-leaf to-garden-sage text-white p-6 rounded-b-3xl shadow-elevated">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{t('stats.title')}</h1>
            <p className="text-green-100 text-sm">
              {harvestsCount === 1
                ? t('stats.subtitle_one', { count: harvestsCount, year: currentYear })
                : t('stats.subtitle_other', { count: harvestsCount, year: currentYear })}
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="bg-white/20 text-white hover:bg-white/30 rounded-full w-10 h-10"
            title={t('stats.report_btn')}
            onClick={() => setShowReport(true)}
          >
            <FileText className="w-5 h-5" />
          </Button>
          <Button size="icon" className="bg-white text-garden-leaf hover:bg-green-50 rounded-full w-10 h-10" onClick={() => setShowAddHarvest(true)}>
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="px-4 mt-6 space-y-5">
        {/* Achievements */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base dark:text-white">
              <Trophy className="w-5 h-5 text-amber-500" />
              {t('achievements.title')}
              <Badge variant="outline" className="ml-auto">
                {unlockedCount} / {achievements.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {achievements.map(a => (
                <div
                  key={a.id}
                  className={`relative flex flex-col items-center justify-center p-2 rounded-xl border text-center ${
                    a.unlocked
                      ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700'
                      : 'bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600 opacity-60'
                  }`}
                  title={t(a.descKey)}
                >
                  <span className={`text-2xl ${a.unlocked ? '' : 'grayscale'}`}>{a.icon}</span>
                  <p className="text-[10px] font-semibold mt-1 leading-tight dark:text-white">
                    {t(a.titleKey)}
                  </p>
                  {!a.unlocked && (
                    <div className="w-full mt-1 h-1 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400"
                        style={{ width: `${a.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Anno selector */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setYearOffset(y => y + 1)}
            className="px-4 py-2 rounded-xl border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm dark:text-white transition-colors"
          >
             {currentYear - 1}
          </button>
          <span className="font-bold text-lg dark:text-white">{currentYear}</span>
          <button
            onClick={() => setYearOffset(y => Math.max(0, y - 1))}
            disabled={yearOffset === 0}
            className="px-4 py-2 rounded-xl border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm dark:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {currentYear + 1}
          </button>
        </div>

        {harvests?.length === 0 ? (
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="pt-8 pb-8 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-2">{t('stats.no_harvests')}</p>
              <p className="text-sm text-gray-400 mb-4">{t('stats.no_harvests_hint')}</p>
              <Button className="rounded-full" onClick={() => setShowAddHarvest(true)}>
                <Plus className="w-4 h-4 mr-2" />{t('stats.add_harvest')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Confronto anni */}
            {hasPrevData && (
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-base dark:text-white">{t('stats.comparison', { year: prevYear })}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-around">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-garden-leaf">{totalCurrent.toFixed(1)} kg</p>
                      <p className="text-xs text-muted-foreground">{t('stats.current_year_equiv', { year: currentYear })}</p>
                    </div>
                    <div className="text-center">
                      {diffPct !== null ? (
                        <>
                          {diffPct > 0
                            ? <TrendingUp className="w-8 h-8 text-green-500 mx-auto" />
                            : diffPct < 0
                            ? <TrendingDown className="w-8 h-8 text-red-400 mx-auto" />
                            : <Minus className="w-8 h-8 text-gray-400 mx-auto" />
                          }
                          <p className={`text-lg font-bold ${diffPct > 0 ? 'text-green-500' : diffPct < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                            {diffPct > 0 ? '+' : ''}{diffPct.toFixed(1)}%
                          </p>
                        </>
                      ) : <Minus className="w-8 h-8 text-gray-400 mx-auto" />}
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-400">{totalPrev.toFixed(1)} kg</p>
                      <p className="text-xs text-muted-foreground">{t('stats.prev_year_equiv', { year: prevYear })}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Grafico mensile */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-base dark:text-white">{t('stats.monthly', { year: currentYear })}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="mese" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: number) => [`${v} kg`, '']} />
                    {hasPrevData && <Legend />}
                    <Bar dataKey={currentYear} fill="#4a7c59" radius={[4, 4, 0, 0]} name={`${currentYear}`} />
                    {hasPrevData && <Bar dataKey={prevYear} fill="#a0c4b1" radius={[4, 4, 0, 0]} name={`${prevYear}`} />}
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  {t('stats.kg_note')}
                </p>
              </CardContent>
            </Card>

            {/* Totali per pianta */}
            {perPlantTotals.length > 0 && (
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-base dark:text-white">{t('stats.per_plant', { year: currentYear })}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {perPlantTotals.map(({ plant, byUnit }) => (
                      <div key={plant.id} className="flex items-center justify-between py-2 border-b dark:border-gray-700 last:border-0">
                        <div>
                          <p className="font-medium dark:text-white">{plant.name}</p>
                          {plant.variety && <p className="text-xs text-muted-foreground">{plant.variety}</p>}
                        </div>
                        <div className="flex gap-1 flex-wrap justify-end">
                          {Object.entries(byUnit).map(([unit, qty]) => (
                            <Badge key={unit} variant="outline" className="text-xs dark:border-gray-600 dark:text-gray-300">
                              {qty % 1 === 0 ? qty : qty.toFixed(1)} {unit}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Lista ultime raccolte */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-base dark:text-white">{t('stats.latest')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {harvests?.slice(0, 15).map(h => {
                    const plant = plantMap.get(h.plantId);
                    const d = new Date(h.date);
                    return (
                      <div key={h.id} className="flex items-center justify-between py-2 border-b dark:border-gray-700 last:border-0">
                        <div>
                          <p className="font-medium text-sm dark:text-white">{plant?.name ?? t('stats.plant_removed')}</p>
                          <p className="text-xs text-muted-foreground">
                            {d.getDate()} {MONTHS_SHORT[d.getMonth()]} {d.getFullYear()}
                            {h.notes && ` · ${h.notes}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="dark:bg-gray-700 dark:text-gray-300">
                            {h.quantity % 1 === 0 ? h.quantity : h.quantity.toFixed(1)} {h.unit}
                          </Badge>
                          <button
                            onClick={async () => { if (h.id) await db.harvests.delete(h.id); }}
                            className="text-gray-300 hover:text-red-400 transition-colors"
                          >

                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <AddHarvestDialog open={showAddHarvest} onOpenChange={setShowAddHarvest} />
      <AnnualReportDialog year={currentYear} open={showReport} onOpenChange={setShowReport} />
    </div>
  );
}
