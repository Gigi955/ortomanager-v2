import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown, ChevronUp, ChevronLeft,
  Home, Leaf, Calendar, ChefHat, BarChart2, Settings,
  Plus, Search, Camera, Stethoscope, CheckCircle2,
  Bell, Sun, Download, Bot, MapPin, BookOpen,
  Circle, Trash2, Heart, Pencil, Star,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

interface Section {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  color: string;
  content: React.ReactNode;
}

function TipBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-garden-leaf/10 border border-garden-leaf/20 rounded-xl p-3 mt-3">
      <p className="text-sm text-garden-leaf font-medium">{children}</p>
    </div>
  );
}

function Step({ num, text }: { num: number; text: string }) {
  return (
    <div className="flex items-start gap-3 py-1.5">
      <div className="w-6 h-6 rounded-full bg-garden-leaf text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
        {num}
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-300">{text}</p>
    </div>
  );
}

function BulletItem({ icon, text }: { icon?: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-2 py-1">
      <span className="text-garden-leaf shrink-0 mt-0.5">{icon || <Circle className="w-3 h-3 mt-1" />}</span>
      <p className="text-sm text-gray-700 dark:text-gray-300">{text}</p>
    </div>
  );
}

export default function GuidePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [openSection, setOpenSection] = useState<string | null>('home');

  const toggle = (id: string) => setOpenSection(prev => prev === id ? null : id);

  const sections: Section[] = [
    {
      id: 'home',
      icon: <Home className="w-5 h-5" />,
      title: t('guide.home_title'),
      subtitle: t('guide.home_desc'),
      color: 'text-green-600',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            La Home è il punto di partenza dell&apos;app: mostra un riepilogo rapido di tutto quello che succede nel tuo orto.
          </p>

          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Riquadri statistiche rapide</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Piante attive', desc: 'In crescita, fioritura o fruttificazione' },
                { label: 'Da annaffiare', desc: 'Piante che richiedono irrigazione oggi' },
                { label: 'Task oggi', desc: 'Attività pianificate per la giornata' },
                { label: 'Task urgenti', desc: 'Attività con priorità alta' },
              ].map(item => (
                <div key={item.label} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-2.5">
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{item.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Sezioni della Home</p>
            <BulletItem icon={<CheckCircle2 className="w-3.5 h-3.5" />} text="Task da completare: mostra i prossimi 3 task in scadenza. Tocca il cerchio per marcarli completati." />
            <BulletItem icon={<Leaf className="w-3.5 h-3.5" />} text="Le tue piante: le ultime 3 piante aggiunte con stato e note principali." />
            <BulletItem icon={<ChefHat className="w-3.5 h-3.5" />} text="Ricette di stagione: suggerimenti culinari in base al periodo dell'anno." />
          </div>

          <TipBox>Il saluto cambia automaticamente in base all&apos;orario: Buongiorno, Buon pomeriggio o Buonasera.</TipBox>
        </div>
      ),
    },
    {
      id: 'piante',
      icon: <Leaf className="w-5 h-5" />,
      title: t('guide.plants_title'),
      subtitle: t('guide.plants_desc'),
      color: 'text-green-700',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            La sezione Piante è il cuore dell&apos;app. Qui tieni traccia di tutte le coltivazioni, le loro condizioni e la loro storia.
          </p>

          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Aggiungere una pianta</p>
            <Step num={1} text="Tocca il pulsante + verde in alto a destra" />
            <Step num={2} text="Inserisci nome, varietà e categoria (verdura, frutto, erba, fiore, altro)" />
            <Step num={3} text="Imposta la data di semina/trapianto" />
            <Step num={4} text="Aggiungi ubicazione (es: orto nord, vaso terrazzo) e frequenza irrigazione" />
            <Step num={5} text="Opzionale: scatta o carica una foto e aggiungi note personali" />
            <Step num={6} text="Tocca Salva" />
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Stato della pianta</p>
            <div className="space-y-1">
              {[
                { badge: 'In crescita', color: 'bg-green-100 text-green-800', desc: 'Pianta sana e in fase vegetativa' },
                { badge: 'In fioritura', color: 'bg-yellow-100 text-yellow-800', desc: 'Sta producendo fiori' },
                { badge: 'Fruttificazione', color: 'bg-orange-100 text-orange-800', desc: 'Sta producendo frutti o ortaggi' },
                { badge: 'Dormiente', color: 'bg-gray-100 text-gray-800', desc: 'In riposo invernale o stagionale' },
                { badge: 'Morta', color: 'bg-red-100 text-red-800', desc: 'Pianta non più attiva' },
              ].map(s => (
                <div key={s.badge} className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.color}`}>{s.badge}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{s.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Foto della pianta</p>
            <BulletItem icon={<Camera className="w-3.5 h-3.5" />} text="Tocca l'icona fotocamera per scattare direttamente con l'app." />
            <BulletItem icon={<Plus className="w-3.5 h-3.5" />} text="Tocca l'icona immagine per scegliere dalla galleria del telefono." />
            <BulletItem text="Puoi aggiungere più foto per una stessa pianta. La prima foto è quella principale." />
            <BulletItem text="Tocca una foto per ingrandirla. Scorri per vedere le altre." />
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Scheda colturale</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tocca il nome della categoria sotto una pianta per vedere la scheda colturale dettagliata con:
              esposizione solare consigliata, tipo di suolo, fertilizzazione, potatura e periodo di semina ideale.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Diagnostica AI</p>
            <BulletItem icon={<Stethoscope className="w-3.5 h-3.5" />} text="Tocca l'icona stetoscopio su una pianta per avviare la diagnostica." />
            <BulletItem text="Scatta o carica una foto della parte malata (foglie, fusto, radici)." />
            <BulletItem text="L'AI analizza la foto e identifica: malattia, sintomi, trattamento consigliato e urgenza." />
            <TipBox>La diagnostica AI richiede una chiave API Anthropic. Configurala in Impostazioni → AI Diagnostica Malattie.</TipBox>
          </div>
        </div>
      ),
    },
    {
      id: 'calendario',
      icon: <Calendar className="w-5 h-5" />,
      title: t('guide.calendar_title'),
      subtitle: t('guide.calendar_desc'),
      color: 'text-blue-600',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Il Calendario ti aiuta a pianificare tutte le attività del tuo orto: irrigazioni, concimazioni, potature, semine e raccolte.
          </p>

          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Vista Calendario (griglia mensile)</p>
            <BulletItem text="Naviga tra i mesi con le frecce sinistra/destra." />
            <BulletItem text="Tocca il nome del mese per scegliere rapidamente mese e anno." />
            <BulletItem icon={<div className="w-3 h-3 rounded-full bg-yellow-400 mt-1" />} text="Punto giallo: ci sono attività in scadenza quel giorno." />
            <BulletItem icon={<div className="w-3 h-3 rounded-full bg-red-500 mt-1" />} text="Punto rosso: ci sono attività già scadute." />
            <BulletItem text="Tocca un giorno per vedere le attività di quella data nella lista sottostante." />
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Vista Lista</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Tocca il tab Lista per vedere tutte le attività raggruppate per scadenza:
            </p>
            <div className="space-y-1">
              {['Scaduti', 'Oggi', 'Domani', 'Questa settimana', 'Questo mese', 'Prossimamente'].map(g => (
                <div key={g} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-garden-leaf" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{g}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Aggiungere un&apos;attività</p>
            <Step num={1} text="Tocca il pulsante + verde in alto a destra" />
            <Step num={2} text="Inserisci il titolo dell'attività (es: 'Annaffia pomodori')" />
            <Step num={3} text="Scegli la categoria: Irrigazione, Concimazione, Potatura, Raccolta, Semina o Altro" />
            <Step num={4} text="Imposta data di scadenza e priorità (Bassa, Media, Alta)" />
            <Step num={5} text="Opzionale: collega l'attività a una pianta specifica e aggiungi note" />
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Gestire le attività</p>
            <BulletItem icon={<Circle className="w-3.5 h-3.5" />} text="Tocca il cerchio a sinistra per marcare un'attività come completata." />
            <BulletItem icon={<Trash2 className="w-3.5 h-3.5" />} text="Tocca l'icona cestino per eliminare un'attività." />
            <BulletItem text="Le attività scadute compaiono con sfondo rosso come promemoria." />
          </div>

          <TipBox>Usa la priorità Alta per le attività urgenti: compariranno nel riquadro in Home.</TipBox>
        </div>
      ),
    },
    {
      id: 'ricette',
      icon: <ChefHat className="w-5 h-5" />,
      title: t('guide.recipes_title'),
      subtitle: t('guide.recipes_desc'),
      color: 'text-orange-600',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            La sezione Ricette raccoglie preparazioni culinarie pensate per valorizzare i prodotti del tuo orto, organizzate per stagione e difficoltà.
          </p>

          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Cercare ricette</p>
            <BulletItem icon={<Search className="w-3.5 h-3.5" />} text="Usa la barra di ricerca in alto per trovare ricette per nome, ingrediente o tag." />
            <BulletItem text="I filtri sotto la ricerca permettono di filtrare per: Tutte, Facili, Medie, Difficili." />
            <BulletItem icon={<Heart className="w-3.5 h-3.5" />} text="Il filtro 'Preferite' mostra solo le ricette che hai salvato come preferite." />
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Leggere una ricetta</p>
            <Step num={1} text="Scorri la lista e trova la ricetta che ti interessa." />
            <Step num={2} text="Tocca 'Visualizza ricetta' per espandere ingredienti e preparazione." />
            <Step num={3} text="La preparazione è mostrata passo dopo passo con numeri progressivi." />
            <Step num={4} text="Tocca 'Nascondi ricetta' per comprimere di nuovo la card." />
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Preferiti e informazioni</p>
            <BulletItem icon={<Heart className="w-3.5 h-3.5" />} text="Tocca l'icona cuore in alto a destra di ogni ricetta per salvarla tra i preferiti." />
            <BulletItem text="Ogni ricetta mostra: tempo di preparazione, tempo di cottura, numero di porzioni e livello di difficoltà." />
            <BulletItem text="I tag stagionali (Primavera, Estate, Autunno, Inverno) indicano quando è più adatta la ricetta." />
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Aggiungere una ricetta</p>
            <Step num={1} text="Tocca il pulsante + in alto a destra." />
            <Step num={2} text="Inserisci titolo, descrizione breve e livello di difficoltà." />
            <Step num={3} text="Aggiungi gli ingredienti (uno per riga)." />
            <Step num={4} text="Descrivi i passi di preparazione (uno per riga)." />
            <Step num={5} text="Imposta tempi, porzioni e stagione di riferimento." />
          </div>

          <TipBox>Le ricette di stagione compaiono anche nella Home per ispirarti ogni giorno.</TipBox>
        </div>
      ),
    },
    {
      id: 'statistiche',
      icon: <BarChart2 className="w-5 h-5" />,
      title: t('guide.stats_title'),
      subtitle: t('guide.stats_desc'),
      color: 'text-purple-600',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            La sezione Statistiche ti permette di tenere un diario dei raccolti e visualizzare l&apos;andamento della tua produzione nel tempo.
          </p>

          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Registrare un raccolto</p>
            <Step num={1} text="Tocca il pulsante + in alto a destra (oppure vai su Altro → Statistiche)." />
            <Step num={2} text="Seleziona la pianta raccolta dal menu a tendina." />
            <Step num={3} text="Inserisci la quantità raccolta nel campo testo (es: 1.5, 500, 2,3)." />
            <Step num={4} text="Scegli l'unità di misura: kg, g, pezzi, mazzi, litri, mazzetti, cassette." />
            <Step num={5} text="Imposta la data del raccolto e aggiungi eventuali note (qualità, osservazioni)." />
            <Step num={6} text="Tocca 'Registra raccolta'." />
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Cosa mostrano le statistiche</p>
            <BulletItem icon={<BarChart2 className="w-3.5 h-3.5" />} text="Grafico mensile: barre che mostrano i raccolti mese per mese, con confronto anno precedente." />
            <BulletItem text="Confronto annuale: totale anno corrente vs anno precedente con percentuale di variazione." />
            <BulletItem icon={<Leaf className="w-3.5 h-3.5" />} text="Totali per pianta: quanti kg (o pezzi) hai raccolto da ogni pianta." />
            <BulletItem text="Ultime 15 raccolte: lista dettagliata con data, quantità e note." />
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Navigare tra gli anni</p>
            <BulletItem text="Usa le frecce accanto all'anno per confrontare i dati anno per anno." />
            <BulletItem icon={<Trash2 className="w-3.5 h-3.5" />} text="Tocca il cestino accanto a un raccolto nella lista per eliminarlo." />
          </div>

          <TipBox>Il grafico converte tutto in kg equivalenti per confrontare unità diverse. Ad esempio: 1000 g = 1 kg, 10 pezzi = ~1 kg.</TipBox>
        </div>
      ),
    },
    {
      id: 'impostazioni',
      icon: <Settings className="w-5 h-5" />,
      title: t('guide.settings_title'),
      subtitle: t('guide.settings_desc'),
      color: 'text-gray-600',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            La sezione Impostazioni si apre toccando &quot;Altro&quot; nella barra di navigazione in basso.
            Da qui puoi personalizzare l&apos;app e gestire i tuoi dati.
          </p>

          <div className="space-y-3">
            <div className="border border-gray-100 dark:border-gray-700 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <MapPin className="w-4 h-4 text-garden-leaf" />
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Posizione</p>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Rileva automaticamente la tua città tramite GPS. Usata per consigli stagionali e meteo. Tocca &quot;Rileva&quot; per aggiornare.
              </p>
            </div>

            <div className="border border-gray-100 dark:border-gray-700 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Bell className="w-4 h-4 text-garden-leaf" />
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Notifiche</p>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Attiva/disattiva le notifiche push per i promemoria di irrigazione e le attività in scadenza.
              </p>
            </div>

            <div className="border border-gray-100 dark:border-gray-700 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Sun className="w-4 h-4 text-garden-leaf" />
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Tema</p>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Scegli tra tre modalità: <strong>Chiaro</strong> (sfondo bianco), <strong>Scuro</strong> (sfondo scuro, risparmia batteria), <strong>Auto</strong> (segue le impostazioni del telefono).
              </p>
            </div>

            <div className="border border-gray-100 dark:border-gray-700 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Star className="w-4 h-4 text-garden-leaf" />
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Dimensione testo</p>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Scegli la dimensione del testo per tutta l&apos;app. Ci sono 4 livelli:
              </p>
              <div className="space-y-1">
                {[
                  { size: 'Normale (16px)', desc: 'Dimensione standard' },
                  { size: 'Grande (18px)', desc: 'Lettura facilitata su schermi piccoli' },
                  { size: 'Extra Grande (20px)', desc: 'Per chi ha difficoltà visive' },
                  { size: 'Massima leggibilità (22px)', desc: 'Per ipovedenti, testo molto grande' },
                ].map(item => (
                  <div key={item.size} className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-garden-leaf mt-1.5 shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>{item.size}</strong>: {item.desc}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                La dimensione si applica a tutto il testo dell&apos;app istantaneamente.
              </p>
            </div>

            <div className="border border-gray-100 dark:border-gray-700 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Bot className="w-4 h-4 text-garden-leaf" />
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">AI Diagnostica Malattie</p>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Per usare la diagnostica AI nelle piante, inserisci qui la tua chiave API Anthropic (formato: sk-ant-...).
              </p>
              <BulletItem text="La chiave è salvata solo sul tuo dispositivo, non viene mai inviata ad altri server." />
              <BulletItem text="Ottieni la tua chiave su console.anthropic.com (richiede registrazione e metodo di pagamento)." />
              <BulletItem text="Costo indicativo: circa 1-3 centesimi per analisi. I nuovi account ricevono circa 5$ di credito gratuito." />
            </div>

            <div className="border border-gray-100 dark:border-gray-700 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Download className="w-4 h-4 text-garden-leaf" />
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Backup e Ripristino</p>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Esporta tutti i tuoi dati (piante, task, raccolti, ricette) in un file JSON per tenerlo al sicuro.
              </p>
              <Step num={1} text="Tocca 'Esporta e Condividi Backup' per salvare o condividere il file." />
              <Step num={2} text="Scegli dove salvarlo: Google Drive, Files, WhatsApp, ecc." />
              <Step num={3} text="Per ripristinare, tocca 'Importa Backup' e seleziona il file salvato in precedenza." />
              <TipBox>Fai un backup regolare, specialmente prima di aggiornare o reinstallare l&apos;app!</TipBox>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-garden-cream to-white dark:from-gray-900 dark:to-gray-800 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-garden-leaf to-garden-sage text-white p-6 rounded-b-3xl shadow-elevated">
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={() => navigate('/altro')}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{t('guide.title')}</h1>
            <p className="text-green-100 text-sm">{t('guide.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Intro */}
      <div className="px-4 mt-4">
        <Card className="dark:bg-gray-800 dark:border-gray-700 mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-garden-leaf shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-white">{t('guide.usage_hint').split('.')[0]}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {t('guide.usage_hint')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sezioni */}
        <div className="space-y-3">
          {sections.map((section, idx) => (
            <Card key={section.id} className="dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
              {/* Header sezione */}
              <button
                className="w-full"
                onClick={() => toggle(section.id)}
              >
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      openSection === section.id
                        ? 'bg-garden-leaf text-white'
                        : 'bg-gray-100 dark:bg-gray-700 ' + section.color
                    }`}>
                      {section.icon}
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-800 dark:text-white text-sm">{section.title}</p>
                        <Badge variant="outline" className="text-xs px-1.5 py-0">{idx + 1}</Badge>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{section.subtitle}</p>
                    </div>
                  </div>
                  <div className={`shrink-0 transition-transform ${openSection === section.id ? 'text-garden-leaf' : 'text-gray-400'}`}>
                    {openSection === section.id
                      ? <ChevronUp className="w-5 h-5" />
                      : <ChevronDown className="w-5 h-5" />
                    }
                  </div>
                </div>
              </button>

              {/* Contenuto espandibile */}
              {openSection === section.id && (
                <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 pt-3">
                  {section.content}
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center pb-4">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {t('guide.footer')}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 rounded-full"
            onClick={() => navigate('/altro')}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            {t('guide.back')}
          </Button>
        </div>
      </div>
    </div>
  );
}
