import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTranslation } from 'react-i18next';
import { db, type Recipe } from '@/lib/db';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Share2, Sprout } from 'lucide-react';
import { sharePayload } from '@/lib/share';
import { toast } from 'sonner';

interface ShoppingListDialogProps {
  recipe: Recipe | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function normalize(s: string): string {
  return s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // rimuove accenti
    .replace(/[0-9]+/g, '') // rimuove numeri/quantità
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function ShoppingListDialog({ recipe, open, onOpenChange }: ShoppingListDialogProps) {
  const { t } = useTranslation();
  const plants = useLiveQuery(() => db.plants.toArray()) ?? [];

  const [selected, setSelected] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (open && recipe) {
      // di default: tutti selezionati eccetto quelli che hai già
      const haveIdx = new Set<number>();
      recipe.ingredients.forEach((ing, i) => {
        const ingNorm = normalize(ing);
        if (plants.some(p => ingNorm.includes(normalize(p.name)))) {
          haveIdx.add(i);
        }
      });
      const initial = new Set<number>();
      recipe.ingredients.forEach((_, i) => {
        if (!haveIdx.has(i)) initial.add(i);
      });
      setSelected(initial);
    }
  }, [open, recipe, plants]);

  const haveByIndex = useMemo(() => {
    const m = new Map<number, string>(); // index → plantName trovata
    if (!recipe) return m;
    recipe.ingredients.forEach((ing, i) => {
      const ingNorm = normalize(ing);
      const match = plants.find(p => p.id && ingNorm.includes(normalize(p.name)));
      if (match) m.set(i, match.name);
    });
    return m;
  }, [recipe, plants]);

  if (!recipe) return null;

  const toggle = (i: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  const buildText = (): string => {
    const lines: string[] = [
      `🛒 ${t('shopping.list_for', { name: recipe.title })}`,
      '',
    ];
    recipe.ingredients.forEach((ing, i) => {
      if (selected.has(i)) lines.push(`☐ ${ing}`);
    });
    const haveList = recipe.ingredients
      .map((ing, i) => ({ ing, i }))
      .filter(x => haveByIndex.has(x.i) && !selected.has(x.i));
    if (haveList.length > 0) {
      lines.push('', `✅ ${t('shopping.already_have')}:`);
      haveList.forEach(x => lines.push(`  ${x.ing} (${haveByIndex.get(x.i)})`));
    }
    lines.push('', '— OrtoManager 🌿');
    return lines.join('\n');
  };

  const handleShare = async () => {
    const ok = await sharePayload({
      title: t('shopping.title'),
      text: buildText(),
    });
    if (ok) toast.success(t('shopping.shared'));
    else toast.error(t('shopping.share_error'));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-garden-leaf" />
            {t('shopping.title')}
          </DialogTitle>
          <DialogDescription>{t('shopping.desc', { name: recipe.title })}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {recipe.ingredients.map((ing, i) => {
            const have = haveByIndex.get(i);
            const isSelected = selected.has(i);
            return (
              <label
                key={i}
                className={`flex items-start gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${
                  isSelected
                    ? 'border-garden-leaf bg-garden-leaf/5'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggle(i)}
                  className="mt-1 w-4 h-4 accent-garden-leaf"
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${isSelected ? '' : 'text-muted-foreground line-through'}`}>{ing}</p>
                  {have && (
                    <Badge variant="outline" className="mt-1 text-[10px] py-0 bg-green-50 text-green-700 border-green-200">
                      <Sprout className="w-3 h-3 mr-1" />
                      {t('shopping.you_have', { name: have })}
                    </Badge>
                  )}
                </div>
              </label>
            );
          })}
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-sm">
          <p className="font-medium dark:text-white mb-1">
            {t('shopping.summary', { count: selected.size, total: recipe.ingredients.length })}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('shopping.summary_hint', { have: haveByIndex.size })}
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.close')}</Button>
          <Button onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-1" />
            {t('shopping.share')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
