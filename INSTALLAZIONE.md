# 📱 Come Installare OrtoManager sul Telefono

## IMPORTANTE: L'app è pronta!

OrtoManager è una **Progressive Web App (PWA)** che puoi installare sul tuo telefono come un'app nativa. Ecco come fare:

## 🚀 Passaggi per l'Installazione

### 1️⃣ Prima: Pubblica l'App Online

L'app deve essere ospitata su un server web. Puoi usare servizi gratuiti come:

- **Vercel** (consigliato): https://vercel.com
- **Netlify**: https://netlify.com
- **GitHub Pages**: https://pages.github.com

#### Con Vercel (più semplice):

```bash
# Installa Vercel CLI
npm install -g vercel

# Fai il build
npm run build

# Deploy
vercel --prod
```

Vercel ti darà un URL tipo: `https://ortomanager-xxx.vercel.app`

### 2️⃣ Installazione su Android (Chrome/Edge)

1. Apri il link dell'app nel browser Chrome o Edge
2. Tocca il menu (⋮) in alto a destra
3. Seleziona **"Aggiungi a schermata Home"** o **"Installa app"**
4. Conferma toccando **"Installa"**
5. L'app apparirà nella tua home screen! 🎉

### 3️⃣ Installazione su iPhone/iPad (Safari)

1. Apri il link dell'app in **Safari** (deve essere Safari, non Chrome)
2. Tocca il pulsante **Condividi** (quadrato con freccia su) in basso
3. Scorri verso il basso e tocca **"Aggiungi a Home"**
4. Personalizza il nome se vuoi, poi tocca **"Aggiungi"**
5. L'app apparirà nella tua home screen! 🎉

## ✨ Dopo l'Installazione

Dopo aver installato l'app:

- ✅ Si aprirà a schermo intero come un'app nativa
- ✅ Avrà la sua icona personalizzata
- ✅ Funzionerà anche offline!
- ✅ I tuoi dati saranno salvati localmente sul telefono
- ✅ Riceverai aggiornamenti automatici quando disponibili

## 🎯 Funzionalità dell'App

### 🏠 Home
Dashboard con panoramica del tuo orto:
- Numero di piante attive
- Piante da annaffiare
- Task di oggi
- Attività urgenti

### 🌱 Piante
Gestisci tutte le tue piante:
- Aggiungi nuove piante
- Monitora lo stato di crescita
- Traccia l'irrigazione
- Prendi note personalizzate

### 📅 Calendario
Organizza i lavori dell'orto:
- Crea task con scadenze
- Imposta priorità
- Completa le attività
- Vista raggruppata per data

### 👨‍🍳 Ricette
Ricette con i prodotti del tuo orto:
- Ricette di stagione
- Filtri per difficoltà
- Lista ingredienti
- Istruzioni passo-passo

## 💡 Consigli per l'Uso

1. **Usa l'app installata**: Dopo l'installazione, usa sempre l'icona dalla home screen, non il browser
2. **Permetti le notifiche**: Per ricevere promemoria sui task
3. **Backup regolari**: I dati sono sul tuo dispositivo, considera di esportarli periodicamente
4. **Aggiorna regolarmente**: L'app si aggiorna automaticamente, ma riavviala ogni tanto

## 🔧 Sviluppo Locale

Se vuoi testare l'app sul tuo computer prima di pubblicarla:

```bash
# Installa le dipendenze
npm install

# Avvia il server di sviluppo
npm run dev

# Apri http://localhost:8080 nel browser
```

## 📦 Build per Produzione

```bash
# Crea la versione ottimizzata
npm run build

# La cartella 'dist' conterrà l'app pronta per il deploy
```

## 🆘 Problemi Comuni

### "Non vedo il pulsante Installa"
- Assicurati di usare Chrome/Edge su Android o Safari su iOS
- Controlla che l'app sia servita tramite HTTPS
- Prova a ricaricare la pagina

### "I dati non si salvano"
- Controlla le impostazioni del browser per i cookies/storage
- Assicurati di non essere in modalità incognito
- Verifica di avere spazio sufficiente sul dispositivo

### "L'app non funziona offline"
- La prima volta devi essere online per scaricare l'app
- Dopo il primo accesso, tutto funzionerà offline

## 🎨 Personalizzazione

Vuoi personalizzare l'app? Modifica:

- **Colori**: `src/index.css` (variabili CSS)
- **Icone**: `public/icon.svg`
- **Nome**: `public/manifest.json`
- **Dati iniziali**: `src/lib/db.ts` (funzione seedDatabase)

## 📧 Supporto

Hai domande o problemi? 
- Controlla la documentazione nel README.md
- Apri una issue su GitHub
- Consulta la community

---

**Buon giardinaggio con OrtoManager! 🌱🌻🍅**
