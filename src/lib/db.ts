import Dexie, { Table } from 'dexie';

// Malattia/parassita di una pianta
export interface Disease {
  name: string;           // es. "Peronospora"
  symptoms: string;       // come riconoscerla
  treatment: string;      // come curarla
  prevention: string;     // come prevenirla
}

// Database delle piante disponibili
export interface PlantType {
  id?: number;
  name: string;
  scientificName?: string;
  category: 'vegetables' | 'fruits' | 'herbs' | 'flowers' | 'trees';
  description?: string;
  imageUrl?: string;
  wateringFrequency: number; // giorni
  plantingPeriod?: string;
  harvestPeriod?: string;
  // Cura
  soilType?: string;           // tipo di terreno ideale
  sunExposure?: string;        // esposizione al sole
  fertilizing?: string;        // quando e come concimare
  pruning?: string;            // potatura/cimatura
  careNotes?: string;          // note generali di cura
  // Consociazioni
  companionPlants?: string[];  // piante amiche
  enemyPlants?: string[];      // piante nemiche
  // Malattie e parassiti
  diseases?: Disease[];
}

// Piante dell'utente
export interface Plant {
  id?: number;
  plantTypeId?: number; // riferimento al tipo di pianta
  name: string;
  scientificName?: string;
  variety?: string;
  plantedDate: Date; // data di semina/trapianto
  numberOfPlants: number; // N. piante o semi
  location: string;
  notes?: string;
  status: 'seedling' | 'growing' | 'flowering' | 'fruiting' | 'harvested' | 'dormant';
  wateringFrequency: number; // giorni
  lastWatered?: Date;
  imageUrl?: string;
  images?: string[]; // array di foto aggiuntive (base64)
  category: 'vegetables' | 'fruits' | 'herbs' | 'flowers' | 'trees';
}

// Impostazioni dell'app
export interface Settings {
  id?: number;
  city?: string; // città salvata da GPS
  latitude?: number;
  longitude?: number;
  notifications: boolean;
  theme: 'light' | 'dark' | 'auto';
  claudeApiKey?: string; // chiave API Anthropic Claude per diagnostica AI
  reminderHour?: number; // ora (0-23) a cui inviare i promemoria task; default 9
  themePalette?: 'leaf' | 'ocean' | 'sunset' | 'lavender' | 'terracotta';
}

export interface Task {
  id?: number;
  title: string;
  description?: string;
  dueDate: Date;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category: 'watering' | 'fertilizing' | 'pruning' | 'harvesting' | 'planting' | 'other';
  plantId?: number;
  createdAt: Date;
}

export interface Recipe {
  id?: number;
  title: string;
  description?: string;
  ingredients: string[];
  instructions: string[];
  prepTime: number; // minuti
  cookTime: number; // minuti
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  imageUrl?: string;
  relatedPlants: number[]; // IDs delle piante
  tags: string[];
  season: ('spring' | 'summer' | 'autumn' | 'winter')[];
  isFavorite: boolean;
}

export interface Harvest {
  id?: number;
  plantId: number;
  date: Date;
  quantity: number;
  unit: string;
  notes?: string;
}

export type JournalEventType =
  | 'transplant'
  | 'first_flower'
  | 'first_fruit'
  | 'pest'
  | 'disease'
  | 'pruning'
  | 'fertilizing'
  | 'observation'
  | 'other';

export interface Note {
  id?: number;
  title: string;
  content: string;
  date: Date;
  tags: string[];
  plantId?: number;
  eventType?: JournalEventType;
}

// Foto datata di una pianta (timeline di crescita)
export interface PlantPhoto {
  id?: number;
  plantId: number;
  dataUrl: string;       // immagine base64
  date: Date;            // data dello scatto
  note?: string;         // descrizione/osservazione
  stage?: Plant['status']; // stato fenologico al momento dello scatto
}

// Cella della planimetria orto
export interface GardenCell {
  x: number;
  y: number;
  plantId?: number;   // riferimento a Plant
  label?: string;     // etichetta libera (es. "Vasca tomato")
  color?: string;     // colore zona (es. "#a7f3d0")
}

// Planimetria orto (singleton, id=1)
export interface GardenLayout {
  id?: number;
  gridWidth: number;   // numero colonne
  gridHeight: number;  // numero righe
  cells: GardenCell[];
}

// ── Catalogo piante seed data (usato nell'upgrade v6) ──────────────────────
// NOTA: questo array NON contiene 'id' perché Dexie lo assegna automaticamente (++id)
const PLANT_CATALOG_SEED: Omit<PlantType, 'id'>[] = [
  { name: 'Pomodoro', scientificName: 'Solanum lycopersicum', category: 'vegetables', description: 'Ortaggio estivo per eccellenza, versatile in cucina.', wateringFrequency: 2, plantingPeriod: 'Marzo-Maggio (trapianto)', harvestPeriod: 'Luglio-Ottobre', soilType: 'Terreno fertile, ben drenato, pH 6-7', sunExposure: 'Pieno sole (almeno 6-8 ore)', fertilizing: 'Potassio e fosforo alla messa a dimora', pruning: 'Eliminare le femminelle settimanalmente', companionPlants: ['Basilico', 'Carota', 'Prezzemolo', 'Aglio'], enemyPlants: ['Finocchio', 'Cavolo', 'Patata'], diseases: [{ name: 'Peronospora', symptoms: 'Macchie giallo-brune sulle foglie', treatment: 'Poltiglia bordolese ogni 7-10 giorni', prevention: 'Evitare bagnatura fogliare, buona areazione' }, { name: 'Afidi', symptoms: 'Colonie verdi/neri sui germogli', treatment: 'Sapone molle diluito, piretro naturale', prevention: 'Consociazione con basilico' }] },
  { name: 'Zucchina', scientificName: 'Cucurbita pepo', category: 'vegetables', description: 'Ortaggio prolifico, produce abbondantemente. I fiori sono commestibili.', wateringFrequency: 1, plantingPeriod: 'Aprile-Giugno', harvestPeriod: 'Giugno-Settembre', soilType: 'Terreno ricco, ben lavorato, pH 6-7', sunExposure: 'Pieno sole', fertilizing: 'Letame maturo abbondante alla preparazione', pruning: 'Eliminare foglie basali ingiallite', companionPlants: ['Mais', 'Fagiolo', 'Nasturzio', 'Cipolla'], enemyPlants: ['Patata', 'Finocchio'], diseases: [{ name: 'Oidio (mal bianco)', symptoms: 'Polvere bianca farinosa su foglie e steli', treatment: 'Zolfo bagnabile, bicarbonato di potassio', prevention: 'Buona areazione, varietà resistenti' }] },
  { name: 'Melanzana', scientificName: 'Solanum melongena', category: 'vegetables', description: 'Ortaggio estivo che ama il calore. Protagonista della cucina mediterranea.', wateringFrequency: 2, plantingPeriod: 'Aprile-Maggio (trapianto)', harvestPeriod: 'Luglio-Settembre', soilType: 'Terreno profondo, fertile, pH 5.5-6.5', sunExposure: 'Pieno sole, posizione riparata dal vento', fertilizing: 'Concime organico + potassio durante produzione', pruning: 'Cimatura per stimolare rami laterali', companionPlants: ['Basilico', 'Peperone', 'Timo', 'Spinacio'], enemyPlants: ['Finocchio', 'Patata'], diseases: [{ name: 'Afide verde della patata', symptoms: 'Colonie sulle foglie, trasmette virosi', treatment: 'Piretro naturale, sapone insetticidia', prevention: 'Monitoraggio continuo, consociazione con basilico' }] },
  { name: 'Peperone', scientificName: 'Capsicum annuum', category: 'vegetables', description: 'Ortaggio colorato e versatile, dolce o piccante. Ricco di vitamina C.', wateringFrequency: 2, plantingPeriod: 'Aprile-Maggio (trapianto)', harvestPeriod: 'Luglio-Ottobre', soilType: 'Terreno leggero, ricco, ben drenato, pH 6-7', sunExposure: 'Pieno sole, caldo', fertilizing: 'Potassio abbondante in fruttificazione', pruning: 'Cimatura apicale per ramificazione', companionPlants: ['Basilico', 'Carota', 'Cipolla', 'Spinacio'], enemyPlants: ['Finocchio', 'Patata'], diseases: [{ name: 'Marciume apicale', symptoms: 'Macchia bruna-nera all\'apice del frutto', treatment: 'Correggere l\'irrigazione, apportare calcio', prevention: 'Irrigazioni costanti e regolari' }] },
  { name: 'Lattuga', scientificName: 'Lactuca sativa', category: 'vegetables', description: 'Insalata fresca e croccante, a crescita rapida. Ideale per colture scalari.', wateringFrequency: 1, plantingPeriod: 'Marzo-Settembre (semina in successione)', harvestPeriod: 'Aprile-Novembre', soilType: 'Terreno fertile, fresco, umido, pH 6-7', sunExposure: 'Sole pieno in primavera/autunno; mezz\'ombra in estate', fertilizing: 'Concime azotato leggero ogni 2 settimane', pruning: 'Raccogliere foglie esterne per prolungare produzione', companionPlants: ['Carota', 'Ravanello', 'Fragola', 'Cipolla'], enemyPlants: ['Finocchio', 'Prezzemolo'], diseases: [{ name: 'Peronospora della lattuga', symptoms: 'Macchie gialle sulle foglie', treatment: 'Rame, rimuovere foglie colpite', prevention: 'Buona areazione, varietà resistenti' }] },
  { name: 'Carota', scientificName: 'Daucus carota', category: 'vegetables', description: 'Ortaggio da radice ricco di betacarotene. Si coltiva in primavera e autunno.', wateringFrequency: 3, plantingPeriod: 'Febbraio-Aprile e Agosto-Settembre', harvestPeriod: 'Maggio-Giugno e Ottobre-Novembre', soilType: 'Terreno sabbioso, profondo, senza sassi, pH 6-6.8', sunExposure: 'Sole pieno o leggera ombra', fertilizing: 'Concime potassico in pre-semina; evitare azoto', pruning: 'Diradare le piantine a 5 cm di distanza', companionPlants: ['Pomodoro', 'Cipolla', 'Porro', 'Rosmarino'], enemyPlants: ['Aneto', 'Finocchio', 'Prezzemolo'], diseases: [{ name: 'Mosca della carota', symptoms: 'Gallerie rossastre nella radice', treatment: 'Rimuovere le piante colpite', prevention: 'Reti anti-insetto, consociazione con cipolla' }] },
  { name: 'Cipolla', scientificName: 'Allium cepa', category: 'vegetables', description: 'Ortaggio indispensabile in cucina. Si coltiva da seme, bulbillo o piantine.', wateringFrequency: 5, plantingPeriod: 'Febbraio-Marzo (bulbilli)', harvestPeriod: 'Giugno-Luglio', soilType: 'Terreno leggero, fertile, ben drenato, pH 6-7', sunExposure: 'Pieno sole', fertilizing: 'Concime fosfopotassico in pre-impianto', pruning: 'Piegare le foglie quando ingialliscono', companionPlants: ['Carota', 'Lattuga', 'Pomodoro', 'Camomilla'], enemyPlants: ['Fagiolo', 'Pisello', 'Salvia'], diseases: [{ name: 'Peronospora della cipolla', symptoms: 'Efflorescenze violacee sulle foglie', treatment: 'Poltiglia bordolese', prevention: 'Rotazione, evitare bagnatura fogliare' }] },
  { name: 'Aglio', scientificName: 'Allium sativum', category: 'vegetables', description: 'Bulbo aromatico dalle proprietà antibatteriche. Alleato contro molti parassiti.', wateringFrequency: 7, plantingPeriod: 'Ottobre-Novembre (autunnale)', harvestPeriod: 'Giugno-Luglio', soilType: 'Terreno sciolto, leggero, ben drenato, pH 6-7', sunExposure: 'Pieno sole', fertilizing: 'Concime fosfopotassico in pre-impianto', pruning: 'Rimuovere gli scapi fiorali per ingrossare il bulbo', companionPlants: ['Pomodoro', 'Fragola', 'Carota', 'Lattuga'], enemyPlants: ['Fagiolo', 'Pisello'], diseases: [{ name: 'Ruggine dell\'aglio', symptoms: 'Striature arancioni sulle foglie', treatment: 'Zolfo, rame', prevention: 'Rotazione, buona areazione' }] },
  { name: 'Porro', scientificName: 'Allium porrum', category: 'vegetables', description: 'Ortaggio invernale dal sapore delicato, molto resistente al freddo.', wateringFrequency: 4, plantingPeriod: 'Marzo-Aprile (trapianto a Giugno-Luglio)', harvestPeriod: 'Ottobre-Marzo', soilType: 'Terreno profondo, fertile, umido, pH 6-7', sunExposure: 'Sole pieno', fertilizing: 'Concime azotato al trapianto e a metà estate', pruning: 'Rincalzare progressivamente per sbiancare il fusto', companionPlants: ['Carota', 'Sedano', 'Lattuga'], enemyPlants: ['Fagiolo', 'Pisello'], diseases: [{ name: 'Ruggine del porro', symptoms: 'Pustole arancioni allungate sulle foglie', treatment: 'Rame, zolfo', prevention: 'Rotazione, buona areazione' }] },
  { name: 'Fagiolo', scientificName: 'Phaseolus vulgaris', category: 'vegetables', description: 'Leguminosa che arricchisce il suolo di azoto. Varietà nane e rampicanti.', wateringFrequency: 3, plantingPeriod: 'Aprile-Luglio (semina scalare)', harvestPeriod: 'Giugno-Settembre', soilType: 'Terreno leggero, caldo, ben drenato, pH 6-7', sunExposure: 'Pieno sole', fertilizing: 'Poca concimazione azotata', pruning: 'Non necessaria per varietà nane', companionPlants: ['Zucchina', 'Mais', 'Carota', 'Ravanello'], enemyPlants: ['Cipolla', 'Aglio', 'Finocchio'], diseases: [{ name: 'Antracnosi', symptoms: 'Macchie brune-rosse su baccelli e foglie', treatment: 'Rame, rimozione parti colpite', prevention: 'Seme certificato, evitare bagnatura' }] },
  { name: 'Pisello', scientificName: 'Pisum sativum', category: 'vegetables', description: 'Leguminosa primaverile e autunnale. Fissa l\'azoto e migliora il suolo.', wateringFrequency: 4, plantingPeriod: 'Febbraio-Aprile e Settembre-Ottobre', harvestPeriod: 'Aprile-Giugno e Novembre-Dicembre', soilType: 'Terreno fresco, ben drenato, neutro, pH 6-7.5', sunExposure: 'Sole pieno; tollera la mezz\'ombra', fertilizing: 'Poca concimazione azotata', pruning: 'Non necessaria; tutorare le varietà rampicanti', companionPlants: ['Carota', 'Ravanello', 'Spinacio', 'Lattuga'], enemyPlants: ['Cipolla', 'Aglio', 'Finocchio'], diseases: [{ name: 'Oidio del pisello', symptoms: 'Polvere bianca sulle foglie e baccelli', treatment: 'Zolfo bagnabile, bicarbonato', prevention: 'Varietà resistenti, buona areazione' }] },
  { name: 'Spinacio', scientificName: 'Spinacia oleracea', category: 'vegetables', description: 'Ortaggio a foglia ricco di ferro e vitamine. Cresce velocemente in clima fresco.', wateringFrequency: 2, plantingPeriod: 'Febbraio-Aprile e Agosto-Ottobre', harvestPeriod: 'Marzo-Maggio e Settembre-Novembre', soilType: 'Terreno ricco, umido, pH 6.5-7', sunExposure: 'Sole pieno in primavera/autunno; mezz\'ombra estate', fertilizing: 'Azoto moderato ogni 2 settimane', pruning: 'Raccogliere foglie esterne per prolungare produzione', companionPlants: ['Fragola', 'Pomodoro', 'Pisello', 'Cavolo'], enemyPlants: ['Barbabietola'], diseases: [{ name: 'Peronospora dello spinacio', symptoms: 'Macchie giallo-verdi sulla pagina superiore', treatment: 'Rame', prevention: 'Varietà resistenti, rotazione' }] },
  { name: 'Barbabietola rossa', scientificName: 'Beta vulgaris', category: 'vegetables', description: 'Ortaggio coloratissimo, buono crudo e cotto. Anche le foglie sono commestibili.', wateringFrequency: 4, plantingPeriod: 'Marzo-Luglio', harvestPeriod: 'Maggio-Ottobre', soilType: 'Terreno profondo, sciolto, ben drenato, pH 6-7', sunExposure: 'Sole pieno', fertilizing: 'Concime potassico; evitare eccesso di azoto', pruning: 'Diradare a 10 cm di distanza', companionPlants: ['Cipolla', 'Lattuga', 'Cavolo', 'Ravanello'], enemyPlants: ['Spinacio', 'Fagiolo'], diseases: [{ name: 'Cercospora', symptoms: 'Macchie rotonde brune con bordo rosso-viola', treatment: 'Rame, rimuovere foglie colpite', prevention: 'Rotazione, varietà resistenti' }] },
  { name: 'Ravanello', scientificName: 'Raphanus sativus', category: 'vegetables', description: 'Ortaggio a crescita rapidissima (20-30 giorni). Ottimo come coltura intercalare.', wateringFrequency: 2, plantingPeriod: 'Marzo-Settembre (semina ogni 2 settimane)', harvestPeriod: 'Aprile-Ottobre', soilType: 'Terreno sciolto, fresco, ben lavorato, pH 6-7', sunExposure: 'Sole pieno o mezz\'ombra', fertilizing: 'Non necessaria se il terreno è fertile', pruning: 'Diradare a 5 cm; raccogliere appena pronti', companionPlants: ['Carota', 'Lattuga', 'Spinacio', 'Pisello', 'Cetriolo'], enemyPlants: ['Aneto', 'Finocchio'], diseases: [] },
  { name: 'Cavolo cappuccio', scientificName: 'Brassica oleracea var. capitata', category: 'vegetables', description: 'Ortaggio invernale nutriente. Varietà estive e autunno-invernali.', wateringFrequency: 3, plantingPeriod: 'Marzo-Aprile (estivo) o Giugno-Luglio (invernale)', harvestPeriod: 'Giugno-Luglio o Ottobre-Febbraio', soilType: 'Terreno ricco, fresco, ben drenato, pH 6.5-7.5', sunExposure: 'Pieno sole', fertilizing: 'Azoto abbondante nelle prime fasi; potassio prima del raccolto', pruning: 'Non necessaria', companionPlants: ['Sedano', 'Aneto', 'Menta', 'Rosmarino', 'Cipolla'], enemyPlants: ['Fragola', 'Pomodoro', 'Aglio'], diseases: [{ name: 'Cavolaia', symptoms: 'Larve verdi che divorano le foglie', treatment: 'Bacillus thuringiensis', prevention: 'Reti anti-insetto, consociazione con sedano' }] },
  { name: 'Broccolo', scientificName: 'Brassica oleracea var. italica', category: 'vegetables', description: 'Ortaggio autunnale-invernale molto nutriente. Produce germogli laterali.', wateringFrequency: 3, plantingPeriod: 'Luglio-Agosto (trapianto)', harvestPeriod: 'Settembre-Dicembre', soilType: 'Terreno ricco, fresco, neutro, pH 6.5-7.5', sunExposure: 'Pieno sole', fertilizing: 'Azoto moderato; potassio per la testa', pruning: 'Tagliare il cespo centrale; lasciare pianta per produzione laterale', companionPlants: ['Sedano', 'Cipolla', 'Menta', 'Rosmarino'], enemyPlants: ['Fragola', 'Pomodoro'], diseases: [{ name: 'Cavolaia', symptoms: 'Larve che mangiano foglie e cespo', treatment: 'Bacillus thuringiensis', prevention: 'Reti anti-insetto' }] },
  { name: 'Cetriolo', scientificName: 'Cucumis sativus', category: 'vegetables', description: 'Ortaggio estivo rinfrescante. Cresce velocemente e produce abbondantemente.', wateringFrequency: 1, plantingPeriod: 'Aprile-Giugno', harvestPeriod: 'Giugno-Settembre', soilType: 'Terreno ricco, caldo, ben drenato, pH 6-7', sunExposure: 'Pieno sole, posizione calda e riparata', fertilizing: 'Abbondante concime organico; azoto poi potassio', pruning: 'Cimatura dell\'apice dopo 5-6 foglie', companionPlants: ['Fagiolo', 'Mais', 'Pisello', 'Ravanello'], enemyPlants: ['Salvia', 'Patata', 'Finocchio'], diseases: [{ name: 'Oidio del cetriolo', symptoms: 'Polvere bianca su foglie e steli', treatment: 'Zolfo, bicarbonato', prevention: 'Varietà resistenti, buona areazione' }] },
  { name: 'Patata', scientificName: 'Solanum tuberosum', category: 'vegetables', description: 'Tubero molto produttivo, base dell\'alimentazione italiana.', wateringFrequency: 5, plantingPeriod: 'Marzo-Aprile', harvestPeriod: 'Giugno-Luglio (precoci) o Agosto-Settembre (tardive)', soilType: 'Terreno sciolto, profondo, sabbioso-argilloso, pH 5.5-6.5', sunExposure: 'Pieno sole', fertilizing: 'Letame maturo in pre-impianto; potassio e fosforo', pruning: 'Rincalzare 2-3 volte durante la crescita', companionPlants: ['Fagiolo', 'Cavolo', 'Mais', 'Nasturzio'], enemyPlants: ['Pomodoro', 'Melanzana', 'Peperone'], diseases: [{ name: 'Peronospora (Phytophthora infestans)', symptoms: 'Macchie brune sulle foglie, marciume tuberi', treatment: 'Rame ogni 7-10 giorni preventivamente', prevention: 'Varietà resistenti, rotazione' }] },
  { name: 'Zucca', scientificName: 'Cucurbita maxima', category: 'vegetables', description: 'Pianta rustica e produttiva, i frutti si conservano per mesi.', wateringFrequency: 3, plantingPeriod: 'Aprile-Maggio', harvestPeriod: 'Settembre-Ottobre', soilType: 'Terreno ricco di humus, ben drenato, caldo, pH 6-7', sunExposure: 'Pieno sole', fertilizing: 'Abbondante letame o compost; azoto poi potassio', pruning: 'Cimatura dei tralci dopo 2-3 frutti', companionPlants: ['Mais', 'Fagiolo', 'Nasturzio', 'Menta'], enemyPlants: ['Patata', 'Finocchio'], diseases: [{ name: 'Oidio', symptoms: 'Polvere bianca sulle foglie', treatment: 'Zolfo, bicarbonato', prevention: 'Buona areazione' }] },
  { name: 'Finocchio', scientificName: 'Foeniculum vulgare var. azoricum', category: 'vegetables', description: 'Ortaggio dal sapore anisato. Autunno-invernale.', wateringFrequency: 3, plantingPeriod: 'Luglio-Agosto (trapianto)', harvestPeriod: 'Ottobre-Febbraio', soilType: 'Terreno ben drenato, fertile, calcareo, pH 6.5-7.5', sunExposure: 'Pieno sole', fertilizing: 'Azoto moderato; potassio per ingrossare il grumolo', pruning: 'Rincalzare il grumolo quando grande come un arancio', companionPlants: ['Lattuga', 'Cipolla'], enemyPlants: ['Pomodoro', 'Peperone', 'Fagiolo', 'Pisello', 'Carota', 'Patata'], diseases: [] },
  { name: 'Sedano', scientificName: 'Apium graveolens', category: 'vegetables', description: 'Ortaggio aromatico dalle coste croccanti. Lungo periodo di crescita.', wateringFrequency: 2, plantingPeriod: 'Marzo-Aprile (semina in semenzaio)', harvestPeriod: 'Agosto-Novembre', soilType: 'Terreno ricco, umido, argilloso-limoso, pH 6-7', sunExposure: 'Sole pieno o leggera ombra', fertilizing: 'Azoto abbondante e regolare', pruning: 'Sbiancare le coste avvolgendo con cartone', companionPlants: ['Pomodoro', 'Cavolo', 'Porro', 'Fagiolo'], enemyPlants: ['Mais', 'Patata'], diseases: [] },
  { name: 'Asparago', scientificName: 'Asparagus officinalis', category: 'vegetables', description: 'Ortaggio perenne dal ciclo lungo: 2-3 anni prima del primo raccolto.', wateringFrequency: 5, plantingPeriod: 'Marzo-Aprile (zampe di 1 anno)', harvestPeriod: 'Aprile-Giugno (dalla 3° stagione)', soilType: 'Terreno sabbioso, leggero, drenato, pH 6.5-7.5', sunExposure: 'Pieno sole', fertilizing: 'Letame abbondante alla messa a dimora', pruning: 'Tagliare i turioni a 2-3 cm dal suolo', companionPlants: ['Pomodoro', 'Prezzemolo', 'Basilico', 'Calendula'], enemyPlants: ['Cipolla', 'Aglio', 'Patata'], diseases: [{ name: 'Ruggine dell\'asparago', symptoms: 'Pustole arancioni poi nere sui rametti', treatment: 'Rame, zolfo', prevention: 'Varietà resistenti, buona areazione' }] },
  { name: 'Carciofo', scientificName: 'Cynara cardunculus var. scolymus', category: 'vegetables', description: 'Ortaggio tipicamente italiano, perenne. Pianta monumentale.', wateringFrequency: 4, plantingPeriod: 'Agosto-Settembre (ovoli/carducci)', harvestPeriod: 'Ottobre-Maggio', soilType: 'Terreno profondo, fertile, argilloso-limoso, pH 6-7', sunExposure: 'Pieno sole', fertilizing: 'Abbondante letame o compost alla messa a dimora', pruning: 'Eliminare foglie vecchie basali; raccogliere prima che si apra', companionPlants: ['Carota', 'Prezzemolo', 'Cavolo'], enemyPlants: ['Patata'], diseases: [{ name: 'Peronospora del carciofo', symptoms: 'Muffa bianca-grigiastra su foglie e capolini', treatment: 'Rame', prevention: 'Buona areazione, evitare ristagni' }] },
  { name: 'Cipollotto', scientificName: 'Allium cepa var. aggregatum', category: 'vegetables', description: 'Variante della cipolla per il fusto verde fresco. Ciclo brevissimo.', wateringFrequency: 3, plantingPeriod: 'Tutto l\'anno (in successione)', harvestPeriod: 'Tutto l\'anno (30-60 giorni dalla semina)', soilType: 'Terreno fertile, ben drenato, pH 6-7', sunExposure: 'Sole pieno', fertilizing: 'Azoto leggero ogni 2 settimane', pruning: 'Non necessaria', companionPlants: ['Carota', 'Lattuga', 'Pomodoro'], enemyPlants: ['Fagiolo', 'Pisello'], diseases: [] },
  { name: 'Basilico', scientificName: 'Ocimum basilicum', category: 'herbs', description: 'L\'erba aromatica italiana per eccellenza. Perfetta per pesto e piatti mediterranei.', wateringFrequency: 1, plantingPeriod: 'Aprile-Giugno (dopo il freddo)', harvestPeriod: 'Giugno-Settembre', soilType: 'Terreno fertile, drenato, ricco, pH 6-7', sunExposure: 'Pieno sole, posizione calda e riparata', fertilizing: 'Concime liquido azotato ogni 2 settimane', pruning: 'Cimatura continua rimuovendo le infiorescenze', companionPlants: ['Pomodoro', 'Peperone', 'Melanzana'], enemyPlants: ['Salvia', 'Timo', 'Finocchio'], diseases: [{ name: 'Fusariosi del basilico', symptoms: 'Pianta improvvisamente avvizzisce', treatment: 'Nessuna cura; rimuovere la pianta', prevention: 'Varietà resistenti, terreno ben drenato' }] },
  { name: 'Rosmarino', scientificName: 'Rosmarinus officinalis', category: 'herbs', description: 'Aromatica perenne mediterranea, resistentissima. Ottima per arrosti e focacce.', wateringFrequency: 7, plantingPeriod: 'Marzo-Maggio o Settembre-Ottobre', harvestPeriod: 'Tutto l\'anno', soilType: 'Terreno povero, calcareo, molto ben drenato, pH 6.5-8', sunExposure: 'Pieno sole, posizione calda e secca', fertilizing: 'Pochissima concimazione; eccesso indebolisce il profumo', pruning: 'Potatura leggera dopo la fioritura (marzo-aprile)', companionPlants: ['Carota', 'Cavolo', 'Fagiolo', 'Salvia', 'Timo'], enemyPlants: ['Basilico', 'Menta', 'Cetriolo'], diseases: [] },
  { name: 'Salvia', scientificName: 'Salvia officinalis', category: 'herbs', description: 'Aromatica perenne dalle foglie vellutate. Ottima con burro e pasta.', wateringFrequency: 7, plantingPeriod: 'Marzo-Maggio o Settembre-Ottobre', harvestPeriod: 'Tutto l\'anno', soilType: 'Terreno ben drenato, calcareo, asciutto, pH 6-7.5', sunExposure: 'Pieno sole', fertilizing: 'Minima; concime leggero in primavera', pruning: 'Potatura dopo la fioritura; ringiovanire ogni 3-4 anni', companionPlants: ['Carota', 'Cavolo', 'Rosmarino', 'Fagiolo'], enemyPlants: ['Cipolla', 'Cetriolo', 'Basilico'], diseases: [] },
  { name: 'Prezzemolo', scientificName: 'Petroselinum crispum', category: 'herbs', description: 'Erba aromatica biennale indispensabile in cucina italiana.', wateringFrequency: 2, plantingPeriod: 'Marzo-Settembre (semina diretta)', harvestPeriod: 'Tutto l\'anno (con copertura in inverno)', soilType: 'Terreno fertile, umido, ben drenato, pH 6-7', sunExposure: 'Sole pieno o mezz\'ombra', fertilizing: 'Azoto leggero ogni 3-4 settimane', pruning: 'Raccogliere sempre i rami esterni', companionPlants: ['Pomodoro', 'Asparago', 'Carota', 'Cipolla'], enemyPlants: ['Lattuga', 'Sedano'], diseases: [] },
  { name: 'Menta', scientificName: 'Mentha spp.', category: 'herbs', description: 'Aromatica molto vigorosa e invasiva. Meglio coltivarla in vaso. Repelle parassiti.', wateringFrequency: 2, plantingPeriod: 'Marzo-Maggio (da stoloni o piantine)', harvestPeriod: 'Maggio-Ottobre', soilType: 'Terreno fresco, umido, ricco, pH 6-7', sunExposure: 'Sole pieno o mezz\'ombra', fertilizing: 'Concime azotato leggero a primavera', pruning: 'Cimatura frequente; tagliare a metà in estate', companionPlants: ['Pomodoro', 'Cavolo', 'Pisello', 'Carota'], enemyPlants: ['Prezzemolo', 'Camomilla'], diseases: [] },
  { name: 'Timo', scientificName: 'Thymus vulgaris', category: 'herbs', description: 'Aromatica perenne compatta. Ottima in cucina e come bordo. Molto rustica.', wateringFrequency: 7, plantingPeriod: 'Marzo-Maggio o Settembre', harvestPeriod: 'Tutto l\'anno', soilType: 'Terreno povero, ben drenato, sabbioso-calcareo, pH 6-8', sunExposure: 'Pieno sole', fertilizing: 'Minima, concime leggero in primavera', pruning: 'Potatura dopo la fioritura; non tagliare legno vecchio', companionPlants: ['Pomodoro', 'Melanzana', 'Cavolo', 'Carota', 'Rosmarino'], enemyPlants: ['Basilico', 'Cetriolo'], diseases: [] },
  { name: 'Origano', scientificName: 'Origanum vulgare', category: 'herbs', description: 'Aromatica perenne tipicamente mediterranea. Essenziale per pizza e piatti italiani.', wateringFrequency: 7, plantingPeriod: 'Marzo-Maggio', harvestPeriod: 'Giugno-Settembre (più profumato in fioritura)', soilType: 'Terreno povero, calcareo, molto drenato, pH 6.5-8', sunExposure: 'Pieno sole', fertilizing: 'Minima', pruning: 'Tagliare i rami fioriti a fine estate', companionPlants: ['Pomodoro', 'Peperone', 'Cetriolo', 'Zucchina'], enemyPlants: [], diseases: [] },
  { name: 'Erba cipollina', scientificName: 'Allium schoenoprasum', category: 'herbs', description: 'Aromatica perenne dal sapore delicato di cipolla. Facilissima in vaso.', wateringFrequency: 3, plantingPeriod: 'Marzo-Settembre', harvestPeriod: 'Tutto l\'anno', soilType: 'Terreno fertile, ben drenato, pH 6-7', sunExposure: 'Sole pieno o mezz\'ombra', fertilizing: 'Concime azotato leggero in primavera e estate', pruning: 'Tagliare le foglie a 3 cm dalla base', companionPlants: ['Carota', 'Fragola', 'Pomodoro', 'Lattuga'], enemyPlants: ['Fagiolo', 'Pisello'], diseases: [] },
  { name: 'Aneto', scientificName: 'Anethum graveolens', category: 'herbs', description: 'Aromatica annuale dal sapore delicato. Ottima con pesce, cetrioli e formaggi.', wateringFrequency: 3, plantingPeriod: 'Marzo-Luglio (semina diretta)', harvestPeriod: 'Maggio-Settembre', soilType: 'Terreno leggero, fertile, ben drenato, pH 5.5-6.5', sunExposure: 'Pieno sole', fertilizing: 'Minima', pruning: 'Raccogliere le foglie prima della fioritura', companionPlants: ['Cetriolo', 'Cavolo', 'Lattuga'], enemyPlants: ['Finocchio', 'Carota', 'Pomodoro'], diseases: [] },
  { name: 'Lavanda', scientificName: 'Lavandula angustifolia', category: 'herbs', description: 'Aromatica perenne ornamentale e officinale. Repellente naturale per insetti.', wateringFrequency: 10, plantingPeriod: 'Marzo-Maggio o Settembre-Ottobre', harvestPeriod: 'Giugno-Luglio (in fioritura)', soilType: 'Terreno povero, calcareo, molto drenato, pH 6.5-8', sunExposure: 'Pieno sole', fertilizing: 'Minima o nulla', pruning: 'Potatura importante dopo la fioritura (tagliare 1/3)', companionPlants: ['Pomodoro', 'Carota', 'Rosa', 'Cavolo'], enemyPlants: [], diseases: [] },
  { name: 'Fragola', scientificName: 'Fragaria × ananassa', category: 'fruits', description: 'Frutto dolce e profumato, pianta perenne. Varietà unifere e rifiorenti.', wateringFrequency: 2, plantingPeriod: 'Settembre-Ottobre o Marzo-Aprile', harvestPeriod: 'Maggio-Giugno o Maggio-Ottobre', soilType: 'Terreno fertile, acido, ben drenato, pH 5.5-6.5', sunExposure: 'Pieno sole', fertilizing: 'Concime organico + potassio in fruttificazione', pruning: 'Rimuovere stoloni regolarmente; rinnovare ogni 3 anni', companionPlants: ['Aglio', 'Cipolla', 'Lattuga', 'Spinacio', 'Timo', 'Salvia'], enemyPlants: ['Cavolo', 'Finocchio', 'Pomodoro'], diseases: [{ name: 'Botrytis (muffa grigia)', symptoms: 'Muffa grigia cotonosa sui frutti', treatment: 'Rimuovere i frutti colpiti', prevention: 'Pacciamare, raccogliere regolarmente, buona areazione' }] },
  { name: 'Pomodoro ciliegino', scientificName: 'Solanum lycopersicum var. cerasiforme', category: 'fruits', description: 'Varietà mini del pomodoro, dolcissima e produttiva. Ottima in vaso e in orto.', wateringFrequency: 2, plantingPeriod: 'Marzo-Maggio', harvestPeriod: 'Luglio-Ottobre', soilType: 'Terreno fertile, ben drenato, pH 6-7', sunExposure: 'Pieno sole', fertilizing: 'Potassio e fosforo in fruttificazione', pruning: 'Eliminare le femminelle come pomodoro comune', companionPlants: ['Basilico', 'Carota', 'Prezzemolo', 'Aglio'], enemyPlants: ['Finocchio', 'Patata'], diseases: [] },
  { name: 'Lampone', scientificName: 'Rubus idaeus', category: 'fruits', description: 'Piccolo frutto estivo o autunnale dal sapore intenso. Molto produttivo.', wateringFrequency: 3, plantingPeriod: 'Novembre-Marzo (a riposo vegetativo)', harvestPeriod: 'Giugno-Luglio (estivi) o Agosto-Ottobre (rifiorenti)', soilType: 'Terreno acido, fresco, ben drenato, ricco di humus, pH 5.5-6.5', sunExposure: 'Sole pieno o mezz\'ombra', fertilizing: 'Letame maturo in autunno; concime bilanciato a primavera', pruning: 'Tagliare i rami fruttificati a terra dopo il raccolto', companionPlants: ['Aglio', 'Tanaceto', 'Insalata'], enemyPlants: ['Fragola', 'Patata'], diseases: [] },
  { name: 'Mirtillo', scientificName: 'Vaccinium corymbosum', category: 'fruits', description: 'Piccolo frutto blu ricco di antiossidanti. Richiede terreno molto acido.', wateringFrequency: 3, plantingPeriod: 'Novembre-Marzo', harvestPeriod: 'Luglio-Agosto', soilType: 'Terreno molto acido, torboso, drenato, pH 4.5-5.5', sunExposure: 'Sole pieno o mezz\'ombra', fertilizing: 'Concimi acidificanti (solfato di ammonio)', pruning: 'Potatura di ringiovanimento ogni 2-3 anni', companionPlants: ['Rododendro', 'Azalea', 'Erica'], enemyPlants: [], diseases: [] },
  { name: 'Uva da tavola', scientificName: 'Vitis vinifera', category: 'fruits', description: 'Vite coltivata per frutti freschi. Italia tra i maggiori produttori mondiali.', wateringFrequency: 7, plantingPeriod: 'Novembre-Marzo (barbatelle)', harvestPeriod: 'Agosto-Ottobre', soilType: 'Terreno profondo, sciolto, ben drenato, calcareo, pH 6-7.5', sunExposure: 'Pieno sole, posizione calda', fertilizing: 'Letame maturo in autunno; potassio prima della maturazione', pruning: 'Potatura invernale fondamentale (Guyot o cordone speronato)', companionPlants: ['Basilico', 'Aneto', 'Geranio', 'Rosa'], enemyPlants: ['Cavolo'], diseases: [{ name: 'Peronospora della vite', symptoms: 'Macchie oleose sulle foglie, muffa bianca sotto', treatment: 'Rame ogni 7-10 giorni preventivamente', prevention: 'Varietà resistenti (PIWI), buona areazione' }] },
  { name: 'Fico', scientificName: 'Ficus carica', category: 'fruits', description: 'Albero da frutto mediterraneo rustico e longevo. Frutti dolcissimi.', wateringFrequency: 14, plantingPeriod: 'Novembre-Marzo', harvestPeriod: 'Luglio-Agosto e Settembre-Ottobre', soilType: 'Terreno qualsiasi, anche povero, ben drenato, pH 6-8', sunExposure: 'Pieno sole, posizione calda', fertilizing: 'Poco; letame maturo in autunno ogni 2-3 anni', pruning: 'Potatura invernale: eliminare rami secchi e incrociati', companionPlants: ['Basilico', 'Menta', 'Ruta'], enemyPlants: [], diseases: [] },
  { name: 'Limone', scientificName: 'Citrus limon', category: 'fruits', description: 'Agrume sempreverde simbolo del Mediterraneo. In vaso al Nord, in piena terra al Sud.', wateringFrequency: 5, plantingPeriod: 'Aprile-Maggio (trapianto)', harvestPeriod: 'Tutto l\'anno (picchi in primavera e autunno)', soilType: 'Terreno fertile, ben drenato, leggermente acido, pH 5.5-6.5', sunExposure: 'Pieno sole, temperatura minima 5°C', fertilizing: 'Concimi specifici per agrumi ogni 4-6 settimane', pruning: 'Eliminare polloni, rami secchi e che entrano nella chioma', companionPlants: ['Basilico', 'Lavanda', 'Menta'], enemyPlants: [], diseases: [{ name: 'Clorosi ferrica', symptoms: 'Foglie gialle con nervature verdi', treatment: 'Chelato di ferro, acidificare il terreno', prevention: 'Terreno acido, concimi specifici per agrumi' }] },
  { name: 'Melo', scientificName: 'Malus domestica', category: 'trees', description: 'Albero da frutto più coltivato in Italia. Centinaia di varietà.', wateringFrequency: 7, plantingPeriod: 'Novembre-Marzo (a riposo)', harvestPeriod: 'Luglio-Novembre (secondo la varietà)', soilType: 'Terreno profondo, fertile, ben drenato, pH 6-7', sunExposure: 'Pieno sole', fertilizing: 'Letame maturo in autunno; concime minerale a primavera', pruning: 'Potatura invernale importante; potatura verde estiva', companionPlants: ['Nasturzio', 'Lavanda', 'Achillea', 'Aglio'], enemyPlants: ['Patata', 'Noce'], diseases: [{ name: 'Ticchiolatura (Venturia inaequalis)', symptoms: 'Macchie scure sulle foglie e sui frutti', treatment: 'Rame e zolfo preventivi dopo le piogge', prevention: 'Varietà resistenti, raccolta foglie cadute' }] },
  { name: 'Pero', scientificName: 'Pyrus communis', category: 'trees', description: 'Albero elegante con fioritura precoce. Frutti succosi con molte varietà italiane.', wateringFrequency: 7, plantingPeriod: 'Novembre-Marzo', harvestPeriod: 'Luglio-Ottobre (secondo la varietà)', soilType: 'Terreno profondo, argilloso-limoso, ben drenato, pH 6-7', sunExposure: 'Pieno sole', fertilizing: 'Letame in autunno; azoto moderato in primavera', pruning: 'Potatura invernale; eliminare rami interni per aerare', companionPlants: ['Nasturzio', 'Lavanda', 'Aglio'], enemyPlants: ['Noce', 'Patata'], diseases: [{ name: 'Colpo di fuoco batterico', symptoms: 'Rami appassiscono come bruciati dal fuoco', treatment: 'Tagliare i rami colpiti a 30 cm sotto la parte sana', prevention: 'Varietà resistenti, evitare potature tardive' }] },
  { name: 'Ciliegio', scientificName: 'Prunus avium', category: 'trees', description: 'Albero dalla fioritura spettacolare e dai frutti dolci. Simbolo della primavera.', wateringFrequency: 7, plantingPeriod: 'Novembre-Marzo', harvestPeriod: 'Maggio-Luglio', soilType: 'Terreno profondo, sciolto, calcareo, ben drenato, pH 6-7.5', sunExposure: 'Pieno sole', fertilizing: 'Letame maturo in autunno; poco azoto', pruning: 'Potatura minima; solo rami secchi e incrociati', companionPlants: ['Aglio', 'Nasturzio', 'Allium'], enemyPlants: ['Patata', 'Peperone'], diseases: [{ name: 'Monilia (marciume dei frutti)', symptoms: 'Frutti che marciscono con anelli di spore beige', treatment: 'Rimuovere i frutti colpiti; rame in fioritura', prevention: 'Raccolta immediata dei frutti maturi' }] },
  { name: 'Pesco', scientificName: 'Prunus persica', category: 'trees', description: 'Albero da frutto estivo con fioritura rosea primaverile. Pesche, nettarine e percoche.', wateringFrequency: 7, plantingPeriod: 'Novembre-Marzo', harvestPeriod: 'Giugno-Settembre (secondo la varietà)', soilType: 'Terreno leggero, sabbioso-limoso, ben drenato, pH 6-7', sunExposure: 'Pieno sole', fertilizing: 'Letame in autunno; azoto in primavera; potassio in estate', pruning: 'Potatura verde importante (giugno): diradamento frutti e rami', companionPlants: ['Aglio', 'Tanaceto', 'Basilico', 'Nasturzio'], enemyPlants: ['Noce', 'Patata'], diseases: [{ name: 'Bolla del pesco (Taphrina deformans)', symptoms: 'Foglie bollose, distorte, rosso-rosa in primavera', treatment: 'Rame in pre-gemmazione (fine inverno, obbligatorio)', prevention: 'Trattamento rame a fine inverno prima del rigonfiamento gemme' }] },
  { name: 'Olivo', scientificName: 'Olea europaea', category: 'trees', description: 'Albero simbolo del Mediterraneo, secolare e longevo. Produce olive per olio e da tavola.', wateringFrequency: 14, plantingPeriod: 'Marzo-Maggio o Settembre-Ottobre', harvestPeriod: 'Ottobre-Dicembre (raccolta olive)', soilType: 'Terreno qualsiasi, calcareo, ben drenato, anche povero, pH 6-8.5', sunExposure: 'Pieno sole, caldo, posizione riparata dal freddo', fertilizing: 'Letame maturo ogni 2-3 anni; azoto in primavera', pruning: 'Potatura biennale dopo la raccolta: aerare la chioma, eliminare succhioni', companionPlants: ['Lavanda', 'Timo', 'Rosmarino', 'Aglio'], enemyPlants: [], diseases: [{ name: 'Mosca dell\'olivo (Bactrocera oleae)', symptoms: 'Larve nelle olive, fori di uscita, marciume', treatment: 'Trappole a feromoni + proteina idrolizzata; kaolin argilloso', prevention: 'Varietà meno suscettibili, raccolta precoce' }] },
  { name: 'Nasturzio', scientificName: 'Tropaeolum majus', category: 'flowers', description: 'Fiore commestibile e ottimo alleato dell\'orto. Attira gli afidi lontano dagli ortaggi.', wateringFrequency: 5, plantingPeriod: 'Marzo-Maggio', harvestPeriod: 'Giugno-Ottobre', soilType: 'Terreno povero, ben drenato; eccesso di nutrienti produce foglie senza fiori', sunExposure: 'Sole pieno o mezz\'ombra', fertilizing: 'Non necessaria', pruning: 'Rimuovere i fiori appassiti per prolungare la fioritura', companionPlants: ['Pomodoro', 'Zucchina', 'Fagiolo', 'Cetriolo', 'Cavolo'], enemyPlants: [], diseases: [] },
  { name: 'Calendula', scientificName: 'Calendula officinalis', category: 'flowers', description: 'Fiore arancione dalle proprietà officinali e insetticida. Repelle mosca bianca.', wateringFrequency: 5, plantingPeriod: 'Marzo-Maggio o Settembre', harvestPeriod: 'Aprile-Novembre', soilType: 'Terreno qualsiasi, ben drenato, pH 5.5-7', sunExposure: 'Pieno sole', fertilizing: 'Minima', pruning: 'Rimuovere i fiori appassiti per prolungare la fioritura', companionPlants: ['Pomodoro', 'Asparago', 'Carota', 'Cavolo', 'Peperone'], enemyPlants: [], diseases: [] },
  { name: 'Girasole', scientificName: 'Helianthus annuus', category: 'flowers', description: 'Fiore annuale alto e spettacolare. Attira impollinatori e i semi sono commestibili.', wateringFrequency: 5, plantingPeriod: 'Aprile-Giugno', harvestPeriod: 'Agosto-Settembre (semi)', soilType: 'Terreno qualsiasi, ben drenato, pH 6-7.5', sunExposure: 'Pieno sole (obbligatorio)', fertilizing: 'Moderata; potassio per i semi', pruning: 'Non necessaria', companionPlants: ['Cetriolo', 'Zucchina', 'Mais', 'Fagiolo'], enemyPlants: ['Patata'], diseases: [] },
  { name: 'Camomilla', scientificName: 'Matricaria chamomilla', category: 'flowers', description: 'Pianta officinale con fiori bianchi profumati. Stimola la crescita delle piante vicine.', wateringFrequency: 5, plantingPeriod: 'Marzo-Aprile o Settembre', harvestPeriod: 'Maggio-Luglio', soilType: 'Terreno povero, ben drenato, pH 5.6-7.5', sunExposure: 'Sole pieno', fertilizing: 'Non necessaria', pruning: 'Raccogliere i fiori aperti regolarmente', companionPlants: ['Cavolo', 'Cipolla', 'Cetriolo', 'Carota'], enemyPlants: ['Menta'], diseases: [] },
];

class OrtoDatabase extends Dexie {
  plantTypes!: Table<PlantType>;
  plants!: Table<Plant>;
  tasks!: Table<Task>;
  recipes!: Table<Recipe>;
  harvests!: Table<Harvest>;
  notes!: Table<Note>;
  settings!: Table<Settings>;
  plantPhotos!: Table<PlantPhoto>;
  gardenLayout!: Table<GardenLayout>;

  constructor() {
    super('OrtoManagerDB');

    // Versione 1 - iniziale
    this.version(1).stores({
      plants: '++id, name, category, status, plantedDate',
      tasks: '++id, dueDate, completed, category, priority, plantId',
      recipes: '++id, title, difficulty, isFavorite',
      harvests: '++id, plantId, date',
      notes: '++id, date, plantId'
    });

    // Versione 2 - aggiunge plantTypes, settings e numberOfPlants
    this.version(2).stores({
      plantTypes: '++id, name, category',
      plants: '++id, name, category, status, plantedDate, plantTypeId',
      tasks: '++id, dueDate, category, priority, plantId',
      recipes: '++id, title, difficulty, isFavorite',
      harvests: '++id, plantId, date',
      notes: '++id, date, plantId',
      settings: '++id'
    }).upgrade(async tx => {
      await tx.table('plants').toCollection().modify(plant => {
        if (!plant.numberOfPlants) plant.numberOfPlants = 1;
      });
    });

    // Versione 3 - aggiunge campi cura, consociazioni e malattie a plantTypes
    this.version(3).stores({
      plantTypes: '++id, name, category',
      plants: '++id, name, category, status, plantedDate, plantTypeId',
      tasks: '++id, dueDate, category, priority, plantId',
      recipes: '++id, title, difficulty, isFavorite',
      harvests: '++id, plantId, date',
      notes: '++id, date, plantId',
      settings: '++id'
    }).upgrade(async tx => {
      await tx.table('plantTypes').clear();
    });

    // Versione 4 - forza reload catalogo piante con dati completi (50+ piante italiane)
    this.version(4).stores({
      plantTypes: '++id, name, category',
      plants: '++id, name, category, status, plantedDate, plantTypeId',
      tasks: '++id, dueDate, category, priority, plantId',
      recipes: '++id, title, difficulty, isFavorite',
      harvests: '++id, plantId, date',
      notes: '++id, date, plantId',
      settings: '++id'
    }).upgrade(async tx => {
      await tx.table('plantTypes').clear();
    });

    // Versione 5 - bump per forzare nuovo upgrade su dispositivi con DB corrotto
    this.version(5).stores({
      plantTypes: '++id, name, category',
      plants: '++id, name, category, status, plantedDate, plantTypeId',
      tasks: '++id, dueDate, category, priority, plantId',
      recipes: '++id, title, difficulty, isFavorite',
      harvests: '++id, plantId, date',
      notes: '++id, date, plantId',
      settings: '++id'
    }).upgrade(async tx => {
      await tx.table('plantTypes').clear();
    });

    // Versione 6 - seed GARANTITO del catalogo piante nell'upgrade transaction
    // Viene eseguito PRIMA che l'app carichi: garantisce il catalogo su ogni dispositivo
    this.version(6).stores({
      plantTypes: '++id, name, category',
      plants: '++id, name, category, status, plantedDate, plantTypeId',
      tasks: '++id, dueDate, category, priority, plantId',
      recipes: '++id, title, difficulty, isFavorite',
      harvests: '++id, plantId, date',
      notes: '++id, date, plantId',
      settings: '++id'
    }).upgrade(async tx => {
      console.log('[DB v6] Seed catalogo piante nell\'upgrade transaction...');
      await tx.table('plantTypes').clear();
      // bulkAdd dentro la transazione di upgrade: atomico e garantito
      await tx.table('plantTypes').bulkAdd(PLANT_CATALOG_SEED as PlantType[]);
      const count = await tx.table('plantTypes').count();
      console.log('[DB v6] Catalogo piante inserito:', count, 'piante');
    });

    // Versione 7 - timeline foto pianta (cronologia di crescita)
    this.version(7).stores({
      plantTypes: '++id, name, category',
      plants: '++id, name, category, status, plantedDate, plantTypeId',
      tasks: '++id, dueDate, category, priority, plantId',
      recipes: '++id, title, difficulty, isFavorite',
      harvests: '++id, plantId, date',
      notes: '++id, date, plantId',
      settings: '++id',
      plantPhotos: '++id, plantId, date',
    });

    // Versione 8 - planimetria orto (gardenLayout singleton)
    this.version(8).stores({
      plantTypes: '++id, name, category',
      plants: '++id, name, category, status, plantedDate, plantTypeId',
      tasks: '++id, dueDate, category, priority, plantId',
      recipes: '++id, title, difficulty, isFavorite',
      harvests: '++id, plantId, date',
      notes: '++id, date, plantId',
      settings: '++id',
      plantPhotos: '++id, plantId, date',
      gardenLayout: '++id',
    });
  }
}

export const db = new OrtoDatabase();

// ── Helper: inserisce le piante UNA PER UNA e restituisce gli ID reali ──────
// Più robusto di bulkAdd({ allKeys: true }) che può fallire su Capacitor/WebView
async function insertPlantTypes(plantTypesList: Omit<PlantType, 'id'>[]): Promise<number[]> {
  const ids: number[] = [];
  for (const pt of plantTypesList) {
    try {
      const id = await db.plantTypes.add(pt);
      ids.push(id as number);
    } catch (err) {
      console.error('Errore inserimento plantType:', pt.name, err);
    }
  }
  return ids;
}

// Dati di esempio iniziali
export async function seedDatabase() {
  const plantTypeCount = await db.plantTypes.count();

  let plantTypeIds: number[] = [];
  // Ricarica sempre se meno di 10 piante (catalogo mancante o corrotto)
  if (plantTypeCount < 10) {
    console.log('[seed] Catalogo piante mancante o incompleto. Ricarico...');
    if (plantTypeCount > 0) {
      await db.plantTypes.clear();
    }
    const ids = await insertPlantTypes([
      // ── ORTAGGI ──────────────────────────────────────────────────────────
      {
        name: 'Pomodoro',
        scientificName: 'Solanum lycopersicum',
        category: 'vegetables',
        description: 'Ortaggio estivo per eccellenza, versatile in cucina. Esistono centinaia di varietà italiane.',
        wateringFrequency: 2,
        plantingPeriod: 'Marzo-Maggio (trapianto)',
        harvestPeriod: 'Luglio-Ottobre',
        soilType: 'Terreno fertile, ben drenato, ricco di humus, pH 6-7',
        sunExposure: 'Pieno sole (almeno 6-8 ore al giorno)',
        fertilizing: 'Concime ricco di potassio e fosforo alla messa a dimora; concimazione fogliare ogni 2 settimane in fioritura',
        pruning: 'Eliminare i getti laterali (femminelle) settimanalmente; cimatura dell\'apice dopo 4-5 grappoli',
        careNotes: 'Necessita di tutori robusti. Irrigare alla base, evitare le foglie. Rincalzare il fusto per favorire le radici avventizie.',
        companionPlants: ['Basilico', 'Carota', 'Prezzemolo', 'Aglio', 'Cipolla', 'Insalata'],
        enemyPlants: ['Finocchio', 'Cavolo', 'Patata', 'Mais'],
        diseases: [
          { name: 'Peronospora', symptoms: 'Macchie giallo-brune sulle foglie, muffa bianca sul retro', treatment: 'Rame (poltiglia bordolese) ogni 7-10 giorni in caso di pioggia', prevention: 'Evitare bagnatura fogliare, garantire buona areazione, varietà resistenti' },
          { name: 'Alternaria', symptoms: 'Macchie scure concentriche sulle foglie, spesso con alone giallo', treatment: 'Prodotti a base di rame, rimuovere le foglie colpite', prevention: 'Rotazione colturale, evitare ristagni idrici' },
          { name: 'Botrite (muffa grigia)', symptoms: 'Muffa grigia su fiori e frutti, marciumi molli', treatment: 'Rimuovere le parti colpite, trattare con bicarbonato di sodio o prodotti specifici', prevention: 'Buona ventilazione, evitare eccesso di azoto' },
          { name: 'Virosi (virus del mosaico)', symptoms: 'Foglie a mosaico giallo-verde, pianta stentata', treatment: 'Nessuna cura, rimuovere le piante colpite', prevention: 'Controllo degli afidi (vettori), seme certificato' },
          { name: 'Afidi', symptoms: 'Colonie di insetti verdi/neri sui germogli, foglie arricciate', treatment: 'Sapone molle diluito, piretro naturale, coccinelle', prevention: 'Monitoraggio frequente, consociazione con basilico' },
          { name: 'Nottua (Helicoverpa armigera)', symptoms: 'Fori nei frutti, escrementi scuri', treatment: 'Bacillus thuringiensis, rimozione manuale delle larve', prevention: 'Reti anti-insetto, trappole a feromoni' }
        ]
      },
      {
        name: 'Zucchina',
        scientificName: 'Cucurbita pepo',
        category: 'vegetables',
        description: 'Ortaggio prolifico, produce abbondantemente. I fiori sono commestibili e molto apprezzati in cucina.',
        wateringFrequency: 1,
        plantingPeriod: 'Aprile-Giugno (semina diretta o trapianto)',
        harvestPeriod: 'Giugno-Settembre',
        soilType: 'Terreno ricco, ben lavorato e drenato, pH 6-7',
        sunExposure: 'Pieno sole',
        fertilizing: 'Abbondante letame maturo alla preparazione del suolo; concime azotato ogni 3 settimane',
        pruning: 'Eliminare le foglie basali ingiallite per migliorare l\'areazione',
        careNotes: 'Raccogliere le zucchine giovani (15-20 cm) per stimolare la produzione. La pianta ha bisogno di molto spazio.',
        companionPlants: ['Mais', 'Fagiolo', 'Nasturzio', 'Aneto', 'Cipolla'],
        enemyPlants: ['Patata', 'Finocchio'],
        diseases: [
          { name: 'Oidio (mal bianco)', symptoms: 'Polvere bianca farinosa su foglie e steli', treatment: 'Zolfo bagnabile, bicarbonato di potassio, latte diluito 1:9', prevention: 'Buona areazione, evitare eccesso di azoto, varietà resistenti' },
          { name: 'Peronospora', symptoms: 'Macchie angolari gialle sulla pagina superiore, muffa viola-grigiastra sotto', treatment: 'Poltiglia bordolese o prodotti rameici', prevention: 'Irrigazione alla base, rotazione colturale' },
          { name: 'Marciume del colletto', symptoms: 'Marcescenza alla base del fusto, pianta avvizzisce', treatment: 'Rimuovere la pianta, disinfettare il suolo', prevention: 'Evitare ristagni idrici, non interrare troppo' },
          { name: 'Mosca delle cucurbitacee', symptoms: 'Gallerie nei frutti, marciume interno', treatment: 'Trappole cromotropiche, insetticidi biologici', prevention: 'Reti anti-insetto, rotazione' },
          { name: 'Afidi', symptoms: 'Colonie sulle foglie giovani, melata appiccicosa', treatment: 'Piretro, sapone molle, lancio di coccinelle', prevention: 'Consociazione con nasturzio come pianta trappola' }
        ]
      },
      {
        name: 'Melanzana',
        scientificName: 'Solanum melongena',
        category: 'vegetables',
        description: 'Ortaggio estivo che ama il calore. Protagonista della cucina mediterranea.',
        wateringFrequency: 2,
        plantingPeriod: 'Aprile-Maggio (trapianto dopo le gelate)',
        harvestPeriod: 'Luglio-Settembre',
        soilType: 'Terreno profondo, fertile, ben drenato, pH 5.5-6.5',
        sunExposure: 'Pieno sole, posizione riparata dal vento',
        fertilizing: 'Concime organico alla messa a dimora; potassio e fosforo durante la produzione',
        pruning: 'Cimatura per stimolare rami laterali; limitare a 3-4 frutti per pianta per qualità migliore',
        careNotes: 'Sensibile al freddo: trapiantare solo quando le temperature notturne superano i 15°C. Mulching consigliato.',
        companionPlants: ['Basilico', 'Peperone', 'Timo', 'Spinacio'],
        enemyPlants: ['Finocchio', 'Patata'],
        diseases: [
          { name: 'Verticilliosi', symptoms: 'Ingiallimento e avvizzimento di metà pianta, striature scure nel legno', treatment: 'Nessuna cura efficace, rimuovere la pianta', prevention: 'Rotazione lunga (4 anni), varietà resistenti, innesto su portinnesti resistenti' },
          { name: 'Afide verde della patata', symptoms: 'Colonie sulle foglie, trasmette virosi', treatment: 'Piretro naturale, sapone insetticidia', prevention: 'Monitoraggio continuo, consociazione con basilico' },
          { name: 'Dorifora (Colorado beetle)', symptoms: 'Larve arancioni che scheletrizzano le foglie', treatment: 'Raccolta manuale, Bacillus thuringiensis', prevention: 'Rotazione, cercare le uova sul retro delle foglie' },
          { name: 'Ragnetto rosso', symptoms: 'Punteggiatura giallastra sulle foglie, ragnatele fini', treatment: 'Zolfo, aumentare l\'umidità, acari predatori', prevention: 'Irrigazioni regolari, non eccedere con azoto' }
        ]
      },
      {
        name: 'Peperone',
        scientificName: 'Capsicum annuum',
        category: 'vegetables',
        description: 'Ortaggio colorato e versatile, dolce o piccante. Ricco di vitamina C.',
        wateringFrequency: 2,
        plantingPeriod: 'Aprile-Maggio (trapianto)',
        harvestPeriod: 'Luglio-Ottobre',
        soilType: 'Terreno leggero, ricco, ben drenato, pH 6-7',
        sunExposure: 'Pieno sole, caldo',
        fertilizing: 'Concime bilanciato alla semina; potassio in abbondanza durante la fruttificazione',
        pruning: 'Cimatura del germoglio apicale per ramificazione; rimozione fiori in eccesso',
        careNotes: 'Molto sensibile al freddo e al vento. Tutorare le piante. I frutti cambiano colore maturando.',
        companionPlants: ['Basilico', 'Carota', 'Cipolla', 'Spinacio'],
        enemyPlants: ['Finocchio', 'Patata'],
        diseases: [
          { name: 'Marciume apicale', symptoms: 'Macchia bruna-nera all\'apice del frutto', treatment: 'Correggere l\'irrigazione, apportare calcio al suolo', prevention: 'Irrigazioni costanti, non alternare siccità e abbondanza d\'acqua' },
          { name: 'Batteriosi (Xanthomonas)', symptoms: 'Macchie acquose sulle foglie che diventano brune con alone giallo', treatment: 'Rame, rimozione delle parti colpite', prevention: 'Seme certificato, evitare bagnatura fogliare' },
          { name: 'Afidi', symptoms: 'Insetti verdi/gialli sui germogli, foglie arricciate', treatment: 'Piretro, sapone molle, insetti utili', prevention: 'Monitoraggio, consociazione con basilico e cipolla' }
        ]
      },
      {
        name: 'Lattuga',
        scientificName: 'Lactuca sativa',
        category: 'vegetables',
        description: 'Insalata fresca e croccante, a crescita rapida. Ideale per colture scalari.',
        wateringFrequency: 1,
        plantingPeriod: 'Marzo-Settembre (in successione ogni 3 settimane)',
        harvestPeriod: 'Aprile-Novembre',
        soilType: 'Terreno fertile, fresco, umido ma drenato, pH 6-7',
        sunExposure: 'Sole pieno in primavera/autunno; mezz\'ombra in estate',
        fertilizing: 'Leggero concime azotato ogni 2 settimane',
        pruning: 'Non necessaria; raccogliere le foglie esterne per prolungare la produzione',
        careNotes: 'Va a seme rapidamente con il caldo. In estate coltivare varietà da caldo o all\'ombra parziale. Annaffiare regolarmente.',
        companionPlants: ['Carota', 'Ravanello', 'Fragola', 'Cipolla', 'Pomodoro'],
        enemyPlants: ['Finocchio', 'Prezzemolo', 'Sedano'],
        diseases: [
          { name: 'Peronospora della lattuga', symptoms: 'Macchie gialle sulle foglie, muffa grigio-viola sotto', treatment: 'Rame, rimuovere le foglie colpite', prevention: 'Buona areazione, evitare bagnatura, varietà resistenti' },
          { name: 'Sclerotinia (marciume bianco)', symptoms: 'Marciume cotonoso bianco alla base, sclerozi neri', treatment: 'Rimuovere le piante, non interrare i residui', prevention: 'Rotazione lunga, drenaggio ottimale' },
          { name: 'Lumache e limacce', symptoms: 'Fori irregolari nelle foglie, tracce mucose', treatment: 'Granuli di fosfato ferrico (ecologici), esche naturali', prevention: 'Barriere di cenere o sabbia, raccolta notturna' },
          { name: 'Afidi della lattuga', symptoms: 'Colonie giallo-verdi nelle foglie interne, pianta stentata', treatment: 'Piretro, sapone molle', prevention: 'Rotazione, evitare concimazioni azotate eccessive' }
        ]
      },
      {
        name: 'Carota',
        scientificName: 'Daucus carota',
        category: 'vegetables',
        description: 'Ortaggio da radice ricco di betacarotene. Si coltiva in primavera e autunno.',
        wateringFrequency: 3,
        plantingPeriod: 'Febbraio-Aprile e Agosto-Settembre',
        harvestPeriod: 'Maggio-Giugno e Ottobre-Novembre',
        soilType: 'Terreno sabbioso, profondo, sciolto, senza sassi, pH 6-6.8',
        sunExposure: 'Sole pieno o leggera ombra',
        fertilizing: 'Evitare letame fresco (biforcazioni). Concime potassico in pre-semina.',
        pruning: 'Diradare le piantine a 5 cm di distanza quando alte 5 cm',
        careNotes: 'Seminare in file, diradare presto. Il terreno deve essere profondo e soffice per radici dritte. Non concimare con azoto.',
        companionPlants: ['Pomodoro', 'Cipolla', 'Porro', 'Salvia', 'Rosmarino', 'Lattuga'],
        enemyPlants: ['Aneto', 'Finocchio', 'Prezzemolo'],
        diseases: [
          { name: 'Mosca della carota', symptoms: 'Gallerie rossastre nella radice, foglie ingiallite', treatment: 'Nessuna cura in corso; rimuovere le piante colpite', prevention: 'Reti anti-insetto, coltivazione in tarda estate (2° volo), consociazione con cipolla' },
          { name: 'Alternaria (bruciatura fogliare)', symptoms: 'Macchie scure con alone giallo sulle foglie', treatment: 'Rame, rimozione foglie colpite', prevention: 'Rotazione, seme certificato, buona areazione' },
          { name: 'Cavalletta e tripidi', symptoms: 'Punteggiatura argentata sulle foglie', treatment: 'Piretro, spinosad biologico', prevention: 'Rotazione colturale, reti' }
        ]
      },
      {
        name: 'Cipolla',
        scientificName: 'Allium cepa',
        category: 'vegetables',
        description: 'Ortaggio indispensabile in cucina. Si coltiva da seme, da bulbillo o da piantine.',
        wateringFrequency: 5,
        plantingPeriod: 'Febbraio-Marzo (bulbilli) o Settembre-Ottobre (invernali)',
        harvestPeriod: 'Giugno-Luglio (estive); Marzo-Aprile (invernali)',
        soilType: 'Terreno leggero, fertile, ben drenato, pH 6-7',
        sunExposure: 'Pieno sole',
        fertilizing: 'Concime fosfopotassico in pre-impianto; azoto leggero all\'inizio',
        pruning: 'Piegare le foglie a terra quando ingialliscono per favorire la maturazione del bulbo',
        careNotes: 'Ridurre le irrigazioni man mano che il bulbo matura. Estrarre e far seccare prima di conservare.',
        companionPlants: ['Carota', 'Lattuga', 'Pomodoro', 'Camomilla', 'Barbabietola'],
        enemyPlants: ['Fagiolo', 'Pisello', 'Salvia'],
        diseases: [
          { name: 'Peronospora della cipolla', symptoms: 'Efflorescenze violacee sulle foglie, pianta si piega', treatment: 'Poltiglia bordolese, prodotti rameici', prevention: 'Rotazione, evitare bagnatura fogliare, varietà resistenti' },
          { name: 'Ruggine (Puccinia allii)', symptoms: 'Pustole arancioni sulle foglie', treatment: 'Zolfo, rame', prevention: 'Rotazione, buona areazione' },
          { name: 'Mosca della cipolla', symptoms: 'Larve bianche nel bulbo, pianta avvizzisce e muore', treatment: 'Rimuovere le piante colpite', prevention: 'Rotazione, reti anti-insetto, consociazione con carota' },
          { name: 'Botrytis (muffa del collo)', symptoms: 'Marciume grigio al collo del bulbo durante la conservazione', treatment: 'Eliminare i bulbi colpiti', prevention: 'Buona asciugatura prima della conservazione, ambienti aerati' }
        ]
      },
      {
        name: 'Aglio',
        scientificName: 'Allium sativum',
        category: 'vegetables',
        description: 'Bulbo aromatico dalle proprietà antibatteriche. Alleato naturale contro molti parassiti.',
        wateringFrequency: 7,
        plantingPeriod: 'Ottobre-Novembre (aglio autunnale) o Febbraio-Marzo (primaverile)',
        harvestPeriod: 'Giugno-Luglio',
        soilType: 'Terreno sciolto, leggero, ben drenato, pH 6-7',
        sunExposure: 'Pieno sole',
        fertilizing: 'Concime fosfopotassico in pre-impianto; evitare azoto eccessivo',
        pruning: 'Rimuovere gli scapi fiorali (torsoli) per ingrossare il bulbo',
        careNotes: 'Piantare gli spicchi con la punta verso l\'alto a 5 cm di profondità. Ridurre le irrigazioni a maggio. Conservare in luogo asciutto.',
        companionPlants: ['Pomodoro', 'Fragola', 'Carota', 'Rosa', 'Lattuga'],
        enemyPlants: ['Fagiolo', 'Pisello', 'Cavolo'],
        diseases: [
          { name: 'Ruggine dell\'aglio', symptoms: 'Striature arancioni sulle foglie', treatment: 'Zolfo, rame', prevention: 'Rotazione, buona areazione, varietà resistenti' },
          { name: 'Fusariosi (marciume basale)', symptoms: 'Radici e base del bulbo marce, pianta ingiallisce', treatment: 'Rimuovere le piante, non reimpiantare nella stessa area', prevention: 'Rotazione lunga, bulbi sani certificati, drenaggio' },
          { name: 'Tripidi', symptoms: 'Striature argentee sulle foglie, deperimento', treatment: 'Spinosad, piretro', prevention: 'Rotazione, irrigazione regolare' }
        ]
      },
      {
        name: 'Porro',
        scientificName: 'Allium porrum',
        category: 'vegetables',
        description: 'Ortaggio invernale dal sapore delicato, molto resistente al freddo.',
        wateringFrequency: 4,
        plantingPeriod: 'Marzo-Aprile (trapianto a Giugno-Luglio)',
        harvestPeriod: 'Ottobre-Marzo',
        soilType: 'Terreno profondo, fertile, umido, pH 6-7',
        sunExposure: 'Sole pieno',
        fertilizing: 'Concime azotato al trapianto e a metà estate',
        pruning: 'Rincalzare progressivamente per sbiancare il fusto',
        careNotes: 'Trapiantare le piantine quando sono alte 15-20 cm. Rincalzare più volte per avere più parte bianca.',
        companionPlants: ['Carota', 'Sedano', 'Lattuga', 'Pomodoro'],
        enemyPlants: ['Fagiolo', 'Pisello'],
        diseases: [
          { name: 'Ruggine del porro', symptoms: 'Pustole arancioni allungate sulle foglie', treatment: 'Rame, zolfo', prevention: 'Rotazione, buona areazione' },
          { name: 'Muffa viola (Botrytis porri)', symptoms: 'Marciume con muffa sulle foglie', treatment: 'Rimuovere le foglie colpite, trattare con rame', prevention: 'Evitare bagnatura fogliare, buona areazione' }
        ]
      },
      {
        name: 'Fagiolo',
        scientificName: 'Phaseolus vulgaris',
        category: 'vegetables',
        description: 'Leguminosa arricchisce il suolo di azoto. Varietà nane e rampicanti.',
        wateringFrequency: 3,
        plantingPeriod: 'Aprile-Luglio (semina scalare)',
        harvestPeriod: 'Giugno-Settembre',
        soilType: 'Terreno leggero, caldo, ben drenato, pH 6-7',
        sunExposure: 'Pieno sole',
        fertilizing: 'Poca concimazione azotata (fissa l\'azoto); fosforo e potassio utili',
        pruning: 'Non necessaria per varietà nane; cimatura per rampicanti',
        careNotes: 'Non irrigare durante la fioritura per non far cadere i fiori. Raccogliere i baccelli giovani e teneri regolarmente.',
        companionPlants: ['Zucchina', 'Mais', 'Carota', 'Ravanello', 'Cetriolo'],
        enemyPlants: ['Cipolla', 'Aglio', 'Finocchio', 'Porro'],
        diseases: [
          { name: 'Antracnosi', symptoms: 'Macchie brune-rosse su baccelli e foglie, bordi scuri', treatment: 'Rame, rimozione parti colpite', prevention: 'Seme certificato, evitare bagnatura, rotazione' },
          { name: 'Batteriosi (Pseudomonas)', symptoms: 'Macchie acquose sulle foglie, annerimento dei baccelli', treatment: 'Rame, rimuovere le parti colpite', prevention: 'Seme sano, evitare lavori in campo bagnato' },
          { name: 'Afidi neri', symptoms: 'Colonie nere su germogli e foglie giovani', treatment: 'Piretro, sapone molle, coccinelle', prevention: 'Monitoraggio precoce, consociazione con nasturzio' },
          { name: 'Tonchio (Acanthoscelides)', symptoms: 'Larve nei semi essiccati, buchini tondeggianti', treatment: 'Conservare i semi in contenitori ermetici con alloro', prevention: 'Raccogliere i baccelli maturi, conservazione corretta' }
        ]
      },
      {
        name: 'Pisello',
        scientificName: 'Pisum sativum',
        category: 'vegetables',
        description: 'Leguminosa primaverile e autunnale. Fissa l\'azoto e migliora il suolo.',
        wateringFrequency: 4,
        plantingPeriod: 'Febbraio-Aprile e Settembre-Ottobre',
        harvestPeriod: 'Aprile-Giugno e Novembre-Dicembre',
        soilType: 'Terreno fresco, ben drenato, neutro, pH 6-7.5',
        sunExposure: 'Sole pieno; tollera la mezz\'ombra',
        fertilizing: 'Poca concimazione azotata; fosforo e potassio',
        pruning: 'Non necessaria; tutorare le varietà rampicanti',
        careNotes: 'Seminare in piena terra. Non sopporta il caldo estivo. Raccogliere i baccelli giovani per produzione continua.',
        companionPlants: ['Carota', 'Ravanello', 'Spinacio', 'Lattuga', 'Menta'],
        enemyPlants: ['Cipolla', 'Aglio', 'Finocchio'],
        diseases: [
          { name: 'Oidio del pisello', symptoms: 'Polvere bianca sulle foglie e baccelli', treatment: 'Zolfo bagnabile, bicarbonato', prevention: 'Varietà resistenti, buona areazione, non eccedere azoto' },
          { name: 'Peronospora', symptoms: 'Macchie gialle sulle foglie, muffa bianca-grigiastra sotto', treatment: 'Rame', prevention: 'Rotazione, evitare ristagni idrici' },
          { name: 'Tonchio del pisello', symptoms: 'Larve nei semi, buchini all\'esterno', treatment: 'Conservazione in freezer 3 giorni per eliminare le uova', prevention: 'Reti anti-insetto, raccolta tempestiva' }
        ]
      },
      {
        name: 'Spinacio',
        scientificName: 'Spinacia oleracea',
        category: 'vegetables',
        description: 'Ortaggio a foglia ricco di ferro e vitamine. Cresce velocemente in clima fresco.',
        wateringFrequency: 2,
        plantingPeriod: 'Febbraio-Aprile e Agosto-Ottobre',
        harvestPeriod: 'Marzo-Maggio e Settembre-Novembre',
        soilType: 'Terreno ricco, umido, buona capacità idrica, pH 6.5-7',
        sunExposure: 'Sole pieno in primavera/autunno; mezz\'ombra in estate',
        fertilizing: 'Azoto moderato ogni 2 settimane; tollera male il letame fresco',
        pruning: 'Raccogliere le foglie esterne per prolungare la produzione',
        careNotes: 'Va a seme con il caldo e i giorni lunghi. Coltivare in primavera precoce o autunno. Semina scalare ogni 2 settimane.',
        companionPlants: ['Fragola', 'Pomodoro', 'Pisello', 'Cavolo'],
        enemyPlants: ['Barbabietola'],
        diseases: [
          { name: 'Peronospora dello spinacio', symptoms: 'Macchie giallo-verdi sulla pagina superiore, muffa grigio-viola sotto', treatment: 'Rame, rimozione foglie colpite', prevention: 'Varietà resistenti, rotazione, buona areazione' },
          { name: 'Cladosporiosi', symptoms: 'Macchie gialle e muffa bruna sulle foglie', treatment: 'Fungicidi rameici', prevention: 'Rotazione, non bagnare le foglie' }
        ]
      },
      {
        name: 'Barbabietola rossa',
        scientificName: 'Beta vulgaris',
        category: 'vegetables',
        description: 'Ortaggio coloratissimo, buono crudo e cotto. Anche le foglie sono commestibili.',
        wateringFrequency: 4,
        plantingPeriod: 'Marzo-Luglio',
        harvestPeriod: 'Maggio-Ottobre',
        soilType: 'Terreno profondo, sciolto, ben drenato, pH 6-7',
        sunExposure: 'Sole pieno',
        fertilizing: 'Concime potassico; evitare eccesso di azoto che favorisce le foglie a scapito della radice',
        pruning: 'Diradare a 10 cm di distanza',
        careNotes: 'Seminare in file, diradare presto. Raccogliere quando grossa come una mela.',
        companionPlants: ['Cipolla', 'Lattuga', 'Cavolo', 'Ravanello'],
        enemyPlants: ['Spinacio', 'Fagiolo'],
        diseases: [
          { name: 'Cercospora (macchia fogliare)', symptoms: 'Macchie rotonde brune con bordo rosso-viola sulle foglie', treatment: 'Rame, rimuovere le foglie colpite', prevention: 'Rotazione, varietà resistenti, buona areazione' },
          { name: 'Peronospora', symptoms: 'Muffa grigia sulle foglie in clima umido', treatment: 'Prodotti rameici', prevention: 'Evitare eccessi d\'acqua' }
        ]
      },
      {
        name: 'Ravanello',
        scientificName: 'Raphanus sativus',
        category: 'vegetables',
        description: 'Ortaggio a crescita rapidissima (20-30 giorni). Ottimo come coltura intercalare.',
        wateringFrequency: 2,
        plantingPeriod: 'Marzo-Settembre (semina ogni 2 settimane)',
        harvestPeriod: 'Aprile-Ottobre',
        soilType: 'Terreno sciolto, fresco, ben lavorato, pH 6-7',
        sunExposure: 'Sole pieno o mezz\'ombra',
        fertilizing: 'Non necessaria se il terreno è fertile',
        pruning: 'Diradare a 5 cm; raccogliere appena pronti (induriscono)',
        careNotes: 'Coltura velocissima. Ottimo per rompere la crosta del suolo e come coltura intercalare tra ortaggi a lenta crescita.',
        companionPlants: ['Carota', 'Lattuga', 'Spinacio', 'Pisello', 'Cetriolo'],
        enemyPlants: ['Aneto', 'Finocchio'],
        diseases: [
          { name: 'Hernia (Plasmodiophora brassicae)', symptoms: 'Radici gonfie e deformate, pianta stentata', treatment: 'Nessuna cura; rimuovere le piante', prevention: 'Rotazione lunga (5-7 anni), calcinazione del terreno' },
          { name: 'Afidi grigio-verdi', symptoms: 'Colonie sulle foglie', treatment: 'Piretro, sapone molle', prevention: 'Consociazione con nasturzio' }
        ]
      },
      {
        name: 'Cavolo cappuccio',
        scientificName: 'Brassica oleracea var. capitata',
        category: 'vegetables',
        description: 'Ortaggio invernale nutriente. Esistono varietà estive e autunno-invernali.',
        wateringFrequency: 3,
        plantingPeriod: 'Marzo-Aprile (estivo) o Giugno-Luglio (invernale)',
        harvestPeriod: 'Giugno-Luglio (estivo) o Ottobre-Febbraio (invernale)',
        soilType: 'Terreno ricco, fresco, ben drenato, pH 6.5-7.5',
        sunExposure: 'Pieno sole',
        fertilizing: 'Azoto abbondante nelle prime fasi; potassio prima della raccolta',
        pruning: 'Non necessaria',
        careNotes: 'Spaziatura abbondante (50x50 cm). Rincalzare il fusto. Proteggere dalle cavolaie con reti.',
        companionPlants: ['Sedano', 'Aneto', 'Menta', 'Rosmarino', 'Cipolla', 'Spinacio'],
        enemyPlants: ['Fragola', 'Pomodoro', 'Aglio'],
        diseases: [
          { name: 'Cavolaia (Pieris brassicae)', symptoms: 'Larve verdi che divorano le foglie', treatment: 'Bacillus thuringiensis, raccolta manuale delle uova', prevention: 'Reti anti-insetto, consociazione con sedano e aneto' },
          { name: 'Hernia (Plasmodiophora)', symptoms: 'Radici gonfie, pianta stentata e ingiallita', treatment: 'Nessuna cura; eliminare le piante', prevention: 'Rotazione lunga, calce al suolo, pH > 7' },
          { name: 'Peronospora del cavolo', symptoms: 'Macchie gialle sulle foglie, muffa grigia sotto', treatment: 'Rame', prevention: 'Areazione, evitare ristagni, rotazione' },
          { name: 'Lumache', symptoms: 'Fori irregolari nelle foglie', treatment: 'Granuli di fosfato ferrico', prevention: 'Barriere fisiche, reti a terra' }
        ]
      },
      {
        name: 'Broccolo',
        scientificName: 'Brassica oleracea var. italica',
        category: 'vegetables',
        description: 'Ortaggio autunnale-invernale molto nutriente. Dopo il cespo centrale produce germogli laterali.',
        wateringFrequency: 3,
        plantingPeriod: 'Luglio-Agosto (trapianto)',
        harvestPeriod: 'Settembre-Dicembre',
        soilType: 'Terreno ricco, fresco, neutro, pH 6.5-7.5',
        sunExposure: 'Pieno sole',
        fertilizing: 'Azoto moderato; potassio per la testa',
        pruning: 'Tagliare il cespo centrale appena compatto; lasciare la pianta per la produzione laterale',
        careNotes: 'Raccogliere il cespo principale prima che si aprano i fiori gialli. I getti laterali si producono per settimane.',
        companionPlants: ['Sedano', 'Cipolla', 'Menta', 'Rosmarino'],
        enemyPlants: ['Fragola', 'Pomodoro'],
        diseases: [
          { name: 'Cavolaia', symptoms: 'Larve che mangiano le foglie e il cespo', treatment: 'Bacillus thuringiensis', prevention: 'Reti anti-insetto' },
          { name: 'Afide ceroso del cavolo', symptoms: 'Colonie grigio-bianche sulle foglie ceroso', treatment: 'Piretro, sapone molle', prevention: 'Monitoraggio, lancio di insetti utili' }
        ]
      },
      {
        name: 'Cetriolo',
        scientificName: 'Cucumis sativus',
        category: 'vegetables',
        description: 'Ortaggio estivo rinfrescante. Cresce velocemente e produce abbondantemente.',
        wateringFrequency: 1,
        plantingPeriod: 'Aprile-Giugno',
        harvestPeriod: 'Giugno-Settembre',
        soilType: 'Terreno ricco, caldo, ben drenato, pH 6-7',
        sunExposure: 'Pieno sole, posizione calda e riparata',
        fertilizing: 'Abbondante concime organico; azoto nella fase vegetativa, poi potassio',
        pruning: 'Cimatura dell\'apice dopo 5-6 foglie; eliminare i getti laterali basali',
        careNotes: 'Irrigare alla base abbondantemente. Raccogliere i cetrioli quando ancora verdi e brillanti. Il calore è fondamentale.',
        companionPlants: ['Fagiolo', 'Mais', 'Pisello', 'Ravanello', 'Girasole'],
        enemyPlants: ['Salvia', 'Patata', 'Finocchio'],
        diseases: [
          { name: 'Oidio del cetriolo', symptoms: 'Polvere bianca su foglie e steli', treatment: 'Zolfo, bicarbonato, latte diluito', prevention: 'Varietà resistenti, buona areazione' },
          { name: 'Peronospora', symptoms: 'Macchie angolari giallo-brune sulle foglie', treatment: 'Rame', prevention: 'Evitare bagnatura fogliare, rotazione' },
          { name: 'Mosca bianca', symptoms: 'Piccoli insetti bianchi che volano sulle foglie, melata', treatment: 'Trappole gialle cromotropiche, sapone, piretro', prevention: 'Monitoraggio, insetti utili (Encarsia)' },
          { name: 'Ragnetto rosso', symptoms: 'Ragnatele fini, foglie punteggiate di giallo', treatment: 'Zolfo, aumentare umidità, acari predatori', prevention: 'Nebulizzazioni d\'acqua sulle foglie' }
        ]
      },
      {
        name: 'Patata',
        scientificName: 'Solanum tuberosum',
        category: 'vegetables',
        description: 'Tubero molto produttivo, base dell\'alimentazione. Coltivata in ogni regione italiana.',
        wateringFrequency: 5,
        plantingPeriod: 'Marzo-Aprile (al Sud anche Febbraio)',
        harvestPeriod: 'Giugno-Luglio (precoci) o Agosto-Settembre (tardive)',
        soilType: 'Terreno sciolto, profondo, sabbioso-argilloso, leggermente acido pH 5.5-6.5',
        sunExposure: 'Pieno sole',
        fertilizing: 'Letame maturo o compost in pre-impianto; potassio e fosforo; evitare azoto eccessivo',
        pruning: 'Rincalzare 2-3 volte durante la crescita per aumentare la produzione di tuberi',
        careNotes: 'Usare tuberi-seme certificati. Non piantare dove sono cresciuti pomodori o melanzane. La parte verde è tossica.',
        companionPlants: ['Fagiolo', 'Cavolo', 'Mais', 'Nasturzio', 'Rafano'],
        enemyPlants: ['Pomodoro', 'Melanzana', 'Peperone', 'Zucca', 'Cetriolo'],
        diseases: [
          { name: 'Peronospora (Phytophthora infestans)', symptoms: 'Macchie brune sulle foglie con alone chiaro, marciume dei tuberi', treatment: 'Rame ogni 7-10 giorni preventivamente', prevention: 'Varietà resistenti, rotazione, non irrigare la sera' },
          { name: 'Alternaria', symptoms: 'Macchie concentriche scure sulle foglie', treatment: 'Rame, rimozione foglie colpite', prevention: 'Rotazione, seme certificato' },
          { name: 'Dorifora della patata', symptoms: 'Larve arancioni che defoguano la pianta', treatment: 'Raccolta manuale, Bacillus thuringiensis', prevention: 'Rotazione colturale, cerca uova gialle sul retro foglie' },
          { name: 'Rizoctonia (scabbia nera)', symptoms: 'Macchie nere sui tuberi, fusto strozzato', treatment: 'Seme certificato, rotazione', prevention: 'pH neutro, non piantare in terreni troppo freddi o umidi' }
        ]
      },
      {
        name: 'Zucca',
        scientificName: 'Cucurbita maxima / moschata',
        category: 'vegetables',
        description: 'Pianta rustica e produttiva, i frutti si conservano per mesi. Fiori e semi commestibili.',
        wateringFrequency: 3,
        plantingPeriod: 'Aprile-Maggio',
        harvestPeriod: 'Settembre-Ottobre',
        soilType: 'Terreno ricco di humus, ben drenato, caldo, pH 6-7',
        sunExposure: 'Pieno sole',
        fertilizing: 'Abbondante letame o compost; azoto nelle prime fasi, poi potassio',
        pruning: 'Cimatura dei tralci dopo 2-3 frutti per concentrare le energie',
        careNotes: 'Necessita di molto spazio (2-3 m²). Raccogliere quando il peduncolo è legnoso e secco. Si conserva in luogo fresco e asciutto.',
        companionPlants: ['Mais', 'Fagiolo', 'Nasturzio', 'Menta'],
        enemyPlants: ['Patata', 'Finocchio'],
        diseases: [
          { name: 'Oidio', symptoms: 'Polvere bianca sulle foglie, soprattutto a fine stagione', treatment: 'Zolfo, bicarbonato', prevention: 'Buona areazione, non eccedere azoto' },
          { name: 'Marciume del frutto (Botrytis)', symptoms: 'Marciume grigio-cotonoso sui frutti', treatment: 'Rimuovere i frutti colpiti', prevention: 'Non far riposare i frutti sul terreno umido, sollevarli con assi' }
        ]
      },
      {
        name: 'Finocchio',
        scientificName: 'Foeniculum vulgare var. azoricum',
        category: 'vegetables',
        description: 'Ortaggio dal sapore anisat. Si coltiva in estate per raccolto autunno-invernale.',
        wateringFrequency: 3,
        plantingPeriod: 'Luglio-Agosto (trapianto)',
        harvestPeriod: 'Ottobre-Febbraio',
        soilType: 'Terreno ben drenato, fertile, calcareo, pH 6.5-7.5',
        sunExposure: 'Pieno sole',
        fertilizing: 'Azoto moderato al trapianto; potassio per ingrossare il grumolo',
        pruning: 'Rincalzare il grumolo per sbiancare e renderlo più tenero',
        careNotes: 'Trapiantare con cura (non ama i trapianti). Rincalzare il grumolo quando è grande come un arancio. Distanza di 30 cm.',
        companionPlants: ['Lattuga', 'Cipolla'],
        enemyPlants: ['Pomodoro', 'Peperone', 'Fagiolo', 'Pisello', 'Cetriolo', 'Carota', 'Patata'],
        diseases: [
          { name: 'Septoria (macchia fogliare)', symptoms: 'Macchie brune con bordo scuro sulle foglie', treatment: 'Rame, rimozione foglie colpite', prevention: 'Rotazione, seme certificato' },
          { name: 'Afidi grigio-verdi', symptoms: 'Colonie sulle foglie e steli', treatment: 'Piretro, sapone molle', prevention: 'Monitoraggio, insetti utili' }
        ]
      },
      {
        name: 'Sedano',
        scientificName: 'Apium graveolens',
        category: 'vegetables',
        description: 'Ortaggio aromatico dalle coste croccanti. Richiede un lungo periodo di crescita.',
        wateringFrequency: 2,
        plantingPeriod: 'Marzo-Aprile (semina in semenzaio)',
        harvestPeriod: 'Agosto-Novembre',
        soilType: 'Terreno ricco, umido, argilloso-limoso, pH 6-7',
        sunExposure: 'Sole pieno o leggera ombra',
        fertilizing: 'Azoto abbondante e regolare',
        pruning: 'Sbiancare le coste avvolgendo le piante con cartone o incalzando',
        careNotes: 'Richiede irrigazione costante. Lungo ciclo (5-6 mesi). Sensibile al freddo nelle fasi giovani.',
        companionPlants: ['Pomodoro', 'Cavolo', 'Porro', 'Fagiolo'],
        enemyPlants: ['Mais', 'Patata'],
        diseases: [
          { name: 'Septoria del sedano', symptoms: 'Macchie brune con picnidi sulle foglie', treatment: 'Rame, rimuovere foglie colpite', prevention: 'Seme certificato, evitare bagnatura fogliare' },
          { name: 'Mosca del sedano', symptoms: 'Gallerie nelle foglie causate da larve', treatment: 'Spinosad, rimozione foglie minate', prevention: 'Reti anti-insetto' }
        ]
      },
      // ── ERBE AROMATICHE ────────────────────────────────────────────────
      {
        name: 'Basilico',
        scientificName: 'Ocimum basilicum',
        category: 'herbs',
        description: 'L\'erba aromatica italiana per eccellenza. Perfetta per pesto, insalate e piatti mediterranei.',
        wateringFrequency: 1,
        plantingPeriod: 'Aprile-Giugno (dopo il freddo)',
        harvestPeriod: 'Giugno-Settembre',
        soilType: 'Terreno fertile, drenato, ricco, pH 6-7',
        sunExposure: 'Pieno sole, posizione calda e riparata',
        fertilizing: 'Concime liquido azotato ogni 2 settimane',
        pruning: 'Cimatura continua rimuovendo le infiorescenze per stimolare le foglie',
        careNotes: 'Non tollera il freddo (sotto 10°C muore). Irrigare alla base. Non bagnare le foglie. Coltivare vicino al pomodoro.',
        companionPlants: ['Pomodoro', 'Peperone', 'Melanzana', 'Asparago'],
        enemyPlants: ['Salvia', 'Timo', 'Finocchio'],
        diseases: [
          { name: 'Fusariosi del basilico', symptoms: 'Pianta improvvisamente avvizzisce, stelo con striature brune', treatment: 'Nessuna cura; rimuovere la pianta', prevention: 'Varietà resistenti (es. Genovese certificato), terreno ben drenato, seme certificato' },
          { name: 'Peronospora del basilico', symptoms: 'Ingiallimento rapido delle foglie, muffa grigio-viola sotto', treatment: 'Rimuovere le foglie colpite; aerazione immediata', prevention: 'Non bagnare le foglie, buona areazione, varietà resistenti' },
          { name: 'Afidi verdi', symptoms: 'Colonie sui germogli, foglie arricciate', treatment: 'Piretro, sapone molle', prevention: 'Monitoraggio frequente' }
        ]
      },
      {
        name: 'Rosmarino',
        scientificName: 'Rosmarinus officinalis',
        category: 'herbs',
        description: 'Aromatica perenne mediterranea, resistentissima. Ottima per arrosti e focacce.',
        wateringFrequency: 7,
        plantingPeriod: 'Marzo-Maggio o Settembre-Ottobre',
        harvestPeriod: 'Tutto l\'anno',
        soilType: 'Terreno povero, calcareo, molto ben drenato, pH 6.5-8',
        sunExposure: 'Pieno sole, posizione calda e secca',
        fertilizing: 'Pochissima concimazione; eccesso di nutrienti indebolisce il profumo',
        pruning: 'Potatura leggera dopo la fioritura (marzo-aprile) per mantenere la forma',
        careNotes: 'Rustica e siccitosa. Il ristagno idrico è letale. Ottima in vaso su balcone. Repelle molti insetti.',
        companionPlants: ['Carota', 'Cavolo', 'Fagiolo', 'Salvia', 'Timo'],
        enemyPlants: ['Basilico', 'Menta', 'Cetriolo'],
        diseases: [
          { name: 'Oidio del rosmarino', symptoms: 'Polvere bianca su foglie e steli, rami deperiti', treatment: 'Zolfo, bicarbonato di potassio', prevention: 'Buona areazione, evitare ristagni idrici' },
          { name: 'Verticilliosi', symptoms: 'Rami che seccano improvvisamente da un lato', treatment: 'Tagliare i rami colpiti, disinfettare le forbici', prevention: 'Drenaggio ottimale, evitare ristagni' }
        ]
      },
      {
        name: 'Salvia',
        scientificName: 'Salvia officinalis',
        category: 'herbs',
        description: 'Aromatica perenne dalle foglie vellutate e dal sapore intenso. Ottima con burro e pasta.',
        wateringFrequency: 7,
        plantingPeriod: 'Marzo-Maggio o Settembre-Ottobre',
        harvestPeriod: 'Tutto l\'anno',
        soilType: 'Terreno ben drenato, calcareo, asciutto, pH 6-7.5',
        sunExposure: 'Pieno sole',
        fertilizing: 'Minima; concime leggero in primavera',
        pruning: 'Potatura dopo la fioritura; ringiovanire ogni 3-4 anni tagliando i rami legnosi',
        careNotes: 'Pianta rustica e longeva. Repelle lumache e afidi. Ottima vicino alle brassiche.',
        companionPlants: ['Carota', 'Cavolo', 'Rosmarino', 'Fagiolo', 'Pomodoro'],
        enemyPlants: ['Cipolla', 'Cetriolo', 'Basilico'],
        diseases: [
          { name: 'Oidio', symptoms: 'Polvere bianca sulle foglie', treatment: 'Zolfo bagnabile', prevention: 'Buona areazione, evitare umidità' },
          { name: 'Ragnetto rosso', symptoms: 'Punteggiatura gialla sulle foglie, ragnatele fini', treatment: 'Zolfo, aumentare umidità ambientale', prevention: 'Nebulizzazioni d\'acqua, evitare siccità prolungata' }
        ]
      },
      {
        name: 'Prezzemolo',
        scientificName: 'Petroselinum crispum',
        category: 'herbs',
        description: 'Erba aromatica biennale indispensabile in cucina italiana. A foglie lisce o ricciate.',
        wateringFrequency: 2,
        plantingPeriod: 'Marzo-Settembre (semina diretta)',
        harvestPeriod: 'Tutto l\'anno (con copertura in inverno)',
        soilType: 'Terreno fertile, umido, ben drenato, pH 6-7',
        sunExposure: 'Sole pieno o mezz\'ombra',
        fertilizing: 'Azoto leggero ogni 3-4 settimane',
        pruning: 'Raccogliere sempre i rami esterni; non strappare troppo in una sola volta',
        careNotes: 'Germinazione lenta (3-4 settimane). Bagnare il terreno prima della semina. Al secondo anno va a seme.',
        companionPlants: ['Pomodoro', 'Asparago', 'Carota', 'Cipolla'],
        enemyPlants: ['Lattuga', 'Sedano'],
        diseases: [
          { name: 'Septoria del prezzemolo', symptoms: 'Macchie brune sulle foglie con picnidi scuri', treatment: 'Rame, rimozione foglie colpite', prevention: 'Seme certificato, evitare bagnatura fogliare, rotazione' },
          { name: 'Mal del piede', symptoms: 'Marcescenza alla base del fusto', treatment: 'Rimuovere le piante colpite', prevention: 'Drenaggio, non piantare nello stesso posto ogni anno' }
        ]
      },
      {
        name: 'Menta',
        scientificName: 'Mentha spp.',
        category: 'herbs',
        description: 'Aromatica molto vigorosa e invasiva. Meglio coltivarla in vaso. Repelle molti parassiti.',
        wateringFrequency: 2,
        plantingPeriod: 'Marzo-Maggio (da stoloni o piantine)',
        harvestPeriod: 'Maggio-Ottobre',
        soilType: 'Terreno fresco, umido, ricco, pH 6-7',
        sunExposure: 'Sole pieno o mezz\'ombra',
        fertilizing: 'Concime azotato leggero a primavera',
        pruning: 'Cimatura frequente per stimolare la produzione; tagliare a metà in estate',
        careNotes: 'Coltivare in vaso (si diffonde aggressivamente tramite stoloni). Ottima repellente per formiche e afidi.',
        companionPlants: ['Pomodoro', 'Cavolo', 'Pisello', 'Carota'],
        enemyPlants: ['Prezzemolo', 'Camomilla'],
        diseases: [
          { name: 'Ruggine della menta', symptoms: 'Pustole arancioni sulle foglie', treatment: 'Rimuovere le foglie colpite, trattare con zolfo', prevention: 'Buona areazione, non bagnare le foglie' },
          { name: 'Verticilliosi', symptoms: 'Rami che appassiscono, striature scure nel fusto', treatment: 'Rimuovere le piante colpite; reimpiantare in nuovo suolo', prevention: 'Non coltivare nella stessa terra per anni' }
        ]
      },
      {
        name: 'Timo',
        scientificName: 'Thymus vulgaris',
        category: 'herbs',
        description: 'Aromatica perenne compatta, ottima in cucina e come pianta da bordo. Molto rustica.',
        wateringFrequency: 7,
        plantingPeriod: 'Marzo-Maggio o Settembre',
        harvestPeriod: 'Tutto l\'anno',
        soilType: 'Terreno povero, ben drenato, sabbioso-calcareo, pH 6-8',
        sunExposure: 'Pieno sole',
        fertilizing: 'Minima, concime leggero in primavera',
        pruning: 'Potatura dopo la fioritura; non tagliare il legno vecchio',
        careNotes: 'Pianta xerofila, tollera la siccità. Il ristagno idrico è letale. Ringiovanire con talea ogni 3-4 anni.',
        companionPlants: ['Pomodoro', 'Melanzana', 'Cavolo', 'Carota', 'Rosmarino'],
        enemyPlants: ['Basilico', 'Cetriolo'],
        diseases: [
          { name: 'Marciume radicale', symptoms: 'Pianta che appassisce progressivamente, radici marce', treatment: 'Nessuna cura; rimuovere la pianta', prevention: 'Drenaggio eccellente, non irrigare in eccesso' }
        ]
      },
      {
        name: 'Origano',
        scientificName: 'Origanum vulgare',
        category: 'herbs',
        description: 'Aromatica perenne tipicamente mediterranea. Essenziale per pizza e piatti italiani.',
        wateringFrequency: 7,
        plantingPeriod: 'Marzo-Maggio',
        harvestPeriod: 'Giugno-Settembre (più profumato in fioritura)',
        soilType: 'Terreno povero, calcareo, molto drenato, pH 6.5-8',
        sunExposure: 'Pieno sole',
        fertilizing: 'Minima',
        pruning: 'Tagliare i rami fioriti a fine estate; potatura leggera in primavera',
        careNotes: 'Il profumo è più intenso in terreni poveri e soleggiati. Eccellente in vaso. Lasciare asciugare bene tra un\'irrigazione e l\'altra.',
        companionPlants: ['Pomodoro', 'Peperone', 'Cetriolo', 'Zucchina'],
        enemyPlants: [],
        diseases: [
          { name: 'Oidio', symptoms: 'Polvere bianca sulle foglie', treatment: 'Zolfo, buona areazione', prevention: 'Evitare ristagni idrici e ombra' }
        ]
      },
      {
        name: 'Erba cipollina',
        scientificName: 'Allium schoenoprasum',
        category: 'herbs',
        description: 'Aromatica perenne dal sapore delicato di cipolla. Facilissima da coltivare in vaso.',
        wateringFrequency: 3,
        plantingPeriod: 'Marzo-Settembre',
        harvestPeriod: 'Tutto l\'anno',
        soilType: 'Terreno fertile, ben drenato, pH 6-7',
        sunExposure: 'Sole pieno o mezz\'ombra',
        fertilizing: 'Concime azotato leggero in primavera e estate',
        pruning: 'Tagliare le foglie a 3 cm dalla base; taglia regolare stimola la crescita',
        careNotes: 'Dividere il cespo ogni 2-3 anni per rinvigorire la pianta. I fiori viola sono commestibili.',
        companionPlants: ['Carota', 'Fragola', 'Pomodoro', 'Lattuga'],
        enemyPlants: ['Fagiolo', 'Pisello'],
        diseases: [
          { name: 'Ruggine', symptoms: 'Pustole arancioni sulle foglie', treatment: 'Rimuovere le foglie colpite', prevention: 'Buona areazione, evitare ristagni' }
        ]
      },
      {
        name: 'Aneto',
        scientificName: 'Anethum graveolens',
        category: 'herbs',
        description: 'Aromatica annuale dal sapore delicato. Ottima con pesce, cetrioli e formaggi.',
        wateringFrequency: 3,
        plantingPeriod: 'Marzo-Luglio (semina diretta)',
        harvestPeriod: 'Maggio-Settembre',
        soilType: 'Terreno leggero, fertile, ben drenato, pH 5.5-6.5',
        sunExposure: 'Pieno sole',
        fertilizing: 'Minima',
        pruning: 'Raccogliere le foglie prima della fioritura per il sapore migliore',
        careNotes: 'Seminare direttamente (non trapianta bene). Va a seme rapidamente: seminare in successione. Si risemina facilmente da solo.',
        companionPlants: ['Cetriolo', 'Cavolo', 'Lattuga'],
        enemyPlants: ['Finocchio', 'Carota', 'Pomodoro'],
        diseases: [
          { name: 'Oidio', symptoms: 'Polvere bianca su foglie e steli', treatment: 'Zolfo', prevention: 'Buona areazione' }
        ]
      },
      {
        name: 'Lavanda',
        scientificName: 'Lavandula angustifolia',
        category: 'herbs',
        description: 'Aromatica perenne ornamentale e officinale. Repellente naturale per insetti.',
        wateringFrequency: 10,
        plantingPeriod: 'Marzo-Maggio o Settembre-Ottobre',
        harvestPeriod: 'Giugno-Luglio (in fioritura)',
        soilType: 'Terreno povero, calcareo, molto drenato, pH 6.5-8',
        sunExposure: 'Pieno sole',
        fertilizing: 'Minima o nulla',
        pruning: 'Potatura importante dopo la fioritura (tagliare di 1/3); non tagliare nel legno vecchio',
        careNotes: 'Pianta xerofila mediterranea. Odia i ristagni idrici. Eccellente come bordo e repellente.',
        companionPlants: ['Pomodoro', 'Carota', 'Rosa', 'Cavolo'],
        enemyPlants: [],
        diseases: [
          { name: 'Marciume radicale', symptoms: 'Pianta che muore lentamente, radici nerastre', treatment: 'Nessuna cura; rimuovere la pianta', prevention: 'Drenaggio perfetto, non irrigare in eccesso' },
          { name: 'Xilotrogo (Aromia moschata)', symptoms: 'Fori nel legno, segatura, rami secchi', treatment: 'Tagliare e bruciare i rami colpiti', prevention: 'Piante vigorose e sane resistono meglio' }
        ]
      },
      // ── FRUTTI ────────────────────────────────────────────────────────
      {
        name: 'Fragola',
        scientificName: 'Fragaria × ananassa',
        category: 'fruits',
        description: 'Frutto dolce e profumato, pianta perenne. Esistono varietà unifere e rifiorenti.',
        wateringFrequency: 2,
        plantingPeriod: 'Settembre-Ottobre (autunnale) o Marzo-Aprile (primaverile)',
        harvestPeriod: 'Maggio-Giugno (unifere) o Maggio-Ottobre (rifiorenti)',
        soilType: 'Terreno fertile, acido, ben drenato, pH 5.5-6.5',
        sunExposure: 'Pieno sole',
        fertilizing: 'Concime organico in pre-impianto; potassio durante la fruttificazione',
        pruning: 'Rimuovere i stoloni (barbe) regolarmente; rinnovare le piante ogni 3 anni',
        careNotes: 'Pacciamatura con paglia per tenere i frutti puliti e mantenere l\'umidità. Raccogliere con il picciolo.',
        companionPlants: ['Aglio', 'Cipolla', 'Lattuga', 'Spinacio', 'Timo', 'Salvia'],
        enemyPlants: ['Cavolo', 'Finocchio', 'Pomodoro'],
        diseases: [
          { name: 'Oidio della fragola', symptoms: 'Polvere bianca sulle foglie, frutti deformati e imbiancati', treatment: 'Zolfo, bicarbonato', prevention: 'Varietà resistenti, buona areazione, non bagnare le foglie' },
          { name: 'Botrytis (muffa grigia)', symptoms: 'Muffa grigia cotonosa sui frutti', treatment: 'Rimuovere i frutti colpiti, trattare con rame', prevention: 'Pacciamare, raccogliere regolarmente, buona areazione' },
          { name: 'Verticilliosi', symptoms: 'Foglie esterne avvizziscono, pianta muore', treatment: 'Rimuovere la pianta, non reimpiantare fragole per 4 anni', prevention: 'Rotazione, evitare terreni con patate o pomodori precedenti' },
          { name: 'Ragnetto rosso', symptoms: 'Foglie bronzate e punteggiate', treatment: 'Zolfo, acari predatori', prevention: 'Irrigazione regolare, umidità' },
          { name: 'Oziorrinco', symptoms: 'Tacche semicircolari ai bordi delle foglie (adulto); radici rosicchiate (larva)', treatment: 'Nematodi entomopatogeni (Heterorhabditis) contro le larve', prevention: 'Reti, cattura notturna degli adulti' }
        ]
      },
      {
        name: 'Pomodoro ciliegino',
        scientificName: 'Solanum lycopersicum var. cerasiforme',
        category: 'fruits',
        description: 'Varietà mini del pomodoro, dolcissima e produttiva. Ottima in vaso e in orto.',
        wateringFrequency: 2,
        plantingPeriod: 'Marzo-Maggio',
        harvestPeriod: 'Luglio-Ottobre',
        soilType: 'Terreno fertile, ben drenato, pH 6-7',
        sunExposure: 'Pieno sole',
        fertilizing: 'Come il pomodoro comune: potassio e fosforo in fruttificazione',
        pruning: 'Come il pomodoro: eliminare le femminelle',
        careNotes: 'Più tollerante del pomodoro comune. Ottimo in vaso grande. Raccogliere i frutti a mazzetti.',
        companionPlants: ['Basilico', 'Carota', 'Prezzemolo', 'Aglio'],
        enemyPlants: ['Finocchio', 'Patata'],
        diseases: [
          { name: 'Peronospora', symptoms: 'Come il pomodoro comune', treatment: 'Rame ogni 7-10 giorni', prevention: 'Evitare bagnatura fogliare' },
          { name: 'Afidi', symptoms: 'Colonie sui germogli', treatment: 'Piretro, sapone molle', prevention: 'Consociazione con basilico' }
        ]
      },
      {
        name: 'Lampone',
        scientificName: 'Rubus idaeus',
        category: 'fruits',
        description: 'Piccolo frutto estivo o autunnale dal sapore intenso. Molto produttivo.',
        wateringFrequency: 3,
        plantingPeriod: 'Novembre-Marzo (a riposo vegetativo)',
        harvestPeriod: 'Giugno-Luglio (estivi) o Agosto-Ottobre (rifiorenti)',
        soilType: 'Terreno acido, fresco, ben drenato, ricco di humus, pH 5.5-6.5',
        sunExposure: 'Sole pieno o mezz\'ombra',
        fertilizing: 'Letame maturo in autunno; concime bilanciato a primavera',
        pruning: 'Tagliare i rami fruttificati a terra dopo il raccolto; lasciare solo i rami nuovi',
        careNotes: 'Tutorare i rami con paletti e fili. Pacciamare per mantenere freschezza e acidità del suolo.',
        companionPlants: ['Aglio', 'Tanaceto', 'Insalata'],
        enemyPlants: ['Fragola', 'Patata'],
        diseases: [
          { name: 'Peronospora del lampone', symptoms: 'Macchie bianche sui frutti, muffa grigia', treatment: 'Rame', prevention: 'Buona areazione, non bagnare le foglie' },
          { name: 'Botrytis (muffa grigia)', symptoms: 'Muffa grigia sui frutti, marciume', treatment: 'Rimuovere i frutti colpiti', prevention: 'Raccolta frequente, buona areazione' },
          { name: 'Afide del lampone', symptoms: 'Colonie sulle foglie giovani', treatment: 'Piretro, sapone molle', prevention: 'Insetti utili, monitoraggio' }
        ]
      },
      {
        name: 'Mirtillo',
        scientificName: 'Vaccinium corymbosum',
        category: 'fruits',
        description: 'Piccolo frutto blu ricco di antiossidanti. Richiede terreno acido.',
        wateringFrequency: 3,
        plantingPeriod: 'Novembre-Marzo',
        harvestPeriod: 'Luglio-Agosto',
        soilType: 'Terreno molto acido, torboso, drenato, pH 4.5-5.5',
        sunExposure: 'Sole pieno o mezz\'ombra',
        fertilizing: 'Concimi acidificanti (solfato di ammonio); letame di conifere',
        pruning: 'Potatura di ringiovanimento ogni 2-3 anni; eliminare rami vecchi e secchi',
        careNotes: 'Fondamentale mantenere il pH acido. Pacciamatura con trucioli di pino. Piantare 2 varietà per l\'impollinazione incrociata.',
        companionPlants: ['Rododendro', 'Azalea', 'Erica'],
        enemyPlants: [],
        diseases: [
          { name: 'Mummificazione dei frutti (Monilinia)', symptoms: 'Frutti che si disseccano e rimangono sulla pianta', treatment: 'Rimuovere i frutti mummificati', prevention: 'Buona areazione, varietà resistenti' },
          { name: 'Cancro del fusto (Phomopsis)', symptoms: 'Cancri sulle corteccia, disseccamento rami', treatment: 'Tagliare i rami colpiti, disinfettare', prevention: 'Piante vigorose, evitare ferite' }
        ]
      },
      {
        name: 'Uva da tavola',
        scientificName: 'Vitis vinifera',
        category: 'fruits',
        description: 'Vite coltivata per frutti freschi. Italia è tra i maggiori produttori mondiali.',
        wateringFrequency: 7,
        plantingPeriod: 'Novembre-Marzo (barbatelle)',
        harvestPeriod: 'Agosto-Ottobre',
        soilType: 'Terreno profondo, sciolto, ben drenato, calcareo, pH 6-7.5',
        sunExposure: 'Pieno sole, posizione calda',
        fertilizing: 'Letame maturo in autunno; potassio prima della maturazione',
        pruning: 'Potatura invernale fondamentale (Guyot, cordone speronato); diradamento grappoli in estate',
        careNotes: 'Necessita di struttura robusta (pergola, spalliera). Trattamenti preventivi contro peronospora e oidio.',
        companionPlants: ['Basilico', 'Aneto', 'Geranio', 'Rosa'],
        enemyPlants: ['Cavolo', 'Radici'],
        diseases: [
          { name: 'Peronospora della vite (Plasmopara viticola)', symptoms: 'Macchie oleose sulle foglie, muffa bianca sotto, disseccamento grappoli', treatment: 'Rame ogni 7-10 giorni preventivamente dalla fase prefioritura', prevention: 'Varietà resistenti (PIWI), buona areazione, potatura corretta' },
          { name: 'Oidio della vite (Uncinula necator)', symptoms: 'Polvere bianca su foglie e acini, cracking dei frutti', treatment: 'Zolfo ogni 7-10 giorni in fase vegetativa', prevention: 'Varietà resistenti, sfogliatura per aerazione' },
          { name: 'Botrytis (muffa grigia)', symptoms: 'Muffa grigia sui grappoli, marciume', treatment: 'Rimuovere i grappoli colpiti; fungicidi specifici', prevention: 'Sfogliatura nella zona grappoli, diradamento' },
          { name: 'Fillossera (Daktulosphaira vitifoliae)', symptoms: 'Radici con nodosità, pianta deperisce lentamente', treatment: 'Nessuna cura efficace', prevention: 'Innesto su portinnesti resistenti (obbligatorio in Italia)' }
        ]
      },
      {
        name: 'Fico',
        scientificName: 'Ficus carica',
        category: 'fruits',
        description: 'Albero da frutto mediterraneo rustico e longevo. Frutti dolcissimi, freschi o essiccati.',
        wateringFrequency: 14,
        plantingPeriod: 'Novembre-Marzo',
        harvestPeriod: 'Luglio-Agosto (fioroni) e Settembre-Ottobre (forniti)',
        soilType: 'Terreno qualsiasi, anche povero, ben drenato, pH 6-8',
        sunExposure: 'Pieno sole, posizione calda',
        fertilizing: 'Poco; letame maturo in autunno ogni 2-3 anni',
        pruning: 'Potatura invernale: eliminare rami secchi e incrociati; contenere l\'altezza',
        careNotes: 'Pianta rustica e siccitosa una volta adulta. La linfa è urticante. Produce senza impollinazione.',
        companionPlants: ['Basilico', 'Menta', 'Ruta'],
        enemyPlants: [],
        diseases: [
          { name: 'Cancro rameale (Phomopsis cinerescens)', symptoms: 'Cancri sulle branche, essudati gommosi', treatment: 'Tagliare le parti colpite, disinfettare con rame', prevention: 'Potatura corretta, evitare ferite' },
          { name: 'Cocciniglia del fico', symptoms: 'Scudetti bianchi sui rami, deperimento', treatment: 'Olio bianco in inverno, piretro', prevention: 'Piante vigorose, insetti utili' }
        ]
      },
      {
        name: 'Limone',
        scientificName: 'Citrus limon',
        category: 'fruits',
        description: 'Agrume sempreverdi simbolo del Mediterraneo. In vaso al Nord, in piena terra al Sud.',
        wateringFrequency: 5,
        plantingPeriod: 'Aprile-Maggio (trapianto in vaso o piena terra al Sud)',
        harvestPeriod: 'Tutto l\'anno (con picchi in primavera e autunno)',
        soilType: 'Terreno fertile, ben drenato, leggermente acido, pH 5.5-6.5',
        sunExposure: 'Pieno sole, temperatura minima 5°C',
        fertilizing: 'Concimi specifici per agrumi ricchi di ferro e microelementi, ogni 4-6 settimane in primavera-estate',
        pruning: 'Eliminare i polloni, i rami secchi e quelli che entrano nell\'interno della chioma',
        careNotes: 'Al Nord coltivare in vaso e portare all\'interno sopra 0°C. Irrigare regolarmente ma senza ristagni. La clorosi ferrica (foglie gialle) è frequente.',
        companionPlants: ['Basilico', 'Lavanda', 'Menta'],
        enemyPlants: [],
        diseases: [
          { name: 'Clorosi ferrica', symptoms: 'Foglie gialle con nervature verdi', treatment: 'Chelato di ferro, acidificare il terreno', prevention: 'Terreno acido, concimi specifici per agrumi' },
          { name: 'Cocciniglia bruna (Coccus hesperidum)', symptoms: 'Scudetti bruni sui rami, melata, fumaggine', treatment: 'Olio bianco, piretro, spazzolare i rami', prevention: 'Monitoraggio, insetti utili (parassitoidi)' },
          { name: 'Minatore fogliare degli agrumi', symptoms: 'Gallerie tortuose nelle foglie giovani', treatment: 'Piretro sui germogli giovani', prevention: 'Evitare concimazioni azotate tardive che stimolano vegetazione giovane' },
          { name: 'Tristeza degli agrumi (CTV virus)', symptoms: 'Pianta che deperisce progressivamente', treatment: 'Nessuna cura; rimuovere la pianta', prevention: 'Piante certificate, controllo degli afidi vettori' }
        ]
      },
      // ── ALBERI DA FRUTTO ──────────────────────────────────────────────
      {
        name: 'Melo',
        scientificName: 'Malus domestica',
        category: 'trees',
        description: 'Albero da frutto più coltivato in Italia. Centinaia di varietà, da quelle antiche alle moderne.',
        wateringFrequency: 7,
        plantingPeriod: 'Novembre-Marzo (a riposo)',
        harvestPeriod: 'Luglio-Novembre (secondo la varietà)',
        soilType: 'Terreno profondo, fertile, ben drenato, pH 6-7',
        sunExposure: 'Pieno sole',
        fertilizing: 'Letame maturo in autunno; concime minerale a primavera',
        pruning: 'Potatura invernale importante (forma a vaso o palmetta); potatura verde estiva',
        careNotes: 'Necessita di impollinatori (varietà diverse vicine). Diradamento dei frutti per qualità superiore. Trattamenti preventivi contro ticchiolatura e oidio.',
        companionPlants: ['Nasturzio', 'Lavanda', 'Achillea', 'Aglio'],
        enemyPlants: ['Patata', 'Noce'],
        diseases: [
          { name: 'Ticchiolatura (Venturia inaequalis)', symptoms: 'Macchie scure sulle foglie e sui frutti', treatment: 'Rame e zolfo preventivi, specialmente dopo le piogge', prevention: 'Varietà resistenti, raccolta foglie cadute, buona areazione' },
          { name: 'Oidio del melo', symptoms: 'Polvere bianca su foglie e germogli giovani', treatment: 'Zolfo, bicarbonato', prevention: 'Varietà resistenti, potatura corretta' },
          { name: 'Carpocapsa (Cydia pomonella)', symptoms: 'Vermi nei frutti, fori con escrementi', treatment: 'Trappole a feromoni, Bacillus thuringiensis, spinosad', prevention: 'Trappole cromotropiche, bande trappola sul tronco' },
          { name: 'Afide lanigero (Eriosoma lanigerum)', symptoms: 'Ciuffi cotonosi bianchi sui rami, cancri', treatment: 'Olio bianco, piretro, spazzolare le colonie', prevention: 'Insetti utili (Aphelinus mali), evitare ferite' }
        ]
      },
      {
        name: 'Pero',
        scientificName: 'Pyrus communis',
        category: 'trees',
        description: 'Albero elegante con fioritura precoce. Frutti succosi con molte varietà italiane pregiate.',
        wateringFrequency: 7,
        plantingPeriod: 'Novembre-Marzo',
        harvestPeriod: 'Luglio-Ottobre (secondo la varietà)',
        soilType: 'Terreno profondo, argilloso-limoso, ben drenato, pH 6-7',
        sunExposure: 'Pieno sole',
        fertilizing: 'Letame in autunno; azoto moderato in primavera',
        pruning: 'Potatura invernale; eliminare i rami interni per aerare la chioma',
        careNotes: 'La fioritura precoce è sensibile alle gelate tardive. Necessita di impollinatori. Raccogliere leggermente acerbo e far maturare in casa.',
        companionPlants: ['Nasturzio', 'Lavanda', 'Aglio'],
        enemyPlants: ['Noce', 'Patata'],
        diseases: [
          { name: 'Colpo di fuoco batterico (Erwinia amylovora)', symptoms: 'Rami che appassiscono improvvisamente come bruciati dal fuoco, essudati ambrati', treatment: 'Tagliare i rami colpiti a 30 cm sotto la parte sana; disinfettare gli attrezzi', prevention: 'Varietà resistenti, evitare potature tardive, ridurre azoto' },
          { name: 'Ticchiolatura del pero', symptoms: 'Macchie vellutate sulle foglie e croste sui frutti', treatment: 'Rame e ziram preventivi', prevention: 'Raccolta foglie cadute, buona areazione' },
          { name: 'Carpocapsa', symptoms: 'Larve nei frutti', treatment: 'Come per il melo', prevention: 'Trappole a feromoni' }
        ]
      },
      {
        name: 'Ciliegio',
        scientificName: 'Prunus avium',
        category: 'trees',
        description: 'Albero dalla fioritura spettacolare e dai frutti dolci. Simbolo della primavera italiana.',
        wateringFrequency: 7,
        plantingPeriod: 'Novembre-Marzo',
        harvestPeriod: 'Maggio-Luglio',
        soilType: 'Terreno profondo, sciolto, calcareo, ben drenato, pH 6-7.5',
        sunExposure: 'Pieno sole',
        fertilizing: 'Letame maturo in autunno; poco azoto',
        pruning: 'Potatura minima (le ferite sono pericolose); solo rami secchi e incrociati',
        careNotes: 'Necessita di impollinatori (piantare 2 varietà). I frutti vanno raccolti appena maturi per evitare coccinea. Le ciliegie sui rami attraggono uccelli.',
        companionPlants: ['Aglio', 'Nasturzio', 'Allium'],
        enemyPlants: ['Patata', 'Peperone'],
        diseases: [
          { name: 'Monilia (marciume dei frutti)', symptoms: 'Frutti che marciscono con anelli di spore beige', treatment: 'Rimuovere i frutti colpiti; rame in fioritura', prevention: 'Raccolta immediata dei frutti maturi, buona areazione' },
          { name: 'Corineo (Coryneum beijerinckii)', symptoms: 'Macchie angolari sulle foglie che poi cadono (fori)', treatment: 'Rame in pre-fogliazione', prevention: 'Raccolta foglie infette, rame autunnale' },
          { name: 'Mosca delle ciliegie (Rhagoletis cerasi)', symptoms: 'Larve bianche nei frutti', treatment: 'Trappole a feromoni cromotropiche; kaolin argilloso', prevention: 'Reti anti-insetto, raccolta precoce' }
        ]
      },
      {
        name: 'Pesco',
        scientificName: 'Prunus persica',
        category: 'trees',
        description: 'Albero da frutto estivo con fioritura rosea primaverile. Pesche, nettarine e percoche.',
        wateringFrequency: 7,
        plantingPeriod: 'Novembre-Marzo',
        harvestPeriod: 'Giugno-Settembre (secondo la varietà)',
        soilType: 'Terreno leggero, sabbioso-limoso, ben drenato, pH 6-7',
        sunExposure: 'Pieno sole',
        fertilizing: 'Letame in autunno; azoto in primavera; potassio in estate',
        pruning: 'Potatura verde importante (giugno): diradamento frutti e rami; potatura invernale',
        careNotes: 'Diradamento dei frutti fondamentale (1 ogni 15-20 cm) per ottenere pesca di qualità. Sensibile alla bolla.',
        companionPlants: ['Aglio', 'Tanaceto', 'Basilico', 'Nasturzio'],
        enemyPlants: ['Noce', 'Patata'],
        diseases: [
          { name: 'Bolla del pesco (Taphrina deformans)', symptoms: 'Foglie bollose, distorte, rosso-rosa in primavera', treatment: 'Rame in pre-gemmazione (fine inverno, obbligatorio)', prevention: 'Trattamento preventivo rame a fine inverno, prima del rigonfiamento gemme' },
          { name: 'Monilia', symptoms: 'Frutti che marciscono con muffe beige', treatment: 'Rimuovere i frutti colpiti, rame', prevention: 'Diradamento, raccolta tempestiva' },
          { name: 'Afide verde del pesco (Myzus persicae)', symptoms: 'Foglie arricciate e arrossate, colonie sulle foglie giovani', treatment: 'Piretro, sapone molle, olio bianco in inverno', prevention: 'Insetti utili, monitoraggio precoce' },
          { name: 'Cidia (Cydia molesta)', symptoms: 'Germogli apicali appassiti, larve nei frutti', treatment: 'Trappole a feromoni, Bacillus thuringiensis', prevention: 'Monitoraggio con trappole' }
        ]
      },
      {
        name: 'Olivo',
        scientificName: 'Olea europaea',
        category: 'trees',
        description: 'Albero simbolo del Mediterraneo, secolare e longevo. Produce olive per olio e da tavola.',
        wateringFrequency: 14,
        plantingPeriod: 'Marzo-Maggio o Settembre-Ottobre',
        harvestPeriod: 'Ottobre-Dicembre (raccolta olive)',
        soilType: 'Terreno qualsiasi, calcareo, ben drenato, anche povero, pH 6-8.5',
        sunExposure: 'Pieno sole, caldo, posizione riparata dal freddo',
        fertilizing: 'Letame maturo ogni 2-3 anni; concime azotato in primavera',
        pruning: 'Potatura biennale dopo la raccolta: aerare la chioma, eliminare succhioni',
        careNotes: 'Pianta xerofila e longeva. Teme le gelate severe (sotto -8°C). In vaso al Nord portare in riparo.',
        companionPlants: ['Lavanda', 'Timo', 'Rosmarino', 'Aglio'],
        enemyPlants: [],
        diseases: [
          { name: 'Mosca dell\'olivo (Bactrocera oleae)', symptoms: 'Larve nelle olive, fori di uscita, marciume', treatment: 'Trappole a feromoni + proteina idrolizzata; spinosad; kaolin argilloso', prevention: 'Varietà meno suscettibili, raccolta precoce' },
          { name: 'Occhio di pavone (Spilocaea oleagina)', symptoms: 'Macchie tonde con alone giallo sulle foglie, defoguazione', treatment: 'Rame in autunno e fine inverno', prevention: 'Potatura per aerare, raccolta foglie cadute' },
          { name: 'Verticilliosi', symptoms: 'Rami che seccano improvvisamente', treatment: 'Tagliare i rami colpiti, disinfettare', prevention: 'Evitare terreni pesanti con ristagni' }
        ]
      },
      {
        name: 'Fico d\'India',
        scientificName: 'Opuntia ficus-indica',
        category: 'trees',
        description: 'Pianta succulenta con frutti dolci e colorati. Tipica del Sud Italia, Sicilia e Sardegna.',
        wateringFrequency: 14,
        plantingPeriod: 'Aprile-Maggio',
        harvestPeriod: 'Agosto-Ottobre',
        soilType: 'Terreno povero, sabbioso, molto ben drenato, pH 6-8',
        sunExposure: 'Pieno sole',
        fertilizing: 'Minima; potassio prima della fruttificazione',
        pruning: 'Eliminare le pale soprannumerarie; raccogliere i frutti con guanti spessi',
        careNotes: 'Maneggiare sempre con guanti (spine e glochidi). Pianta xerofila: rarissime irrigazioni. Ottima per climi siccitosi.',
        companionPlants: [],
        enemyPlants: [],
        diseases: [
          { name: 'Cocciniglia del fico d\'India (Dactylopius coccus)', symptoms: 'Ciuffi cotonosi bianchi sulle pale, deperimento', treatment: 'Olio bianco, alcol, rimozione meccanica', prevention: 'Monitoraggio, insetti utili' }
        ]
      },
      // ── FIORI / ORNAMENTALI UTILI ─────────────────────────────────────
      {
        name: 'Nasturzio',
        scientificName: 'Tropaeolum majus',
        category: 'flowers',
        description: 'Fiore commestibile e ottimo alleato dell\'orto. Attira gli afidi lontano dagli ortaggi.',
        wateringFrequency: 5,
        plantingPeriod: 'Marzo-Maggio',
        harvestPeriod: 'Giugno-Ottobre',
        soilType: 'Terreno povero, ben drenato; in terreni ricchi produce foglie a scapito dei fiori',
        sunExposure: 'Sole pieno o mezz\'ombra',
        fertilizing: 'Non necessaria; l\'eccesso di azoto favorisce le foglie',
        pruning: 'Rimuovere i fiori appassiti per prolungare la fioritura',
        careNotes: 'Pianta trappola per gli afidi. I fiori e le foglie sono commestibili (sapore piccante). Si risemina da sola.',
        companionPlants: ['Pomodoro', 'Zucchina', 'Fagiolo', 'Cetriolo', 'Cavolo'],
        enemyPlants: [],
        diseases: [
          { name: 'Afidi neri (pianta trappola)', symptoms: 'Colonie di afidi neri - normale, è il suo ruolo', treatment: 'Lasciare la pianta trappola; rimuovere se infestazione eccessiva', prevention: 'Questa è la sua funzione nell\'orto' }
        ]
      },
      {
        name: 'Calendula',
        scientificName: 'Calendula officinalis',
        category: 'flowers',
        description: 'Fiore arancione dalle proprietà officinali e insetticida. Repelle la mosca bianca e i nematodi.',
        wateringFrequency: 5,
        plantingPeriod: 'Marzo-Maggio (primavera) o Settembre (autunno)',
        harvestPeriod: 'Aprile-Novembre',
        soilType: 'Terreno qualsiasi, ben drenato, pH 5.5-7',
        sunExposure: 'Pieno sole',
        fertilizing: 'Minima',
        pruning: 'Rimuovere i fiori appassiti per prolungare la fioritura',
        careNotes: 'Si risemina facilmente. Eccellente consociata con gli ortaggi per repellere insetti dannosi. I petali sono commestibili.',
        companionPlants: ['Pomodoro', 'Asparago', 'Carota', 'Cavolo', 'Peperone'],
        enemyPlants: [],
        diseases: [
          { name: 'Oidio', symptoms: 'Polvere bianca sulle foglie', treatment: 'Zolfo', prevention: 'Buona areazione, rimuovere fiori appassiti' }
        ]
      },
      {
        name: 'Girasole',
        scientificName: 'Helianthus annuus',
        category: 'flowers',
        description: 'Fiore annuale alto e spettacolare. Attira impollinatori e i semi sono commestibili.',
        wateringFrequency: 5,
        plantingPeriod: 'Aprile-Giugno',
        harvestPeriod: 'Agosto-Settembre (semi)',
        soilType: 'Terreno qualsiasi, ben drenato, pH 6-7.5',
        sunExposure: 'Pieno sole (obbligatorio)',
        fertilizing: 'Moderata; potassio per i semi',
        pruning: 'Non necessaria',
        careNotes: 'Ottimo per attirare insetti impollinatori. Le radici rilasciano allelopatici che inibiscono alcune piante vicine.',
        companionPlants: ['Cetriolo', 'Zucchina', 'Mais', 'Fagiolo'],
        enemyPlants: ['Patata', 'Fagiolo rampicante'],
        diseases: [
          { name: 'Peronospora del girasole', symptoms: 'Muffa bianca sotto le foglie', treatment: 'Rame', prevention: 'Rotazione, buona areazione' },
          { name: 'Sclerotinia', symptoms: 'Marciume cotonoso bianco al colletto e sul capolino', treatment: 'Rimuovere le piante colpite', prevention: 'Rotazione, drenaggio' }
        ]
      },
      {
        name: 'Camomilla',
        scientificName: 'Matricaria chamomilla',
        category: 'flowers',
        description: 'Pianta officinale con fiori bianchi profumati. Stimola la crescita delle piante vicine.',
        wateringFrequency: 5,
        plantingPeriod: 'Marzo-Aprile o Settembre',
        harvestPeriod: 'Maggio-Luglio',
        soilType: 'Terreno povero, ben drenato, pH 5.6-7.5',
        sunExposure: 'Sole pieno',
        fertilizing: 'Non necessaria',
        pruning: 'Raccogliere i fiori aperti regolarmente',
        careNotes: 'Si risemina facilmente. Il tè di camomilla irrorato sulle piante è un antifungino naturale. Attira insetti utili.',
        companionPlants: ['Cavolo', 'Cipolla', 'Cetriolo', 'Carota'],
        enemyPlants: ['Menta'],
        diseases: []
      },
      // ── ALTRI ORTAGGI ─────────────────────────────────────────────────
      {
        name: 'Asparago',
        scientificName: 'Asparagus officinalis',
        category: 'vegetables',
        description: 'Ortaggio perenne dal ciclo lungo: richiede 2-3 anni prima del primo raccolto.',
        wateringFrequency: 5,
        plantingPeriod: 'Marzo-Aprile (zampe di 1 anno)',
        harvestPeriod: 'Aprile-Giugno (dalla 3° stagione)',
        soilType: 'Terreno sabbioso, leggero, drenato, pH 6.5-7.5',
        sunExposure: 'Pieno sole',
        fertilizing: 'Letame abbondante alla messa a dimora; concime azotato dopo il raccolto',
        pruning: 'Tagliare i turioni a 2-3 cm dal suolo; lasciare crescere la felce dopo il raccolto',
        careNotes: 'Investimento a lungo termine (dura 15-20 anni). Non raccogliere i primi 2 anni. Diserbo importante.',
        companionPlants: ['Pomodoro', 'Prezzemolo', 'Basilico', 'Calendula'],
        enemyPlants: ['Cipolla', 'Aglio', 'Patata'],
        diseases: [
          { name: 'Ruggine dell\'asparago (Puccinia asparagi)', symptoms: 'Pustole arancioni poi nere sui rametti', treatment: 'Rame, zolfo', prevention: 'Varietà resistenti, buona areazione, raccolta foglie' },
          { name: 'Stemfiliosi', symptoms: 'Macchie brune sulle ramificazioni', treatment: 'Rame', prevention: 'Rotazione, buona areazione' },
          { name: 'Criocera dell\'asparago', symptoms: 'Larve e adulti che defoliano la pianta', treatment: 'Piretro, raccolta manuale', prevention: 'Monitoraggio in primavera' }
        ]
      },
      {
        name: 'Carciofo',
        scientificName: 'Cynara cardunculus var. scolymus',
        category: 'vegetables',
        description: 'Ortaggio tipicamente italiano, perenne. Testa e cuore commestibili. Pianta monumentale.',
        wateringFrequency: 4,
        plantingPeriod: 'Agosto-Settembre (ovoli/carducci)',
        harvestPeriod: 'Ottobre-Maggio',
        soilType: 'Terreno profondo, fertile, argilloso-limoso, pH 6-7',
        sunExposure: 'Pieno sole',
        fertilizing: 'Abbondante letame o compost alla messa a dimora; azoto in autunno-inverno',
        pruning: 'Eliminare le foglie vecchie basali; raccogliere il capolino prima che si apra',
        careNotes: 'Pianta che occupa molto spazio (1 m²). Rinnovare ogni 3-4 anni. In zone fredde coprire con paglia in inverno.',
        companionPlants: ['Carota', 'Prezzemolo', 'Cavolo'],
        enemyPlants: ['Patata'],
        diseases: [
          { name: 'Peronospora del carciofo', symptoms: 'Muffa bianca-grigiastra sulle foglie e sui capolini', treatment: 'Rame', prevention: 'Buona areazione, evitare ristagni' },
          { name: 'Afide grigio del carciofo (Capitophorus)', symptoms: 'Colonie grigiastre sulle foglie e sui capolini', treatment: 'Piretro, sapone molle', prevention: 'Monitoraggio precoce, insetti utili' }
        ]
      },
      {
        name: 'Cipollotto',
        scientificName: 'Allium cepa var. aggregatum',
        category: 'vegetables',
        description: 'Variante della cipolla coltivata per il fusto verde fresco. Ciclo brevissimo.',
        wateringFrequency: 3,
        plantingPeriod: 'Tutto l\'anno (in successione)',
        harvestPeriod: 'Tutto l\'anno (30-60 giorni dalla semina)',
        soilType: 'Terreno fertile, ben drenato, pH 6-7',
        sunExposure: 'Sole pieno',
        fertilizing: 'Azoto leggero ogni 2 settimane',
        pruning: 'Non necessaria',
        careNotes: 'Coltura velocissima. Ottimo in vaso. Raccogliere quando il fusto è alto 20-25 cm.',
        companionPlants: ['Carota', 'Lattuga', 'Pomodoro'],
        enemyPlants: ['Fagiolo', 'Pisello'],
        diseases: [
          { name: 'Peronospora', symptoms: 'Muffa grigio-viola sulle foglie', treatment: 'Rame', prevention: 'Buona areazione, evitare bagnatura fogliare' }
        ]
      }
    ]);
    plantTypeIds = ids;
    console.log(`[seed] Inserite ${plantTypeIds.length} piante nel catalogo. IDs:`, plantTypeIds.slice(0, 5));
  } else {
    const types = await db.plantTypes.orderBy('id').toArray();
    plantTypeIds = types.map(t => t.id as number);
    console.log(`[seed] Catalogo già presente con ${plantTypeIds.length} piante.`);
  }

  const plantCount = await db.plants.count();

  if (plantCount === 0) {
    // Usiamo gli ID reali ottenuti dall'inserimento
    const [pomodoroId, basilacoId, zucchinaId, fragolaId, rosarinoId] = plantTypeIds;

    await db.plants.bulkAdd([
      {
        plantTypeId: pomodoroId,
        name: 'Pomodoro San Marzano',
        scientificName: 'Solanum lycopersicum',
        variety: 'San Marzano',
        plantedDate: new Date(2025, 2, 15),
        numberOfPlants: 6,
        location: 'Aiuola Sud',
        status: 'growing',
        wateringFrequency: 2,
        category: 'vegetables',
        notes: 'Richiede supporto alto. Ottimo per salse.'
      },
      {
        plantTypeId: basilacoId,
        name: 'Basilico Genovese',
        scientificName: 'Ocimum basilicum',
        plantedDate: new Date(2025, 3, 1),
        numberOfPlants: 12,
        location: 'Vaso balcone',
        status: 'growing',
        wateringFrequency: 1,
        category: 'herbs',
        notes: 'Perfetto per il pesto. Evitare ristagni d\'acqua.'
      },
      {
        plantTypeId: zucchinaId,
        name: 'Zucchine Romanesco',
        variety: 'Romanesco',
        plantedDate: new Date(2025, 3, 10),
        numberOfPlants: 4,
        location: 'Aiuola Nord',
        status: 'flowering',
        wateringFrequency: 1,
        category: 'vegetables',
        notes: 'Produzione abbondante. Raccogliere giovani.'
      },
      {
        plantTypeId: fragolaId,
        name: 'Fragole',
        scientificName: 'Fragaria × ananassa',
        plantedDate: new Date(2024, 10, 15),
        numberOfPlants: 20,
        location: 'Aiuola rialzata',
        status: 'fruiting',
        wateringFrequency: 2,
        category: 'fruits',
        notes: 'Proteggere dagli uccelli durante la maturazione.'
      },
      {
        plantTypeId: rosarinoId,
        name: 'Rosmarino',
        scientificName: 'Rosmarinus officinalis',
        plantedDate: new Date(2023, 8, 1),
        numberOfPlants: 2,
        location: 'Bordura',
        status: 'growing',
        wateringFrequency: 7,
        category: 'herbs',
        notes: 'Pianta perenne, resistente alla siccità.'
      }
    ]);

    // Aggiungi task di esempio
    const today = new Date();
    await db.tasks.bulkAdd([
      {
        title: 'Annaffiare pomodori',
        description: 'Irrigazione profonda alle radici',
        dueDate: new Date(today.getTime() + 86400000),
        completed: false,
        priority: 'high',
        category: 'watering',
        createdAt: today
      },
      {
        title: 'Raccogliere zucchine',
        description: 'Le zucchine sono pronte per il raccolto',
        dueDate: today,
        completed: false,
        priority: 'high',
        category: 'harvesting',
        createdAt: today
      },
      {
        title: 'Concimare basilico',
        description: 'Fertilizzante liquido per aromatiche',
        dueDate: new Date(today.getTime() + 7 * 86400000),
        completed: false,
        priority: 'medium',
        category: 'fertilizing',
        createdAt: today
      }
    ]);

    // Aggiungi ricette di esempio
    // Bug #2 fix: relatedPlants usa gli ID reali
    await db.recipes.bulkAdd([
      {
        title: 'Pesto alla Genovese',
        description: 'Il classico pesto fatto in casa con basilico fresco',
        ingredients: [
          '50g di basilico fresco',
          '30g di parmigiano grattugiato',
          '30g di pecorino grattugiato',
          '30g di pinoli',
          '2 spicchi d\'aglio',
          '100ml di olio extravergine d\'oliva',
          'Sale q.b.'
        ],
        instructions: [
          'Lavare e asciugare bene le foglie di basilico',
          'Mettere nel mortaio l\'aglio, i pinoli e un pizzico di sale',
          'Pestare fino ad ottenere una pasta',
          'Aggiungere il basilico a poco a poco e continuare a pestare',
          'Incorporare i formaggi grattugiati',
          'Aggiungere l\'olio a filo mescolando',
          'Conservare in frigo coperto con olio'
        ],
        prepTime: 15,
        cookTime: 0,
        servings: 4,
        difficulty: 'easy',
        relatedPlants: [basilacoId],
        tags: ['vegetariano', 'ligure', 'condimento'],
        season: ['spring', 'summer'],
        isFavorite: true
      },
      {
        title: 'Sugo di pomodoro fresco',
        description: 'Salsa di pomodoro semplice e genuina',
        ingredients: [
          '1kg di pomodori San Marzano',
          '2 spicchi d\'aglio',
          'Basilico fresco',
          '4 cucchiai di olio extravergine',
          'Sale q.b.'
        ],
        instructions: [
          'Scottare i pomodori in acqua bollente per 1 minuto',
          'Sbucciarli e tagliarli a pezzi',
          'In una padella soffriggere l\'aglio nell\'olio',
          'Aggiungere i pomodori e il sale',
          'Cuocere a fuoco medio per 30 minuti',
          'Aggiungere il basilico fresco a fine cottura',
          'Passare con il passaverdure se si preferisce una salsa liscia'
        ],
        prepTime: 15,
        cookTime: 35,
        servings: 6,
        difficulty: 'easy',
        relatedPlants: [pomodoroId, basilacoId],
        tags: ['vegetariano', 'italiano', 'salsa'],
        season: ['summer', 'autumn'],
        isFavorite: true
      },
      {
        title: 'Zucchine alla scapece',
        description: 'Zucchine fritte marinate con aceto e menta',
        ingredients: [
          '800g di zucchine',
          'Olio di semi per friggere',
          '2 spicchi d\'aglio',
          'Aceto di vino bianco',
          'Menta fresca',
          'Sale e pepe'
        ],
        instructions: [
          'Tagliare le zucchine a rondelle sottili',
          'Friggerle in abbondante olio caldo',
          'Scolarle e asciugarle su carta assorbente',
          'Disporle a strati in un contenitore',
          'Condire ogni strato con aglio tritato, menta, sale, pepe e aceto',
          'Lasciar marinare per almeno 2 ore',
          'Servire a temperatura ambiente'
        ],
        prepTime: 20,
        cookTime: 15,
        servings: 4,
        difficulty: 'medium',
        relatedPlants: [zucchinaId],
        tags: ['vegetariano', 'napoletano', 'antipasto'],
        season: ['summer'],
        isFavorite: false
      },
      // ── 15 nuove ricette ─────────────────────────────────────────────
      {
        title: "Minestrone dell'orto",
        description: 'Zuppa ricca con tutte le verdure fresche di stagione',
        ingredients: [
          '2 zucchine', '2 carote', '2 patate', '100g di fagiolini',
          '1 cipolla', '2 coste di sedano', '400g di pomodori pelati',
          '200g di pasta o riso', 'Parmigiano, olio EVO, sale, pepe'
        ],
        instructions: [
          'Tagliare tutte le verdure a dadini',
          "Soffriggere cipolla e sedano nell'olio",
          'Aggiungere carote e patate, cuocere 5 min',
          'Unire pomodori, fagiolini e zucchine',
          'Coprire con acqua e cuocere 30 min',
          'Aggiungere la pasta e cuocere al dente',
          'Servire con parmigiano e olio crudo'
        ],
        prepTime: 20, cookTime: 40, servings: 6, difficulty: 'easy',
        relatedPlants: [],
        tags: ['vegetariano', 'zuppa', 'italiano'],
        season: ['spring', 'summer', 'autumn'], isFavorite: false
      },
      {
        title: 'Caponata di Melanzane',
        description: 'Il classico agrodolce siciliano con melanzane, capperi e olive',
        ingredients: [
          '2 melanzane grandi', '2 coste di sedano', '1 cipolla grande',
          '200g di pomodori pelati', '50g di capperi sotto sale',
          '80g di olive verdi denocciolate', '3 cucchiai di aceto di vino',
          '2 cucchiai di zucchero', 'Olio EVO, sale'
        ],
        instructions: [
          'Tagliare le melanzane a cubetti, salarle e lasciarle 30 min',
          'Friggere le melanzane in abbondante olio',
          'Soffriggere cipolla e sedano in olio pulito',
          'Aggiungere pomodori e cuocere 10 min',
          'Unire capperi, olive, aceto e zucchero',
          'Aggiungere le melanzane fritte',
          'Cuocere ancora 5 min e lasciar raffreddare',
          'Servire a temperatura ambiente o il giorno dopo'
        ],
        prepTime: 40, cookTime: 30, servings: 6, difficulty: 'medium',
        relatedPlants: [],
        tags: ['vegano', 'siciliano', 'antipasto'],
        season: ['summer', 'autumn'], isFavorite: false
      },
      {
        title: 'Frittata di Zucchine',
        description: 'Frittata soffice e dorata con zucchine fresche del tuo orto',
        ingredients: [
          '3 zucchine medie', '6 uova', '50g di parmigiano grattugiato',
          "1 spicchio d'aglio", 'Basilico fresco', 'Olio EVO, sale, pepe'
        ],
        instructions: [
          'Tagliare le zucchine a rondelle sottili',
          "Soffriggere l'aglio nell'olio e aggiungere le zucchine",
          'Cuocere le zucchine fino a doratura, salare',
          'Sbattere le uova con parmigiano, sale e pepe',
          'Versare le uova sulle zucchine in padella',
          'Cuocere a fuoco basso con coperchio 8 min',
          'Girare la frittata e cuocere altri 3 min',
          'Guarnire con basilico fresco'
        ],
        prepTime: 10, cookTime: 20, servings: 4, difficulty: 'easy',
        relatedPlants: [zucchinaId],
        tags: ['vegetariano', 'italiano', 'secondo'],
        season: ['spring', 'summer'], isFavorite: true
      },
      {
        title: 'Insalata Caprese',
        description: 'La classica insalata con pomodori freschi, mozzarella e basilico',
        ingredients: [
          '4 pomodori maturi grandi', '400g di mozzarella di bufala',
          'Basilico fresco abbondante', 'Olio EVO di qualita',
          'Sale grosso, pepe nero'
        ],
        instructions: [
          'Affettare i pomodori a rondelle spesse',
          'Affettare la mozzarella della stessa dimensione',
          'Alternare fette di pomodoro e mozzarella',
          'Disporre le foglie di basilico sopra',
          'Condire con abbondante olio EVO',
          'Salare con sale grosso e pepe nero appena macinato',
          'Servire immediatamente'
        ],
        prepTime: 10, cookTime: 0, servings: 4, difficulty: 'easy',
        relatedPlants: [pomodoroId, basilacoId],
        tags: ['vegetariano', 'italiano', 'insalata', 'estivo'],
        season: ['summer'], isFavorite: true
      },
      {
        title: 'Ratatouille Provenzale',
        description: 'Stufato profumato di verdure estive alla maniera francese',
        ingredients: [
          '2 melanzane', '3 zucchine', '2 peperoni rossi', '4 pomodori maturi',
          '2 cipolle', "4 spicchi d'aglio",
          'Timo, rosmarino, basilico', 'Olio EVO, sale, pepe'
        ],
        instructions: [
          'Tagliare tutte le verdure a cubetti simili',
          'In una casseruola soffriggere cipolla e aglio',
          'Aggiungere melanzane e cuocere 5 min',
          'Unire peperoni e cuocere altri 5 min',
          'Aggiungere zucchine, pomodori e erbe aromatiche',
          'Cuocere a fuoco medio-basso 35 min mescolando',
          'Aggiustare di sale e pepe',
          'Ottima calda o fredda il giorno dopo'
        ],
        prepTime: 25, cookTime: 45, servings: 6, difficulty: 'medium',
        relatedPlants: [pomodoroId, zucchinaId],
        tags: ['vegano', 'francese', 'contorno'],
        season: ['summer', 'autumn'], isFavorite: false
      },
      {
        title: 'Gazpacho Andaluso',
        description: 'Zuppa fredda spagnola di pomodoro, perfetta d\'estate',
        ingredients: [
          '1kg di pomodori maturi', '1 cetriolo', '1 peperone verde',
          "1 spicchio d'aglio", '2 fette di pane raffermo',
          '4 cucchiai di olio EVO', '2 cucchiai di aceto di vino bianco',
          'Sale, acqua fredda'
        ],
        instructions: [
          'Ammollare il pane in acqua fredda',
          'Frullare pomodori, cetriolo, peperone e aglio',
          'Aggiungere il pane strizzato e frullare ancora',
          'Incorporare olio e aceto emulsionando',
          'Regolare la consistenza con acqua fredda',
          'Salare e filtrare se si desidera liscio',
          'Refrigerare almeno 2 ore',
          'Servire con guarnizioni di verdure a dadini'
        ],
        prepTime: 20, cookTime: 0, servings: 4, difficulty: 'easy',
        relatedPlants: [pomodoroId],
        tags: ['vegano', 'spagnolo', 'estivo', 'zuppa'],
        season: ['summer'], isFavorite: false
      },
      {
        title: 'Peperonata',
        description: 'Peperoni stufati nell\'olio con pomodoro e cipolla',
        ingredients: [
          '4 peperoni misti (rossi, gialli, verdi)', '2 cipolle',
          '400g di pomodori pelati', "3 spicchi d'aglio",
          'Basilico fresco', 'Olio EVO, sale, pepe'
        ],
        instructions: [
          'Arrostire i peperoni in forno a 200 gradi per 30 min',
          'Spellarli, privarli dei semi e tagliarli a striscioline',
          'Soffriggere cipolla e aglio nell\'olio',
          'Aggiungere i pomodori e cuocere 10 min',
          'Unire i peperoni e cuocere altri 15 min',
          'Aggiustare di sale e pepe',
          'Profumare con basilico fresco a fine cottura'
        ],
        prepTime: 15, cookTime: 55, servings: 4, difficulty: 'easy',
        relatedPlants: [pomodoroId],
        tags: ['vegano', 'italiano', 'contorno'],
        season: ['summer', 'autumn'], isFavorite: false
      },
      {
        title: "Torta Salata all'Orto",
        description: 'Torta rustica con verdure di stagione e ricotta',
        ingredients: [
          '1 rotolo di pasta brise o sfoglia',
          '300g di verdure miste (spinaci, zucchine, carote)',
          '250g di ricotta', '2 uova', '50g di parmigiano grattugiato',
          'Noce moscata, sale, pepe', '1 cipolla'
        ],
        instructions: [
          'Saltare le verdure in padella con cipolla e olio',
          'Lasciarle raffreddare e strizzarle bene',
          'Mescolare ricotta, uova, parmigiano e spezie',
          'Unire le verdure al composto di ricotta',
          'Stendere la pasta in uno stampo da 26cm',
          'Versare il ripieno e livellare',
          'Cuocere in forno a 180 gradi per 35-40 min',
          'Servire tiepida o fredda'
        ],
        prepTime: 25, cookTime: 40, servings: 6, difficulty: 'medium',
        relatedPlants: [],
        tags: ['vegetariano', 'torta', 'secondo'],
        season: ['spring', 'summer', 'autumn'], isFavorite: false
      },
      {
        title: 'Crema di Carote allo Zenzero',
        description: 'Vellutata arancione profumata con zenzero fresco',
        ingredients: [
          '600g di carote', '1 cipolla', '2cm di zenzero fresco',
          '400ml di brodo vegetale', '200ml di latte di cocco',
          'Olio EVO, sale, pepe', 'Semi di sesamo per guarnire'
        ],
        instructions: [
          'Pelare e tagliare carote e cipolla a pezzi',
          "Soffriggere cipolla e zenzero grattugiato nell'olio",
          'Aggiungere le carote e il brodo',
          'Cuocere a fuoco medio 25 min',
          'Frullare tutto con il frullatore a immersione',
          'Aggiungere il latte di cocco e mescolare',
          'Riscaldare senza bollire e regolare di sale',
          'Servire con semi di sesamo tostati'
        ],
        prepTime: 15, cookTime: 30, servings: 4, difficulty: 'easy',
        relatedPlants: [],
        tags: ['vegano', 'vellutata', 'primo'],
        season: ['autumn', 'winter'], isFavorite: false
      },
      {
        title: 'Bruschetta al Pomodoro',
        description: "L'antipasto italiano per eccellenza con pomodori freschi e basilico",
        ingredients: [
          '4 fette di pane casareccio', '4 pomodori maturi',
          "1 spicchio d'aglio", 'Basilico fresco abbondante',
          'Olio EVO di qualita', 'Sale grosso'
        ],
        instructions: [
          'Tostare le fette di pane su griglia o in forno',
          "Strofinare l'aglio sulle fette ancora calde",
          'Tagliare i pomodori a dadini piccoli',
          'Condire i pomodori con olio, sale e basilico spezzettato',
          'Distribuire il condimento sulle bruschette',
          'Servire immediatamente per mantenere la croccantezza'
        ],
        prepTime: 10, cookTime: 5, servings: 4, difficulty: 'easy',
        relatedPlants: [pomodoroId, basilacoId],
        tags: ['vegano', 'italiano', 'antipasto'],
        season: ['summer'], isFavorite: true
      },
      {
        title: 'Pomodori Ripieni di Riso',
        description: 'Pomodori grossi farciti con riso aromatico e cotti in forno',
        ingredients: [
          '6 pomodori grandi e sodi', '200g di riso',
          '1 cipolla', "2 spicchi d'aglio",
          'Basilico, prezzemolo, menta', '50g di parmigiano grattugiato',
          'Olio EVO, sale, pepe'
        ],
        instructions: [
          'Tagliare la calotta ai pomodori e svuotarli conservando la polpa',
          "Soffriggere cipolla e aglio, aggiungere la polpa dei pomodori",
          'Aggiungere il riso crudo e cuocere 5 min mescolando',
          'Unire erbe aromatiche, parmigiano, sale e pepe',
          'Riempire i pomodori con il composto',
          "Disporre in una teglia con un po' d'olio",
          'Coprire con le calotte e cuocere a 180 gradi per 45 min',
          'Lasciare intiepidire prima di servire'
        ],
        prepTime: 25, cookTime: 50, servings: 6, difficulty: 'medium',
        relatedPlants: [pomodoroId],
        tags: ['vegetariano', 'italiano', 'secondo'],
        season: ['summer'], isFavorite: false
      },
      {
        title: 'Panzanella Toscana',
        description: 'Insalata di pane raffermo con pomodori, cipolla e basilico',
        ingredients: [
          '300g di pane toscano raffermo', '4 pomodori maturi',
          '1 cipolla rossa', '1 cetriolo', 'Basilico abbondante',
          'Aceto di vino rosso', 'Olio EVO, sale'
        ],
        instructions: [
          'Tagliare il pane a pezzi e bagnarlo con acqua e aceto',
          'Strizzare bene il pane e sbriciolarlo in una ciotola',
          'Tagliare pomodori, cetriolo e cipolla a pezzi',
          'Mescolare il pane con le verdure',
          'Condire con olio EVO, aceto, sale',
          'Aggiungere il basilico spezzettato',
          'Lasciar riposare in frigo 30 min prima di servire'
        ],
        prepTime: 20, cookTime: 0, servings: 4, difficulty: 'easy',
        relatedPlants: [pomodoroId, basilacoId],
        tags: ['vegano', 'toscano', 'insalata'],
        season: ['summer'], isFavorite: false
      },
      {
        title: 'Ribollita Toscana',
        description: 'La ricca zuppa toscana con cavolo nero, fagioli e pane',
        ingredients: [
          '400g di fagioli cannellini lessi', '1 mazzo di cavolo nero',
          '2 patate', '2 carote', '2 cipolle', '3 coste di sedano',
          '400g di pomodori pelati', '4 fette di pane toscano raffermo',
          'Aglio, rosmarino, olio EVO, sale'
        ],
        instructions: [
          'Soffriggere verdure tritate in abbondante olio',
          'Aggiungere pomodori, patate e cuocere 10 min',
          'Unire il cavolo nero a striscioline e i fagioli',
          'Coprire con acqua e cuocere 40 min a fuoco lento',
          'Schiacciare parte dei fagioli per addensare',
          'Disporre il pane a strati nella zuppa',
          'Cuocere ancora 10 min',
          "Servire con filo d'olio crudo e pepe"
        ],
        prepTime: 30, cookTime: 60, servings: 6, difficulty: 'medium',
        relatedPlants: [],
        tags: ['vegano', 'toscano', 'zuppa', 'invernale'],
        season: ['autumn', 'winter'], isFavorite: false
      },
      {
        title: 'Salsa Verde alle Erbe',
        description: 'Condimento fresco a base di erbe aromatiche per carni e pesci',
        ingredients: [
          '1 mazzo di prezzemolo', '10 foglie di basilico',
          '1 cucchiaio di capperi', "1 spicchio d'aglio",
          '1 fetta di pane raffermo', 'Aceto di vino bianco',
          'Olio EVO, sale'
        ],
        instructions: [
          "Ammollare il pane nell'aceto e strizzarlo",
          'Tritare finemente prezzemolo e basilico',
          'Aggiungere capperi e aglio tritati',
          'Unire il pane ammollato',
          'Emulsionare con olio EVO fino a ottenere una salsa',
          'Regolare di sale e aggiungere altro aceto se serve',
          'Lasciar riposare 30 min per amalgamare i sapori'
        ],
        prepTime: 15, cookTime: 0, servings: 6, difficulty: 'easy',
        relatedPlants: [basilacoId],
        tags: ['italiano', 'salsa', 'condimento'],
        season: ['spring', 'summer'], isFavorite: false
      },
      {
        title: 'Risotto al Basilico e Limone',
        description: 'Risotto cremoso con pesto di basilico e scorza di limone',
        ingredients: [
          '320g di riso Carnaroli', '1 litro di brodo vegetale caldo',
          '1 cipolla piccola', '80ml di vino bianco secco',
          '40g di burro', '60g di parmigiano grattugiato',
          '3 cucchiai di pesto di basilico', 'Scorza di 1 limone bio',
          'Olio EVO, sale'
        ],
        instructions: [
          "Soffriggere la cipolla tritata nell'olio",
          'Tostare il riso 2 min mescolando',
          'Sfumare con il vino bianco e lasciare evaporare',
          'Aggiungere il brodo caldo un mestolo alla volta',
          'Mescolare continuamente per 18 min',
          'Spegnere il fuoco e mantecare con burro e parmigiano',
          'Aggiungere il pesto di basilico e la scorza di limone',
          "Coprire 2 min e servire all'onda"
        ],
        prepTime: 10, cookTime: 25, servings: 4, difficulty: 'medium',
        relatedPlants: [basilacoId],
        tags: ['vegetariano', 'primo', 'italiano'],
        season: ['spring', 'summer'], isFavorite: true
      }
    ]);
  }

  // Bug #4 fix: uso put() con id fisso invece di add() per garantire upsert sicuro
  const existing = await db.settings.get(1);
  if (!existing) {
    await db.settings.put({
      id: 1,
      city: undefined,
      latitude: undefined,
      longitude: undefined,
      notifications: true,
      theme: 'light'
    });
  }
}
