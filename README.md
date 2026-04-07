# Gestione Progetti & Diagramma di Gantt

Un'applicazione web sviluppata con **Next.js**, **Prisma** e database (**SQLite** per test veloce o **PostgreSQL** per produzione) per la gestione di progetti e task aziendali, dotata di una pratica visualizzazione a **Diagramma di Gantt** per tenere traccia delle tempistiche. L'app include già dei dati di esempio pronti all'uso per essere testata istantaneamente!

## 🌟 Funzionalità

- **Autenticazione Sicura e Ruoli**: Login tramite credenziali protetto da JWT. Supporto ruoli (Admin e User) per visibilità controllata su progetti e task.
- **Gestione Avanzata Progetti**:
  - Creazione, visualizzazione, modifica stato.
  - Calcolo automatico avanzamento globale.
  - **Duplicazione rapida**: Duplica interi progetti con tutti i task (azzerandone stato e valori per ripartire da zero).
  - Eliminazione tramite "Soft Delete" (Cestino dedicato per recupero).
- **Gestione Potenziata Task**:
  - Aggiunta di task con date di inizio, fine, colore e dipendenze.
  - Collegamento di sotto-elementi (righe) ai task (testo, numeri, allegati fisici, date).
  - Sincronizzazione automatica tra stato (es. Completato) e progresso (100%).
  - Spostamento di massa (Bulk Offset) delle date dei task.
- **Notifiche Email Automatiche**: Pattern "Watchers" per ricevere email alla creazione, modifica e notifica giornaliera automatica (tramite cron) per i task in scadenza.
- **Diagramma di Gantt Interattivo**: Visualizzazione temporale tramite `frappe-gantt`, con drag & drop disabilitato per dipendenze automatiche, viste dinamiche (giorno, settimana, mese).
- **UI Moderna e Responsiva "Premium"**:
  - Layout ibridi (Tabelle su Desktop, Card compattate "schiacciate" su Mobile).
  - Finestre modali e UI pulita in Tailwind CSS v4.

---

## 📸 Anteprime

### 1. Pagina di Login
Accesso protetto per gli utenti dell'applicazione.
![Pagina di Login](./public/screenshots/login.png)

### 2. Dashboard Interattiva
Panoramica completa dei progetti attivi assegnati all'utente e task in evidenza.
![Dashboard dei Progetti](./public/screenshots/dashboard.png)

### 3. Dettagli Progetto e Diagramma di Gantt
Gestione avanzata dei task, statistiche di avanzamento, duplicazione e vista Gantt.
![Dettagli Progetto e Gantt](./public/screenshots/project_detail.png)

### 4. Gestione Dettaglio Task
Modal dedicata per gestire lo stato, l'avanzamento, le dipendenze e gli allegati.
![Dettagli Task](./public/screenshots/task_detail.png)

### 5. Cestino (Soft Delete)
Sezione sicura per visualizzare, ripristinare o eliminare permanentemente i progetti cancellati.
![Cestino Progetti](./public/screenshots/trash.png)

---

## 🚀 Setup per Sviluppatori

Questa sezione descrive come configurare l'applicazione per l'esecuzione in ambiente di sviluppo locale.

### Prerequisiti
- **Node.js** (versione 18 o superiore raccomandata)
- *(Opzionale)* **PostgreSQL** (per messa in produzione)

### Avvio Veloce (con SQLite e Dati di Esempio)

L'applicazione include già un database SQLite (`dev.db`) pre-popolato con dei progetti e task di esempio, così puoi testare subito l'interfaccia e il diagramma di Gantt!

1. **Clona la repository e installa le dipendenze:**
   ```bash
   npm install
   ```

2. **Configura le variabili d'ambiente:**
   Copia il file di esempio `.env.example` creando un nuovo file denominato `.env`:
   ```bash
   cp .env.example .env
   ```
   Il file `.env` sarà già pre-configurato per utilizzare SQLite (`DATABASE_URL="file:./dev.db"`). Puoi personalizzare le chiavi `APP_USERS` e `JWT_SECRET_KEY` se lo desideri.

3. **Genera il Client Prisma (opzionale se già sincronizzato):**
   ```bash
   npx prisma generate
   ```

4. **Avvia il server di sviluppo:**
   ```bash
   npm run dev
   ```

5. **Apri l'app:**
   Il progetto sarà ora accessibile all'indirizzo [http://localhost:3000](http://localhost:3000). Accedi con `admin:admin123` o `user:user123`.

### 🗄️ Passare a PostgreSQL per la Produzione

Se vuoi usare l'applicazione in un ambiente di produzione o multi-utente, è facilissimo passare a PostgreSQL:

1. Nel file `.env`, commenta la riga di SQLite e de-commenta (e compila) l'URL di connessione di PostgreSQL:
   ```env
   # DATABASE_URL="file:./dev.db"
   DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"
   ```

2. Sposta lo schema di produzione rinominandolo:
   ```bash
   mv prisma/schema.prisma prisma/schema.sqlite.prisma
   mv prisma/schema.prod.prisma prisma/schema.prisma
   ```

3. Sincronizza il nuovo database e rigenera il client:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

---

## 📚 Utilizzo (Per l'Utente Finale)

L'applicazione è pensata per essere facile e immediata da usare:

1. **Accesso all'App (Login)**:
   - Vai alla pagina iniziale.
   - Inserisci le credenziali fornite dall'amministratore (configurate nella variabile `APP_USERS` dell'ambiente, di default es. `admin` e `admin123`).

2. **Creazione di un Progetto**:
   - Dalla Dashboard principale, clicca sul pulsante **+ Nuovo Progetto**.
   - Compila il form specificando un codice univoco, un nome e una descrizione.
   - Il progetto apparirà ora nella lista.

3. **Gestione dei Task ed Elaborazione del Gantt**:
   - Clicca su **Dettagli** in corrispondenza del progetto desiderato.
   - In basso, nella sezione *Task del Progetto*, clicca su **+ Nuovo Task** per aggiungere un'attività specificando la **Data di inizio** e la **Data di fine**.
   - I task creati appariranno automaticamente nel **Diagramma di Gantt** in alto.
   - Usa i pulsanti *Giorno*, *Settimana*, e *Mese* per cambiare il livello di zoom temporale nel Gantt e orientarti tra le varie attività!

4. **Dettagli aggiuntivi per i Task**:
   - Per ogni task, è possibile aggiungere sotto-elementi (righe o campi personalizzati come testo o allegati) cliccando sul pulsante **+ Aggiungi Riga** e compilando i campi necessari.
