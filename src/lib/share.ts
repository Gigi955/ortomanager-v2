import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import type { Plant, Harvest } from './db';

export interface ShareOptions {
  title: string;
  text: string;
  dialogTitle?: string;
}

export async function sharePayload(opts: ShareOptions): Promise<boolean> {
  // Native (Capacitor) o Web Share API
  if (Capacitor.isNativePlatform()) {
    try {
      await Share.share({
        title: opts.title,
        text: opts.text,
        dialogTitle: opts.dialogTitle ?? opts.title,
      });
      return true;
    } catch (e) {
      console.warn('[share] native failed', e);
      return false;
    }
  }

  if (typeof navigator !== 'undefined' && (navigator as Navigator & { share?: (data: ShareData) => Promise<void> }).share) {
    try {
      await (navigator as Navigator & { share: (data: ShareData) => Promise<void> }).share({
        title: opts.title,
        text: opts.text,
      });
      return true;
    } catch {
      return false;
    }
  }

  // Fallback: clipboard
  try {
    await navigator.clipboard.writeText(`${opts.title}\n\n${opts.text}`);
    return true;
  } catch {
    return false;
  }
}

function fmt(d: Date | string): string {
  const dt = new Date(d);
  return dt.toLocaleDateString();
}

export async function sharePlant(plant: Plant): Promise<boolean> {
  const lines = [
    `🌱 ${plant.name}${plant.variety ? ` (${plant.variety})` : ''}`,
    `📍 ${plant.location}`,
    `🗓️ Piantata: ${fmt(plant.plantedDate)}`,
    `🔢 N. piante: ${plant.numberOfPlants}`,
    `💧 Annaffiare ogni ${plant.wateringFrequency} giorni`,
    plant.notes ? `📝 ${plant.notes}` : '',
    '',
    '— condiviso da OrtoManager 🌿',
  ].filter(Boolean);

  return sharePayload({
    title: `OrtoManager — ${plant.name}`,
    text: lines.join('\n'),
  });
}

export async function shareHarvest(harvest: Harvest, plantName: string): Promise<boolean> {
  const lines = [
    `🌾 Raccolto: ${plantName}`,
    `📅 ${fmt(harvest.date)}`,
    `⚖️ ${harvest.quantity} ${harvest.unit}`,
    harvest.notes ? `📝 ${harvest.notes}` : '',
    '',
    '— condiviso da OrtoManager 🌿',
  ].filter(Boolean);

  return sharePayload({
    title: `OrtoManager — Raccolto ${plantName}`,
    text: lines.join('\n'),
  });
}
