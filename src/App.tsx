import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { useEffect } from 'react';
import { db, seedDatabase } from './lib/db';
import OnboardingPermissions, { useOnboarding } from './components/OnboardingPermissions';
import { FontSizeProvider } from './contexts/FontSizeContext';

import HomePage from './pages/Home';
import PlantsPage from './pages/Plants';
import CalendarPage from './pages/Calendar';
import RecipesPage from './pages/Recipes';
import SettingsPage from './pages/Settings';
import StatisticsPage from './pages/Statistics';
import GuidePage from './pages/Guide';
import GardenPage from './pages/Garden';
import JournalPage from './pages/Journal';
import AssistantPage from './pages/Assistant';
import BottomNav from './components/BottomNav';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const { showOnboarding, completeOnboarding } = useOnboarding();

  useEffect(() => {
    db.open()
      .then(() => seedDatabase())
      .catch(console.error);
  }, []);

  // Applica palette personalizzata da settings
  useEffect(() => {
    const apply = async () => {
      try {
        const s = (await db.settings.toArray())[0];
        const palette = s?.themePalette ?? 'leaf';
        if (palette === 'leaf') {
          document.documentElement.removeAttribute('data-palette');
        } else {
          document.documentElement.setAttribute('data-palette', palette);
        }
      } catch { /* ignora */ }
    };
    apply();
    // re-applica se cambia (live observer su settings non semplice qui — basta polling raro)
    const handler = () => apply();
    window.addEventListener('orto-theme-changed', handler);
    return () => window.removeEventListener('orto-theme-changed', handler);
  }, []);

  if (showOnboarding === null) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-garden-leaf to-garden-sage flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-6xl mb-4"></div>
          <p className="text-green-100">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (showOnboarding) {
    return <OnboardingPermissions onComplete={completeOnboarding} />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/piante" element={<PlantsPage />} />
          <Route path="/calendario" element={<CalendarPage />} />
          <Route path="/ricette" element={<RecipesPage />} />
          <Route path="/altro" element={<SettingsPage />} />
          <Route path="/statistiche" element={<StatisticsPage />} />
          <Route path="/guida" element={<GuidePage />} />
          <Route path="/mappa" element={<GardenPage />} />
          <Route path="/diario" element={<JournalPage />} />
          <Route path="/assistente" element={<AssistantPage />} />
        </Routes>
        <BottomNav />
      </div>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'white',
            color: '#333',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '16px',
          },
        }}
      />
    </Router>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        storageKey="orto-theme"
      >
        <FontSizeProvider>
          <AppContent />
        </FontSizeProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
