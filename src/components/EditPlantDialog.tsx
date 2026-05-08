import { useState, useEffect, useRef } from 'react';
import { db, Plant, Attachment } from '@/lib/db';
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
import { Trash2, Camera, X, Plus, Link2, Paperclip, FileText, Download, ExternalLink } from 'lucide-react';
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
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

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
      setAttachments(plant.attachments ?? []);
      setShowLinkInput(false);
      setLinkUrl('');
      setLinkLabel('');
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
        attachments: attachments.length > 0 ? attachments : undefined,
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

  const newAttachmentId = () =>
    `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const handleAttachmentFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('dialogs.editPlant.attachment_too_big'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setAttachments(prev => [...prev, {
        id: newAttachmentId(),
        type: 'file',
        name: file.name,
        data: dataUrl,
        mimeType: file.type || undefined,
        size: file.size,
        addedAt: new Date(),
      }]);
    };
    reader.readAsDataURL(file);
  };

  const handleAttachmentPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(f => handleAttachmentFile(f));
    e.target.value = '';
  };

  const confirmAddLink = () => {
    let url = linkUrl.trim();
    if (!url) { toast.error(t('dialogs.editPlant.link_url_required')); return; }
    if (!/^https?:\/\//i.test(url) && !url.startsWith('mailto:')) {
      url = 'https://' + url;
    }
    const label = linkLabel.trim() || url.replace(/^https?:\/\//i, '');
    setAttachments(prev => [...prev, {
      id: newAttachmentId(),
      type: 'link',
      name: label,
      data: url,
      addedAt: new Date(),
    }]);
    setLinkUrl('');
    setLinkLabel('');
    setShowLinkInput(false);
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const openAttachment = (att: Attachment) => {
    if (att.type === 'link') {
      window.open(att.data, '_blank', 'noopener,noreferrer');
      return;
    }
    // file: triggera download/apertura
    const a = document.createElement('a');
    a.href = att.data;
    a.download = att.name;
    a.target = '_blank';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
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
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={numberOfPlants}
                onChange={e => setNumberOfPlants(e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, ''))}
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

          {/* Allegati (file e link) */}
          <div className="space-y-2">
            <Label>{t('dialogs.editPlant.attachments', { count: attachments.length })}</Label>

            {attachments.length > 0 && (
              <ul className="space-y-1.5">
                {attachments.map(att => (
                  <li
                    key={att.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-green-200 bg-white"
                  >
                    {att.type === 'link' ? (
                      <Link2 className="w-4 h-4 text-garden-leaf shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-garden-leaf shrink-0" />
                    )}
                    <button
                      type="button"
                      onClick={() => openAttachment(att)}
                      className="flex-1 min-w-0 text-left text-sm truncate hover:underline"
                      title={att.type === 'link' ? att.data : att.name}
                    >
                      {att.name}
                      {att.type === 'file' && att.size ? (
                        <span className="ml-2 text-xs text-gray-400">{formatFileSize(att.size)}</span>
                      ) : null}
                    </button>
                    {att.type === 'link' ? (
                      <ExternalLink className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    ) : (
                      <Download className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    )}
                    <button
                      type="button"
                      onClick={() => removeAttachment(att.id)}
                      className="text-gray-400 hover:text-red-500 shrink-0"
                      aria-label={t('dialogs.editPlant.attachment_remove')}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {showLinkInput ? (
              <div className="space-y-2 p-3 border border-dashed border-green-200 rounded-xl bg-green-50/40">
                <Input
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  placeholder={t('dialogs.editPlant.link_url_ph')}
                  autoFocus
                />
                <Input
                  value={linkLabel}
                  onChange={e => setLinkLabel(e.target.value)}
                  placeholder={t('dialogs.editPlant.link_label_ph')}
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => { setShowLinkInput(false); setLinkUrl(''); setLinkLabel(''); }}
                  >
                    {t('dialogs.editPlant.cancel')}
                  </Button>
                  <Button type="button" size="sm" onClick={confirmAddLink}>
                    {t('dialogs.editPlant.add_link_confirm')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowLinkInput(true)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-garden-leaf hover:text-garden-leaf transition-colors"
                >
                  <Link2 className="w-4 h-4" />
                  {t('dialogs.editPlant.add_link')}
                </button>
                <button
                  type="button"
                  onClick={() => attachmentInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-garden-leaf hover:text-garden-leaf transition-colors"
                >
                  <Paperclip className="w-4 h-4" />
                  {t('dialogs.editPlant.add_file')}
                </button>
              </div>
            )}

            <input
              ref={attachmentInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleAttachmentPick}
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
