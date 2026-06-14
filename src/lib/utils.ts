import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Plant } from "@/lib/db"
import i18n from "@/i18n"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  const lang = i18n.language?.split('-')[0] || 'it';
  return new Intl.DateTimeFormat(lang, {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

export function formatShortDate(date: Date): string {
  const lang = i18n.language?.split('-')[0] || 'it';
  return new Intl.DateTimeFormat(lang, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

export function getDaysUntil(date: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Returns i18n key — callers do: t(getSeasonName(season))
export function getSeasonName(season: string): string {
  return `season.${season}`;
}

export function getCurrentSeason(): 'spring' | 'summer' | 'autumn' | 'winter' {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
}

// Funzioni condivise per le piante
export function getStatusColor(status: Plant['status']): string {
  const colors: Record<Plant['status'], string> = {
    seedling: 'bg-yellow-100 text-yellow-800',
    growing: 'bg-green-100 text-green-800',
    flowering: 'bg-pink-100 text-pink-800',
    fruiting: 'bg-orange-100 text-orange-800',
    harvested: 'bg-blue-100 text-blue-800',
    dormant: 'bg-gray-100 text-gray-800',
    uprooted: 'bg-red-100 text-red-800'
  };
  return colors[status];
}

// Returns i18n key — callers do: t(getStatusLabel(status))
export function getStatusLabel(status: Plant['status']): string {
  return `status.${status}`;
}

// Frequenza di irrigazione normalizzata: numero intero >= 1 (robusto a stringhe/valori mancanti)
function wateringFreq(plant: Pick<Plant, 'wateringFrequency'>): number {
  const n = Math.floor(Number(plant.wateringFrequency));
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

// Giorni di CALENDARIO trascorsi tra due date (entrambe azzerate a mezzanotte),
// così "innaffiata oggi" = 0 giorni a prescindere dall'ora dell'innaffiatura.
function calendarDaysBetween(from: Date, to: Date = new Date()): number {
  const a = new Date(from); a.setHours(0, 0, 0, 0);
  const b = new Date(to); b.setHours(0, 0, 0, 0);
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export function needsWatering(plant: Pick<Plant, 'lastWatered' | 'wateringFrequency'>): boolean {
  if (!plant.lastWatered) return true;
  return calendarDaysBetween(new Date(plant.lastWatered)) >= wateringFreq(plant);
}

// Giorni di calendario dall'ultima innaffiatura (0 = oggi). Se mai innaffiata, ritorna -1.
export function daysSinceWatered(plant: Pick<Plant, 'lastWatered' | 'wateringFrequency'>): number {
  if (!plant.lastWatered) return -1;
  return calendarDaysBetween(new Date(plant.lastWatered));
}

// Giorni mancanti alla prossima irrigazione. <= 0 quando la pianta è già da innaffiare.
// Se mai innaffiata, ritorna 0 (da innaffiare subito).
export function daysUntilWatering(plant: Pick<Plant, 'lastWatered' | 'wateringFrequency'>): number {
  if (!plant.lastWatered) return 0;
  return wateringFreq(plant) - calendarDaysBetween(new Date(plant.lastWatered));
}
