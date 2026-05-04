import { useState, useEffect, useCallback } from 'react';

export interface DailyForecast {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  precipitationSum: number;
  windGusts: number;
}

export interface WeatherData {
  currentTemp: number;
  currentWeatherCode: number;
  currentPrecipitation: number;
  currentWindSpeed: number;
  currentHumidity: number;
  daily: DailyForecast[];
  fetchedAt: number;
}

export interface GardenAlert {
  icon: string;
  titleKey: string;
  messageKey: string;
  severity: 'high' | 'medium' | 'low';
  dayLabel: string;
}

const CACHE_KEY = 'weather_cache';
const CACHE_TTL = 30 * 60 * 1000; // 30 minuti

function getCached(): WeatherData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data: WeatherData = JSON.parse(raw);
    if (Date.now() - data.fetchedAt > CACHE_TTL) return null;
    return data;
  } catch {
    return null;
  }
}

function setCache(data: WeatherData) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // ignore localStorage errors
  }
}

export function getWeatherIcon(code: number): string {
  if (code === 0) return '☀️';
  if (code <= 3) return '🌤️';
  if (code <= 48) return '🌫️';
  if (code <= 67) return '🌦️';
  if (code <= 77) return '❄️';
  if (code <= 82) return '🌧️';
  if (code <= 99) return '⛈️';
  return '🌡️';
}

// Returns i18n key — callers do: t(getWeatherLabel(code))
export function getWeatherLabel(code: number): string {
  if (code === 0) return 'weather.label_clear';
  if (code <= 3) return 'weather.label_partly_cloudy';
  if (code <= 48) return 'weather.label_fog';
  if (code <= 55) return 'weather.label_drizzle';
  if (code <= 67) return 'weather.label_rain';
  if (code <= 77) return 'weather.label_snow';
  if (code <= 82) return 'weather.label_showers';
  if (code <= 99) return 'weather.label_thunderstorm';
  return 'weather.label_variable';
}

function formatDayLabel(dateStr: string, index: number, t: (key: string) => string, lang: string): string {
  if (index === 0) return t('weather.today');
  const date = new Date(dateStr);
  return date.toLocaleDateString(lang, { weekday: 'short' });
}

export function generateGardenAlerts(
  daily: DailyForecast[],
  t: (key: string) => string,
  lang: string
): GardenAlert[] {
  const alerts: GardenAlert[] = [];

  daily.slice(0, 7).forEach((day, index) => {
    const label = formatDayLabel(day.date, index, t, lang);

    if (day.tempMin < 2) {
      alerts.push({
        icon: '🥶',
        titleKey: 'weather.alert_frost_title',
        messageKey: 'weather.alert_frost_msg',
        severity: 'high',
        dayLabel: label,
      });
    }

    if (day.tempMax > 35) {
      alerts.push({
        icon: '🔥',
        titleKey: 'weather.alert_heat_title',
        messageKey: 'weather.alert_heat_msg',
        severity: 'medium',
        dayLabel: label,
      });
    }

    if (day.precipitationSum > 15) {
      alerts.push({
        icon: '🌧️',
        titleKey: 'weather.alert_rain_title',
        messageKey: 'weather.alert_rain_msg',
        severity: 'low',
        dayLabel: label,
      });
    }

    if (day.windGusts > 60) {
      alerts.push({
        icon: '💨',
        titleKey: 'weather.alert_wind_title',
        messageKey: 'weather.alert_wind_msg',
        severity: 'medium',
        dayLabel: label,
      });
    }
  });

  // Deduplica: mantieni solo la prima occorrenza per tipologia
  const seen = new Set<string>();
  return alerts.filter(a => {
    if (seen.has(a.titleKey)) return false;
    seen.add(a.titleKey);
    return true;
  });
}

export function useWeather(latitude?: number, longitude?: number) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async (lat: number, lon: number, force = false) => {
    if (!force) {
      const cached = getCached();
      if (cached) {
        setWeather(cached);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        latitude: lat.toString(),
        longitude: lon.toString(),
        current: 'temperature_2m,weathercode,precipitation,windspeed_10m,relative_humidity_2m',
        daily: 'temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum,windgusts_10m_max',
        timezone: 'auto',
        forecast_days: '7',
      });

      const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
      if (!res.ok) throw new Error(`Errore meteo: ${res.status}`);

      const json = await res.json();

      const data: WeatherData = {
        currentTemp: Math.round(json.current.temperature_2m),
        currentWeatherCode: json.current.weathercode,
        currentPrecipitation: json.current.precipitation,
        currentWindSpeed: Math.round(json.current.windspeed_10m),
        currentHumidity: json.current.relative_humidity_2m,
        daily: (json.daily.time as string[]).map((date: string, i: number) => ({
          date,
          weatherCode: json.daily.weathercode[i],
          tempMax: Math.round(json.daily.temperature_2m_max[i]),
          tempMin: Math.round(json.daily.temperature_2m_min[i]),
          precipitationSum: json.daily.precipitation_sum[i] ?? 0,
          windGusts: Math.round(json.daily.windgusts_10m_max[i] ?? 0),
        })),
        fetchedAt: Date.now(),
      };

      setCache(data);
      setWeather(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel recupero del meteo');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (latitude !== undefined && longitude !== undefined) {
      fetchWeather(latitude, longitude);
    }
  }, [latitude, longitude, fetchWeather]);

  const refresh = useCallback(() => {
    if (latitude !== undefined && longitude !== undefined) {
      fetchWeather(latitude, longitude, true);
    }
  }, [latitude, longitude, fetchWeather]);

  return { weather, loading, error, refresh };
}
