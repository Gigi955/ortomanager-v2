import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Camera,
  Mic,
  Bell,
  Clock,
  CheckCircle2,
  ChevronRight,
  Leaf,
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Geolocation } from '@capacitor/geolocation';
import { Camera as CapCamera } from '@capacitor/camera';

//  Storage persistente via IndexedDB (funziona in Capacitor WebView) 
// localStorage NON è affidabile in Capacitor su Android
const STORE_NAME = 'orto_prefs';
const DB_NAME = 'OrtoPrefsDB';
const ONBOARDING_KEY = 'onboarding_done';

function openPrefsDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function prefsGet(key: string): Promise<string | null> {
  try {
    const db = await openPrefsDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function prefsSet(key: string, value: string): Promise<void> {
  try {
    const db = await openPrefsDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // fallback silenzioso
  }
}

//  Hook onboarding 
export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    prefsGet(ONBOARDING_KEY).then(val => {
      setShowOnboarding(val !== 'true');
    });
  }, []);

  const completeOnboarding = async () => {
    await prefsSet(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  };

  return { showOnboarding, completeOnboarding };
}

//  Definizione permessi 
interface PermissionItem {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  required: boolean;
}

const PERMISSIONS: PermissionItem[] = [
  {
    id: 'notifications',
    icon: <Bell className="w-6 h-6" />,
    title: 'Notifiche',
    description: 'Ricevi promemoria per annaffiare, concimare e raccogliere le tue piante.',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    required: true,
  },
  {
    id: 'location',
    icon: <MapPin className="w-6 h-6" />,
    title: 'Geolocalizzazione',
    description: 'Ottieni consigli meteo e stagionali basati sulla tua posizione geografica.',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    required: false,
  },
  {
    id: 'camera',
    icon: <Camera className="w-6 h-6" />,
    title: 'Fotocamera',
    description: 'Scatta foto delle tue piante per documentare la crescita e le malattie.',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    required: false,
  },
  {
    id: 'microphone',
    icon: <Mic className="w-6 h-6" />,
    title: 'Microfono',
    description: 'Aggiungi note vocali alle tue piante con un semplice tocco.',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    required: false,
  },
  {
    id: 'reminders',
    icon: <Clock className="w-6 h-6" />,
    title: 'Promemoria',
    description: 'Imposta allarmi precisi per ogni attività del tuo orto.',
    color: 'text-rose-600',
    bgColor: 'bg-rose-100',
    required: false,
  },
];

//  Verifica permessi già concessi 
async function checkPermissions(): Promise<Record<string, boolean>> {
  const state: Record<string, boolean> = {};
  const isNative = Capacitor.isNativePlatform();

  try {
    if (isNative) {
      const r = await LocalNotifications.checkPermissions();
      state.notifications = r.display === 'granted';
      state.reminders = r.display === 'granted';
    } else if ('Notification' in window) {
      state.notifications = Notification.permission === 'granted';
      state.reminders = Notification.permission === 'granted';
    } else {
      state.notifications = false;
      state.reminders = false;
    }
  } catch {
    state.notifications = false;
    state.reminders = false;
  }

  try {
    if (isNative) {
      const r = await Geolocation.checkPermissions();
      state.location = r.location === 'granted' || r.coarseLocation === 'granted';
    } else if (navigator.permissions) {
      const s = await navigator.permissions.query({ name: 'geolocation' });
      state.location = s.state === 'granted';
    } else {
      state.location = false;
    }
  } catch {
    state.location = false;
  }

  try {
    if (isNative) {
      const r = await CapCamera.checkPermissions();
      state.camera = r.camera === 'granted' || r.photos === 'granted';
    } else if (navigator.permissions) {
      const s = await navigator.permissions.query({ name: 'camera' as PermissionName });
      state.camera = s.state === 'granted';
    } else {
      state.camera = false;
    }
  } catch {
    state.camera = false;
  }

  try {
    if (navigator.permissions) {
      const s = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      state.microphone = s.state === 'granted';
    } else {
      state.microphone = false;
    }
  } catch {
    state.microphone = false;
  }

  return state;
}

async function requestPermission(id: string): Promise<boolean> {
  const isNative = Capacitor.isNativePlatform();
  try {
    if (id === 'notifications' || id === 'reminders') {
      if (isNative) {
        const result = await LocalNotifications.requestPermissions();
        return result.display === 'granted';
      }
      if ('Notification' in window) {
        const result = await Notification.requestPermission();
        return result === 'granted';
      }
      return false;
    }

    if (id === 'location') {
      if (isNative) {
        const result = await Geolocation.requestPermissions();
        return result.location === 'granted' || result.coarseLocation === 'granted';
      }
      return await new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve(true),
          () => resolve(false),
          { timeout: 8000 }
        );
      });
    }

    if (id === 'camera') {
      if (isNative) {
        const result = await CapCamera.requestPermissions({ permissions: ['camera', 'photos'] });
        return result.camera === 'granted' || result.photos === 'granted';
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(t => t.stop());
        return true;
      } catch {
        return false;
      }
    }

    if (id === 'microphone') {
      // Capacitor non ha plugin microfono dedicato: usiamo Web API su entrambe le piattaforme
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());
        return true;
      } catch {
        return false;
      }
    }

    return false;
  } catch (e) {
    console.warn(`requestPermission(${id}) error:`, e);
    return false;
  }
}

//  Componente principale 
interface OnboardingPermissionsProps {
  onComplete: () => void;
}

export default function OnboardingPermissions({ onComplete }: OnboardingPermissionsProps) {
  const [granted, setGranted] = useState<Record<string, boolean>>({});
  const [requesting, setRequesting] = useState<string | null>(null);
  const [step, setStep] = useState<'welcome' | 'permissions' | 'done'>('welcome');

  useEffect(() => {
    checkPermissions().then(setGranted);
  }, []);

  const handleRequest = async (id: string) => {
    setRequesting(id);
    const ok = await requestPermission(id);
    setGranted(prev => {
      const next = { ...prev, [id]: ok };
      // notifiche e promemoria sono legati
      if (id === 'notifications') next.reminders = ok;
      if (id === 'reminders') next.notifications = ok;
      return next;
    });
    setRequesting(null);
  };

  const handleRequestAll = async () => {
    for (const perm of PERMISSIONS) {
      if (!granted[perm.id]) await handleRequest(perm.id);
    }
    setStep('done');
  };

  //  Welcome 
  if (step === 'welcome') {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-garden-leaf to-garden-sage flex flex-col items-center justify-center p-8 z-50">
        <div className="text-center text-white max-w-sm w-full">
          <div className="w-28 h-28 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Leaf className="w-14 h-14 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2">OrtoManager</h1>
          <p className="text-green-100 text-lg mb-2">Il tuo orto digitale </p>
          <p className="text-green-200 text-sm mb-12 leading-relaxed">
            Gestisci piante, raccolti, malattie e consociazioni con il catalogo completo delle piante italiane.
          </p>
          <Button
            className="w-full bg-white text-garden-leaf hover:bg-green-50 rounded-full py-6 text-lg font-semibold shadow-xl"
            onClick={() => setStep('permissions')}
          >
            Inizia <ChevronRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    );
  }

  //  Done 
  if (step === 'done') {
    const count = Object.values(granted).filter(Boolean).length;
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-garden-leaf to-garden-sage flex flex-col items-center justify-center p-8 z-50">
        <div className="text-center text-white max-w-sm w-full">
          <div className="w-28 h-28 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-14 h-14 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-3">Tutto pronto!</h2>
          <p className="text-green-100 mb-2">
            {count} su {PERMISSIONS.length} permessi attivati.
          </p>
          <p className="text-green-200 text-sm mb-12">
            Puoi modificarli in qualsiasi momento dalle impostazioni del telefono.
          </p>
          <Button
            className="w-full bg-white text-garden-leaf hover:bg-green-50 rounded-full py-6 text-lg font-semibold shadow-xl"
            onClick={onComplete}
          >
            Vai all'orto 
          </Button>
        </div>
      </div>
    );
  }

  //  Permessi 
  return (
    <div className="fixed inset-0 bg-white flex flex-col z-50">
      <div className="bg-gradient-to-r from-garden-leaf to-garden-sage text-white p-6 pb-8 rounded-b-3xl">
        <h2 className="text-2xl font-bold mb-1">Permessi app</h2>
        <p className="text-green-100 text-sm">
          OrtoManager ha bisogno di alcuni permessi per funzionare al meglio
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 mt-2">
        {PERMISSIONS.map((perm) => {
          const isGranted = granted[perm.id] === true;
          const isRequesting = requesting === perm.id;
          return (
            <div
              key={perm.id}
              className={`rounded-2xl border-2 p-4 flex items-center gap-4 transition-all ${
                isGranted ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-white'
              }`}
            >
              <div className={`w-12 h-12 rounded-full ${perm.bgColor} flex items-center justify-center shrink-0`}>
                <span className={perm.color}>{perm.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900">{perm.title}</p>
                  {perm.required && (
                    <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-medium">
                      richiesto
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{perm.description}</p>
              </div>
              <div className="shrink-0">
                {isGranted ? (
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full text-xs border-garden-sage text-garden-leaf"
                    onClick={() => handleRequest(perm.id)}
                    disabled={isRequesting}
                  >
                    {isRequesting ? '...' : 'Attiva'}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 space-y-3 border-t bg-white">
        <Button
          className="w-full rounded-full py-5 bg-garden-leaf hover:bg-garden-sage text-white font-semibold"
          onClick={handleRequestAll}
          disabled={requesting !== null}
        >
          {requesting ? 'Richiesta in corso...' : 'Attiva tutti i permessi'}
        </Button>
        <Button
          variant="ghost"
          className="w-full rounded-full text-gray-400 text-sm"
          onClick={() => setStep('done')}
        >
          Salta per ora
        </Button>
      </div>
    </div>
  );
}
