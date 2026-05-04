import { useState, useEffect, useRef } from 'react';
import { db, Plant } from '@/lib/db';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Trash2, Camera, X, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface EditPlantDialogProps {
  plant: Plant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditPlantDialog({ plant, open, onOpenChange }: EditPlantDialogProps) {
  const { t } = useTranslation();

  const STATUS_OPTIONS: { value: Plant['status']; label: string }[] = [
    { value: 'seedling',  label: '🌱 ' + t('status.seedling') },
    { value: 'growing',   label: '🌿 ' + t('status.growing') },
    { value: 'flowering', label: '🌸 ' + t('status.flowering') },
    { value: 'fruiting',  label: '🍅 ' + t('status.fruiting') },
    { value: 'harvested', label: '✂️ ' + t('status.harvested') },
    { value: 'dormant',   label: '😴 ' + t('status.dormant') },
  ];

  const CATEGORY_OPTIONS: { value: Plant['category']; label: string }[] = [
    { value: 'vegetables', label: '🥦 ' + t('category.vegetables') },
    { value: 'fruits',     label: '🍓 ' + t('category.fruits') },
    { value: 'herbs',      label: '🌿 ' + t('category.herbs') },
    { value: 'flowers',    label: '🌸 ' + t('category.flowers') },
    { value: 'trees',      label: '🌳 ' + t('category.trees') },
  ];

  const [name, setName] = useState('');
  const [variety, setVariety] = useState('');
  const [status, setStatus] = useState<Plant['status']>('seedling');
  const [category, setCategory] = useState<Plant['category']>('vegetables');
  const [numberOfPlants, setNumberOfPlants] = useState('');
  const [location, setLocation] = useState('');
  const [plantedDate, setPlantedDate] = useState('');
  const [wateringFrequency, setWateringFrequency] = useState('');
  const [notes, setNotes] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Popola il form quando si apre il dialog
  useEffect(() => {
    if (plant && open) {
      setName(plant.name);
      setVariety(plant.variety ?? '');
      setStatus(plant.status);
      setCategory(plant.category);
      setNumberOfPlants(String(plant.numberOfPlants));
      setLocation(plant.location);
      const _pd = plant.plantedDate instanceof Date ? plant.plantedDate : new Date(plant.plantedDate);
      const _localDate = `${_pd.getFullYear()}-${String(_pd.getMonth()+1).padStart(2,'0')}-${String(_pd.getDate()).padStart(2,'0')}`;
      setPlantedDate(_localDate);
      setWateringFrequency(String(plant.wateringFrequency));
      setNotes(plant.notes ?? '');
      // Merge imageUrl legacy + images array
      const legacy = plant.imageUrl ? [plant.imageUrl] : [];
      const extra = plant.images ?? [];
      const merged = [...new Set([...legacy, ...extra])];
      setImages(merged);
      setShowDeleteConfirm(false);
    }
  }, [plant, open]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plant?.id) return;
    if (!name.trim()) { toast.error(t('dialogs.editPlant.error_name')); return; }
    if (!location.trim()) { toast.error(t('dialogs.editPlant.error_location')); return; }
    const parsedNumPlants = numberOfPlants === '' ? 0 : parseInt(numberOfPlants, 10);
    const parsedWatering = wateringFrequency === '' ? 1 : parseInt(wateringFrequency, 10);
    if (isNaN(parsedNumPlants) || parsedNumPlants < 0) { toast.error(t('dialogs.editPlant.error_negative')); return; }
    if (isNaN(parsedWatering) || parsedWatering < 1) { toast.error(t('dialogs.editPlant.error_watering')); return; }

    try {
      await db.plants.update(plant.id, {
        name: name.trim(),
        variety: variety.trim() || undefined,
        status,
        category,
        numberOfPlants: parsedNumPlants,
        location: location.trim(),
        plantedDate: new Date(plantedDate),
        wateringFrequency: parsedWatering,
        notes: notes.trim() || undefined,
        imageUrl: images[0] || undefined,
        images: images.length > 0 ? images : undefined,
      });
      toast.success(t('dialogs.editPlant.success_update'));
      onOpenChange(false);
    } catch (err) {
      toast.error(t('dialogs.editPlant.error_save'));
      console.error(err);
    }
  };

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error(t('dialogs.editPlant.error_image'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImages(prev => [...prev, dataUrl]);
    };
    reader.readAsDataURL(file);
  };

  const handleGalleryPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(f => handleImageFile(f));
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleDelete = async () => {
    if (!plant?.id) return;
    try {
      await db.plants.delete(plant.id);
      toast.success(t('dialogs.editPlant.success_delete'));
      onOpenChange(false);
    } catch (err) {
      toast.error(t('dialogs.editPlant.error_delete'));
      console.error(err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('dialogs.editPlant.title')}</DialogTitle>
          <DialogDescription>
            {t('dialogs.editPlant.desc')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="edit-name">{t('dialogs.editPlant.name')}</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('dialogs.editPlant.name_ph')}
            />
          </div>

          {/* Varieta */}
          <div className="space-y-2">
            <Label htmlFor="edit-variety">{t('dialogs.editPlant.variety')}</Label>
            <Input
              id="edit-variety"
              value={variety}
              onChange={e => setVariety(e.target.value)}
              placeholder={t('dialogs.editPlant.variety_ph')}
            />
          </div>

          {/* Stato e Categoria affiancati */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t('dialogs.editPlant.status')}</Label>
              <Select value={status} onValueChange={v => setStatus(v as Plant['status'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('dialogs.editPlant.category')}</Label>
              <Select value={category} onValueChange={v => setCategory(v as Plant['category'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* N. piante e Frequenza irrigazione affiancati */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-num">{t('dialogs.editPlant.num_plants')}</Label>
              <Input
                id="edit-num"
                type="number"
                min="0"
                value={numberOfPlants}
                onChange={e => setNumberOfPlants(e.target.value)}
                placeholder="es. 3"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-freq">{t('dialogs.editPlant.watering')}</Label>
              <Input
                id="edit-freq"
                type="number"
                min="1"
                value={wateringFrequency}
                onChange={e => setWateringFrequency(e.target.value)}
                placeholder="es. 3"
              />
            </div>
          </div>

          {/* Posizione */}
          <div className="space-y-2">
            <Label htmlFor="edit-location">{t('dialogs.editPlant.location')}</Label>
            <Input
              id="edit-location"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder={t('dialogs.editPlant.location_ph')}
            />
          </div>

          {/* Data semina */}
          <div className="space-y-2">
            <Label htmlFor="edit-date">{t('dialogs.editPlant.planting_date')}</Label>
            <Input
              id="edit-date"
              type="date"
              value={plantedDate}
              onChange={e => setPlantedDate(e.target.value)}
            />
          </div>

          {/* Foto */}
          <div className="space-y-2">
            <Label>{t('dialogs.editPlant.photos', { count: images.length })}</Label>

            {/* Griglia foto esistenti */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {images.map((src, idx) => (
                  <div key={idx} className="relative aspect-square">
                    <img
                      src={src}
                      alt={`Foto ${idx + 1}`}
                      className="w-full h-full object-cover rounded-xl border border-green-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-1 left-1 bg-garden-leaf/80 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                        {t('dialogs.editPlant.main_photo')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pulsanti aggiungi foto */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-garden-leaf hover:text-garden-leaf transition-colors"
              >
                <Camera className="w-4 h-4" />
                {t('dialogs.editPlant.take_photo')}
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-garden-leaf hover:text-garden-leaf transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t('dialogs.editPlant.add_photo')}
              </button>
            </div>

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
              multiple
              className="hidden"
              onChange={handleGalleryPick}
            />
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="edit-notes">{t('dialogs.editPlant.notes')}</Label>
            <Textarea
              id="edit-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={t('dialogs.editPlant.notes_ph')}
              rows={3}
            />
          </div>

          {/* Footer */}
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            {/* Pulsante elimina */}
            {!showDeleteConfirm ? (
              <Button
                type="button"
                variant="outline"
                className="border-red-200 text-red-500 hover:bg-red-50 w-full sm:w-auto"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t('dialogs.editPlant.delete')}
              </Button>
            ) : (
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="destructive"
                  className="flex-1"
                  onClick={handleDelete}
                >
                  {t('dialogs.editPlant.confirm_delete')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  {t('dialogs.editPlant.no')}
                </Button>
              </div>
            )}

            <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t('dialogs.editPlant.cancel')}
              </Button>
              <Button type="submit">
                {t('dialogs.editPlant.submit')}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
