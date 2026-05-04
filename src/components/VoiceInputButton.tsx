import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { toast } from 'sonner';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
  size?: 'icon' | 'sm';
  /** Modalità: replace = sostituisce, append = aggiunge a quello esistente (con spazio) */
  mode?: 'replace' | 'append';
  currentValue?: string;
}

export default function VoiceInputButton({
  onTranscript, className, size = 'icon', mode = 'append', currentValue,
}: VoiceInputButtonProps) {
  const { t, i18n } = useTranslation();
  const lang = `${i18n.language?.split('-')[0] || 'it'}-${(i18n.language?.split('-')[0] || 'it').toUpperCase()}`;
  const { supported, listening, transcript, error, start, stop } = useSpeechRecognition({ lang });

  // Quando il riconoscimento finisce (listening passa a false), spedisci il transcript finale
  useEffect(() => {
    if (!listening && transcript) {
      const finalText = mode === 'append' && currentValue
        ? `${currentValue.trim()} ${transcript}`.trim()
        : transcript;
      onTranscript(finalText);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listening]);

  useEffect(() => {
    if (error === 'not-allowed') {
      toast.error(t('voice.error_permission'));
    } else if (error && error !== 'aborted' && error !== 'no-speech') {
      toast.error(t('voice.error_generic', { error }));
    }
  }, [error, t]);

  if (!supported) return null;

  return (
    <Button
      type="button"
      size={size}
      variant={listening ? 'destructive' : 'outline'}
      className={`${listening ? 'animate-pulse' : ''} ${className ?? ''}`}
      onClick={() => listening ? stop() : start()}
      title={listening ? t('voice.stop') : t('voice.start')}
    >
      {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
    </Button>
  );
}
