import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { db, type Task } from './db';

const DEFAULT_HOUR = 9;

const CATEGORY_EMOJI: Record<Task['category'], string> = {
  watering: '💧',
  fertilizing: '🌿',
  pruning: '✂️',
  harvesting: '🌾',
  planting: '🌱',
  other: '📝',
};

function notificationIdFor(taskId: number): number {
  // Capacitor accetta id numerici a 32 bit; tasks.id parte da 1, è già sicuro.
  return taskId;
}

async function notificationsAllowed(): Promise<boolean> {
  const settings = await db.settings.toArray().then(s => s[0]);
  if (settings && settings.notifications === false) return false;

  if (Capacitor.isNativePlatform()) {
    try {
      const r = await LocalNotifications.checkPermissions();
      return r.display === 'granted';
    } catch {
      return false;
    }
  }
  return false;
}

function buildScheduleDate(dueDate: Date | string, hour: number): Date {
  const d = new Date(dueDate);
  d.setHours(hour, 0, 0, 0);
  return d;
}

export async function scheduleTaskNotification(task: Task): Promise<void> {
  if (!task.id || task.completed) return;
  if (!(await notificationsAllowed())) return;

  const settings = await db.settings.toArray().then(s => s[0]);
  const hour = settings?.reminderHour ?? DEFAULT_HOUR;
  const at = buildScheduleDate(task.dueDate, hour);
  if (at.getTime() <= Date.now()) return; // niente notifiche per task già passate

  const id = notificationIdFor(task.id);
  const emoji = CATEGORY_EMOJI[task.category] ?? '📝';

  try {
    await LocalNotifications.cancel({ notifications: [{ id }] }).catch(() => {});
    await LocalNotifications.schedule({
      notifications: [
        {
          id,
          title: `${emoji} ${task.title}`,
          body: task.description || 'Promemoria OrtoManager',
          schedule: { at },
          smallIcon: 'ic_stat_icon_config_sample',
          extra: { taskId: task.id },
        },
      ],
    });
  } catch (e) {
    console.warn('[notifications] schedule failed', e);
  }
}

export async function cancelTaskNotification(taskId: number): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.cancel({ notifications: [{ id: notificationIdFor(taskId) }] });
  } catch (e) {
    console.warn('[notifications] cancel failed', e);
  }
}

export async function rescheduleAllPendingTasks(): Promise<number> {
  if (!(await notificationsAllowed())) return 0;
  const tasks = await db.tasks.where('completed').equals(0 as unknown as boolean).toArray()
    .catch(async () => (await db.tasks.toArray()).filter(t => !t.completed));
  let count = 0;
  for (const t of tasks) {
    if (!t.id) continue;
    await scheduleTaskNotification(t);
    count++;
  }
  return count;
}

export async function cancelAllTaskNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications.map(n => ({ id: n.id })) });
    }
  } catch (e) {
    console.warn('[notifications] cancelAll failed', e);
  }
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    if ('Notification' in window) {
      const r = await Notification.requestPermission();
      return r === 'granted';
    }
    return false;
  }
  try {
    const check = await LocalNotifications.checkPermissions();
    if (check.display === 'granted') return true;
    const req = await LocalNotifications.requestPermissions();
    return req.display === 'granted';
  } catch {
    return false;
  }
}
