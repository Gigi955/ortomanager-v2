import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { db, Plant } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Droplet, CheckCircle2 } from 'lucide-react';
import { needsWatering } from '@/lib/utils';
import { PlantCard } from './Plants';
import EditPlantDialog from '@/components/EditPlantDialog';
import PlantDiagnosticDialog from '@/components/PlantDiagnosticDialog';
import PlantPhotoTimelineDialog from '@/components/PlantPhotoTimelineDialog';

export default function DaInnaffiarePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language?.split('-')[0] || 'it';
  const plants = useLiveQuery(() => db.plants.toArray());
  const settings = useLiveQuery(() => db.settings.toArray().then(s => s[0]));

  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
  const [diagnosticPlant, setDiagnosticPlant] = useState<Plant | null>(null);
  const [timelinePlant, setTimelinePlant] = useState<Plant | null>(null);

  // Stesso predicato del contatore Home: piante non estirpate da innaffiare oggi.
  const toWater = (plants ?? [])
    .filter(p => p.status !== 'uprooted' && needsWatering(p))
    .sort((a, b) => a.name.localeCompare(b.name, lang));

  return (
    <div className="min-h-screen bg-gradient-to-b from-garden-cream to-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-garden-water to-garden-leaf text-white p-6 rounded-b-3xl shadow-elevated">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Droplet className="w-8 h-8" />
          <div>
            <h1 className="text-3xl font-bold">{t('watering_today.title')}</h1>
            <p className="text-green-100">
              {toWater.length === 1
                ? t('watering_today.count_one', { count: toWater.length })
                : t('watering_today.count_other', { count: toWater.length })}
            </p>
          </div>
        </div>
      </div>

      {/* Elenco piante da innaffiare */}
      <div className="px-4 mt-4 space-y-3">
        {toWater.length > 0 ? (
          toWater.map((plant) => (
            <PlantCard
              key={plant.id}
              plant={plant}
              onEdit={setEditingPlant}
              onDiagnose={setDiagnosticPlant}
              onTimeline={setTimelinePlant}
            />
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="w-16 h-16 text-garden-leaf mx-auto mb-4 opacity-60" />
              <p className="text-gray-600 font-medium">{t('watering_today.empty')}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog modifica */}
      <EditPlantDialog
        plant={editingPlant}
        open={editingPlant !== null}
        onOpenChange={(open) => { if (!open) setEditingPlant(null); }}
      />

      {/* Dialog AI Diagnostica */}
      <PlantDiagnosticDialog
        open={diagnosticPlant !== null}
        onOpenChange={(open) => { if (!open) setDiagnosticPlant(null); }}
        apiKey={settings?.claudeApiKey ?? ''}
        plantName={diagnosticPlant?.name}
      />

      {/* Dialog Timeline foto */}
      <PlantPhotoTimelineDialog
        plant={timelinePlant}
        open={timelinePlant !== null}
        onOpenChange={(open) => { if (!open) setTimelinePlant(null); }}
      />
    </div>
  );
}
