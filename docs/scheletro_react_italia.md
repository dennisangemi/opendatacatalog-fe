# Scheletro di un progetto React + Vite con design system .italia

Questa documentazione descrive passo-passo come riprodurre lo scheletro frontend che integra il design system .italia (bootstrap-italia + design-react-kit) in un progetto React basato su Vite. Lo scopo è ripristinare o creare lo stesso ambiente/struttura che ho preparato: componenti di layout (Header, Footer, Home), uno placeholder per i grafici e l'integrazione degli stili di .italia. Non vengono gestiti dati dei grafici: trovate un componente placeholder pronto per essere sostituito con il vostro grafico in futuro (es. Plotly).

Di seguito troverai:
- Requisiti e versioni consigliate
- Struttura file minima e contenuti principali da creare
- Passaggi per inizializzare il progetto (install, dev, build, deploy)
- Note sull'integrazione di bootstrap-italia / design-react-kit (Sass, font, icone)
- Vite / configurazioni utili
- Controlli di qualità e debugging comuni
- Estensioni consigliate e prossimi passi

Narrativa rapida: ho raccolto gli elementi essenziali del progetto e li ho codificati nell'elenco file + istruzioni qui sotto. Seguendo questi passaggi potrai ricreare lo stesso scheletro nel tuo repository o in una nuova cartella di progetto; alla fine trovi anche come pubblicare su GitHub Pages (come nel package.json originale).

---

## 1) Requisiti e versioni consigliate

- Node.js: versione LTS consigliata (Node 18.x o 20.x). Vite e React 19 funzionano con Node 18+.


Verifica versione Node:
```bash
node -v
# esempio output: v18.20.0
```

---

## 2) Creare il progetto (opzioni)

Se parti da zero:
- Crea una cartella vuota o usa `npm init`.
- Installa Vite + React e le dipendenze di UI (vedi sezione successiva).

---

## 3) Dipendenze principali (esempio da package.json originale)

Installa le dipendenze usate nello scheletro (esempio con npm):
```bash
npm install react react-dom design-react-kit bootstrap-italia bootstrap-icons react-icons react-plotly.js plotly.js
npm install -D vite @vitejs/plugin-react eslint @eslint/js eslint-plugin-react-hooks
```

Note:
- Nel progetto originale sono anche presenti pacchetti typeface per font;

---

## 4) Struttura dei file consigliata (minimale)

Crea i file seguenti nella cartella `src/` del progetto. Qui sotto trovi i contenuti consigliati per ciascun file (il codice realizzato in precedenza che ti ho preparato).

- src/main.jsx
- src/App.jsx
- src/components/Header.jsx
- src/components/Footer.jsx
- src/pages/Home.jsx
- src/widgets/GraphPlaceholder.jsx
- src/styles/main.scss
- index.html (nella root del progetto) — assicurati che contenga un div con id="root"
- vite.config.js (root) — abilita plugin react

Esempio struttura:
```
project-root/
├─ index.html
├─ package.json
├─ vite.config.js
├─ src/
   ├─ main.jsx
   ├─ App.jsx
   ├─ styles/
   │  └─ main.scss
   ├─ components/
   │  ├─ Header.jsx
   │  └─ Footer.jsx
   ├─ pages/
   │  └─ Home.jsx
   └─ widgets/
      └─ GraphPlaceholder.jsx
```

---

## 5) Contenuti essenziali dei file

Qui sotto trovi il contenuto consigliato per i file principali (riassunto e snippet): copia/incolla nei file corrispondenti.

- Entry (src/main.jsx)
```javascript
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/main.scss';

const rootEl = document.getElementById('root');
createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- App (src/App.jsx)
```javascript
import React from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';

export default function App() {
  return (
    <div className="it-page">
      <Header />
      <main className="container my-4">
        <Home />
      </main>
      <Footer />
    </div>
  );
}
```

- Header (src/components/Header.jsx)
```javascript
import React from 'react';

export default function Header() {
  return (
    <header className="it-header-wrapper it-header-wrapper-slim bg-white shadow-sm">
      <div className="container py-3 d-flex align-items-center">
        <a className="d-flex align-items-center text-decoration-none" href="/">
          <img src="/logo192.png" alt="logo" style={{ width: 48, height: 48, objectFit: 'contain', marginRight: 12 }}/>
          <div>
            <strong className="h5 mb-0 d-block">Portale Open Data Messina</strong>
            <small className="text-muted">Dashboard</small>
          </div>
        </a>
        <nav className="ms-auto">
          <ul className="nav">
            <li className="nav-item"><a className="nav-link" href="#home">Home</a></li>
            <li className="nav-item"><a className="nav-link" href="#dati">Dati</a></li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
```

- Footer (src/components/Footer.jsx)
```javascript
import React from 'react';

export default function Footer() {
  return (
    <footer className="it-footer mt-5 bg-light py-3">
      <div className="container d-flex justify-content-between">
        <small className="text-muted">© {new Date().getFullYear()} Comune di Messina</small>
        <div>
          <a className="me-3" href="https://design-react-kit.dev.digitpa.it/" target="_blank" rel="noreferrer">design-react-kit</a>
          <a href="https://italia.github.io/bootstrap-italia/" target="_blank" rel="noreferrer">bootstrap-italia</a>
        </div>
      </div>
    </footer>
  );
}
```

- Home (src/pages/Home.jsx)
```javascript
import React from 'react';
import GraphPlaceholder from '../widgets/GraphPlaceholder';

export default function Home() {
  return (
    <div>
      <h2 id="home">Panoramica</h2>
      <p className="text-muted">Scheletro dell'interfaccia usando il design system .italia.</p>
      <section className="row g-3">
        <div className="col-12 col-md-6"><GraphPlaceholder title="Temperatura (placeholder)" /></div>
        <div className="col-12 col-md-6"><GraphPlaceholder title="Umidità (placeholder)" /></div>
      </section>
    </div>
  );
}
```

- GraphPlaceholder (src/widgets/GraphPlaceholder.jsx)
```javascript
import React from 'react';

export default function GraphPlaceholder({ title = 'Grafico' }) {
  return (
    <article className="card">
      <div className="card-body">
        <h5 className="card-title">{title}</h5>
        <div className="border rounded d-flex align-items-center justify-content-center" style={{ minHeight: 220, background: '#fafafa' }}>
          <span className="text-muted">Placeholder grafico — qui verrà montato il componente grafico</span>
        </div>
      </div>
    </article>
  );
}
```

- Stili (src/styles/main.scss)
```scss
@import "bootstrap-italia/dist/css/bootstrap-italia.min.css";
@import "design-react-kit/dist/css/design-react-kit.min.css";

/* Stili custom */
body {
  background: #fff;
  color: #222;
  font-family: "Titillium Web", sans-serif;
}

.it-header-wrapper-slim {
  border-bottom: 1px solid rgba(0,0,0,0.05);
}

.card {
  box-shadow: 0 0 0.5rem rgba(0,0,0,0.03);
}
```

- index.html (root)
Assicurati che ci sia il div "root":
```html
<!doctype html>
<html lang="it">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Portale Open Data del Comune di Messina</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- vite.config.js (root)
Esempio minimale:
```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  }
});
```

---

## 6) Comandi utili (dev / build / lint / deploy)

- Installa dipendenze:
```bash
npm install
```

- Avvia dev server:
```bash
npm run dev
# di default Vite avvia su http://localhost:3000 (o porta 5173 se configurata)
```

- Build di produzione:
```bash
npm run build
```

- Lint:
```bash
npm run lint
```

- Deploy su GitHub Pages (se vuoi riprodurre la pubblicazione come nel package.json originale con gh-pages):
1. Assicurati che `homepage` in package.json sia impostato correttamente (es. https://comunedimessina.github.io/opendata).
2. Usa lo script `deploy` (richiede gh-pages installato come devDependency):
```bash
npm run predeploy
npm run deploy
```

Nota: per gh-pages è comune avere il branch `gh-pages` creato automaticamente dallo script.

---

## 7) Integrazione di bootstrap-italia / design-react-kit — suggerimenti e caveat

- Import degli stili:
  - Ho importato i CSS direttamente in `src/styles/main.scss` tramite:
    @import "bootstrap-italia/dist/css/bootstrap-italia.min.css";
    @import "design-react-kit/dist/css/design-react-kit.min.css";
  - Vite risolve import CSS/Sass da node_modules automaticamente. Se trovi errori di risoluzione prova a specificare il percorso `node_modules/...`.

- Icone:
  - Per le icone `bootstrap-icons` puoi importare il CSS o usare i pacchetti React (`react-bootstrap-icons`, `react-icons`).

- Componenti React ufficiali:
  - design-react-kit fornisce componenti pronti (ItHeader, ItNavbar, ecc.). Nello scheletro ho usato markup semplificato con classi di bootstrap-italia per rimanere leggero. Se preferisci, sostituisci il markup con i componenti del kit importandoli dal pacchetto.

- Personalizzazione Sass:
  - Se vuoi sovrascrivere variabili SASS di bootstrap-italia, crea un file scss che importa prima le variabili custom, poi i file del framework. Verifica però come bootstrap-italia espone le variabili SASS nella versione che usi.

### Gestione del font (guida pratica)
Usare i pacchetti `typeface-*` (in bundle con l'app)
    - Vantaggi: nessuna dipendenza runtime da CDN, semplice import JS.
    - Svantaggi: aumenta leggermente il bundle iniziale.

Installazione:
```bash
npm install --save typeface-titillium-web
```

Import (es. in `src/main.jsx` o in `src/styles/main.scss` tramite import JS):

```javascript
import 'typeface-titillium-web';
import './styles/main.scss';
```

Oppure (se il pacchetto espone CSS) importalo in SCSS/JS. Poi nel CSS:
```scss
body {
font-family: "Titillium Web", sans-serif;
}
```

---

## 8) Dove montare i grafici in futuro

- Il componente `src/widgets/GraphPlaceholder.jsx` è il punto previsto per montare i grafici (es. un componente `PlotlyChart.jsx` che usa `react-plotly.js`).
- Suggerimento per integrazione futura:
  - Crea un componente `src/widgets/PlotlyChart.jsx` che accetta props: `data`, `layout`, `config`.
  - Nel `Home.jsx` passa dati fittizi o vuoti per testare il rendering.
  - Mantieni i grafici all'interno di card per uniformità al design system .italia.

---

## 9) Controlli di qualità e accessibilità

- A11y: verifica colori e contrasti (bootstrap-italia segue linee guida, ma controlla le combinazioni personalizzate).
- Test responsive: usa le classi grid `col-12 col-md-6` come nello scheletro per una buona resa su mobile.
- Linting: esegui `npm run lint`. Configura regole eslint in `.eslintrc` o `eslint.config.js`.
- Performance: in fase di sviluppo mantieni i bundle leggeri; evita import pesanti nei componenti dove non necessari (es. non importare plotly.min prima che serva).

---

## 10) Debugging comune

- Gli stili non vengono applicati:
  - Controlla che `src/styles/main.scss` sia importato in `main.jsx`.
  - Apri DevTools e verifica che il CSS di bootstrap-italia sia caricato.
  - Se usi Vite, pulisci la cache e riavvia il server.

- Font non caricati:
  - Se usi typeface-packages, verifica che siano installati e importati; altrimenti usa Google Fonts.

- Errore plugin React / JSX con Vite:
  - Assicurati di avere `@vitejs/plugin-react` e che `vite.config.js` lo includa.

- Deploy gh-pages non aggiorna il sito:
  - Controlla il valore `homepage` in package.json.
  - Controlla che il repo Github abbia abilitato Pages per il branch `gh-pages` (o per `gh-pages` branch creato dallo script).

---

## 11) Raccomandazioni per il controllo versione e branch

- Crea un branch di feature per lo scheletro:
```bash
git checkout -b feat/scheletro-italia
# aggiungi file, commit, push
git add .
git commit -m "feat: scheletro frontend con design system .italia"
git push -u origin feat/scheletro-italia
```
- Apri una Pull Request verso `main`/`master` per revisione.


