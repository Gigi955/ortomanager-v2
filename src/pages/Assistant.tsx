import { useEffect, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { db } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, ArrowLeft, Send, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { getCurrentSeason, getSeasonName } from '@/lib/utils';
import VoiceInputButton from '@/components/VoiceInputButton';

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_PROMPTS_IT = [
  'Cosa posso piantare in questo periodo?',
  'Come curare le mie piante in questa stagione?',
  'Suggerisci consociazioni per il mio orto',
  'Quali parassiti cercare ora?',
];

export default function AssistantPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const settings = useLiveQuery(() => db.settings.toArray().then(s => s[0]));
  const plants = useLiveQuery(() => db.plants.toArray()) ?? [];
  const tasks = useLiveQuery(() => db.tasks.filter(t => !t.completed).toArray()) ?? [];

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const lang = i18n.language?.split('-')[0] || 'it';

  const systemPrompt = useMemo(() => {
    const season = t(getSeasonName(getCurrentSeason()));
    const today = new Date().toLocaleDateString(lang);
    const plantsList = plants.length === 0
      ? '(nessuna pianta registrata)'
      : plants.map(p => {
          const planted = new Date(p.plantedDate).toLocaleDateString(lang);
          return `- ${p.name}${p.variety ? ` (${p.variety})` : ''} · ${p.location} · piantata ${planted} · stato: ${p.status} · annaffiare ogni ${p.wateringFrequency}gg`;
        }).join('\n');
    const tasksList = tasks.length === 0
      ? '(nessuna attività in sospeso)'
      : tasks.slice(0, 10).map(t => `- ${t.title} (${t.category}, ${new Date(t.dueDate).toLocaleDateString(lang)})`).join('\n');
    const city = settings?.city ?? 'non specificata';

    return `Sei l'assistente AI di OrtoManager, un'app per la gestione dell'orto domestico. Aiuti l'utente con consigli pratici di coltivazione: semina, irrigazione, concimazione, potatura, malattie, parassiti, consociazioni, raccolto e ricette.

Rispondi in modo conciso (massimo 3-4 paragrafi corti, usa elenchi puntati quando utile). Sii pratico, evita risposte generiche. Adatta il consiglio al contesto dell'utente qui sotto.

CONTESTO UTENTE
Data: ${today}
Stagione: ${season}
Località: ${city}

PIANTE NELL'ORTO:
${plantsList}

ATTIVITÀ IN SOSPESO:
${tasksList}

Rispondi nella lingua dell'utente: ${lang}.`;
  }, [plants, tasks, settings, t, lang]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    if (!settings?.claudeApiKey) {
      setError(t('assistant.error_no_key'));
      return;
    }

    const userMsg: ChatMsg = { role: 'user', content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': settings.claudeApiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          system: systemPrompt,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`API error ${response.status}: ${errBody.slice(0, 200)}`);
      }

      const data = await response.json();
      const assistantText: string = data.content?.[0]?.text ?? '';
      setMessages(prev => [...prev, { role: 'assistant', content: assistantText }]);
    } catch (e) {
      console.error('[assistant]', e);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const hasKey = !!settings?.claudeApiKey;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-garden-cream to-white dark:from-gray-900 dark:to-gray-800">
      <div className="bg-gradient-to-r from-garden-sage to-garden-leaf text-white p-5 rounded-b-3xl shadow-elevated">
        <div className="flex items-center gap-3">
          <Button size="icon" variant="ghost" className="text-white hover:bg-white/20" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Bot className="w-7 h-7" />
          <div>
            <h1 className="text-2xl font-bold">{t('assistant.title')}</h1>
            <p className="text-green-100 text-sm">{t('assistant.subtitle')}</p>
          </div>
        </div>
      </div>

      {!hasKey && (
        <div className="px-4 mt-4">
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
            <CardContent className="p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-900 dark:text-amber-100">
                <p className="font-semibold">{t('assistant.no_key_title')}</p>
                <p className="text-xs mt-1">{t('assistant.no_key_desc')}</p>
                <Button size="sm" variant="outline" className="mt-2 border-amber-300" onClick={() => navigate('/altro')}>
                  {t('assistant.go_to_settings')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div ref={scrollerRef} className="flex-1 overflow-y-auto px-4 mt-4 pb-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 text-garden-leaf mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground mb-4">{t('assistant.empty_hint')}</p>
            <div className="flex flex-col gap-2 max-w-xs mx-auto">
              {QUICK_PROMPTS_IT.map(p => (
                <Button
                  key={p}
                  variant="outline"
                  size="sm"
                  className="text-xs justify-start text-left h-auto py-2"
                  disabled={!hasKey}
                  onClick={() => send(p)}
                >
                  {p}
                </Button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap leading-snug ${
                m.role === 'user'
                  ? 'bg-garden-leaf text-white rounded-br-sm'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-sm'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-3.5 py-2 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-garden-leaf" />
              <span className="text-xs text-muted-foreground">{t('assistant.thinking')}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-start">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 text-red-800 dark:text-red-200 rounded-2xl px-3.5 py-2 text-xs">
              {error}
            </div>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-3">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send(input)}
            placeholder={t('assistant.placeholder')}
            disabled={!hasKey || loading}
          />
          <VoiceInputButton currentValue={input} onTranscript={setInput} />
          <Button onClick={() => send(input)} disabled={!hasKey || loading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
