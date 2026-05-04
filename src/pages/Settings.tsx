import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTheme } from 'next-themes';
import { useNavigate } from 'react-router-dom';
import { db } from '@/lib/db';
import BackupRestoreCard from '@/components/BackupRestoreCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  Loader2,
  Check,
  Settings as SettingsIcon,
  Bell,
  Palette,
  Sun,
  Moon,
  Monitor,
  BarChart2,
  Map as MapIcon,
  BookText,
  Bot as BotIcon,
  ChevronRight,
  Type,
  Bot,
  Eye,
  EyeOff,
  BookOpen,
  Languages,
} from 'lucide-react';
import { toast } from 'sonner';
import { useFontSize } from '@/contexts/FontSizeContext';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import {
  ensureNotificationPermission,
  rescheduleAllPendingTasks,
  cancelAllTaskNotifications,
} from '@/lib/notifications';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const LANGUAGES = [
  { code: 'it', flag: '🇮🇹', label: 'Italiano' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'es', flag: '🇪🇸', label: 'Español' },
  { code: 'fr', flag: '🇫🇷', label: 'Français' },
  { code: 'de', flag: '🇩🇪', label: 'Deutsch' },
];

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const settings = useLiveQuery(() => db.settings.toArray().then(s => s[0]));
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();
  const { fontSize, setFontSize } = useFontSize();
  const navigate = useNavigate();
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSavingKey, setIsSavingKey] = useState(false);

  const getCityFromCoordinates = async (lat: number, lon: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=it`
      );
      const data = await response.json();
      return data.address?.city || data.address?.town || data.address?.village || data.address?.municipality || data.address?.county || t('settings.location_unknown');
    } catch {
      return t('settings.location_saved');
    }
  };

  const handleGetLocation = () => {
    setIsLoadingLocation(true);
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError(t('settings.location_no_geo'));
      setIsLoadingLocation(false);
      toast.error(t('settings.location_error_geo'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const cityName = await getCityFromCoordinates(latitude, longitude);
          if (settings?.id) {
            await db.settings.update(settings.id, { city: cityName, latitude, longitude });
          } else {
            await db.settings.add({ city: cityName, latitude, longitude, notifications: true, theme: 'light' });
          }
          toast.success(t('settings.location_saved_city', { city: cityName }));
        } catch {
          toast.error(t('settings.location_save_error'));
        } finally {
          setIsLoadingLocation(false);
        }
      },
      (error) => {
        let errorMessage = t('settings.location_get_error');
        if (error.code === error.PERMISSION_DENIED) errorMessage = t('settings.location_denied');
        else if (error.code === error.POSITION_UNAVAILABLE) errorMessage = t('settings.location_unavailable');
        else if (error.code === error.TIMEOUT) errorMessage = t('settings.location_timeout');
        setLocationError(errorMessage);
        toast.error(errorMessage);
        setIsLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleToggleNotifications = async () => {
    if (!settings?.id) return;
    const turningOn = !settings.notifications;

    if (turningOn) {
      const ok = await ensureNotificationPermission();
      if (!ok) {
        toast.error(t('settings.notifications_permission_denied'));
        return;
      }
      await db.settings.update(settings.id, { notifications: true });
      const n = await rescheduleAllPendingTasks();
      toast.success(t('settings.notifications_enabled') + (n > 0 ? ` (${n})` : ''));
    } else {
      await db.settings.update(settings.id, { notifications: false });
      await cancelAllTaskNotifications();
      toast.success(t('settings.notifications_disabled'));
    }
  };

  const handlePaletteChange = async (palette: 'leaf' | 'ocean' | 'sunset' | 'lavender' | 'terracotta') => {
    if (settings?.id) {
      await db.settings.update(settings.id, { themePalette: palette });
    } else {
      await db.settings.add({ notifications: true, theme: 'light', themePalette: palette });
    }
    if (palette === 'leaf') {
      document.documentElement.removeAttribute('data-palette');
    } else {
      document.documentElement.setAttribute('data-palette', palette);
    }
    window.dispatchEvent(new Event('orto-theme-changed'));
    toast.success(t('settings.palette_saved', { name: t(`settings.palette.${palette}`) }));
  };

  const handleReminderHourChange = async (hourStr: string) => {
    const hour = parseInt(hourStr, 10);
    if (settings?.id) {
      await db.settings.update(settings.id, { reminderHour: hour });
    } else {
      await db.settings.add({ notifications: true, theme: 'light', reminderHour: hour });
    }
    if (settings?.notifications) {
      await cancelAllTaskNotifications();
      await rescheduleAllPendingTasks();
    }
    toast.success(t('settings.reminder_hour_saved', { hour: `${String(hour).padStart(2,'0')}:00` }));
  };

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'auto') => {
    setTheme(newTheme);
    if (settings?.id) {
      await db.settings.update(settings.id, { theme: newTheme });
    } else {
      await db.settings.add({ notifications: true, theme: newTheme });
    }
    const msg = newTheme === 'light' ? t('settings.theme_light_on') : newTheme === 'dark' ? t('settings.theme_dark_on') : t('settings.theme_auto_on');
    toast.success(msg);
  };

  const handleFontSizeChange = (size: 'normal' | 'large' | 'xlarge' | 'xxlarge') => {
    setFontSize(size);
    const msgs: Record<string, string> = {
      normal: t('settings.fontsize_normal_on'),
      large: t('settings.fontsize_large_on'),
      xlarge: t('settings.fontsize_xlarge_on'),
      xxlarge: t('settings.fontsize_xxlarge_on'),
    };
    toast.success(msgs[size]);
  };

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) { toast.error(t('settings.ai_key_invalid')); return; }
    setIsSavingKey(true);
    try {
      if (settings?.id) {
        await db.settings.update(settings.id, { claudeApiKey: apiKeyInput.trim() });
      } else {
        await db.settings.add({ notifications: true, theme: 'light', claudeApiKey: apiKeyInput.trim() });
      }
      setApiKeyInput('');
      toast.success(t('settings.ai_key_saved'));
    } catch {
      toast.error(t('settings.ai_key_save_error'));
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleRemoveApiKey = async () => {
    if (!settings?.id) return;
    await db.settings.update(settings.id, { claudeApiKey: undefined });
    toast.success(t('settings.ai_key_remove'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-garden-cream to-white dark:from-gray-900 dark:to-gray-800 pb-20">
      <div className="bg-gradient-to-r from-garden-sage to-garden-leaf text-white p-6 rounded-b-3xl shadow-elevated">
        <div className="flex items-center gap-3 mb-2">
          <SettingsIcon className="w-8 h-8" />
          <div>
            <h1 className="text-3xl font-bold">{t('settings.title')}</h1>
            <p className="text-green-100">{t('settings.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="px-4 mt-6 space-y-4">
        {/* Link Statistiche */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700" onClick={() => navigate('/statistiche')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-garden-leaf/10 dark:bg-garden-leaf/20 flex items-center justify-center">
              <BarChart2 className="w-5 h-5 text-garden-leaf" />
            </div>
            <div className="flex-1">
              <p className="font-semibold dark:text-white">{t('settings.stats_link')}</p>
              <p className="text-sm text-muted-foreground">{t('settings.stats_desc')}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </CardContent>
        </Card>

        {/* Link Mappa orto */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700" onClick={() => navigate('/mappa')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-garden-leaf/10 dark:bg-garden-leaf/20 flex items-center justify-center">
              <MapIcon className="w-5 h-5 text-garden-leaf" />
            </div>
            <div className="flex-1">
              <p className="font-semibold dark:text-white">{t('settings.garden_link')}</p>
              <p className="text-sm text-muted-foreground">{t('settings.garden_desc')}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </CardContent>
        </Card>

        {/* Link Diario */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700" onClick={() => navigate('/diario')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-garden-leaf/10 dark:bg-garden-leaf/20 flex items-center justify-center">
              <BookText className="w-5 h-5 text-garden-leaf" />
            </div>
            <div className="flex-1">
              <p className="font-semibold dark:text-white">{t('settings.journal_link')}</p>
              <p className="text-sm text-muted-foreground">{t('settings.journal_desc')}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </CardContent>
        </Card>

        {/* Link AI Assistente */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700" onClick={() => navigate('/assistente')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-garden-leaf/10 dark:bg-garden-leaf/20 flex items-center justify-center">
              <BotIcon className="w-5 h-5 text-garden-leaf" />
            </div>
            <div className="flex-1">
              <p className="font-semibold dark:text-white">{t('settings.assistant_link')}</p>
              <p className="text-sm text-muted-foreground">{t('settings.assistant_desc')}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </CardContent>
        </Card>

        {/* Posizione GPS */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <MapPin className="w-5 h-5 text-garden-leaf" />
              {t('settings.location_title')}
            </CardTitle>
            <CardDescription>{t('settings.location_desc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings?.city && (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                <MapPin className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <p className="font-semibold text-green-900 dark:text-green-300">{settings.city}</p>
                  {settings.latitude && settings.longitude && (
                    <p className="text-xs text-green-700 dark:text-green-500">
                      {settings.latitude.toFixed(4)}, {settings.longitude.toFixed(4)}
                    </p>
                  )}
                </div>
                <Check className="w-5 h-5 text-green-600" />
              </div>
            )}
            {locationError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                <p className="text-sm text-red-900 dark:text-red-300">{locationError}</p>
              </div>
            )}
            <Button onClick={handleGetLocation} disabled={isLoadingLocation} className="w-full" variant={settings?.city ? 'outline' : 'default'}>
              {isLoadingLocation ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('settings.location_detecting')}</>
              ) : (
                <><MapPin className="w-4 h-4 mr-2" />{settings?.city ? t('settings.location_update') : t('settings.location_detect')}</>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">{t('settings.location_hint')}</p>
          </CardContent>
        </Card>

        {/* Notifiche */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <Bell className="w-5 h-5 text-garden-leaf" />
              {t('settings.notifications_title')}
            </CardTitle>
            <CardDescription>{t('settings.notifications_desc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium dark:text-white">{t('settings.notifications_push')}</p>
                <p className="text-sm text-muted-foreground">{t('settings.notifications_hint')}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleToggleNotifications}>
                {settings?.notifications
                  ? <Badge variant="success">{t('settings.notifications_on')}</Badge>
                  : <Badge variant="outline">{t('settings.notifications_off')}</Badge>
                }
              </Button>
            </div>

            {settings?.notifications && (
              <div className="flex items-center justify-between gap-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex-1">
                  <p className="font-medium dark:text-white">{t('settings.reminder_hour_title')}</p>
                  <p className="text-sm text-muted-foreground">{t('settings.reminder_hour_desc')}</p>
                </div>
                <Select
                  value={String(settings.reminderHour ?? 9)}
                  onValueChange={handleReminderHourChange}
                >
                  <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[6, 7, 8, 9, 10, 12, 14, 17, 18, 20, 21].map(h => (
                      <SelectItem key={h} value={String(h)}>{String(h).padStart(2, '0')}:00</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lingua */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <Languages className="w-5 h-5 text-garden-leaf" />
              {t('settings.language_title')}
            </CardTitle>
            <CardDescription>{t('settings.language_desc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-2">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => i18n.changeLanguage(lang.code)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-colors ${
                    i18n.language?.startsWith(lang.code)
                      ? 'border-garden-leaf bg-garden-leaf/10 dark:bg-garden-leaf/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-garden-leaf/50'
                  }`}
                >
                  <span className="text-xl">{lang.flag}</span>
                  <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300 leading-tight text-center">{lang.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tema */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 dark:text-white text-xl">
              <Palette className="w-7 h-7 text-garden-leaf" />
              {t('settings.theme_title')}
            </CardTitle>
            <CardDescription className="text-sm mt-1">{t('settings.theme_desc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant={theme === 'light' ? 'default' : 'outline'} className="w-full justify-start h-12 text-base" onClick={() => handleThemeChange('light')}>
                <Sun className="w-5 h-5 mr-3" />{t('settings.theme_light')}
                {theme === 'light' && <Check className="w-5 h-5 ml-auto" />}
              </Button>
              <Button variant={theme === 'dark' ? 'default' : 'outline'} className="w-full justify-start h-12 text-base" onClick={() => handleThemeChange('dark')}>
                <Moon className="w-5 h-5 mr-3" />{t('settings.theme_dark')}
                {theme === 'dark' && <Check className="w-5 h-5 ml-auto" />}
              </Button>
              <Button variant={(theme === 'auto' || theme === 'system') ? 'default' : 'outline'} className="w-full justify-start h-12 text-base" onClick={() => handleThemeChange('auto')}>
                <Monitor className="w-5 h-5 mr-3" />{t('settings.theme_auto')}
                {(theme === 'auto' || theme === 'system') && <Check className="w-5 h-5 ml-auto" />}
              </Button>
            </div>

            {/* Palette colore */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="font-medium text-sm dark:text-white mb-2">{t('settings.palette_title')}</p>
              <div className="grid grid-cols-5 gap-2">
                {(['leaf','ocean','sunset','lavender','terracotta'] as const).map(p => {
                  const colors: Record<typeof p, string> = {
                    leaf: 'hsl(142 45% 35%)',
                    ocean: 'hsl(200 70% 42%)',
                    sunset: 'hsl(18 75% 50%)',
                    lavender: 'hsl(270 45% 50%)',
                    terracotta: 'hsl(15 65% 50%)',
                  };
                  const active = (settings?.themePalette ?? 'leaf') === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handlePaletteChange(p)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 ${active ? 'border-gray-900 dark:border-white' : 'border-gray-200 dark:border-gray-600'}`}
                    >
                      <span className="w-8 h-8 rounded-full" style={{ background: colors[p] }} />
                      <span className="text-[10px] font-medium leading-tight dark:text-gray-200">{t(`settings.palette.${p}`)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dimensione testo */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <Type className="w-5 h-5 text-garden-leaf" />
              {t('settings.fontsize_title')}
            </CardTitle>
            <CardDescription>{t('settings.fontsize_desc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button
                variant={fontSize === 'normal' ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={() => handleFontSizeChange('normal')}
              >
                <span className="text-sm mr-2 font-bold">A</span>
                {t('settings.fontsize_normal')}
                {fontSize === 'normal' && <Check className="w-4 h-4 ml-auto" />}
              </Button>
              <Button
                variant={fontSize === 'large' ? 'default' : 'outline'}
                className="w-full justify-start h-11"
                onClick={() => handleFontSizeChange('large')}
              >
                <span className="text-base mr-2 font-bold">A</span>
                {t('settings.fontsize_large')}
                {fontSize === 'large' && <Check className="w-4 h-4 ml-auto" />}
              </Button>
              <Button
                variant={fontSize === 'xlarge' ? 'default' : 'outline'}
                className="w-full justify-start h-12 text-base"
                onClick={() => handleFontSizeChange('xlarge')}
              >
                <span className="text-xl mr-2 font-bold">A</span>
                {t('settings.fontsize_xlarge')}
                {fontSize === 'xlarge' && <Check className="w-5 h-5 ml-auto" />}
              </Button>
              <Button
                variant={fontSize === 'xxlarge' ? 'default' : 'outline'}
                className="w-full justify-start h-14 text-lg"
                onClick={() => handleFontSizeChange('xxlarge')}
              >
                <span className="text-2xl mr-2 font-bold">A</span>
                {t('settings.fontsize_xxlarge')}
                {fontSize === 'xxlarge' && <Check className="w-6 h-6 ml-auto" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">{t('settings.fontsize_hint')}</p>
          </CardContent>
        </Card>

        {/* AI Diagnostica */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <Bot className="w-5 h-5 text-garden-leaf" />
              {t('settings.ai_title')}
            </CardTitle>
            <CardDescription>{t('settings.ai_desc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {settings?.claudeApiKey ? (
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <p className="text-sm font-medium text-green-800 dark:text-green-300">
                    {t('settings.ai_key_set')}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleRemoveApiKey} className="text-red-500 border-red-200 hover:bg-red-50">
                  {t('settings.ai_key_remove')}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative flex items-center">
                  <Input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKeyInput}
                    onChange={e => setApiKeyInput(e.target.value)}
                    placeholder={t('settings.ai_key_placeholder')}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 text-gray-400 hover:text-gray-600"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button onClick={handleSaveApiKey} disabled={isSavingKey} className="w-full">
                  {isSavingKey ? t('settings.ai_key_saving') : t('settings.ai_key_save')}
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">{t('settings.ai_key_hint')}</p>
          </CardContent>
        </Card>

        {/* Backup e Ripristino */}
        <BackupRestoreCard />

        {/* Guida App */}
        <Card
          className="dark:bg-gray-800 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/guida')}
        >
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-garden-leaf/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-garden-leaf" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-white text-sm">{t('settings.guide_title')}</p>
                  <p className="text-xs text-muted-foreground">{t('settings.guide_desc')}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        {/* Info App */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <div className="text-4xl mb-2">🌱</div>
              <h3 className="font-bold text-lg dark:text-white">{t('settings.app_name')}</h3>
              <p className="text-sm text-muted-foreground">{t('settings.app_version')}</p>
              <p className="text-xs text-muted-foreground">{t('settings.app_desc')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
