import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { db, type GardenLayout, type GardenCell, type Plant } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Map as MapIcon, ArrowLeft, Plus, Minus, Trash2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const PALETTE = ['#a7f3d0', '#fde68a', '#fbcfe8', '#bfdbfe', '#fecaca', '#ddd6fe', '#fed7aa', '#bbf7d0'];
const CATEGORY_ICON: Record<Plant['category'], string> = {
  vegetables: '🥦', fruits: '🍓', herbs: '🌿', flowers: '🌸', trees: '🌳',
};

export default function GardenPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const layout = useLiveQuery(() => db.gardenLayout.toArray().then(a => a[0]));
  const plants = useLiveQuery(() => db.plants.toArray()) ?? [];

  const [selectedCell, setSelectedCell] = useState<{ x: number; y: number } | null>(null);
  const [labelInput, setLabelInput] = useState('');
  const [plantInput, setPlantInput] = useState<string>('none');
  const [colorInput, setColorInput] = useState<string>('');

  // Inizializza layout di default se non esiste
  useEffect(() => {
    (async () => {
      const existing = await db.gardenLayout.toArray();
      if (existing.length === 0) {
        await db.gardenLayout.add({ gridWidth: 6, gridHeight: 6, cells: [] });
      }
    })();
  }, []);

  const cellMap = useMemo(() => {
    const m = new Map<string, GardenCell>();
    (layout?.cells ?? []).forEach(c => m.set(`${c.x},${c.y}`, c));
    return m;
  }, [layout]);

  const plantById = useMemo(() => {
    const m = new Map<number, Plant>();
    plants.forEach(p => { if (p.id) m.set(p.id, p); });
    return m;
  }, [plants]);

  if (!layout) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">{t('common.loading')}</p>
      </div>
    );
  }

  const updateLayout = async (changes: Partial<GardenLayout>) => {
    if (!layout.id) return;
    await db.gardenLayout.update(layout.id, changes);
  };

  const updateCells = async (cells: GardenCell[]) => {
    if (!layout.id) return;
    await db.gardenLayout.update(layout.id, { cells });
  };

  const handleCellClick = (x: number, y: number) => {
    const existing = cellMap.get(`${x},${y}`);
    setLabelInput(existing?.label ?? '');
    setPlantInput(existing?.plantId ? String(existing.plantId) : 'none');
    setColorInput(existing?.color ?? '');
    setSelectedCell({ x, y });
  };

  const handleSaveCell = async () => {
    if (!selectedCell) return;
    const others = (layout.cells ?? []).filter(c => !(c.x === selectedCell.x && c.y === selectedCell.y));
    const plantId = plantInput !== 'none' ? parseInt(plantInput) : undefined;
    const label = labelInput.trim() || undefined;
    const color = colorInput || undefined;
    if (!plantId && !label && !color) {
      // cella vuota: rimuovi
      await updateCells(others);
    } else {
      await updateCells([...others, { x: selectedCell.x, y: selectedCell.y, plantId, label, color }]);
    }
    setSelectedCell(null);
    toast.success(t('garden.cell_saved'));
  };

  const handleClearCell = async () => {
    if (!selectedCell) return;
    const others = (layout.cells ?? []).filter(c => !(c.x === selectedCell.x && c.y === selectedCell.y));
    await updateCells(others);
    setSelectedCell(null);
    toast.success(t('garden.cell_cleared'));
  };

  const resizeGrid = async (deltaW: number, deltaH: number) => {
    const newW = Math.max(2, Math.min(12, layout.gridWidth + deltaW));
    const newH = Math.max(2, Math.min(12, layout.gridHeight + deltaH));
    const filtered = layout.cells.filter(c => c.x < newW && c.y < newH);
    await updateLayout({ gridWidth: newW, gridHeight: newH, cells: filtered });
  };

  const handleResetAll = async () => {
    if (!confirm(t('garden.reset_confirm'))) return;
    await updateCells([]);
    toast.success(t('garden.reset_done'));
  };

  // Auto-popola con piante esistenti non ancora posizionate
  const handleAutoFill = async () => {
    const placedIds = new Set((layout.cells ?? []).map(c => c.plantId).filter(Boolean) as number[]);
    const toPlace = plants.filter(p => p.id && !placedIds.has(p.id));
    if (toPlace.length === 0) {
      toast.info(t('garden.nothing_to_place'));
      return;
    }
    const occupied = new Set((layout.cells ?? []).map(c => `${c.x},${c.y}`));
    const newCells: GardenCell[] = [...layout.cells];
    let placed = 0;
    for (let y = 0; y < layout.gridHeight && placed < toPlace.length; y++) {
      for (let x = 0; x < layout.gridWidth && placed < toPlace.length; x++) {
        if (occupied.has(`${x},${y}`)) continue;
        const plant = toPlace[placed];
        newCells.push({ x, y, plantId: plant.id! });
        occupied.add(`${x},${y}`);
        placed++;
      }
    }
    await updateCells(newCells);
    toast.success(t('garden.auto_placed', { count: placed }));
  };

  const renderCell = (x: number, y: number) => {
    const cell = cellMap.get(`${x},${y}`);
    const plant = cell?.plantId ? plantById.get(cell.plantId) : undefined;
    const bg = cell?.color ?? (plant ? '#dcfce7' : '#f9fafb');

    return (
      <button
        key={`${x},${y}`}
        type="button"
        onClick={() => handleCellClick(x, y)}
        className="aspect-square border border-gray-200 rounded-lg flex flex-col items-center justify-center text-[10px] sm:text-xs leading-tight overflow-hidden p-1 hover:ring-2 hover:ring-garden-leaf transition-all"
        style={{ background: bg }}
        title={plant?.name ?? cell?.label ?? `${x + 1},${y + 1}`}
      >
        {plant ? (
          <>
            <span className="text-base">{CATEGORY_ICON[plant.category]}</span>
            <span className="font-medium text-gray-700 truncate w-full text-center">{plant.name}</span>
          </>
        ) : cell?.label ? (
          <span className="font-medium text-gray-700 truncate w-full text-center">{cell.label}</span>
        ) : (
          <span className="text-gray-300 text-[10px]">+</span>
        )}
      </button>
    );
  };

  const rows: number[] = Array.from({ length: layout.gridHeight }, (_, i) => i);
  const cols: number[] = Array.from({ length: layout.gridWidth }, (_, i) => i);

  return (
    <div className="min-h-screen bg-gradient-to-b from-garden-cream to-white dark:from-gray-900 dark:to-gray-800 pb-24">
      <div className="bg-gradient-to-r from-garden-sage to-garden-leaf text-white p-6 rounded-b-3xl shadow-elevated">
        <div className="flex items-center gap-3 mb-2">
          <Button
            size="icon"
            variant="ghost"
            className="text-white hover:bg-white/20"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <MapIcon className="w-7 h-7" />
          <div>
            <h1 className="text-2xl font-bold">{t('garden.title')}</h1>
            <p className="text-green-100 text-sm">{t('garden.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="px-4 mt-6 space-y-4">
        {/* Controlli dimensione */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{t('garden.grid_size')}</p>
                <p className="text-xs text-muted-foreground">
                  {layout.gridWidth} × {layout.gridHeight} {t('garden.cells')}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-muted-foreground text-center">W</span>
                  <div className="flex">
                    <Button size="icon" variant="outline" className="h-7 w-7 rounded-r-none" onClick={() => resizeGrid(-1, 0)}>
                      <Minus className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="outline" className="h-7 w-7 rounded-l-none border-l-0" onClick={() => resizeGrid(1, 0)}>
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-muted-foreground text-center">H</span>
                  <div className="flex">
                    <Button size="icon" variant="outline" className="h-7 w-7 rounded-r-none" onClick={() => resizeGrid(0, -1)}>
                      <Minus className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="outline" className="h-7 w-7 rounded-l-none border-l-0" onClick={() => resizeGrid(0, 1)}>
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <Button size="sm" variant="outline" className="flex-1" onClick={handleAutoFill}>
                <Sparkles className="w-4 h-4 mr-1" />
                {t('garden.auto_fill')}
              </Button>
              <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={handleResetAll}>
                <Trash2 className="w-4 h-4 mr-1" />
                {t('garden.reset')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Griglia */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-3">
            <div
              className="grid gap-1"
              style={{ gridTemplateColumns: `repeat(${layout.gridWidth}, minmax(0, 1fr))` }}
            >
              {rows.flatMap(y => cols.map(x => renderCell(x, y)))}
            </div>
          </CardContent>
        </Card>

        {/* Legenda */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4">
            <p className="text-sm font-semibold mb-2 dark:text-white">{t('garden.legend')}</p>
            <p className="text-xs text-muted-foreground">{t('garden.legend_hint')}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                🥦 {t('garden.placed')}: {(layout.cells ?? []).filter(c => c.plantId).length}
              </Badge>
              <Badge variant="outline" className="bg-gray-50 text-gray-600">
                {t('garden.empty')}: {layout.gridWidth * layout.gridHeight - (layout.cells?.length ?? 0)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog assegnazione cella */}
      <Dialog open={selectedCell !== null} onOpenChange={(o) => !o && setSelectedCell(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t('garden.cell_title', { x: (selectedCell?.x ?? 0) + 1, y: (selectedCell?.y ?? 0) + 1 })}
            </DialogTitle>
            <DialogDescription>{t('garden.cell_desc')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('garden.plant')}</Label>
              <Select value={plantInput} onValueChange={setPlantInput}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— {t('garden.no_plant')} —</SelectItem>
                  {plants.map(p => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {CATEGORY_ICON[p.category]} {p.name}{p.variety ? ` (${p.variety})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cell-label">{t('garden.label')}</Label>
              <Input
                id="cell-label"
                value={labelInput}
                onChange={e => setLabelInput(e.target.value)}
                placeholder={t('garden.label_ph')}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('garden.zone_color')}</Label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setColorInput('')}
                  className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center text-xs ${colorInput === '' ? 'border-garden-leaf' : 'border-gray-200'}`}
                  style={{ background: '#f9fafb' }}
                  title={t('garden.no_color')}
                >
                  ✕
                </button>
                {PALETTE.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColorInput(c)}
                    className={`w-8 h-8 rounded-lg border-2 ${colorInput === c ? 'border-garden-leaf' : 'border-gray-200'}`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" className="text-red-600 border-red-200" onClick={handleClearCell}>
              <Trash2 className="w-4 h-4 mr-1" />
              {t('garden.clear')}
            </Button>
            <Button variant="outline" onClick={() => setSelectedCell(null)}>{t('common.cancel')}</Button>
            <Button onClick={handleSaveCell}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
