import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, RefreshCw, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { useWeather, getWeatherIcon, getWeatherLabel, generateGardenAlerts } from '@/hooks/useWeather';
import { useTranslation } from 'react-i18next';

function severityColor(severity: 'high' | 'medium' | 'low') {
  if (severity === 'high') return 'bg-red-100 border-red-300 text-red-800';
  if (severity === 'medium') return 'bg-orange-100 border-orange-300 text-orange-800';
  return 'bg-blue-100 border-blue-300 text-blue-800';
}

function severityBadge(severity: 'high' | 'medium' | 'low') {
  if (severity === 'high') return 'destructive';
  if (severity === 'medium') return 'warning';
  return 'secondary';
}

export default function WeatherWidget() {
  const { t, i18n } = useTranslation();
  const settings = useLiveQuery(() => db.settings.toArray().then(s => s[0]));
  const [expanded, setExpanded] = useState(false);

  const { weather, loading, error, refresh } = useWeather(
    settings?.latitude,
    settings?.longitude
  );

  const alerts = weather
    ? generateGardenAlerts(weather.daily, t, i18n.language?.split('-')[0] || 'it')
    : [];

  // Nessuna posizione configurata
  if (!settings) {
    return null;
  }

  if (!settings.latitude || !settings.longitude) {
    return (
      <div className="mx-4 mt-3">
        <Card className="border border-dashed border-muted-foreground/30 bg-white/60">
          <CardContent className="p-4 flex items-center gap-3">
            <MapPin className="w-5 h-5 text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground">
              {t('weather.set_location')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading skeleton
  if (loading && !weather) {
    return (
      <div className="mx-4 mt-3">
        <Card className="bg-gradient-to-r from-sky-50 to-blue-50 border-sky-200">
          <CardContent className="p-4">
            <div className="animate-pulse flex items-center gap-4">
              <div className="w-10 h-10 bg-sky-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-sky-200 rounded w-24" />
                <div className="h-3 bg-sky-100 rounded w-16" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Errore
  if (error && !weather) {
    return (
      <div className="mx-4 mt-3">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <p className="text-sm text-red-700">{t('weather.load_error')}</p>
            <Button size="sm" variant="ghost" onClick={refresh} className="text-red-700">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!weather) return null;

  const today = weather.daily[0];
  const highAlerts = alerts.filter(a => a.severity === 'high');
  const lang = i18n.language?.split('-')[0] || 'it';

  return (
    <div className="mx-4 mt-3">
      <Card
        className="bg-gradient-to-r from-sky-50 to-blue-50 border-sky-200 cursor-pointer select-none"
        onClick={() => setExpanded(e => !e)}
      >
        <CardContent className="p-4">
          {/* Riga compatta */}
          <div className="flex items-center gap-3">
            <span className="text-3xl leading-none">
              {getWeatherIcon(weather.currentWeatherCode)}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-sky-900">
                  {weather.currentTemp}°C
                </span>
                <span className="text-sm text-sky-700 truncate">
                  {t(getWeatherLabel(weather.currentWeatherCode))}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-sky-600">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{settings.city || t('settings.location_unknown')}</span>
                <span className="mx-1">·</span>
                <span>{today.tempMin}°/{today.tempMax}°</span>
              </div>
            </div>

            {/* Badge allerte in compatto */}
            <div className="flex items-center gap-1 shrink-0">
              {highAlerts.length > 0 && (
                <Badge variant="destructive" className="text-xs gap-1 px-1.5">
                  <AlertTriangle className="w-3 h-3" />
                  {highAlerts.length}
                </Badge>
              )}
              {alerts.length > 0 && highAlerts.length === 0 && (
                <Badge variant="warning" className="text-xs gap-1 px-1.5">
                  <AlertTriangle className="w-3 h-3" />
                  {alerts.length}
                </Badge>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="w-6 h-6 text-sky-600"
                onClick={e => { e.stopPropagation(); refresh(); }}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              {expanded
                ? <ChevronUp className="w-4 h-4 text-sky-600" />
                : <ChevronDown className="w-4 h-4 text-sky-600" />
              }
            </div>
          </div>

          {/* Sezione espansa */}
          {expanded && (
            <div className="mt-4 space-y-4" onClick={e => e.stopPropagation()}>
              {/* Previsioni 7 giorni */}
              <div>
                <p className="text-xs font-semibold text-sky-700 uppercase tracking-wide mb-2">
                  {t('weather.next_7_days')}
                </p>
                <div className="grid grid-cols-7 gap-1">
                  {weather.daily.map((day, i) => {
                    const dayName = i === 0
                      ? t('weather.today')
                      : new Date(day.date).toLocaleDateString(lang, { weekday: 'short' });
                    return (
                      <div key={day.date} className="flex flex-col items-center gap-0.5 text-center">
                        <span className="text-[10px] text-sky-700 font-medium">{dayName}</span>
                        <span className="text-base leading-none">{getWeatherIcon(day.weatherCode)}</span>
                        <span className="text-[10px] font-bold text-sky-900">{day.tempMax}°</span>
                        <span className="text-[10px] text-sky-500">{day.tempMin}°</span>
                        {day.precipitationSum > 0.5 && (
                          <span className="text-[9px] text-blue-500">{day.precipitationSum.toFixed(0)}mm</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Condizioni attuali */}
              <div className="flex gap-4 text-xs text-sky-700 bg-white/50 rounded-lg p-2">
                <span>{t('weather.humidity', { value: weather.currentHumidity })}</span>
                <span>{t('weather.wind', { value: weather.currentWindSpeed })}</span>
                {weather.currentPrecipitation > 0 && (
                  <span>{t('weather.rain_mm', { value: weather.currentPrecipitation })}</span>
                )}
              </div>

              {/* Allerte giardino */}
              {alerts.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-sky-700 uppercase tracking-wide mb-2">
                    {t('weather.alerts_section')}
                  </p>
                  <div className="space-y-2">
                    {alerts.map((alert, i) => (
                      <div
                        key={i}
                        className={`border rounded-lg p-2.5 ${severityColor(alert.severity)}`}
                      >
                        <div className="flex items-center gap-2 mb-0.5">
                          <span>{alert.icon}</span>
                          <span className="font-semibold text-sm">{t(alert.titleKey)}</span>
                          <Badge variant={severityBadge(alert.severity) as 'destructive' | 'warning' | 'secondary'} className="ml-auto text-[10px] px-1.5">
                            {alert.dayLabel}
                          </Badge>
                        </div>
                        <p className="text-xs pl-6">{t(alert.messageKey)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {alerts.length === 0 && (
                <p className="text-xs text-sky-600 bg-green-50 border border-green-200 rounded-lg p-2 text-center">
                  {t('weather.no_alerts')}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
