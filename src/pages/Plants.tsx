import { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTranslation } from 'react-i18next';
import { db, Plant, PlantType, seedDatabase } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Search,
  Leaf,
  Droplet,
  Calendar,
  MapPin,
  Hash,
  ChevronDown,
  ChevronUp,
  Sun,
  Sprout,
  FlaskConical,
  Scissors,
  Heart,
  Skull,
  AlertTriangle,
  ShieldCheck,
  Stethoscope,
  Pencil,
  BookOpen,
  Camera,
  ImagePlus,
  X,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  Clock,
  Share2,
  Link2,
  Paperclip,
} from 'lucide-react';
import { formatShortDate, getStatusColor, getStatusLabel, needsWatering } from '@/lib/utils';
import AddPlantDialog from '@/components/AddPlantDialog';
import EditPlantDialog from '@/components/EditPlantDialog';
import PlantDiagnosticDialog from '@/components/PlantDiagnosticDialog';
import PlantPhotoTimelineDialog from '@/components/PlantPhotoTimelineDialog';
import { sharePlant } from '@/lib/share';
import { toast } from 'sonner';

//  Pannello espandibile con i dettagli della PlantType
function PlantTypeDetails({ plantType }: { plantType: PlantType }) {
  const { t } = useTranslation();
  const [openDisease, setOpenDisease] = useState<string | null>(null);

  return (
    <div className="mt-3 space-y-3 border-t pt-3">
      {/* Cura */}
      <div>
        <p className="text-xs font-semibold text-garden-leaf mb-2 uppercase tracking-wide">{t('plants.plant_card')}
        </p>
        <div className="space-y-1.5 text-xs">
          {plantType.sunExposure && (
            <div className="flex items-start gap-2">
              <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <span className="text-gray-700">{plantType.sunExposure}</span>
            </div>
          )}
          {plantType.soilType && (
            <div className="flex items-start gap-2">
              <Sprout className="w-3.5 h-3.5 text-garden-earth shrink-0 mt-0.5" />
              <span className="text-gray-700">{plantType.soilType}</span>
            </div>
          )}
          {plantType.fertilizing && (
            <div className="flex items-start gap-2">
              <FlaskConical className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />
              <span className="text-gray-700">{plantType.fertilizing}</span>
            </div>
          )}
          {plantType.pruning && (
            <div className="flex items-start gap-2">
              <Scissors className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
              <span className="text-gray-700">{plantType.pruning}</span>
            </div>
          )}
          {plantType.plantingPeriod && (
            <div className="flex items-start gap-2">
              <Calendar className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
              <span className="text-gray-700">{t('plants.planting_period', { period: plantType.plantingPeriod })}</span>
            </div>
          )}
          {plantType.harvestPeriod && (
            <div className="flex items-start gap-2">
              <Leaf className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />
              <span className="text-gray-700">{t('plants.harvest_period', { period: plantType.harvestPeriod })}</span>
            </div>
          )}
        </div>
      </div>

      {/* Consociazioni */}
      {((plantType.companionPlants && plantType.companionPlants.length > 0) ||
        (plantType.enemyPlants && plantType.enemyPlants.length > 0)) && (
        <div>
          <p className="text-xs font-semibold text-garden-leaf mb-2 uppercase tracking-wide">
            {t('plants.associations')}
          </p>
          {plantType.companionPlants && plantType.companionPlants.length > 0 && (
            <div className="flex items-start gap-2 text-xs mb-1.5">
              <Heart className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
              <span className="text-gray-700">
                <span className="font-medium text-green-700">{t('plants.companion_friends')}: </span>
                {plantType.companionPlants.join(', ')}
              </span>
            </div>
          )}
          {plantType.enemyPlants && plantType.enemyPlants.length > 0 && (
            <div className="flex items-start gap-2 text-xs">
              <Skull className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
              <span className="text-gray-700">
                <span className="font-medium text-red-700">{t('plants.companion_enemies')}: </span>
                {plantType.enemyPlants.join(', ')}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Malattie */}
      {plantType.diseases && plantType.diseases.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-garden-leaf mb-2 uppercase tracking-wide">{t('plants.diseases_section')}
          </p>
          <div className="space-y-1">
            {plantType.diseases.map((disease) => {
              const isOpen = openDisease === disease.name;
              return (
                <div key={disease.name} className="border border-amber-200 rounded-lg overflow-hidden bg-amber-50">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-amber-800"
                    onClick={() => setOpenDisease(isOpen ? null : disease.name)}
                  >
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      {disease.name}
                    </span>
                    {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  {isOpen && (
                    <div className="px-3 pb-3 space-y-2 border-t border-amber-200 pt-2">
                      <div className="flex items-start gap-2 text-xs">
                        <Stethoscope className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-amber-800">{t('plants.symptoms')}</p>
                          <p className="text-gray-700">{disease.symptoms}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-xs">
                        <Heart className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-red-800">{t('plants.treatment')}</p>
                          <p className="text-gray-700">{disease.treatment}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-xs">
                        <ShieldCheck className="w-3 h-3 text-green-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-green-800">{t('plants.prevention')}</p>
                          <p className="text-gray-700">{disease.prevention}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

//  Card singola pianta utente
function PlantCard({ plant, onEdit, onDiagnose, onTimeline }: { plant: Plant; onEdit: (p: Plant) => void; onDiagnose: (p: Plant) => void; onTimeline: (p: Plant) => void }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const needsWater = needsWatering(plant);

  // Tutte le foto della pianta (compatibilità legacy imageUrl + nuovo images[])
  const allPhotos: string[] = plant.images && plant.images.length > 0
    ? plant.images
    : plant.imageUrl ? [plant.imageUrl] : [];

  const plantType = useLiveQuery(
    () => plant.plantTypeId ? db.plantTypes.get(plant.plantTypeId) : Promise.resolve(undefined),
    [plant.plantTypeId]
  );

  const getCategoryIcon = (category: Plant['category']) => {
    const icons: Record<Plant['category'], string> = {
      vegetables: '',
      fruits: '',
      herbs: '',
      flowers: '',
      trees: ''
    };
    return icons[category];
  };

  const hasDetails = plantType && (
    plantType.sunExposure ||
    plantType.soilType ||
    plantType.fertilizing ||
    plantType.pruning ||
    plantType.plantingPeriod ||
    plantType.harvestPeriod ||
    (plantType.companionPlants && plantType.companionPlants.length > 0) ||
    (plantType.enemyPlants && plantType.enemyPlants.length > 0) ||
    (plantType.diseases && plantType.diseases.length > 0)
  );

  return (
    <Card className={`shadow-card border ${needsWater ? 'border-blue-200 bg-blue-50/30' : 'border-green-100'} rounded-2xl overflow-hidden`}>
      <CardContent className="p-4">
        <div className="flex flex-col gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getCategoryIcon(plant.category)}</span>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-gray-900 break-words">{plant.name}</h3>
              {plant.variety && <p className="text-xs text-gray-500 break-words">{plant.variety}</p>}
            </div>
          </div>
          <div className="flex items-center justify-end gap-1 flex-wrap">
            {needsWater && (
              <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 text-xs">
                {t('plants.irrigate')}
              </Badge>
            )}
            <Badge className={`${getStatusColor(plant.status)} text-xs`}>
              {t(getStatusLabel(plant.status))}
            </Badge>
            <Button
              size="icon"
              variant="ghost"
              className="w-8 h-8 shrink-0 bg-green-50 hover:bg-green-100 rounded-full"
              onClick={() => onEdit(plant)}
              title="Modifica pianta"
            >
              <Pencil className="w-4 h-4 text-garden-leaf" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-garden-earth" />
            <span>{plant.location}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-gray-400" />
            <span>
              {plant.numberOfPlants === 1
                ? t('plants.plant_count_one', { count: plant.numberOfPlants })
                : t('plants.plant_count_other', { count: plant.numberOfPlants })}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Droplet className="w-3.5 h-3.5 text-blue-400" />
            <span>
              {plant.wateringFrequency === 1
                ? t('plants.watering_every_one', { count: plant.wateringFrequency })
                : t('plants.watering_every_other', { count: plant.wateringFrequency })}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-purple-400" />
            <span>{formatShortDate(plant.plantedDate)}</span>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs border-blue-200 text-blue-600 hover:bg-blue-50 rounded-xl"
            onClick={async () => {
              await db.plants.update(plant.id!, { lastWatered: new Date() });
            }}
          >
            <Droplet className="w-3.5 h-3.5 mr-1" />
            {needsWater ? t('plants.water_btn') : t('plants.watered')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs border-amber-200 text-amber-700 hover:bg-amber-50 rounded-xl px-3"
            onClick={() => onTimeline(plant)}
            title="Cronologia foto"
          >
            <Clock className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs border-green-200 text-green-600 hover:bg-green-50 rounded-xl px-3"
            onClick={() => onDiagnose(plant)}
            title="Diagnostica AI malattie"
          >
            <Stethoscope className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs border-purple-200 text-purple-600 hover:bg-purple-50 rounded-xl px-3"
            onClick={async () => {
              const ok = await sharePlant(plant);
              if (ok) toast.success(t('plants.share_success'));
              else toast.error(t('plants.share_error'));
            }}
            title="Condividi"
          >
            <Share2 className="w-3.5 h-3.5" />
          </Button>
        </div>

        {plant.notes && (
          <div className="mt-3 p-3 bg-garden-cream/50 rounded-lg">
            <p className="text-sm text-gray-700"> {plant.notes}</p>
          </div>
        )}

        {plant.attachments && plant.attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {plant.attachments.map(att => (
              <button
                key={att.id}
                type="button"
                onClick={() => {
                  if (att.type === 'link') {
                    window.open(att.data, '_blank', 'noopener,noreferrer');
                  } else {
                    const a = document.createElement('a');
                    a.href = att.data;
                    a.download = att.name;
                    a.target = '_blank';
                    a.rel = 'noopener';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }
                }}
                className="inline-flex items-center gap-1 max-w-[180px] px-2 py-1 rounded-full border border-green-200 bg-white text-xs text-gray-700 hover:bg-green-50"
                title={att.type === 'link' ? att.data : att.name}
              >
                {att.type === 'link' ? (
                  <Link2 className="w-3 h-3 text-garden-leaf shrink-0" />
                ) : (
                  <Paperclip className="w-3 h-3 text-garden-leaf shrink-0" />
                )}
                <span className="truncate">{att.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Galleria foto pianta */}
        {allPhotos.length > 0 && (
          <div className="mt-3">
            {allPhotos.length === 1 ? (
              <button
                type="button"
                onClick={() => setLightboxIndex(0)}
                className="relative w-full group"
              >
                <img
                  src={allPhotos[0]}
                  alt={plant.name}
                  className="w-full h-32 object-cover rounded-xl border border-green-100"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-xl flex items-center justify-center">
                  <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {allPhotos.map((src, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setLightboxIndex(idx)}
                    className="relative aspect-square group"
                  >
                    <img
                      src={src}
                      alt={`${plant.name} ${idx + 1}`}
                      className="w-full h-full object-cover rounded-lg border border-green-100"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                      <ZoomIn className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Lightbox foto */}
        {lightboxIndex !== null && allPhotos[lightboxIndex] && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightboxIndex(null)}
          >
            <img
              src={allPhotos[lightboxIndex]}
              alt={plant.name}
              className="max-w-full max-h-full object-contain rounded-xl"
            />
            {/* Navigazione tra foto */}
            {allPhotos.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => i !== null ? (i - 1 + allPhotos.length) % allPhotos.length : 0); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 text-white rounded-full p-2 hover:bg-white/40"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => i !== null ? (i + 1) % allPhotos.length : 0); }}
                  className="absolute right-14 top-1/2 -translate-y-1/2 bg-white/20 text-white rounded-full p-2 hover:bg-white/40"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm">
                  {lightboxIndex + 1} / {allPhotos.length}
                </div>
              </>
            )}
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute top-4 right-4 bg-white/20 text-white rounded-full p-2 hover:bg-white/40"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        )}

        {hasDetails && (
          <>
            <button
              type="button"
              className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs text-garden-leaf font-medium py-1.5 rounded-lg bg-green-50 hover:bg-green-100 transition-colors"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <><ChevronUp className="w-3.5 h-3.5" />{t('plants.hide_card')}</>
              ) : (
                <><ChevronDown className="w-3.5 h-3.5" />{t('plants.show_card')}</>
              )}
            </button>
            {expanded && plantType && <PlantTypeDetails plantType={plantType} />}
          </>
        )}
      </CardContent>
    </Card>
  );
}

//  Card singola pianta del catalogo
function CatalogCard({ plantType, onAddToGarden }: { plantType: PlantType; onAddToGarden: (pt: PlantType) => void }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const getCategoryIcon = (cat: PlantType['category']) => {
    const icons: Record<PlantType['category'], string> = {
      vegetables: '', fruits: '', herbs: '', flowers: '', trees: ''
    };
    return icons[cat];
  };

  return (
    <Card className="shadow-card border border-green-100 rounded-2xl overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-2xl">{getCategoryIcon(plantType.category)}</span>
            <div>
              <h3 className="font-bold text-gray-900">{plantType.name}</h3>
              {plantType.scientificName && (
                <p className="text-xs text-gray-500 italic">{plantType.scientificName}</p>
              )}
            </div>
          </div>
          <Button
            size="sm"
            className="rounded-full text-xs bg-garden-leaf hover:bg-garden-sage ml-2 shrink-0"
            onClick={() => onAddToGarden(plantType)}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            {t('common.add')}
          </Button>
        </div>

        {plantType.description && (
          <p className="text-xs text-gray-600 mb-2">{plantType.description}</p>
        )}

        <div className="flex gap-2 flex-wrap text-xs">
          {plantType.wateringFrequency && (
            <span className="flex items-center gap-1 text-blue-600">
              <Droplet className="w-3 h-3" />{' '}
              {plantType.wateringFrequency === 1
                ? t('plants.watering_every_one', { count: plantType.wateringFrequency })
                : t('plants.watering_every_other', { count: plantType.wateringFrequency })}
            </span>
          )}
          {plantType.plantingPeriod && (
            <span className="flex items-center gap-1 text-green-600">
              <Calendar className="w-3 h-3" /> {plantType.plantingPeriod}
            </span>
          )}
          {plantType.harvestPeriod && (
            <span className="flex items-center gap-1 text-orange-600">
              <Leaf className="w-3 h-3" /> {plantType.harvestPeriod}
            </span>
          )}
        </div>

        {(plantType.sunExposure || plantType.soilType || plantType.fertilizing ||
          (plantType.companionPlants && plantType.companionPlants.length > 0) ||
          (plantType.diseases && plantType.diseases.length > 0)) && (
          <>
            <button
              type="button"
              className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs text-garden-leaf font-medium py-1.5 rounded-lg bg-green-50 hover:bg-green-100 transition-colors"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <><ChevronUp className="w-3.5 h-3.5" />{t('plants.hide_card')}</>
              ) : (
                <><ChevronDown className="w-3.5 h-3.5" />{t('plants.show_card')}</>
              )}
            </button>
            {expanded && <PlantTypeDetails plantType={plantType} />}
          </>
        )}
      </CardContent>
    </Card>
  );
}

//  Pagina principale
export default function PlantsPage() {
  const { t } = useTranslation();
  const plants = useLiveQuery(() => db.plants.toArray());
  const plantTypes = useLiveQuery(() => db.plantTypes.orderBy('name').toArray());
  const settings = useLiveQuery(() => db.settings.toArray().then(s => s[0]));
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addFromCatalog, setAddFromCatalog] = useState<PlantType | null>(null);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
  const [diagnosticPlant, setDiagnosticPlant] = useState<Plant | null>(null);
  const [timelinePlant, setTimelinePlant] = useState<Plant | null>(null);
  const [activeTab, setActiveTab] = useState<'mie' | 'catalogo'>('mie');

  const filteredPlants = plants?.filter(plant => {
    const matchesSearch = plant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         plant.scientificName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || plant.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Ordina: prima le piante che hanno bisogno di acqua (needsWatering()),
  // mantenendo per il resto l'ordine originale (Array.sort è stabile su V8 ≥ 7).
  const sortedPlants = filteredPlants
    ? [...filteredPlants].sort((a, b) => {
        const aNeeds = needsWatering(a) ? 0 : 1;
        const bNeeds = needsWatering(b) ? 0 : 1;
        return aNeeds - bNeeds;
      })
    : filteredPlants;

  const filteredTypes = plantTypes?.filter(pt => {
    const matchesSearch = pt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         pt.scientificName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         pt.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || pt.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: Plant['category']) => {
    const icons: Record<Plant['category'], string> = {
      vegetables: '', fruits: '', herbs: '', flowers: '', trees: ''
    };
    return icons[category];
  };

  const getCategoryLabel = (category: Plant['category']) => {
    const keys: Record<Plant['category'], string> = {
      vegetables: 'category.vegetables',
      fruits: 'category.fruits',
      herbs: 'category.herbs',
      flowers: 'category.flowers',
      trees: 'category.trees',
    };
    return t(keys[category]);
  };

  const plantsCount = plants?.length || 0;
  const catalogCount = plantTypes?.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-garden-cream to-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-garden-leaf to-garden-sage text-white p-6 rounded-b-3xl shadow-elevated">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-1"> {t('plants.my_garden')}</h1>
            <p className="text-green-100">
              {activeTab === 'mie'
                ? (plantsCount === 1
                    ? t('plants.count_one', { count: plantsCount })
                    : t('plants.count_other', { count: plantsCount }))
                : (catalogCount === 1
                    ? t('plants.catalog_count_one', { count: catalogCount })
                    : t('plants.catalog_count_other', { count: catalogCount }))
              }
            </p>
          </div>
          <Button
            size="icon"
            className="bg-white text-garden-leaf hover:bg-green-50 rounded-full w-12 h-12"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === 'mie'
                ? 'bg-white text-garden-leaf'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
            onClick={() => setActiveTab('mie')}
          >
            <Leaf className="w-4 h-4 inline mr-1.5" />
            {t('plants.my_garden')}
          </button>
          <button
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === 'catalogo'
                ? 'bg-white text-garden-leaf'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
            onClick={() => setActiveTab('catalogo')}
          >
            <BookOpen className="w-4 h-4 inline mr-1.5" />
            {t('plants.catalog')}
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={activeTab === 'mie' ? t('plants.search_my') : t('plants.search_catalog')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/90 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
          />
        </div>
      </div>

      {/* Category Filters */}
      <div className="px-4 mt-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Button
            variant={filterCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterCategory('all')}
            className="rounded-full whitespace-nowrap"
          >
            {t('category.all')}
          </Button>
          {(['vegetables', 'fruits', 'herbs', 'flowers', 'trees'] as const).map((category) => (
            <Button
              key={category}
              variant={filterCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterCategory(category)}
              className="rounded-full whitespace-nowrap"
            >
              {getCategoryIcon(category)} {getCategoryLabel(category)}
            </Button>
          ))}
        </div>
      </div>

      {/* Contenuto tab */}
      <div className="px-4 mt-4 space-y-3">
        {activeTab === 'mie' ? (
          sortedPlants && sortedPlants.length > 0 ? (
            sortedPlants.map((plant) => (
              <PlantCard key={plant.id} plant={plant} onEdit={setEditingPlant} onDiagnose={setDiagnosticPlant} onTimeline={setTimelinePlant} />
            ))
          ) : (
            <div className="text-center py-12">
              <Leaf className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">
                {searchQuery ? t('plants.empty_search') : t('plants.empty_garden')}
              </p>
              {!searchQuery && (
                <p className="text-gray-400 text-sm mb-4">{t('plants.empty_garden_hint')}</p>
              )}
              <div className="flex gap-2 justify-center">
                <Button className="rounded-full" onClick={() => setShowAddDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('common.add')}
                </Button>
                <Button variant="outline" className="rounded-full" onClick={() => setActiveTab('catalogo')}>
                  <BookOpen className="w-4 h-4 mr-2" />
                  {t('plants.browse_catalog')}
                </Button>
              </div>
            </div>
          )
        ) : (
          // TAB CATALOGO
          <>
            {/* Debug panel  mostra sempre lo stato del DB */}
            <div className="mb-3 p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-center justify-between gap-2">
              <span>
                {t('plants.db_catalog')}: <strong>{plantTypes?.length ?? ''}</strong>{' '}
                {plantTypes?.length === 1
                  ? t('plants.plant_count_one', { count: plantTypes?.length ?? 0 })
                  : t('plants.plant_count_other', { count: plantTypes?.length ?? 0 })}
                {plantTypes?.length === 0 && ` ${t('plants.catalog_empty_note')}`}
              </span>
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-blue-400 text-blue-700 hover:bg-blue-100 py-1 px-2 h-7"
                onClick={async () => {
                  try {
                    await seedDatabase();
                    window.location.reload();
                  } catch (e) {
                    console.error('Seed error:', e);
                    alert('Errore nel ricarico catalogo: ' + String(e));
                  }
                }}
              >
                {t('common.reload')}
              </Button>
            </div>

            {filteredTypes && filteredTypes.length > 0 ? (
              filteredTypes.map((pt) => (
                <CatalogCard
                  key={pt.id}
                  plantType={pt}
                  onAddToGarden={(plantType) => {
                    setAddFromCatalog(plantType);
                    setShowAddDialog(true);
                  }}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">
                  {plantTypes?.length === 0
                    ? t('plants.catalog_empty')
                    : t('plants.catalog_empty')}
                </p>
                {plantTypes?.length === 0 && (
                  <Button
                    className="rounded-full mt-2"
                    onClick={async () => {
                      try {
                        await seedDatabase();
                        window.location.reload();
                      } catch (e) {
                        alert('Errore: ' + String(e));
                      }
                    }}
                  >
                    {t('plants.catalog_reload')}
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Dialog aggiunta */}
      <AddPlantDialog
        open={showAddDialog}
        onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) setAddFromCatalog(null);
        }}
        preselectedPlantType={addFromCatalog}
      />

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
