import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { db } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sprout,
  Calendar,
  Droplet,
  ChefHat,
  CheckCircle2,
  AlertCircle,
  Leaf
} from 'lucide-react';
import { formatShortDate, getDaysUntil, getCurrentSeason, getSeasonName, getStatusColor, getStatusLabel, needsWatering } from '@/lib/utils';
import WeatherWidget from '@/components/WeatherWidget';
import { useTranslation } from 'react-i18next';
import { cancelTaskNotification } from '@/lib/notifications';

export default function HomePage() {
  const { t } = useTranslation();
  const plants = useLiveQuery(() => db.plants.toArray());
  // Bug #8 fix: .filter() invece di .where('completed').equals(0)  boolean non indicizzabile
  const tasks = useLiveQuery(() => db.tasks.filter(t => !t.completed).toArray());
  // Bug #2 fix: season è un array, .equals() non funziona su array  filtro lato JS
  const currentSeason = getCurrentSeason();
  const recipes = useLiveQuery(
    () => db.recipes.toArray().then(all => all.filter(r => r.season.includes(currentSeason))),
    [currentSeason]
  );

  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting(t('home.greeting_morning'));
    else if (hour < 18) setGreeting(t('home.greeting_afternoon'));
    else setGreeting(t('home.greeting_evening'));
  }, [t]);

  const activePlants = plants?.filter(p => p.status === 'growing' || p.status === 'flowering' || p.status === 'fruiting').length || 0;
  const needsWateringCount = plants?.filter(p => p.status !== 'uprooted' && needsWatering(p)).length || 0;

  const todayTasks = tasks?.filter(t => getDaysUntil(t.dueDate) === 0).length || 0;
  const urgentTasks = tasks?.filter(t => t.priority === 'high').length || 0;

  const next7Days = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const count = tasks?.filter(t => {
        const dt = new Date(t.dueDate);
        dt.setHours(0, 0, 0, 0);
        return dt.getTime() === d.getTime();
      }).length || 0;
      return { date: d, count };
    });
  }, [tasks]);

  const lang = (typeof navigator !== 'undefined' && navigator.language) || 'it';

  return (
    <div className="min-h-screen bg-gradient-to-b from-garden-cream to-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-garden-leaf to-garden-sage text-white p-6 rounded-b-3xl shadow-elevated">
        <h1 className="text-3xl font-bold mb-2">{greeting}</h1>
        <p className="text-green-100">
          {t(getSeasonName(getCurrentSeason()))} · {t('home.tagline')}
        </p>
      </div>

      {/* Weather Widget */}
      <WeatherWidget />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 p-4 -mt-2">
        <Card className="bg-white/90 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('home.active_plants')}</p>
                <p className="text-2xl font-bold text-garden-leaf">{activePlants}</p>
              </div>
              <Sprout className="w-10 h-10 text-garden-leaf opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('home.to_water')}</p>
                <p className="text-2xl font-bold text-garden-water">{needsWateringCount}</p>
              </div>
              <Droplet className="w-10 h-10 text-garden-water opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('home.tasks_today')}</p>
                <p className="text-2xl font-bold text-garden-sun">{todayTasks}</p>
              </div>
              <Calendar className="w-10 h-10 text-garden-sun opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('home.urgent')}</p>
                <p className="text-2xl font-bold text-garden-terracotta">{urgentTasks}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-garden-terracotta opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Widget prossimi 7 giorni */}
      <div className="px-4 mt-2">
        <Card className="bg-white/90">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold flex items-center gap-2 text-gray-700">
                <Calendar className="w-4 h-4 text-garden-leaf" />
                {t('home.next_7_days')}
              </h2>
              <Link to="/calendario" className="text-xs text-garden-leaf font-medium hover:underline">
                {t('home.view_all')}
              </Link>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {next7Days.map((d, i) => {
                const dayLabel = i === 0
                  ? t('home.today_short')
                  : d.date.toLocaleDateString(lang, { weekday: 'short' }).slice(0, 3);
                const dayNum = d.date.getDate();
                const hasTasks = d.count > 0;
                return (
                  <Link
                    key={d.date.toISOString()}
                    to="/calendario"
                    className={`flex flex-col items-center justify-center p-1.5 rounded-xl border ${
                      hasTasks
                        ? 'bg-garden-leaf/10 border-garden-leaf/30 hover:bg-garden-leaf/20'
                        : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                    } transition-colors`}
                  >
                    <span className="text-[10px] font-medium text-gray-500 capitalize leading-none">
                      {dayLabel.replace('.', '')}
                    </span>
                    <span className={`text-lg font-bold leading-tight ${hasTasks ? 'text-garden-leaf' : 'text-gray-400'}`}>
                      {dayNum}
                    </span>
                    {hasTasks ? (
                      <Badge className="text-[9px] py-0 px-1.5 bg-garden-leaf text-white border-0 leading-tight">
                        {d.count}
                      </Badge>
                    ) : (
                      <span className="text-[9px] text-gray-300 leading-tight">—</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks in scadenza */}
      {tasks && tasks.length > 0 && (
        <div className="px-4 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-garden-leaf" />
              {t('home.tasks_section')}
            </h2>
          </div>
          <div className="space-y-2">
            {tasks.slice(0, 3).map((task) => (
              <Card key={task.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{task.title}</h3>
                        {task.priority === 'high' && (
                          <Badge variant="destructive" className="text-xs">
                            {t('home.urgent_badge')}
                          </Badge>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span><Calendar className="w-3.5 h-3.5 inline-block mr-1" />{formatShortDate(task.dueDate)}</span>
                        {getDaysUntil(task.dueDate) === 0 && (
                          <Badge variant="warning" className="text-xs">{t('home.today')}</Badge>
                        )}
                        {getDaysUntil(task.dueDate) < 0 && (
                          <Badge variant="destructive" className="text-xs">{t('home.expired')}</Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={async () => {
                        if (task.id) {
                          await db.tasks.update(task.id, { completed: true });
                          cancelTaskNotification(task.id);
                        }
                      }}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Piante in evidenza */}
      {plants && plants.length > 0 && (
        <div className="px-4 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Leaf className="w-5 h-5 text-garden-leaf" />
              {t('home.plants_section')}
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {plants.slice(0, 3).map((plant) => (
              <Card key={plant.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">{plant.name}</h3>
                    <Badge className={getStatusColor(plant.status)}>
                      {t(getStatusLabel(plant.status))}
                    </Badge>
                  </div>
                  {plant.scientificName && (
                    <p className="text-sm italic text-muted-foreground mb-2">
                      {plant.scientificName}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{plant.location}</span>
                    <span>
                      {plant.wateringFrequency === 1
                        ? t('home.watering_days_one', { count: plant.wateringFrequency })
                        : t('home.watering_days_other', { count: plant.wateringFrequency })
                      }
                    </span>
                  </div>
                  {plant.notes && (
                    <p className="text-sm text-muted-foreground mt-2 bg-garden-cream/30 p-2 rounded-lg">
                      {plant.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Ricette di stagione */}
      {recipes && recipes.length > 0 && (
        <div className="px-4 mt-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-garden-terracotta" />
              {t('home.recipes_section')}
            </h2>
          </div>
          <div className="space-y-2">
            {recipes.slice(0, 2).map((recipe) => (
              <Card key={recipe.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-1">{recipe.title}</h3>
                  {recipe.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {recipe.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{t('home.minutes', { count: recipe.prepTime + recipe.cookTime })}</span>
                    <span>
                      {recipe.servings === 1
                        ? t('home.people_one', { count: recipe.servings })
                        : t('home.people_other', { count: recipe.servings })
                      }
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {recipe.difficulty === 'easy' ? t('difficulty.easy') : recipe.difficulty === 'medium' ? t('difficulty.medium') : t('difficulty.hard')}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
