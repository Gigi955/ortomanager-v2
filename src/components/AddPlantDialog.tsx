import { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, PlantType } from '@/lib/db';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Sun,
  Droplets,
  Sprout,
  Scissors,
  FlaskConical,
  Heart,
  Skull,
  AlertTriangle,
  Camera,
  ImagePlus,
  X,
  RefreshCcw,
  Wand2,
  Loader2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { checkRotationConflict } from '@/lib/rotation';
import { formatShortDate } from '@/lib/utils';

interface AddPlantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedPlantType?: PlantType | null;
}

export default function AddPlantDialog({ open, onOpenChange, preselectedPlantType }: AddPlantDialogProps) {
  const { t } = useTranslation();
  const plantTypes = useLiveQuery(() => db.plantTypes.orderBy('name').toArray());
  const allPlants = useLiveQuery(() => db.plants.toArray()) ?? [];

  const CATEGORY_OPTIONS: { value: PlantType['category']; emoji: string }[] = [
    { value: 'vegetables', emoji: '🥦' },
    { value: 'fruits',     emoji: '🍎' },
    { value: 'herbs',      emoji: '🌿' },
    { value: 'flowers',    emoji: '🌸' },
    { value: 'trees',      emoji: '🌳' },
  ];

  const [mode, setMode] = useState<'catalog' | 'custom'>('catalog');
  const [selectedPlantType, setSelectedPlantType] = useState<PlantType | null>(null);

  // Campi catalogo
  const [variety, setVariety] = useState('');

  // Campi custom
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState<PlantType['category']>('vegetables');
  const [customWatering, setCustomWatering] = useState(3);

  // Campi comuni
  const [numberOfPlants, setNumberOfPlants] = useState(0);
  const [location, setLocation] = useState('');
  const [plantedDate, setPlantedDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [imageData, setImageData] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const identifyInputRef = useRef<HTMLInputElement>(null);
  const [identifying, setIdentifying] = useState(false);
  const [identifyError, setIdentifyError] = useState<string | null>(null);

  const settings = useLiveQuery(() => db.settings.toArray().then(s => s[0]));

  const identifyFromImage = async (file: File) => {
    if (!settings?.claudeApiKey) {
      setIdentifyError(t('dialogs.addPlant.identify_no_key'));
      return;
    }
    setIdentifying(true);
    setIdentifyError(null);
    try {
      const reader = new FileReader();
      const dataUrl: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const m = dataUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
      if (!m) throw new Error('Invalid image');
      const mediaType = m[1];
      const base64 = m[2];

      const prompt = `Identifica la pianta in questa foto. Rispondi SOLO con JSON valido, senza testo aggiuntivo, in questo formato esatto:
{
  "name": "Nome italiano comune (es. Pomodoro, Basilico)",
  "scientificName": "Nome scientifico latino",
  "category": "vegetables | fruits | herbs | flowers | trees",
  "confidence": "alta | media | bassa"
}
Se non riesci a identificarla, usa name: "Pianta sconosciuta" e confidence: "bassa".`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': settings.claudeApiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 256,
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
              { type: 'text', text: prompt },
            ],
          }],
        }),
      });

      if (!response.ok) throw new Error(`API ${response.status}`);
      const data = await response.json();
      const text = data.content?.[0]?.text ?? '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON in response');
      const parsed = JSON.parse(jsonMatch[0]);

      // Imposta i campi del form custom
      setMode('custom');
      setCustomName(parsed.name || '');
      if (['vegetables','fruits','herbs','flowers','trees'].includes(parsed.category)) {
        setCustomCategory(parsed.category);
      }
      setImageData(dataUrl);
      toast.success(t('dialogs.addPlant.identify_success', { confidence: parsed.confidence ?? '?' }));
    } catch (e) {
      console.error('[identify]', e);
      setIdentifyError(e instanceof Error ? e.message : String(e));
      toast.error(t('dialogs.addPlant.identify_error'));
    } finally {
      setIdentifying(false);
    }
  };

  // Preseleziona automaticamente se arrivato dal Catalogo
  useEffect(() => {
    if (open && preselectedPlantType) {
      setSelectedPlantType(preselectedPlantType);
      setMode('catalog');
    }
  }, [open, preselectedPlantType]);

  const resetForm = () => {
    setMode('catalog');
    setSelectedPlantType(null);
    setVariety('');
    setCustomName('');
    setCustomCategory('vegetables');
    setCustomWatering(3);
    setNumberOfPlants(0);
    setLocation('');
    setPlantedDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setImageData(null);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) resetForm();
    onOpenChange(isOpen);
  };

  const handlePlantTypeChange = (plantTypeId: string) => {
    const selected = plantTypes?.find(pt => pt.id?.toString() === plantTypeId);
    setSelectedPlantType(selected || null);
  };

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error(t('dialogs.addPlant.error_image'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageData(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGalleryPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'catalog' && !selectedPlantType) {
      toast.error(t('dialogs.addPlant.error_select_type'));
      return;
    }

    if (mode === 'custom' && !customName.trim()) {
      toast.error(t('dialogs.addPlant.error_name'));
      return;
    }

    if (!location) {
      toast.error(t('dialogs.addPlant.error_location'));
      return;
    }

    if (numberOfPlants < 0) {
      toast.error(t('dialogs.addPlant.error_negative'));
      return;
    }

    try {
      if (mode === 'catalog' && selectedPlantType) {
        await db.plants.add({
          plantTypeId: selectedPlantType.id,
          name: variety ? `${selectedPlantType.name} ${variety}` : selectedPlantType.name,
          scientificName: selectedPlantType.scientificName,
          variety: variety || undefined,
          plantedDate: new Date(plantedDate),
          numberOfPlants,
          location,
          status: 'seedling',
          wateringFrequency: selectedPlantType.wateringFrequency,
          category: selectedPlantType.category,
          notes: notes || undefined,
          imageUrl: imageData || undefined,
        });
      } else {
        await db.plants.add({
          name: customName.trim(),
          plantedDate: new Date(plantedDate),
          numberOfPlants,
          location,
          status: 'seedling',
          wateringFrequency: customWatering,
          category: customCategory,
          notes: notes || undefined,
          imageUrl: imageData || undefined,
        });
      }

      toast.success(t('dialogs.addPlant.success'));
      handleOpenChange(false);
    } catch (error) {
      toast.error(t('dialogs.addPlant.error_add'));
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('dialogs.addPlant.title')}</DialogTitle>
          <DialogDescription>
            {t('dialogs.addPlant.desc')}
          </DialogDescription>
        </DialogHeader>

        {/* Identifica con AI */}
        <div className="flex flex-col gap-2 mb-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
            disabled={identifying}
            onClick={() => identifyInputRef.current?.click()}
          >
            {identifying ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('dialogs.addPlant.identifying')}</>
            ) : (
              <><Wand2 className="w-4 h-4 mr-2" />{t('dialogs.addPlant.identify_btn')}</>
            )}
          </Button>
          <input
            ref={identifyInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) identifyFromImage(f); e.target.value = ''; }}
          />
          {identifyError && (
            <p className="text-xs text-red-600">{identifyError}</p>
          )}
        </div>

        {/* Toggle modalità */}
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${mode === 'catalog' ? 'bg-garden-leaf text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
            onClick={() => setMode('catalog')}
          >
            {t('dialogs.addPlant.from_catalog')}
          </button>
          <button
            type="button"
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${mode === 'custom' ? 'bg-garden-leaf text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
            onClick={() => setMode('custom')}
          >
            {t('dialogs.addPlant.custom')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {mode === 'catalog' ? (
            <>
              {/* Tipo di pianta */}
              <div className="space-y-2">
                <Label htmlFor="plantType">{t('dialogs.addPlant.plant_type')}</Label>
                <Select value={selectedPlantType?.id?.toString() ?? ""} onValueChange={handlePlantTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('dialogs.addPlant.select_plant')} />
                  </SelectTrigger>
                  <SelectContent>
                    {plantTypes?.map((pt) => (
                      <SelectItem key={pt.id} value={pt.id!.toString()}>
                        <div className="flex flex-col">
                          <span className="font-medium">{pt.name}</span>
                          {pt.scientificName && (
                            <span className="text-xs text-muted-foreground italic">
                              {pt.scientificName}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedPlantType?.description && (
                  <p className="text-xs text-muted-foreground">
                    ℹ️ {selectedPlantType.description}
                  </p>
                )}
              </div>

              {/* Scheda informativa pianta (se selezionata) */}
              {selectedPlantType && (
                <div className="rounded-xl border border-garden-sage/30 bg-green-50/50 p-3 space-y-3">
                  <p className="text-xs font-semibold text-garden-leaf uppercase tracking-wide">
                    {t('dialogs.addPlant.care_card')}
                  </p>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    {selectedPlantType.sunExposure && (
                      <div className="flex items-start gap-2">
                        <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span className="text-gray-700">{selectedPlantType.sunExposure}</span>
                      </div>
                    )}
                    {selectedPlantType.soilType && (
                      <div className="flex items-start gap-2">
                        <Sprout className="w-3.5 h-3.5 text-garden-earth shrink-0 mt-0.5" />
                        <span className="text-gray-700">{selectedPlantType.soilType}</span>
                      </div>
                    )}
                    {selectedPlantType.fertilizing && (
                      <div className="flex items-start gap-2">
                        <FlaskConical className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />
                        <span className="text-gray-700">{selectedPlantType.fertilizing}</span>
                      </div>
                    )}
                    {selectedPlantType.pruning && (
                      <div className="flex items-start gap-2">
                        <Scissors className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                        <span className="text-gray-700">{selectedPlantType.pruning}</span>
                      </div>
                    )}
                    {selectedPlantType.wateringFrequency && (
                      <div className="flex items-start gap-2">
                        <Droplets className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                        <span className="text-gray-700">
                          {selectedPlantType.wateringFrequency === 1
                            ? t('dialogs.addPlant.watering_one', { count: selectedPlantType.wateringFrequency })
                            : t('dialogs.addPlant.watering_other', { count: selectedPlantType.wateringFrequency })
                          }
                        </span>
                      </div>
                    )}
                  </div>

                  {(selectedPlantType.plantingPeriod || selectedPlantType.harvestPeriod) && (
                    <div className="flex flex-wrap gap-2 text-xs">
                      {selectedPlantType.plantingPeriod && (
                        <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                          🌱 {t('plants.planting_period', { period: selectedPlantType.plantingPeriod })}
                        </span>
                      )}
                      {selectedPlantType.harvestPeriod && (
                        <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                          🌾 {t('plants.harvest_period', { period: selectedPlantType.harvestPeriod })}
                        </span>
                      )}
                    </div>
                  )}

                  {selectedPlantType.careNotes && (
                    <p className="text-xs text-gray-600 italic border-t border-garden-sage/20 pt-2">
                      {selectedPlantType.careNotes}
                    </p>
                  )}

                  {(selectedPlantType.companionPlants?.length || selectedPlantType.enemyPlants?.length) ? (
                    <div className="border-t border-garden-sage/20 pt-2 space-y-1.5">
                      {selectedPlantType.companionPlants && selectedPlantType.companionPlants.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <Heart className="w-3 h-3 text-green-600" />
                            <span className="text-xs font-medium text-green-700">{t('plants.friend_plants')}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {selectedPlantType.companionPlants.map((p) => (
                              <Badge key={p} variant="secondary" className="text-[10px] bg-green-100 text-green-800 px-1.5 py-0">
                                {p}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedPlantType.enemyPlants && selectedPlantType.enemyPlants.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <Skull className="w-3 h-3 text-red-500" />
                            <span className="text-xs font-medium text-red-700">{t('plants.enemy_plants')}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {selectedPlantType.enemyPlants.map((p) => (
                              <Badge key={p} variant="secondary" className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0">
                                {p}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}

                  {selectedPlantType.diseases && selectedPlantType.diseases.length > 0 && (
                    <div className="border-t border-garden-sage/20 pt-2">
                      <div className="flex items-center gap-1 mb-1.5">
                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                        <span className="text-xs font-medium text-amber-700">
                          {t('plants.main_diseases', { count: selectedPlantType.diseases.length })}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {selectedPlantType.diseases.map((d) => (
                          <span
                            key={d.name}
                            title={`${t('plants.symptoms')}: ${d.symptoms}\n${t('plants.treatment')}: ${d.treatment}\n${t('plants.prevention')}: ${d.prevention}`}
                            className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full cursor-help"
                          >
                            {d.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Varietà */}
              <div className="space-y-2">
                <Label htmlFor="variety">{t('dialogs.addPlant.variety')}</Label>
                <Input
                  id="variety"
                  value={variety}
                  onChange={(e) => setVariety(e.target.value)}
                  placeholder={t('dialogs.addPlant.variety_ph')}
                />
              </div>
            </>
          ) : (
            <>
              {/* Pianta personalizzata */}
              <div className="space-y-2">
                <Label htmlFor="customName">{t('dialogs.addPlant.custom_name')}</Label>
                <Input
                  id="customName"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder={t('dialogs.addPlant.custom_name_ph')}
                />
              </div>

              <div className="space-y-2">
                <Label>{t('dialogs.addPlant.category')}</Label>
                <Select value={customCategory} onValueChange={v => setCustomCategory(v as PlantType['category'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.emoji} {t(`category.${o.value}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customWatering">{t('dialogs.addPlant.watering_label')}</Label>
                <Input
                  id="customWatering"
                  type="number"
                  min="1"
                  value={customWatering}
                  onChange={(e) => setCustomWatering(parseInt(e.target.value) || 1)}
                />
              </div>
            </>
          )}

          {/* Numero piante */}
          <div className="space-y-2">
            <Label htmlFor="numberOfPlants">{t('dialogs.addPlant.num_plants')}</Label>
            <Input
              id="numberOfPlants"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={numberOfPlants}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
                setNumberOfPlants(digits === '' ? 0 : parseInt(digits, 10));
              }}
              placeholder="0"
            />
          </div>

          {/* Data semina */}
          <div className="space-y-2">
            <Label htmlFor="plantedDate">{t('dialogs.addPlant.planting_date')}</Label>
            <Input
              id="plantedDate"
              type="date"
              value={plantedDate}
              onChange={(e) => setPlantedDate(e.target.value)}
            />
          </div>

          {/* Posizione */}
          <div className="space-y-2">
            <Label htmlFor="location">{t('dialogs.addPlant.location')}</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t('dialogs.addPlant.location_ph')}
            />
            {(() => {
              const candidateName = mode === 'catalog'
                ? (selectedPlantType?.name ?? '')
                : customName;
              if (!candidateName || !location || !plantedDate) return null;
              const conflict = checkRotationConflict(
                candidateName,
                location,
                new Date(plantedDate),
                allPlants,
              );
              if (!conflict) return null;
              return (
                <div className="flex items-start gap-2 p-2.5 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700">
                  <RefreshCcw className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div className="text-xs text-amber-900 dark:text-amber-200 leading-snug">
                    <strong>{t('rotation.warning_title')}</strong>{' '}
                    {t('rotation.warning_msg', {
                      family: conflict.family,
                      name: conflict.conflictPlant.name,
                      date: formatShortDate(conflict.conflictPlant.plantedDate),
                    })}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Foto */}
          <div className="space-y-2">
            <Label>{t('dialogs.addPlant.photo')}</Label>
            {imageData ? (
              <div className="relative">
                <img
                  src={imageData}
                  alt="Foto pianta"
                  className="w-full h-40 object-cover rounded-xl border border-green-200"
                />
                <button
                  type="button"
                  onClick={() => setImageData(null)}
                  className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-garden-leaf hover:text-garden-leaf transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  {t('dialogs.addPlant.take_photo')}
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-garden-leaf hover:text-garden-leaf transition-colors"
                >
                  <ImagePlus className="w-4 h-4" />
                  {t('dialogs.addPlant.gallery')}
                </button>
              </div>
            )}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleGalleryPick}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleGalleryPick}
            />
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="notes">{t('dialogs.addPlant.notes')}</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('dialogs.addPlant.notes_ph')}
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              {t('dialogs.addPlant.cancel')}
            </Button>
            <Button type="submit">
              {t('dialogs.addPlant.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
