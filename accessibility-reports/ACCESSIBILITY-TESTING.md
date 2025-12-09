# Test di Accessibilità WCAG

Test automatizzati per conformità WCAG del Portale Open Data usando **axe-core** e **Playwright**.

## 📋 Standard Testati

- WCAG 2.0/2.1 (A, AA, AAA)
- WCAG 2.2 (AA)
- Best Practices

## 🎯 Pagine Testate

**Statiche:** Home, Catalogo, Temi, Enti, Informazioni  
**Dinamiche:** Dettaglio Dataset e Risorse (auto-discovery via API CKAN)

## 🔧 Funzionalità

- XPath e path assoluti per ogni violazione
- Threshold configurabili (CI/CD ready)
- Organizzazione per impact level
- Auto-discovery dataset/risorse da API CKAN
- Retry logic e timeout configurabili

## 🚀 Uso Rapido

### Script Node.js (Completo)

**Prerequisiti:**
```bash
npm install playwright axe-core
npx playwright install chromium
```

**Comandi:**
```bash
# Sviluppo locale (usa API indicepa.gov.it)
node accessibility-test.js

# URL personalizzato
node accessibility-test.js https://mio-sito.com

# API CKAN personalizzata
node accessibility-test.js http://localhost:3000 https://mia-api-ckan.org/api/3/action
```

**Output:**
- Console: riepilogo violazioni per impact level
- JSON: `accessibility-reports/accessibility-report-YYYY-MM-DD.json`
- HTML: `accessibility-reports/accessibility-report-YYYY-MM-DD.html`

**Exit codes:**
- `0`: Test OK o violazioni entro threshold
- `1`: Violazioni oltre threshold configurati

## 📊 Impact Levels

| Livello | Priorità | Descrizione |
|---------|----------|-------------|
| **Critical** | 🔴 Urgente | Blocco totale accesso |
| **Serious** | 🟠 Alta | Impedisce uso a molti utenti |
| **Moderate** | 🟡 Media | Difficoltà significative |
| **Minor** | 🔵 Bassa | Piccoli problemi usabilità |

## ⚙️ Configurazione

### Threshold Violazioni

Modifica `accessibility-test.js`:
```javascript
maxViolations: {
  critical: 0,   // Nessuna critical
  serious: 0,    // Nessuna serious
  moderate: 5,   // Max 5 moderate
  minor: 10      // Max 10 minor
}
```

### Pagine Statiche

```javascript
const STATIC_PAGES = [
  { url: '/', name: 'Home' },
  { url: '/nuova-pagina', name: 'Nuova Pagina' }
];
```

### Pagine Dinamiche (Dataset/Risorse)

```javascript
const DYNAMIC_PAGES_CONFIG = {
  datasets: {
    enabled: true,
    count: 2,  // N. dataset da testare
    fallbackIds: ['dataset-id-1', 'dataset-id-2']  // Fallback se API non disponibile
  },
  resources: {
    enabled: true,
    count: 2,  // N. risorse per dataset
    fallbackIds: ['resource-id-1']
  }
};
```

**Auto-Discovery:** Lo script chiama l'API CKAN configurata, recupera dataset/risorse più recenti e li testa automaticamente. Fallback su ID configurati se API non disponibile.

### Standard WCAG

```javascript
wcagTags: [
  'wcag2a', 'wcag2aa', 'wcag2aaa',      // WCAG 2.0
  'wcag21a', 'wcag21aa', 'wcag21aaa',   // WCAG 2.1
  'wcag22aa',                            // WCAG 2.2
  'best-practice'
]
```

## 🔄 CI/CD Integration

### GitHub Actions

```yaml
name: Accessibility Tests

on: [push, pull_request]

jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          npm ci
          npx playwright install chromium
      
      - name: Start dev server
        run: npm run dev &
        
      - name: Wait for server
        run: npx wait-on http://localhost:3000
      
      - name: Run accessibility tests
        run: node accessibility-test.js http://localhost:3000
      
      - name: Upload reports
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: accessibility-reports
          path: accessibility-reports/
```

**Exit codes:**
- `0`: OK o entro threshold
- `1`: Violazioni oltre threshold → pipeline fallisce

## 📝 Note

- **Test automatici** rilevano ~30-50% dei problemi
- **Verifica manuale necessaria:**
  - Navigazione tastiera (Tab, Enter, Space)
  - Screen reader (NVDA, JAWS, VoiceOver)
  - Zoom browser (200%, 400%)
  - Contrasto in diverse condizioni luce

- **Conformità PA:** Legge 4/2004 (Stanca) + [Linee guida AgID](https://www.agid.gov.it/it/design-servizi/accessibilita)

## 🐛 Troubleshooting

| Problema | Soluzione |
|----------|-----------|
| Timeout | Aumenta `navigationTimeout` in `accessibility-test.js` |
| Module not found | `npm install playwright axe-core && npx playwright install chromium` |
| API CKAN non disponibile | Imposta `fallbackIds` in `DYNAMIC_PAGES_CONFIG` |

## 📚 Risorse

- [axe-core](https://github.com/dequelabs/axe-core)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Bootstrap Italia Accessibility](https://italia.github.io/bootstrap-italia/docs/organizzare-i-contenuti/introduzione/)
- [AgID Linee guida](https://www.agid.gov.it/it/design-servizi/accessibilita)

---

**Ultima modifica:** 9 dicembre 2025
