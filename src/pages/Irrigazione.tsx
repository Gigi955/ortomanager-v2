import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { db, Plant } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Droplet, MapPin } from 'lucide-react';

// Stima ml d'acqua per singola pianta, in base alla categoria.
// Moltiplicata poi per plant.numberOfPlants per ottenere il totale per riga.
const ML_PER_PLANT: Record<Plant['category'], number> = {
  herbs: 200,
  flowers: 300,
  vegetables: 500,
  fruits: 1000,
  trees: 5000,
};

type GroupKey = 'daily' | 'every_2_3' | 'weekly' | 'biweekly_or_more';
const GROUP_ORDER: GroupKey[] = ['daily', 'every_2_3', 'weekly', 'biweekly_or_more'];

function groupOf(freq: number): GroupKey {
  if (freq <= 1) return 'daily';
  if (freq <= 3) return 'every_2_3';
  if (freq <= 7) return 'weekly';
  return 'biweekly_or_more';
}

function formatWater(ml: number, lang: string): string {
  if (ml < 1000) return `${ml} ml`;
  const liters = ml / 1000;
  const formatted = new Intl.NumberFormat(lang, { maximumFractionDigits: 1 }).format(liters);
  return `${formatted} L`;
}

export default function IrrigazionePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const plants = useLiveQuery(() => db.plants.toArray());
  const lang = i18n.language?.split('-')[0] || 'it';

  const activePlants = (plants ?? []).filter(p => p.status !== 'uprooted');

  const groups = new Map<GroupKey, Plant[]>();
  GROUP_ORDER.forEach(k => groups.set(k, []));
  activePlants.forEach(p => groups.get(groupOf(p.wateringFrequency))!.push(p));
  groups.forEach(arr => arr.sort((a, b) => a.name.localeCompare(b.name, lang)));

  const totalPlants = activePlants.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-garden-cream to-white dark:from-gray-900 dark:to-gray-800 pb-20">
      <div className="bg-gradient-to-r from-garden-sage to-garden-leaf text-white p-6 rounded-b-3xl shadow-elevated">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Droplet className="w-8 h-8" />
          <div>
            <h1 className="text-3xl font-bold">{t('irrigation.title')}</h1>
            <p className="text-green-100">{t('irrigation.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="px-4 mt-6 space-y-4">
        {totalPlants === 0 ? (
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-6 text-center text-muted-foreground">
              {t('irrigation.empty')}
            </CardContent>
          </Card>
        ) : (
          GROUP_ORDER.map(key => {
            const items = groups.get(key)!;
            if (items.length === 0) return null;
            return (
              <Card key={key} className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-base dark:text-white">
                    <span className="flex items-center gap-2">
                      <Droplet className="w-5 h-5 text-garden-leaf" />
                      {t(`irrigation.group.${key}`)}
                    </span>
                    <span className="text-xs text-muted-foreground font-normal">
                      {t(items.length === 1 ? 'irrigation.group_count_one' : 'irrigation.group_count_other', { count: items.length })}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-muted-foreground border-b border-gray-100 dark:border-gray-700">
                          <th className="px-4 py-2 font-medium">{t('irrigation.col.plant')}</th>
                          <th className="px-2 py-2 font-medium whitespace-nowrap">{t('irrigation.col.frequency')}</th>
                          <th className="px-4 py-2 font-medium text-right whitespace-nowrap">{t('irrigation.col.water_per_plant')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map(p => {
                          const mlPerPlant = ML_PER_PLANT[p.category] ?? 500;
                          const count = p.numberOfPlants || 1;
                          const mlTotal = mlPerPlant * count;
                          return (
                            <tr key={p.id} className="border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                              <td className="px-4 py-2.5 align-top">
                                <div className="font-medium text-gray-900 dark:text-white">{p.name}</div>
                                {p.variety && <div className="text-[11px] text-gray-500">{p.variety}</div>}
                                {p.location && (
                                  <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                    <MapPin className="w-3 h-3" /> {p.location}
                                  </div>
                                )}
                              </td>
                              <td className="px-2 py-2.5 whitespace-nowrap align-top dark:text-gray-200">
                                {p.wateringFrequency === 1
                                  ? t('plants.watering_every_one', { count: p.wateringFrequency })
                                  : t('plants.watering_every_other', { count: p.wateringFrequency })}
                              </td>
                              <td className="px-4 py-2.5 text-right whitespace-nowrap align-top">
                                <div className="font-medium text-blue-600 dark:text-blue-400">
                                  {formatWater(mlPerPlant, lang)}
                                </div>
                                {count > 1 && (
                                  <div className="text-[11px] text-muted-foreground mt-0.5">
                                    {t('irrigation.water_total_line', { count, total: formatWater(mlTotal, lang) })}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
