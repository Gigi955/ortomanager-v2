import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTranslation } from 'react-i18next';
import { db, Plant, PlantPhoto } from '@/lib/db';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Camera, ImagePlus, Trash2, X, ZoomIn, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { formatShortDate } from '@/lib/utils';

interface PlantPhotoTimelineDialogProps {
  plant: Plant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STAGE_EMOJI: Record<Plant['status'], string> = {
  seedling: '🌱',
  growing: '🌿',
  flowering: '🌸',
  fruiting: '🍅',
  harvested: '✂️',
  dormant: '😴',
};

export default function PlantPhotoTimelineDialog({
  plant, open, onOpenChange,
}: PlantPhotoTimelineDialogProps) {
  const { t } = useTranslation();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const photos = useLiveQuery(
    () => plant?.id ? db.plantPhotos.where('plantId').equals(plant.id).toArray() : Promise.resolve([]),
    [plant?.id, open]
  );

  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  })();

  const [pendingDataUrl, setPendingDataUrl] = useState<string | null>(null);
  const [date, setDate] = useState(todayStr);
  const [note, setNote] = useState('');
  const [stage, setStage] = useState<Plant['status'] | 'none'>('none');
  const [lightboxId, setLightboxId] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      setPendingDataUrl(null);
      setDate(todayStr);
      setNote('');
      setStage(plant?.status ?? 'none');
    }
  }, [open, plant, todayStr]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error(t('photoTimeline.error_image'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setPendingDataUrl(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!plant?.id || !pendingDataUrl) return;
    try {
      await db.plantPhotos.add({
        plantId: plant.id,
        dataUrl: pendingDataUrl,
        date: new Date(date),
        note: note.trim() || undefined,
        stage: stage === 'none' ? undefined : stage,
      });
      toast.success(t('photoTimeline.success_save'));
      setPendingDataUrl(null);
      setNote('');
    } catch (err) {
      console.error(err);
      toast.error(t('photoTimeline.error_save'));
    }
  };

  const handleDelete = async (photoId?: number) => {
    if (!photoId) return;
    await db.plantPhotos.delete(photoId);
    if (lightboxId === photoId) setLightboxId(null);
    toast.success(t('photoTimeline.deleted'));
  };

  const sortedPhotos = (photos ?? []).slice().sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const lightboxPhoto = sortedPhotos.find(p => p.id === lightboxId);

  if (!plant) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-garden-leaf" />
            {t('photoTimeline.title', { name: plant.name })}
          </DialogTitle>
          <DialogDescription>{t('photoTimeline.desc')}</DialogDescription>
        </DialogHeader>

        {/* Form aggiungi foto */}
        <div className="space-y-3 border rounded-xl p-3 bg-garden-cream/30">
          <p className="text-sm font-semibold text-garden-leaf">{t('photoTimeline.add_new')}</p>

          {pendingDataUrl ? (
            <div className="relative">
              <img src={pendingDataUrl} alt="preview" className="w-full h-48 object-cover rounded-lg" />
              <button
                type="button"
                onClick={() => setPendingDataUrl(null)}
                className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" onClick={() => cameraInputRef.current?.click()}>
                <Camera className="w-4 h-4 mr-2" />
                {t('photoTimeline.camera')}
              </Button>
              <Button type="button" variant="outline" onClick={() => galleryInputRef.current?.click()}>
                <ImagePlus className="w-4 h-4 mr-2" />
                {t('photoTimeline.gallery')}
              </Button>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
              />
            </div>
          )}

          {pendingDataUrl && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="photo-date" className="text-xs">{t('photoTimeline.date')}</Label>
                <Input id="photo-date" type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t('photoTimeline.stage')}</Label>
                <Select value={stage} onValueChange={v => setStage(v as Plant['status'] | 'none')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    <SelectItem value="seedling">🌱 {t('status.seedling')}</SelectItem>
                    <SelectItem value="growing">🌿 {t('status.growing')}</SelectItem>
                    <SelectItem value="flowering">🌸 {t('status.flowering')}</SelectItem>
                    <SelectItem value="fruiting">🍅 {t('status.fruiting')}</SelectItem>
                    <SelectItem value="harvested">✂️ {t('status.harvested')}</SelectItem>
                    <SelectItem value="dormant">😴 {t('status.dormant')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="photo-note" className="text-xs">{t('photoTimeline.note')}</Label>
                <Textarea
                  id="photo-note"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={2}
                  placeholder={t('photoTimeline.note_ph')}
                />
              </div>
              <Button onClick={handleSave} className="w-full">{t('photoTimeline.save')}</Button>
            </>
          )}
        </div>

        {/* Cronologia */}
        <div className="mt-4 space-y-3">
          <p className="text-sm font-semibold text-gray-700">
            {t('photoTimeline.history')} ({sortedPhotos.length})
          </p>
          {sortedPhotos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {t('photoTimeline.empty')}
            </p>
          ) : (
            <div className="space-y-3">
              {sortedPhotos.map((p, idx) => {
                const isFirst = idx === sortedPhotos.length - 1;
                const isLatest = idx === 0;
                return (
                  <div key={p.id} className="flex gap-3 items-start">
                    <div className="flex flex-col items-center pt-1">
                      <div className={`w-3 h-3 rounded-full ${isLatest ? 'bg-garden-leaf' : 'bg-gray-300'}`} />
                      {!isFirst && <div className="w-px flex-1 bg-gray-200 min-h-[60px]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium text-gray-700">
                          {formatShortDate(p.date)}
                        </p>
                        <div className="flex items-center gap-1">
                          {p.stage && (
                            <Badge variant="outline" className="text-[10px] py-0">
                              {STAGE_EMOJI[p.stage]} {t(`status.${p.stage}`)}
                            </Badge>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDelete(p.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                            title={t('photoTimeline.delete')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setLightboxId(p.id ?? null)}
                        className="relative w-full group"
                      >
                        <img
                          src={p.dataUrl}
                          alt={`${plant.name} ${formatShortDate(p.date)}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                          <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100" />
                        </div>
                      </button>
                      {p.note && <p className="text-xs text-gray-600 mt-1.5">{p.note}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Lightbox */}
        {lightboxPhoto && (
          <div
            className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightboxId(null)}
          >
            <img
              src={lightboxPhoto.dataUrl}
              alt={plant.name}
              className="max-w-full max-h-full object-contain rounded-xl"
            />
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/90 text-sm bg-black/40 px-3 py-1 rounded-full">
              {formatShortDate(lightboxPhoto.date)}
              {lightboxPhoto.stage && ` · ${STAGE_EMOJI[lightboxPhoto.stage]} ${t(`status.${lightboxPhoto.stage}`)}`}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxId(null); }}
              className="absolute top-4 right-4 bg-white/20 text-white rounded-full p-2 hover:bg-white/40"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
