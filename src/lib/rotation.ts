import type { Plant } from './db';

// Famiglie botaniche principali per le piante del catalogo OrtoManager
const FAMILY_BY_NAME: Record<string, string> = {
  // Solanaceae
  'pomodoro': 'Solanaceae',
  'pomodoro ciliegino': 'Solanaceae',
  'melanzana': 'Solanaceae',
  'peperone': 'Solanaceae',
  'patata': 'Solanaceae',
  // Cucurbitaceae
  'zucchina': 'Cucurbitaceae',
  'cetriolo': 'Cucurbitaceae',
  'zucca': 'Cucurbitaceae',
  // Brassicaceae
  'cavolo cappuccio': 'Brassicaceae',
  'broccolo': 'Brassicaceae',
  'ravanello': 'Brassicaceae',
  // Apiaceae
  'carota': 'Apiaceae',
  'sedano': 'Apiaceae',
  'finocchio': 'Apiaceae',
  'aneto': 'Apiaceae',
  'prezzemolo': 'Apiaceae',
  // Alliaceae
  'cipolla': 'Alliaceae',
  'aglio': 'Alliaceae',
  'porro': 'Alliaceae',
  'cipollotto': 'Alliaceae',
  'erba cipollina': 'Alliaceae',
  // Fabaceae
  'fagiolo': 'Fabaceae',
  'pisello': 'Fabaceae',
  // Asteraceae
  'lattuga': 'Asteraceae',
  'carciofo': 'Asteraceae',
  'calendula': 'Asteraceae',
  'girasole': 'Asteraceae',
  'camomilla': 'Asteraceae',
  // Chenopodiaceae
  'spinacio': 'Chenopodiaceae',
  'barbabietola rossa': 'Chenopodiaceae',
  // Lamiaceae
  'basilico': 'Lamiaceae',
  'rosmarino': 'Lamiaceae',
  'salvia': 'Lamiaceae',
  'menta': 'Lamiaceae',
  'timo': 'Lamiaceae',
  'origano': 'Lamiaceae',
  'lavanda': 'Lamiaceae',
  // Liliaceae
  'asparago': 'Liliaceae',
  // Rosaceae
  'fragola': 'Rosaceae',
  'lampone': 'Rosaceae',
  'melo': 'Rosaceae',
  'pero': 'Rosaceae',
  'ciliegio': 'Rosaceae',
  'pesco': 'Rosaceae',
};

export function getPlantFamily(name: string): string | null {
  const norm = name.toLowerCase().trim();
  if (FAMILY_BY_NAME[norm]) return FAMILY_BY_NAME[norm];
  // match parziale
  for (const [k, v] of Object.entries(FAMILY_BY_NAME)) {
    if (norm.includes(k)) return v;
  }
  return null;
}

const TWO_YEARS_MS = 2 * 365 * 24 * 60 * 60 * 1000;

export interface RotationConflict {
  conflictPlant: Plant;
  family: string;
  yearsAgo: number;
}

/**
 * Controlla se c'è una pianta della stessa famiglia botanica che è stata
 * coltivata nella stessa location entro gli ultimi 2 anni.
 */
export function checkRotationConflict(
  newName: string,
  newLocation: string,
  newPlantedDate: Date,
  allPlants: Plant[],
): RotationConflict | null {
  const newFamily = getPlantFamily(newName);
  if (!newFamily) return null;

  const newDate = new Date(newPlantedDate).getTime();
  const newLocNorm = newLocation.toLowerCase().trim();

  for (const p of allPlants) {
    if (!p.location) continue;
    if (p.location.toLowerCase().trim() !== newLocNorm) continue;

    const family = getPlantFamily(p.name);
    if (family !== newFamily) continue;

    const plantedAt = new Date(p.plantedDate).getTime();
    const diff = newDate - plantedAt;
    if (diff > 0 && diff <= TWO_YEARS_MS) {
      return {
        conflictPlant: p,
        family,
        yearsAgo: diff / (365 * 24 * 60 * 60 * 1000),
      };
    }
  }
  return null;
}
