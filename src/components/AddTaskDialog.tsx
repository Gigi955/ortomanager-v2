import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { scheduleTaskNotification } from '@/lib/notifications';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import VoiceInputButton from '@/components/VoiceInputButton';

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: Date;
}

export default function AddTaskDialog({ open, onOpenChange, defaultDate }: AddTaskDialogProps) {
  const { t } = useTranslation();
  const plants = useLiveQuery(() => db.plants.toArray());

  const today = defaultDate || new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(todayStr);
  const [category, setCategory] = useState<'watering' | 'fertilizing' | 'pruning' | 'harvesting' | 'planting' | 'other'>('other');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [plantId, setPlantId] = useState<string>('none');

  const reset = () => {
    setTitle('');
    setDescription('');
    setDueDate(todayStr);
    setCategory('other');
    setPriority('medium');
    setPlantId('none');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error(t('dialogs.addTask.error_title')); return; }
    try {
      const newTask = {
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: new Date(dueDate),
        completed: false,
        priority,
        category,
        plantId: plantId !== 'none' ? parseInt(plantId) : undefined,
        createdAt: new Date(),
      };
      const newId = await db.tasks.add(newTask);
      scheduleTaskNotification({ ...newTask, id: newId as number });
      toast.success(t('dialogs.addTask.success'));
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(t('dialogs.addTask.error_save'));
      console.error(err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('dialogs.addTask.title')}</DialogTitle>
          <DialogDescription>{t('dialogs.addTask.desc')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">{t('dialogs.addTask.task_title')}</Label>
            <div className="flex gap-2">
              <Input id="task-title" value={title} onChange={e => setTitle(e.target.value)} placeholder={t('dialogs.addTask.title_ph')} className="flex-1" />
              <VoiceInputButton currentValue={title} onTranscript={setTitle} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-desc">{t('dialogs.addTask.description')}</Label>
            <Textarea id="task-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder={t('dialogs.addTask.desc_ph')} rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t('dialogs.addTask.category')}</Label>
              <Select value={category} onValueChange={v => setCategory(v as typeof category)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="watering">💧 {t('taskCategory.watering')}</SelectItem>
                  <SelectItem value="fertilizing">🌿 {t('taskCategory.fertilizing')}</SelectItem>
                  <SelectItem value="pruning">✂️ {t('taskCategory.pruning')}</SelectItem>
                  <SelectItem value="harvesting">🌾 {t('taskCategory.harvesting')}</SelectItem>
                  <SelectItem value="planting">🌱 {t('taskCategory.planting')}</SelectItem>
                  <SelectItem value="other">📝 {t('taskCategory.other')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('dialogs.addTask.priority')}</Label>
              <Select value={priority} onValueChange={v => setPriority(v as typeof priority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">🟢 {t('priority.low')}</SelectItem>
                  <SelectItem value="medium">🟡 {t('priority.medium')}</SelectItem>
                  <SelectItem value="high">🔴 {t('priority.high')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-date">{t('dialogs.addTask.due_date')}</Label>
            <Input id="task-date" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>{t('dialogs.addTask.linked_plant')}</Label>
            <Select value={plantId} onValueChange={setPlantId}>
              <SelectTrigger><SelectValue placeholder={t('dialogs.addTask.no_plant')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('dialogs.addTask.no_plant')}</SelectItem>
                {plants?.map(p => (
                  <SelectItem key={p.id} value={p.id!.toString()}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => { reset(); onOpenChange(false); }}>{t('dialogs.addTask.cancel')}</Button>
            <Button type="submit">{t('dialogs.addTask.submit')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
