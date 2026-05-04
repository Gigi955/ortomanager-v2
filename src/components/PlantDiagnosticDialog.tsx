import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, ImagePlus, X, Loader2, AlertTriangle, Stethoscope } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface PlantDiagnosticDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKey: string;
  plantName?: string;
}

interface DiagnosticResult {
  disease: string;
  confidence: string;
  symptoms: string;
  treatment: string;
  prevention: string;
  urgency: 'bassa' | 'media' | 'alta';
}

export default function PlantDiagnosticDialog({
  open,
  onOpenChange,
  apiKey,
  plantName,
}: PlantDiagnosticDialogProps) {
  const { t } = useTranslation();
  const [imageData, setImageData] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [rawError, setRawError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error(t('dialogs.editPlant.error_image'));
      return;
    }
    // Resize se necessario (max ~1MB per l'API)
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX = 1024;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
        else { width = Math.round((width * MAX) / height); height = MAX; }
      }
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      setImageData(canvas.toDataURL('image/jpeg', 0.85));
      setResult(null);
      setRawError(null);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const handleGalleryPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
    e.target.value = '';
  };

  const handleAnalyze = async () => {
    if (!imageData) { toast.error(t('dialogs.diagnostic.no_photo')); return; }
    if (!apiKey) { toast.error(t('dialogs.diagnostic.no_key')); return; }

    setIsAnalyzing(true);
    setRawError(null);

    try {
      // Estrai base64 puro (rimuovi prefisso data:image/...;base64,)
      const base64 = imageData.split(',')[1];
      const mediaType = imageData.split(';')[0].split(':')[1] as 'image/jpeg' | 'image/png' | 'image/webp';

      const prompt = `Sei un agronomo esperto. Analizza questa foto di una pianta${plantName ? ` (${plantName})` : ''} e diagnostica eventuali malattie, parassiti o carenze nutrizionali.

Rispondi ESCLUSIVAMENTE in questo formato JSON (senza markdown, senza commenti):
{
  "disease": "nome della malattia/problema rilevato",
  "confidence": "bassa/media/alta",
  "symptoms": "descrizione breve dei sintomi visibili",
  "treatment": "come trattare il problema (metodi naturali e/o chimici)",
  "prevention": "come prevenire in futuro",
  "urgency": "bassa/media/alta"
}

Se la pianta sembra sana, usa disease: "Pianta sana" e urgency: "bassa".
Rispondi solo in italiano.`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-opus-4-5',
          max_tokens: 512,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: { type: 'base64', media_type: mediaType, data: base64 },
                },
                { type: 'text', text: prompt },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`API error ${response.status}: ${errBody}`);
      }

      const data = await response.json();
      const text = data.content?.[0]?.text ?? '';

      // Cerca il JSON nella risposta
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error(t('dialogs.diagnostic.invalid_response'));

      const parsed: DiagnosticResult = JSON.parse(jsonMatch[0]);
      setResult(parsed);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setRawError(msg);
      toast.error(t('dialogs.diagnostic.error_analysis'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClose = () => {
    setImageData(null);
    setResult(null);
    setRawError(null);
    onOpenChange(false);
  };

  const urgencyColor = {
    bassa: 'bg-green-100 text-green-800 border-green-200',
    media: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    alta: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-green-600" />
            {t('dialogs.diagnostic.title')}
          </DialogTitle>
          <DialogDescription>
            {t('dialogs.diagnostic.desc')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Foto */}
          {imageData ? (
            <div className="relative">
              <img
                src={imageData}
                alt="Foto da analizzare"
                className="w-full h-48 object-cover rounded-xl border border-gray-200"
              />
              {!isAnalyzing && (
                <button
                  onClick={() => { setImageData(null); setResult(null); }}
                  className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 flex flex-col items-center justify-center gap-2 py-6 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-garden-leaf hover:text-garden-leaf transition-colors"
              >
                <Camera className="w-6 h-6" />
                {t('dialogs.diagnostic.take_photo')}
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex flex-col items-center justify-center gap-2 py-6 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-garden-leaf hover:text-garden-leaf transition-colors"
              >
                <ImagePlus className="w-6 h-6" />
                {t('dialogs.diagnostic.from_gallery')}
              </button>
            </div>
          )}

          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleGalleryPick} />
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleGalleryPick} />

          {/* Bottone analisi */}
          {imageData && !result && (
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full"
            >
              {isAnalyzing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('dialogs.diagnostic.analyzing')}</>
              ) : (
                <><Stethoscope className="w-4 h-4 mr-2" />{t('dialogs.diagnostic.analyze')}</>
              )}
            </Button>
          )}

          {/* Errore */}
          {rawError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-800">{t('dialogs.diagnostic.error_title')}</p>
                  <p className="text-xs text-red-700 mt-1">{rawError}</p>
                  {rawError.includes('401') && (
                    <p className="text-xs text-red-600 mt-1">
                      {t('dialogs.diagnostic.error_api_key')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Risultato */}
          {result && (
            <div className="space-y-3">
              <div className={`p-3 rounded-xl border ${urgencyColor[result.urgency] || urgencyColor.bassa}`}>
                <div className="flex items-center justify-between mb-1">
                  <p className="font-bold text-sm">{result.disease}</p>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/50">
                    {t('dialogs.diagnostic.urgency', { level: result.urgency })}
                  </span>
                </div>
                <p className="text-xs">{t('dialogs.diagnostic.confidence', { level: result.confidence })}</p>
              </div>

              <div className="space-y-2">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-xs font-semibold text-amber-800 mb-1">{t('dialogs.diagnostic.symptoms')}</p>
                  <p className="text-xs text-amber-900">{result.symptoms}</p>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-xs font-semibold text-blue-800 mb-1">{t('dialogs.diagnostic.treatment')}</p>
                  <p className="text-xs text-blue-900">{result.treatment}</p>
                </div>
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-xs font-semibold text-green-800 mb-1">{t('dialogs.diagnostic.prevention')}</p>
                  <p className="text-xs text-green-900">{result.prevention}</p>
                </div>
              </div>

              <Button variant="outline" className="w-full" onClick={() => { setResult(null); setImageData(null); }}>
                {t('dialogs.diagnostic.new_diagnosis')}
              </Button>
            </div>
          )}

          {!apiKey && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  {t('dialogs.diagnostic.no_api_key')}
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
