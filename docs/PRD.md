# Product Requirements Document (PRD)

## Titolo
Frontend Open Data Portal per CKAN - Comune di Messina

## Obiettivo
Realizzare un frontend web per un portale open data basato su CKAN, con design system conforme a Bootstrap Italia, che consenta la consultazione e la ricerca dei dataset pubblici tramite le API CKAN (sola lettura).

## Stack Tecnologico
Il frontend deve essere sviluppato con React + Vite, seguendo la struttura e le best practice indicate in `scheletro_react_italia.md`.

## Requisiti Funzionali

### 1. Home Page
- Barra di ricerca in evidenza.
- Sezione "Temi" (categorie) ben visibile con una card per ogni tema con icona
- Navigazione chiara verso tutte le sezioni principali.
- Elementi grafici moderni che rimandano a dati connessi

### 2. Pagina Catalogo
- Elenco di tutti i dataset disponibili.
- Filtri per Ente (Titolare/Organizzazione), Temi, Formati delle risorse
- Ogni dataset è una card che mostra titolo, descrizione, Temi del dataset, Data di modifica, titolare, Formati delle risorse e bottone "Dettagli".
- Il bottone "Dettagli" apre una nuova pagina dedicata con tutte le informazioni del dataset selezionato.
- Supporto per link diretto al dettaglio del dataset.

#### Filtri e ricerca nella pagina catalogo

- Ordinamento: menu a tendina per ordinare i dataset (Ultima modifica, Popolari, A-Z, Data di creazione, ecc.).
- Ricerca testuale: box di ricerca per filtrare i dataset per nome o descrizione.
- Filtri per temi (gruppo o categoria): pulsanti per filtrare i dataset per tema (es. Governo, Ambiente, ecc.).

Questi elementi devono essere presenti e funzionanti per garantire una navigazione efficace e una consultazione rapida dei dati.

### 2.1 Pagina Dettaglio Dataset

La pagina di dettaglio di un dataset deve mostrare:
- Titolo del dataset
- Descrizione
- Temi del dataset
- Data di modifica
- Ultimo aggiornamento
- Data creazione
- Frequenza di aggiornamento
- Licenza
- Identificativo del dataset
- Titolare
- Autore
- Publisher
- Lista delle risorse con nome, eventuale descrizione, formato delle risorse con bottone per aprire pagina dettaglio risorsa
- Se disponibile una risorsa tabellare, visualizzare anteprima risorsa tabella navigabile

### 2.2 Pagina dettaglio risorse

- Titolo risorsa
- Descrizione risorsa
- Data creazione
- Data ultima modifica
- Formato risorsa
- Tabella dati (se formato tabulare)
- Data dictionary (se disponibile)
- Opzioni di esportazione
- Endpoint url per accedere alla risorsa da poter copiare con adeguato bottone

### 3. Pagina Enti
- Elenco di tutte le organizzazioni (enti) presenti su CKAN.
- Ogni ente mostra logo, titolo, descrizione, e numero di dataset associati.
- Dettaglio ente rimanda a pagina catalogo con filtro impostato per quell'ente.

### 4. Pagina Temi
- Elenco di tutte le categorie/temi (gruppi) presenti su CKAN.
- Ogni tema mostra icona, titolo, descrizione, e link ai dataset associati.
- Dettaglio tema rimanda a pagina catalogo con filtro impostato per quel tema.

### 5. Pagina Informazioni
- Pagina statica con informazioni generali sul portale e sui dati.

### 6. Routing e Navigazione
- Navbar fissa con link a tutte le pagine principali (Home, Catalogo, Enti, Temi, Informazioni).
- Ogni dataset, risorsa, ente e tema deve avere un link diretto e condivisibile.

### 8. Design System
- Utilizzo di Bootstrap Italia per tutti i componenti UI e layout.
- Layout responsivo e accessibile.

### 9. Integrazione API CKAN

Il frontend deve integrare le API CKAN v3, accessibili tramite richieste HTTP che restituiscono risultati in formato JSON. Il basePath delle API deve essere configurabile per adattarsi a qualsiasi istanza CKAN. Tutte le chiamate sono in sola lettura.

#### Endpoint principali e best practice

- `GET /api/3/action/package_list`  
  Restituisce la lista dei nomi di tutti i dataset disponibili.
- `GET /api/3/action/package_show?id=<dataset-id>`  
  Restituisce tutti i metadati e le risorse di un dataset specifico.
- `GET /api/3/action/current_package_list_with_resources?limit=<n>&offset=<offset>`  
  Restituisce un array di dataset con tutti i campi disponibili.  
  Best practice: non superare `limit=100` per motivi di performance.
- `GET /api/3/action/package_search?q=<query>&rows=<n>&start=<offset>&sort=<ordinamento>`  
  Ricerca e filtra i dataset secondo query testuale, ordinamento, paginazione, filtri per tag, gruppo, organizzazione.
- `GET /api/3/action/group_list`  
  Restituisce la lista dei gruppi (categorie/temi).
- `GET /api/3/action/group_show?id=<group-id>`  
  Restituisce i dettagli di un gruppo e i dataset associati.
- `GET /api/3/action/organization_list`  
  Restituisce la lista delle organizzazioni (enti).
- `GET /api/3/action/organization_show?id=<org-id>`  
  Restituisce i dettagli di una organizzazione e i dataset associati.
- `GET /api/3/action/tag_list`  
  Restituisce la lista dei tag disponibili.
- `GET /api/3/action/license_list`  
  Restituisce la lista delle licenze disponibili.

**Esempi di chiamata API**

- Ottenere la lista dei dataset:
  ```bash
  curl https://demo.ckan.org/api/3/action/package_list
  ```
- Ottenere i dettagli di un dataset:
  ```bash
  curl "https://demo.ckan.org/api/3/action/package_show?id=adur_district_spending"
  ```
- Ricerca per tag:
  ```bash
  curl "https://demo.ckan.org/api/3/action/package_search?fq=tags:economy"
  ```
- Ricerca testuale:
  ```bash
  curl "https://demo.ckan.org/api/3/action/package_search?q=spending&rows=10"
  ```

**Struttura della risposta API**

Ogni risposta API è un oggetto JSON con almeno questi campi:
- `success`: booleano, indica se la richiesta è andata a buon fine
- `result`: il risultato della chiamata (array, oggetto, ecc.)
- `error`: presente solo se la richiesta fallisce

Esempio di risposta:
```json
{
  "help": "...",
  "result": ["dataset1", "dataset2"],
  "success": true
}
```

**Autenticazione**
- Per la consultazione dei dati pubblici non è richiesta autenticazione.
- Alcune funzioni API richiedono un token di autenticazione (header `Authorization`).

**Funzioni principali dell'Action API**

Le funzioni API sono suddivise in:
- `get`: lettura e ricerca dati (dataset, gruppi, organizzazioni, tag, licenze, risorse)
- `create`, `update`, `patch`, `delete`: gestione dati (non richieste per questo frontend)

Le principali funzioni di lettura sono:
- `package_list`, `package_show`, `package_search`, `current_package_list_with_resources`
- `group_list`, `group_show`, `organization_list`, `organization_show`, `tag_list`, `license_list`, `resource_show`, `resource_search`

Per dettagli e parametri avanzati, consultare la [Action API Reference CKAN 2.10](https://docs.ckan.org/en/2.10/api/#action-api-reference).

**Best practice**
- Usare sempre la versione API `/api/3/action/...` per compatibilità.
- Gestire la paginazione con `limit` e `offset`.
- In caso di errore API, mostrare messaggio chiaro all’utente.
- Per visualizzare JSON in modo leggibile, usare plugin browser come [JSONView](https://addons.mozilla.org/en-US/firefox/addon/jsonview/).
- Endpoint CKAN deve essere configurabile nel frontend.

#### DataStore Data API (API generica per dati tabellari)

La DataStore Data API di CKAN consente di leggere, cercare, filtrare, aggiornare ed esportare dati strutturati associati alle risorse. Gli endpoint sono generici e non dipendono da una specifica istanza CKAN: basta sostituire il basePath con quello della propria installazione.

Principali endpoint:

- `GET /api/3/action/datastore_search`  
  Permette di cercare e filtrare dati in una risorsa tabellare. Parametri principali:
  - `resource_id`: id della risorsa (obbligatorio)
  - `limit`, `offset`: paginazione
  - `filters`: filtri per colonne (es. `{ "col1": "valore" }`)
  - `q`: ricerca testuale su tutti i campi o su campi specifici
  - `fields`: elenco colonne da restituire
  - `sort`: ordinamento (es. `col1 desc`)
  - `distinct`, `plain`, `language`, `include_total`, ecc.

  Esempio:
  ```bash
  curl "<basePath>/api/3/action/datastore_search?resource_id=<resource-id>&limit=5"
  curl "<basePath>/api/3/action/datastore_search?resource_id=<resource-id>&q=jones"
  ```

- `GET /api/3/action/datastore_search_sql`  
  Permette di eseguire query SQL direttamente sui dati tabellari. Parametri:
  - `sql`: istruzione SQL (solo SELECT)

  Esempio:
  ```bash
  curl "<basePath>/api/3/action/datastore_search_sql?sql=SELECT * FROM '<resource-id>' WHERE title LIKE 'jones'"
  ```

- `GET /datastore/dump/<resource-id>`  
  Permette di scaricare la risorsa in vari formati: CSV, TSV, JSON, XML. Parametri:
  - `format`: formato desiderato (`csv`, `tsv`, `json`, `xml`)
  - `bom`: compatibilità Excel

  Esempio:
  ```bash
  curl "<basePath>/datastore/dump/<resource-id>?format=csv&bom=true"
  ```

**Risposta tipica**

La risposta di `datastore_search` e `datastore_search_sql` è un oggetto JSON con:
- `fields`: metadati sulle colonne
- `records`: array di record restituiti
- `total`: numero totale di record corrispondenti
- `limit`, `offset`: paginazione
- `filters`: eventuali filtri applicati

**Best practice**
- Usare la paginazione (`limit`, `offset`) per grandi dataset
- Preferire query SQL per operazioni avanzate (join, aggregazioni)
- Gestire sempre errori e limiti di risultato
- Per anteprima tabellare, usare `datastore_search` con `limit` basso
- Per esportazione, usare endpoint `/datastore/dump/<resource-id>`

#### Data Dictionary (metadati delle colonne tabellari)

La Data Dictionary del DataStore consente di descrivere le colonne di una risorsa tabellare tramite metadati accessibili via API. Questi metadati sono utili per fornire informazioni aggiuntive all’utente e per la documentazione dei dati.

Ogni colonna può avere:
- **Label**: etichetta leggibile per la colonna
- **Description**: descrizione estesa in markdown
- **Type Override**: tipo da usare per importazioni future (utile per DataPusher)

Questi metadati sono gestiti tramite il campo `info` nell’oggetto `fields` delle API DataStore:

Esempio di struttura dei campi con Data Dictionary:
```json
[
  {
    "id": "code_number",
    "type": "numeric"
  },
  {
    "id": "description",
    "type": "text",
    "info": {
      "label": "Description",
      "notes": "Breve descrizione d’uso per questo codice",
      "type_override": "text"
    }
  }
]
```

Questi metadati possono essere impostati o letti tramite le API:
- `datastore_create` (impostazione iniziale)
- `datastore_search` (lettura dei metadati)
- `datastore_info` (lettura dettagliata dei metadati e tipi)

**Best practice**
- Usare sempre label e description per migliorare la comprensione dei dati
- Documentare i tipi e le note per facilitare l’integrazione e la validazione
- Visualizzare la Data Dictionary nell’anteprima tabellare e nel dettaglio risorsa

Per dettagli: [CKAN DataStore Data Dictionary](https://docs.ckan.org/en/2.9/maintaining/datastore.html#data-dictionary)

## Vincoli
- Solo Frontend, nessuna modifica ai dati CKAN.
- Endpoint CKAN configurabile.
- Tutte le pagine devono essere statiche e servite da un semplice web server.

## User Story Principali
- Come utente, voglio cercare e consultare dataset open data in modo semplice e veloce.
- Come utente, voglio visualizzare i dettagli di un dataset in una pagina dedicata.
- Come utente, voglio visualizzare e navigare l'anteprima di una risorsa di un dataset.
- Come utente, voglio navigare tra enti e temi per trovare dataset di interesse.
- Come utente, voglio un'interfaccia coerente con il design system .Italia.

## Note
- In caso di errore API, mostrare messaggio chiaro all'utente.
- Tutti i link devono essere facilmente condivisibili.
- Il progetto deve essere facilmente deployabile su server.

## Flusso di navigazione tra le pagine
- Home: accesso diretto alla pagina principale, con link al catalogo e alle categorie tematiche.
- Catalogo: mostra tutti i dataset, con breadcrumb per tornare alla Home.
- Dettaglio Dataset: ogni dataset nel catalogo ha un link "Vai al Dettaglio" che apre la pagina dettaglio con tutte le informazioni.
- Dettaglio Risorsa: visualizza i dettagli delle risorse elencate nella pagina di dettaglio di un dataset. Ha breadcrumbs per tornare indietro (Home > Catalogo > Dettaglio dataset > Dettaglio Risorsa)
- Breadcrumb: sempre visibile per tornare indietro (Home > Catalogo > Dettaglio).
- Navbar: consente di navigare tra Home, Catalogo, e altre sezioni informative.

## Best Practices di Styling

### Gestione Colori Icone nei Bottoni Outline

Quando si utilizzano bottoni con classe `.btn-outline-primary` che contengono icone Bootstrap Italia (componente `<Icon>`), è necessario garantire che le icone mantengano il colore corretto sia nello stato normale che in hover.

**Problema**: Le icone possono apparire nere o con colori non corretti a causa delle regole CSS di default di Bootstrap Italia che sovrascrivono gli stili personalizzati.

**Soluzione implementata**:

1. **Nel componente JSX**: Aggiungere l'attributo `color="primary"` alle icone nei bottoni outline per impostare il colore blu di default
   ```jsx
   <button className="btn btn-outline-primary">
     <Icon icon="it-copy" size="sm" color="primary" className="me-2" />
     Testo bottone
   </button>
   ```

2. **Nel file SCSS**: Aggiungere regole CSS specifiche per forzare i colori delle icone e degli SVG interni ai bottoni outline
   ```scss
   .btn-outline-primary {
     color: #0066cc;
     border-color: #0066cc;
     
     // Gestione colore icone nello stato normale
     svg {
       color: #0066cc !important;
       fill: #0066cc !important;
       transition: all 0.3s ease;
     }
     
     .icon {
       color: #0066cc !important;
       fill: #0066cc !important;
       transition: all 0.3s ease;
     }
     
     // Gestione colore icone in hover
     &:hover {
       background: #0066cc;
       border-color: #0066cc;
       color: white !important;
       
       svg {
         color: white !important;
         fill: white !important;
       }
       
       .icon {
         color: white !important;
         fill: white !important;
       }
     }
     
     // Gestione colore icone in active
     &:active {
       svg {
         color: white !important;
         fill: white !important;
       }
       
       .icon {
         color: white !important;
         fill: white !important;
       }
     }
   }
   ```

**Motivazione**: 
- Bootstrap Italia utilizza SVG per le icone, quindi è necessario targetizzare sia gli elementi `svg` che le classi `.icon`
- La proprietà `fill` controlla il colore di riempimento degli SVG
- La proprietà `color` controlla il colore del testo e alcuni attributi SVG
- L'uso di `!important` è necessario per sovrascrivere le regole specifiche di Bootstrap Italia
- Il risultato finale garantisce che le icone siano sempre **blu (#0066cc)** nello stato normale e **bianche** in hover/active, mantenendo la coerenza visiva con il testo del bottone

**Applicazione**: Questa soluzione va applicata a tutti i bottoni outline che contengono icone per garantire uniformità nell'interfaccia utente.