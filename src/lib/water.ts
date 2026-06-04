import { Plant } from './db';

// Stima ml d'acqua per singola pianta, in base alla categoria.
export const ML_PER_PLANT: Record<Plant['category'], number> = {
  herbs: 200,
  flowers: 300,
  vegetables: 500,
  fruits: 1000,
  trees: 5000,
};

// Moltiplicatore stagionale per mese (0 = gennaio … 11 = dicembre)
export const SEASONAL_MULTIPLIER: number[] = [
  0.6, 0.6, 0.8, 1.0, 1.2, 1.5,
  1.6, 1.5, 1.2, 1.0, 0.8, 0.6,
];

export function getSeasonalMultiplier(date: Date = new Date()): number {
  return SEASONAL_MULTIPLIER[date.getMonth()];
}

// Valore "base" (prima del moltiplicatore stagionale) per singola pianta
export function baseMlPerPlant(plant: Plant): number {
  return plant.waterAmount ?? ML_PER_PLANT[plant.category] ?? 500;
}

// Se l'utente non ha forzato un valore manuale, di default usiamo la stagionalità
export function isSeasonalActive(plant: Plant): boolean {
  return plant.waterAutoSeasonal ?? (plant.waterAmount === undefined);
}

// ml per singola pianta, applicando override manuale e/o stagionalità
export function waterMlPerPlant(plant: Plant, date: Date = new Date()): number {
  const base = baseMlPerPlant(plant);
  const mult = isSeasonalActive(plant) ? getSeasonalMultiplier(date) : 1;
  return Math.round(base * mult);
}

export function waterMlTotal(plant: Plant, date: Date = new Date()): number {
  return waterMlPerPlant(plant, date) * (plant.numberOfPlants || 1);
}

export function formatWater(ml: number, lang: string): string {
  if (ml < 1000) return `${ml} ml`;
  const liters = ml / 1000;
  const formatted = new Intl.NumberFormat(lang, { maximumFractionDigits: 1 }).format(liters);
  return `${formatted} L`;
}
