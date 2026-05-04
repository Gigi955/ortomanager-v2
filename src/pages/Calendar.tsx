import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTranslation } from 'react-i18next';
import { db, Task, Plant } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Plus, CheckCircle2, Circle, Calendar as CalendarIcon,
  Droplet, Scissors, Sprout, Leaf, Wheat, Trash2, ChevronLeft, ChevronRight, ChevronDown
} from 'lucide-react';
import { formatShortDate, getDaysUntil } from '@/lib/utils';
import AddTaskDialog from '@/components/AddTaskDialog';
import { scheduleTaskNotification, cancelTaskNotification } from '@/lib/notifications';
import { useWeather } from '@/hooks/useWeather';
import { CloudRain, SkipForward, Download } from 'lucide-react';
import { toast } from 'sonner';
import { downloadICS } from '@/lib/ics';

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  let day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // lunedi = 0
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const CATEGORY_ICONS: Record<Task['category'], React.ReactNode> = {
  watering: <Droplet className="w-4 h-4 text-blue-500" />,
  fertilizing: <Wheat className="w-4 h-4 text-yellow-600" />,
  pruning: <Scissors className="w-4 h-4 text-purple-500" />,
  harvesting: <Leaf className="w-4 h-4 text-green-600" />,
  planting: <Sprout className="w-4 h-4 text-green-500" />,
  other: <CalendarIcon className="w-4 h-4 text-gray-500" />,
};

const PRIORITY_COLORS: Record<Task['priority'], string> = {
  low: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  high: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
};

export default function CalendarPage() {
  const { t, i18n } = useTranslation();
  const today = new Date();
  const [view, setView] = useState<'grid' | 'lista'>('grid');
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [calMonth, setCalMonth] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [showAddTask, setShowAddTask] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);

  const lang = i18n.language?.split('-')[0] || 'it';

  const MONTHS_DISPLAY = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => {
      const name = new Date(2000, i, 1).toLocaleDateString(lang, { month: 'long' });
      return name.charAt(0).toUpperCase() + name.slice(1);
    })
  , [lang]);

  const MONTHS_SHORT = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => {
      const name = new Date(2000, i, 1).toLocaleDateString(lang, { month: 'short' });
      return name.charAt(0).toUpperCase() + name.slice(1).replace('.', '');
    })
  , [lang]);

  const DAYS = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const name = new Date(2000, 0, 3 + i).toLocaleDateString(lang, { weekday: 'short' });
      return name.charAt(0).toUpperCase() + name.slice(1).replace('.', '');
    })
  , [lang]);

  const CATEGORY_LABELS: Record<Task['category'], string> = {
    watering: t('taskCategory.watering'),
    fertilizing: t('taskCategory.fertilizing'),
    pruning: t('taskCategory.pruning'),
    harvesting: t('taskCategory.harvesting'),
    planting: t('taskCategory.planting'),
    other: t('taskCategory.other'),
  };

  const PRIORITY_LABELS: Record<Task['priority'], string> = {
    low: t('priority.low'),
    medium: t('priority.medium'),
    high: t('priority.high'),
  };

  const allTasks = useLiveQuery(() => db.tasks.toArray());
  const plants = useLiveQuery(() => db.plants.toArray());
  const settings = useLiveQuery(() => db.settings.toArray().then(s => s[0]));
  const { weather } = useWeather(settings?.latitude, settings?.longitude);

  const RAIN_THRESHOLD_MM = 5;
  const rainByDate = useMemo(() => {
    const m = new Map<string, number>();
    weather?.daily.forEach(d => m.set(d.date, d.precipitationSum));
    return m;
  }, [weather]);

  const dateKey = (d: Date | string) => {
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
  };

  const skipWateringTask = async (taskId: number) => {
    await db.tasks.update(taskId, { completed: true });
    cancelTaskNotification(taskId);
    toast.success(t('calendar.skipped_rain'));
  };

  const plantMap = useMemo(() => {
    const m = new Map<number, Plant>();
    plants?.forEach(p => { if (p.id) m.set(p.id, p); });
    return m;
  }, [plants]);

  // Giorni con task nel mese visualizzato
  const taskDayMap = useMemo(() => {
    const m = new Map<string, { hasPending: boolean; hasOverdue: boolean }>();
    allTasks?.forEach(task => {
      const d = new Date(task.dueDate);
      if (d.getFullYear() !== calMonth.year || d.getMonth() !== calMonth.month) return;
      const key = d.getDate().toString();
      const prev = m.get(key) || { hasPending: false, hasOverdue: false };
      const daysUntil = getDaysUntil(d);
      m.set(key, {
        hasPending: prev.hasPending || (!task.completed && daysUntil >= 0),
        hasOverdue: prev.hasOverdue || (!task.completed && daysUntil < 0),
      });
    });
    return m;
  }, [allTasks, calMonth]);

  const selectedDayTasks = useMemo(() =>
    allTasks?.filter(task => sameDay(new Date(task.dueDate), selectedDate))
      .sort((a, b) => a.completed ? 1 : b.completed ? -1 : 0)
  , [allTasks, selectedDate]);

  const sortedTasks = useMemo(() => {
    const filtered = showCompleted ? allTasks : allTasks?.filter(task => !task.completed);
    return filtered?.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }, [allTasks, showCompleted]);

  const pendingCount = allTasks?.filter(task => !task.completed).length ?? 0;

  const toggleTask = async (taskId: number, completed: boolean) => {
    const newCompleted = !completed;
    await db.tasks.update(taskId, { completed: newCompleted });
    if (newCompleted) {
      cancelTaskNotification(taskId);
    } else {
      const task = await db.tasks.get(taskId);
      if (task) scheduleTaskNotification(task);
    }
  };
  const deleteTask = async (taskId: number) => {
    cancelTaskNotification(taskId);
    await db.tasks.delete(taskId);
  };

  const prevMonth = () => {
    setCalMonth(prev => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { year: prev.year, month: prev.month - 1 };
    });
  };
  const nextMonth = () => {
    setCalMonth(prev => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  const groupTasksByDate = (tasks: Task[]) => {
    const groups: Record<string, Task[]> = {};
    tasks.forEach(task => {
      const daysUntil = getDaysUntil(new Date(task.dueDate));
      let key = daysUntil < 0 ? t('calendar.group_overdue')
        : daysUntil === 0 ? t('calendar.group_today')
        : daysUntil === 1 ? t('calendar.group_tomorrow')
        : daysUntil <= 7 ? t('calendar.group_this_week')
        : daysUntil <= 30 ? t('calendar.group_this_month')
        : t('calendar.group_upcoming');
      if (!groups[key]) groups[key] = [];
      groups[key].push(task);
    });
    return groups;
  };

  const groupOrder = [
    t('calendar.group_overdue'),
    t('calendar.group_today'),
    t('calendar.group_tomorrow'),
    t('calendar.group_this_week'),
    t('calendar.group_this_month'),
    t('calendar.group_upcoming'),
  ];

  const daysInMonth = getDaysInMonth(calMonth.year, calMonth.month);
  const firstDayOffset = getFirstDayOfMonth(calMonth.year, calMonth.month);

  const taskGroups = sortedTasks ? groupTasksByDate(sortedTasks) : {};

  const TaskCard = ({ task }: { task: Task }) => {
    const daysUntil = getDaysUntil(new Date(task.dueDate));
    const isOverdue = daysUntil < 0 && !task.completed;
    const isToday = daysUntil === 0;
    const plant = task.plantId ? plantMap.get(task.plantId) : undefined;
    const rainMm = rainByDate.get(dateKey(task.dueDate)) ?? 0;
    const isRainyWatering = task.category === 'watering' && !task.completed && rainMm >= RAIN_THRESHOLD_MM;
    return (
      <Card className={`overflow-hidden dark:bg-gray-800 dark:border-gray-700 ${task.completed ? 'opacity-60' : ''} ${isOverdue ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20' : ''} ${isRainyWatering ? 'border-blue-200 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-950/20' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <button onClick={() => task.id && toggleTask(task.id, task.completed)} className="mt-1 shrink-0">
              {task.completed
                ? <CheckCircle2 className="w-6 h-6 text-green-500" />
                : <Circle className="w-6 h-6 text-gray-400 hover:text-garden-leaf transition-colors" />
              }
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className={`font-semibold dark:text-white ${task.completed ? 'line-through text-gray-400' : ''}`}>{task.title}</h3>
                <div className="flex items-center gap-1 shrink-0">
                  {task.priority !== 'low' && !task.completed && (
                    <Badge className={`${PRIORITY_COLORS[task.priority]} text-xs`}>{PRIORITY_LABELS[task.priority]}</Badge>
                  )}
                  <button onClick={() => task.id && deleteTask(task.id)} className="text-gray-300 hover:text-red-400 transition-colors ml-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {task.description && <p className="text-sm text-muted-foreground mb-2">{task.description}</p>}
              {plant && <p className="text-xs text-garden-leaf font-medium mb-1">{plant.name}</p>}
              <div className="flex items-center gap-3 text-sm flex-wrap">
                <span className="flex items-center gap-1 text-muted-foreground">
                  {CATEGORY_ICONS[task.category]}{CATEGORY_LABELS[task.category]}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <CalendarIcon className="w-3.5 h-3.5" />{formatShortDate(new Date(task.dueDate))}
                </span>
                {isToday && !task.completed && <Badge variant="warning" className="text-xs">{t('calendar.today_badge')}</Badge>}
                {isOverdue && <Badge variant="destructive" className="text-xs">{t('calendar.expired_badge')}</Badge>}
                {isRainyWatering && (
                  <Badge variant="outline" className="text-xs gap-1 bg-blue-50 text-blue-700 border-blue-200">
                    <CloudRain className="w-3 h-3" />
                    {t('calendar.rain_expected', { mm: rainMm.toFixed(1) })}
                  </Badge>
                )}
              </div>
              {isRainyWatering && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 text-blue-700 border-blue-200 hover:bg-blue-50 text-xs"
                  onClick={() => task.id && skipWateringTask(task.id)}
                >
                  <SkipForward className="w-3.5 h-3.5 mr-1" />
                  {t('calendar.skip_watering')}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-garden-cream to-white dark:from-gray-900 dark:to-gray-800 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-garden-leaf to-garden-sage text-white p-6 rounded-b-3xl shadow-elevated">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-1">{t('calendar.title')}</h1>
            <p className="text-green-100">
              {pendingCount === 1
                ? t('calendar.pending_one', { count: pendingCount })
                : t('calendar.pending_other', { count: pendingCount })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="bg-white/20 text-white hover:bg-white/30 rounded-full w-10 h-10"
              title={t('calendar.export_ics')}
              onClick={() => {
                if (!allTasks || allTasks.length === 0) {
                  toast.info(t('calendar.export_empty'));
                  return;
                }
                downloadICS(allTasks, 'ortomanager.ics', { reminderHour: settings?.reminderHour ?? 9 });
                toast.success(t('calendar.export_done'));
              }}
            >
              <Download className="w-5 h-5" />
            </Button>
            <Button size="icon" className="bg-white text-garden-leaf hover:bg-green-50 rounded-full w-12 h-12" onClick={() => setShowAddTask(true)}>
              <Plus className="w-6 h-6" />
            </Button>
          </div>
        </div>
        {/* Tab view */}
        <div className="flex gap-2">
          <button
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${view === 'grid' ? 'bg-white text-garden-leaf' : 'bg-white/20 text-white hover:bg-white/30'}`}
            onClick={() => setView('grid')}
          >
            {t('calendar.tab_calendar')}
          </button>
          <button
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${view === 'lista' ? 'bg-white text-garden-leaf' : 'bg-white/20 text-white hover:bg-white/30'}`}
            onClick={() => setView('lista')}
          >
            {t('calendar.tab_list')}
          </button>
        </div>
      </div>

      {view === 'grid' ? (
        <div className="px-4 mt-4">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <ChevronLeft className="w-5 h-5 dark:text-white" />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowYearPicker(!showYearPicker)}
                className="font-bold text-lg dark:text-white px-3 py-1 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
              >
                {MONTHS_DISPLAY[calMonth.month]} {calMonth.year}
                <ChevronDown className="w-4 h-4 opacity-60" />
              </button>
              {showYearPicker && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-3 w-64">
                  {/* Mesi */}
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide text-center">{t('calendar.month_label')}</p>
                  <div className="grid grid-cols-4 gap-1 mb-3">
                    {MONTHS_SHORT.map((m, i) => (
                      <button
                        key={m}
                        onClick={() => { setCalMonth(prev => ({ ...prev, month: i })); setShowYearPicker(false); }}
                        className={`text-xs py-1 px-1 rounded-lg transition-colors ${calMonth.month === i ? 'bg-garden-leaf text-white font-bold' : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white'}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                  {/* Anno */}
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide text-center">{t('calendar.year_label')}</p>
                  <div className="grid grid-cols-4 gap-1 max-h-32 overflow-y-auto">
                    {Array.from({ length: 20 }, (_, i) => today.getFullYear() - 10 + i).map(yr => (
                      <button
                        key={yr}
                        onClick={() => { setCalMonth(prev => ({ ...prev, year: yr })); setShowYearPicker(false); }}
                        className={`text-xs py-1 px-1 rounded-lg transition-colors ${calMonth.year === yr ? 'bg-garden-leaf text-white font-bold' : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white'}`}
                      >
                        {yr}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <ChevronRight className="w-5 h-5 dark:text-white" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 py-1">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 mb-6">
            {Array.from({ length: firstDayOffset }, (_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dayDate = new Date(calMonth.year, calMonth.month, day);
              const isToday = sameDay(dayDate, today);
              const isSelected = sameDay(dayDate, selectedDate);
              const info = taskDayMap.get(day.toString());
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(dayDate)}
                  className={`
                    relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-medium transition-all
                    ${isSelected ? 'bg-garden-leaf text-white shadow-md' : isToday ? 'bg-garden-leaf/10 dark:bg-garden-leaf/20 text-garden-leaf font-bold' : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white'}
                  `}
                >
                  {day}
                  {info && (
                    <div className="flex gap-0.5 mt-0.5">
                      {info.hasOverdue && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                      {info.hasPending && <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected day tasks */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-700 dark:text-gray-200">
                {sameDay(selectedDate, today)
                  ? t('calendar.group_today')
                  : `${selectedDate.getDate()} ${MONTHS_DISPLAY[selectedDate.getMonth()]}`}
              </h3>
              <Button size="sm" variant="outline" className="rounded-full text-xs" onClick={() => setShowAddTask(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" />{t('calendar.add')}
              </Button>
            </div>
            {selectedDayTasks && selectedDayTasks.length > 0 ? (
              <div className="space-y-2">
                {selectedDayTasks.map(task => <TaskCard key={task.id} task={task} />)}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <CalendarIcon className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">{t('calendar.no_tasks_day')}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="px-4 mt-4">
          {/* Filtro completate */}
          <div className="flex gap-2 mb-4">
            <Button variant={!showCompleted ? 'default' : 'outline'} size="sm" onClick={() => setShowCompleted(false)} className="rounded-full">{t('calendar.todo')}</Button>
            <Button variant={showCompleted ? 'default' : 'outline'} size="sm" onClick={() => setShowCompleted(true)} className="rounded-full">{t('calendar.all')}</Button>
          </div>

          <div className="space-y-6">
            {groupOrder.map(groupKey => {
              const groupTasks = taskGroups[groupKey];
              if (!groupTasks || groupTasks.length === 0) return null;
              return (
                <div key={groupKey}>
                  <h2 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-3 px-1">{groupKey}</h2>
                  <div className="space-y-2">
                    {groupTasks.map(task => <TaskCard key={task.id} task={task} />)}
                  </div>
                </div>
              );
            })}
            {(!sortedTasks || sortedTasks.length === 0) && (
              <div className="text-center py-12">
                <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-2">
                  {showCompleted ? t('calendar.no_tasks') : t('calendar.no_tasks_todo')}
                </p>
                <Button className="rounded-full mt-2" onClick={() => setShowAddTask(true)}>
                  <Plus className="w-4 h-4 mr-2" />{t('calendar.new_task')}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <AddTaskDialog
        open={showAddTask}
        onOpenChange={setShowAddTask}
        defaultDate={view === 'grid' ? selectedDate : undefined}
      />
    </div>
  );
}
