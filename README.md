# Gestione Progetti & Diagramma di Gantt

Un'applicazione web sviluppata con **Next.js**, **Prisma** e database (**SQLite** per test veloce o **PostgreSQL** per produzione) per la gestione di progetti e task aziendali, dotata di una pratica visualizzazione a **Diagramma di Gantt** per tenere traccia delle tempistiche. L'app include già dei dati di esempio pronti all'uso per essere testata istantaneamente!

## 🌟 Funzionalità

- **Autenticazione Sicura**: Login tramite credenziali configurabili (amministratore e utenti) protetto da JWT (JSON Web Tokens).
- **Gestione Progetti**:
  - Creazione, visualizzazione ed eliminazione dei progetti.
  - Assegnazione di codici univoci e stati personalizzati.
- **Gestione Task**:
  - Aggiunta di task con date di inizio e fine.
  - Collegamento di sotto-elementi (righe) ai task (testo, numeri, allegati, date).
- **Diagramma di Gantt Integrato**: Visualizzazione interattiva dei task nel tempo, con supporto alle viste per giorno, settimana e mese.
- **Design Moderno e Responsivo**: Interfaccia pulita e intuitiva realizzata con **Tailwind CSS**.

---

## 📸 Anteprime

### 1. Pagina di Login
Accesso protetto per gli utenti dell'applicazione.
![Pagina di Login](./public/screenshots/login.png)

### 2. Dashboard dei Progetti
Panoramica completa dei progetti attivi, con possibilità di crearne di nuovi.
![Dashboard dei Progetti](./public/screenshots/projects_dashboard.png)

### 3. Dettagli Progetto e Diagramma di Gantt
Gestione dei task di un singolo progetto e visualizzazione temporale tramite Gantt.
![Dettagli Progetto e Gantt](./public/screenshots/project_detail.png)

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
