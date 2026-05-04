import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { db, type Note, type Plant, type JournalEventType } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { BookText, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatShortDate } from '@/lib/utils';
import VoiceInputButton from '@/components/VoiceInputButton';

const EVENT_EMOJI: Record<JournalEventType, string> = {
  transplant: '🪴',
  first_flower: '🌸',
  first_fruit: '🍅',
  pest: '🐛',
  disease: '🦠',
  pruning: '✂️',
  fertilizing: '🌿',
  observation: '👁️',
  other: '📝',
};

export default function JournalPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const notes = useLiveQuery(() => db.notes.toArray()) ?? [];
  const plants = useLiveQuery(() => db.plants.toArray()) ?? [];

  const plantById = useMemo(() => {
    const m = new Map<number, Plant>();
    plants.forEach(p => { if (p.id) m.set(p.id, p); });
    return m;
  }, [plants]);

  const [filterPlant, setFilterPlant] = useState<string>('all');
  const [filterEvent, setFilterEvent] = useState<string>('all');
  const [showAdd, setShowAdd] = useState(false);

  // Form state
  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  })();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState(todayStr);
  const [eventType, setEventType] = useState<JournalEventType>('observation');
  const [plantId, setPlantId] = useState<string>('none');

  const filtered = useMemo(() => {
    return notes
      .filter(n => filterPlant === 'all' || (filterPlant === 'general' ? !n.plantId : String(n.plantId) === filterPlant))
      .filter(n => filterEvent === 'all' || n.eventType === filterEvent)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [notes, filterPlant, filterEvent]);

  const reset = () => {
    setTitle('');
    setContent('');
    setDate(todayStr);
    setEventType('observation');
    setPlantId('none');
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error(t('journal.error_title'));
      return;
    }
    try {
      await db.notes.add({
        title: title.trim(),
        content: content.trim(),
        date: new Date(date),
        tags: [],
        plantId: plantId !== 'none' ? parseInt(plantId) : undefined,
        eventType,
      });
      toast.success(t('journal.success_save'));
      reset();
      setShowAdd(false);
    } catch (err) {
      console.error(err);
      toast.error(t('journal.error_save'));
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (!confirm(t('journal.delete_confirm'))) return;
    await db.notes.delete(id);
    toast.success(t('journal.deleted'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-garden-cream to-white dark:from-gray-900 dark:to-gray-800 pb-24">
      <div className="bg-gradient-to-r from-garden-sage to-garden-leaf text-white p-6 rounded-b-3xl shadow-elevated">
        <div className="flex items-center gap-3 mb-2">
          <Button size="icon" variant="ghost" className="text-white hover:bg-white/20" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <BookText className="w-7 h-7" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{t('journal.title')}</h1>
            <p className="text-green-100 text-sm">{t('journal.subtitle')}</p>
          </div>
          <Button size="icon" className="bg-white text-garden-leaf hover:bg-green-50 rounded-full" onClick={() => setShowAdd(true)}>
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="px-4 mt-6 space-y-4">
        {/* Filtri */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-3 grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">{t('journal.filter_plant')}</Label>
              <Select value={filterPlant} onValueChange={setFilterPlant}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('journal.all_plants')}</SelectItem>
                  <SelectItem value="general">{t('journal.general_only')}</SelectItem>
                  {plants.map(p => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{t('journal.filter_event')}</Label>
              <Select value={filterEvent} onValueChange={setFilterEvent}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('journal.all_events')}</SelectItem>
                  {(Object.keys(EVENT_EMOJI) as JournalEventType[]).map(et => (
                    <SelectItem key={et} value={et}>{EVENT_EMOJI[et]} {t(`journal.event.${et}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista */}
        {filtered.length === 0 ? (
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-8 text-center">
              <BookText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-4">{t('journal.empty')}</p>
              <Button onClick={() => setShowAdd(true)}>
                <Plus className="w-4 h-4 mr-1" />
                {t('journal.add_first')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          filtered.map((note: Note) => {
            const plant = note.plantId ? plantById.get(note.plantId) : undefined;
            const emoji = note.eventType ? EVENT_EMOJI[note.eventType] : '📝';
            return (
              <Card key={note.id} className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xl shrink-0">{emoji}</span>
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">{note.title}</h3>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-muted-foreground">{formatShortDate(note.date)}</span>
                        {plant && (
                          <Badge variant="outline" className="text-[10px] py-0 border-garden-leaf/30 text-garden-leaf">
                            🌿 {plant.name}
                          </Badge>
                        )}
                        {note.eventType && (
                          <Badge variant="outline" className="text-[10px] py-0">
                            {t(`journal.event.${note.eventType}`)}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(note.id)}
                      className="text-gray-300 hover:text-red-500 p-1"
                      title={t('common.delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {note.content && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 whitespace-pre-wrap">{note.content}</p>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Dialog aggiungi */}
      <Dialog open={showAdd} onOpenChange={(o) => { if (!o) reset(); setShowAdd(o); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('journal.new_entry')}</DialogTitle>
            <DialogDescription>{t('journal.new_entry_desc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="j-title">{t('journal.entry_title')}</Label>
              <div className="flex gap-2">
                <Input id="j-title" value={title} onChange={e => setTitle(e.target.value)} placeholder={t('journal.title_ph')} className="flex-1" />
                <VoiceInputButton currentValue={title} onTranscript={setTitle} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="j-date">{t('journal.date')}</Label>
                <Input id="j-date" type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{t('journal.event_type')}</Label>
                <Select value={eventType} onValueChange={v => setEventType(v as JournalEventType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(EVENT_EMOJI) as JournalEventType[]).map(et => (
                      <SelectItem key={et} value={et}>{EVENT_EMOJI[et]} {t(`journal.event.${et}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t('journal.plant')}</Label>
              <Select value={plantId} onValueChange={setPlantId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— {t('journal.no_plant')} —</SelectItem>
                  {plants.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="j-content">{t('journal.content')}</Label>
              <div className="flex gap-2 items-start">
                <Textarea id="j-content" value={content} onChange={e => setContent(e.target.value)} rows={4} placeholder={t('journal.content_ph')} className="flex-1" />
                <VoiceInputButton currentValue={content} onTranscript={setContent} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { reset(); setShowAdd(false); }}>{t('common.cancel')}</Button>
            <Button onClick={handleSave}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
