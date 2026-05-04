import type { Task } from './db';

const CATEGORY_EMOJI: Record<Task['category'], string> = {
  watering: '💧',
  fertilizing: '🌿',
  pruning: '✂️',
  harvesting: '🌾',
  planting: '🌱',
  other: '📝',
};

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function formatICSDate(d: Date): string {
  // Tutto giorno → YYYYMMDD
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

function formatICSDateTime(d: Date): string {
  return `${formatICSDate(d)}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

export function buildICS(tasks: Task[], opts?: { reminderHour?: number }): string {
  const reminderHour = opts?.reminderHour ?? 9;
  const now = new Date();
  const dtstamp = formatICSDateTime(now);

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//OrtoManager//IT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:OrtoManager',
    'X-WR-TIMEZONE:Europe/Rome',
  ];

  for (const task of tasks) {
    if (!task.id) continue;
    const dt = new Date(task.dueDate);
    dt.setHours(reminderHour, 0, 0, 0);
    const dtEnd = new Date(dt);
    dtEnd.setMinutes(dtEnd.getMinutes() + 30);

    const emoji = CATEGORY_EMOJI[task.category] ?? '📝';
    const summary = `${emoji} ${task.title}`;
    const description = task.description ?? '';
    const uid = `task-${task.id}@ortomanager`;

    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${formatICSDateTime(dt)}`,
      `DTEND:${formatICSDateTime(dtEnd)}`,
      `SUMMARY:${escapeICS(summary)}`,
      `DESCRIPTION:${escapeICS(description)}`,
      `CATEGORIES:${task.category.toUpperCase()}`,
      task.completed ? 'STATUS:COMPLETED' : 'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'TRIGGER:-PT0M',
      `DESCRIPTION:${escapeICS(summary)}`,
      'END:VALARM',
      'END:VEVENT',
    );
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadICS(tasks: Task[], filename = 'ortomanager.ics', opts?: { reminderHour?: number }): void {
  const content = buildICS(tasks, opts);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
