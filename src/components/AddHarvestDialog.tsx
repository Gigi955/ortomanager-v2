import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
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

interface AddHarvestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UNITS = ['kg', 'g', 'pezzi', 'mazzi', 'litri', 'mazzetti', 'cassette'];

export default function AddHarvestDialog({ open, onOpenChange }: AddHarvestDialogProps) {
  const plants = useLiveQuery(() => db.plants.toArray());

  const todayStr = new Date().toISOString().split('T')[0];
  const [plantId, setPlantId] = useState<string>('');
  const [quantityStr, setQuantityStr] = useState<string>('1');
  const [unit, setUnit] = useState('kg');
  const [date, setDate] = useState(todayStr);
  const [notes, setNotes] = useState('');

  const reset = () => {
    setPlantId('');
    setQuantityStr('1');
    setUnit('kg');
    setDate(todayStr);
    setNotes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plantId) { toast.error('Seleziona una pianta'); return; }
    // Accetta sia punto che virgola come separatore decimale
    const quantityNum = parseFloat(quantityStr.replace(',', '.'));
    if (isNaN(quantityNum) || quantityNum <= 0) {
      toast.error('Inserisci una quantita valida (es: 1.5 oppure 500)');
      return;
    }
    try {
      await db.harvests.add({
        plantId: parseInt(plantId),
        quantity: quantityNum,
        unit,
        date: new Date(date),
        notes: notes.trim() || undefined,
      });
      const plant = plants?.find(p => p.id === parseInt(plantId));
      toast.success(`Raccolta registrata: ${quantityNum} ${unit} di ${plant?.name || 'pianta'}`);
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error('Errore nel salvataggio');
      console.error(err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registra Raccolta</DialogTitle>
          <DialogDescription>Aggiungi una nuova raccolta alle statistiche</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Pianta *</Label>
            <Select value={plantId} onValueChange={setPlantId}>
              <SelectTrigger><SelectValue placeholder="Seleziona pianta..." /></SelectTrigger>
              <SelectContent>
                {plants?.map(p => (
                  <SelectItem key={p.id} value={p.id!.toString()}>
                    {p.name}{p.variety ? ` (${p.variety})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="harvest-qty">Quantita *</Label>
              <Input
                id="harvest-qty"
                type="text"
                inputMode="decimal"
                placeholder="es: 1.5 oppure 500"
                value={quantityStr}
                onChange={e => setQuantityStr(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Unita *</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="harvest-date">Data raccolta *</Label>
            <Input id="harvest-date" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="harvest-notes">Note</Label>
            <Textarea id="harvest-notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Qualita, osservazioni..." rows={2} />
          </div>

          <DialogFooter className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => { reset(); onOpenChange(false); }}>Annulla</Button>
            <Button type="submit">Registra raccolta</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
