import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { db } from './db';

export interface SavedLocation {
  city: string;
  latitude: number;
  longitude: number;
}

async function getCoords(): Promise<{ latitude: number; longitude: number }> {
  if (Capacitor.isNativePlatform()) {
    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
    });
    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
  }
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation API not available'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=it`
    );
    const data = await res.json();
    return (
      data.address?.city ||
      data.address?.town ||
      data.address?.village ||
      data.address?.municipality ||
      data.address?.county ||
      ''
    );
  } catch {
    return '';
  }
}

export async function fetchAndSaveLocation(): Promise<SavedLocation | null> {
  try {
    const { latitude, longitude } = await getCoords();
    const city = await reverseGeocode(latitude, longitude);
    const existing = (await db.settings.toArray())[0];
    if (existing?.id) {
      await db.settings.update(existing.id, { city, latitude, longitude });
    } else {
      await db.settings.add({
        city,
        latitude,
        longitude,
        notifications: true,
        theme: 'light',
      });
    }
    return { city, latitude, longitude };
  } catch (e) {
    console.warn('fetchAndSaveLocation failed:', e);
    return null;
  }
}
