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

export function needsWatering(plant: Pick<Plant, 'lastWatered' | 'wateringFrequency'>): boolean {
  if (!plant.lastWatered) return true;
  const daysSince = Math.floor((Date.now() - new Date(plant.lastWatered).getTime()) / (1000 * 60 * 60 * 24));
  return daysSince >= plant.wateringFrequency;
}

export function daysSinceWatered(plant: Pick<Plant, 'lastWatered' | 'wateringFrequency'>): number {
  if (!plant.lastWatered) return plant.wateringFrequency + 1;
  return Math.floor((Date.now() - new Date(plant.lastWatered).getTime()) / (1000 * 60 * 60 * 24));
}
