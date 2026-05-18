import { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Harvest } from '@/lib/db';
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
import { HARVEST_UNITS } from './AddHarvestDialog';

interface EditHarvestDialogProps {
  harvest: Harvest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditHarvestDialog({ harvest, open, onOpenChange }: EditHarvestDialogProps) {
  const plants = useLiveQuery(() => db.plants.toArray());

  const [quantityStr, setQuantityStr] = useState<string>('');
  const [unit, setUnit] = useState('kg');
  const [priceStr, setPriceStr] = useState<string>('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (harvest && open) {
      setQuantityStr(String(harvest.quantity));
      setUnit(harvest.unit);
      setPriceStr(harvest.price != null ? String(harvest.price) : '');
      const d = harvest.date instanceof Date ? harvest.date : new Date(harvest.date);
      setDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
      setNotes(harvest.notes ?? '');
    }
  }, [harvest, open]);

  const parsedQuantity = useMemo(() => {
    const n = parseFloat(quantityStr.replace(',', '.'));
    return isNaN(n) || n <= 0 ? null : n;
  }, [quantityStr]);

  const parsedPrice = useMemo(() => {
    const n = parseFloat(priceStr.replace(',', '.'));
    return isNaN(n) || n < 0 ? null : n;
  }, [priceStr]);

  const total = parsedQuantity !== null && parsedPrice !== null ? parsedQuantity * parsedPrice : null;

  const plantName = useMemo(() => {
    if (!harvest) return '';
    const p = plants?.find(pl => pl.id === harvest.plantId);
    if (!p) return 'Pianta rimossa';
    return p.variety ? `${p.name} (${p.variety})` : p.name;
  }, [harvest, plants]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!harvest?.id) return;
    if (parsedQuantity === null) {
      toast.error('Inserisci una quantita valida (es: 1.5 oppure 500)');
      return;
    }
    if (parsedPrice === null || parsedPrice <= 0) {
      toast.error('Inserisci un prezzo unitario valido (es: 2.50)');
      return;
    }
    try {
      await db.harvests.update(harvest.id, {
        quantity: parsedQuantity,
        unit,
        price: parsedPrice,
        date: new Date(date),
        notes: notes.trim() || undefined,
      });
      toast.success('Raccolta aggiornata');
      onOpenChange(false);
    } catch (err) {
      toast.error('Errore nel salvataggio');
      console.error(err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Modifica Raccolta</DialogTitle>
          <DialogDescription>Aggiorna i dati di una raccolta esistente</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Pianta</Label>
            <div className="px-3 py-2 rounded-md border bg-gray-50 dark:bg-gray-800 text-sm dark:text-gray-200">
              {plantName}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-harvest-qty">Quantita *</Label>
              <Input
                id="edit-harvest-qty"
                type="text"
                inputMode="decimal"
                value={quantityStr}
                onChange={e => setQuantityStr(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Unita *</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {HARVEST_UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-harvest-price">Prezzo unitario (€ / {unit}) *</Label>
            <Input
              id="edit-harvest-price"
              type="text"
              inputMode="decimal"
              placeholder="es: 2.50"
              value={priceStr}
              onChange={e => setPriceStr(e.target.value)}
            />
            {total !== null && (
              <p className="text-sm font-medium text-garden-leaf">
                Totale: € {total.toFixed(2)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-harvest-date">Data raccolta *</Label>
            <Input id="edit-harvest-date" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-harvest-notes">Note</Label>
            <Textarea id="edit-harvest-notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Qualita, osservazioni..." rows={2} />
          </div>

          <DialogFooter className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
            <Button type="submit">Salva modifiche</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
