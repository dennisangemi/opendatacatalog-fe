/**
 * Test di Accessibilità WCAG 2.1 AA con axe-core e Playwright
 * 
 * Questo script esegue test di accessibilità automatizzati sul Portale Open Data
 * usando axe-core per verificare la conformità agli standard WCAG 2.1 livello AA.
 * 
 * Lo script testa automaticamente:
 * - Pagine statiche (Home, Catalogo, Temi, Enti, Informazioni)
 * - Pagine di dettaglio dataset (recuperate automaticamente dall'API CKAN)
 * - Pagine di dettaglio risorse (recuperate dai dataset)
 * 
 * Uso:
 *   node accessibility-test.js [FRONTEND_URL] [CKAN_API_URL]
 * 
 * Esempi:
 *   # Sviluppo locale (usa proxy /api)
 *   node accessibility-test.js http://localhost:3000
 * 
 *   # Sviluppo con API CKAN diretta
 *   node accessibility-test.js http://localhost:3000 https://127.0.0.1:8443/api
 * 
 *   # Produzione
 *   node accessibility-test.js https://dati.comune.messina.it https://ckan.comune.messina.it/api
 * 
 * Configurazione pagine dinamiche:
 *   Per testare dataset/risorse specifici, modifica DYNAMIC_PAGES_CONFIG.fallbackIds
 *   con gli ID dei dataset/risorse da testare come fallback.
 * 
 * Prerequisiti:
 *   npm install playwright axe-core
 *   npx playwright install chromium
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');

/**
 * Fetch con supporto HTTPS e user agent appropriato
 */
async function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AccessibilityTestBot/1.0)',
        'Accept': 'application/json'
      }
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Invalid JSON: ${e.message}`));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Configurazione
const CONFIG = {
  url: process.argv[2] || 'http://localhost:3000',
  // URL base dell'API CKAN (diverso dall'URL del frontend)
  // Default: usa l'API di indicepa.gov.it (come in .env.development)
  ckanApiUrl: process.argv[3] || 'https://indicepa.gov.it/ipa-dati/api/3/action',
  outputDir: './accessibility-reports',
  // Tag WCAG più completi - include best-practice, WCAG 2.2 e AAA
  wcagTags: [
    'wcag2a', 'wcag2aa', 'wcag2aaa',     // WCAG 2.0
    'wcag21a', 'wcag21aa', 'wcag21aaa',   // WCAG 2.1
    'wcag22aa',                            // WCAG 2.2
    'best-practice'                        // Best practices aggiuntive
  ],
  viewport: { width: 1920, height: 1080 },
  // Threshold per violazioni (opzionale - per CI/CD)
  maxViolations: {
    critical: 0,
    serious: 0,
    moderate: 5,
    minor: 10
  },
  // Timeout e retry
  navigationTimeout: 60000,
  retryAttempts: 3,
  waitAfterLoad: 3000
};

// Pagine statiche da testare
const STATIC_PAGES = [
  { url: '/', name: 'Home' },
  { url: '/catalogo', name: 'Catalogo' },
  { url: '/temi', name: 'Temi' },
  { url: '/enti', name: 'Enti' },
  { url: '/informazioni', name: 'Informazioni' }
];

// Configurazione per pagine dinamiche (recuperate dall'API)
const DYNAMIC_PAGES_CONFIG = {
  datasets: {
    enabled: true,
    count: 2, // Numero di dataset da testare
    name: 'Dettaglio Dataset',
    // Fallback: ID specifici da testare se la scoperta automatica fallisce
    fallbackIds: []
  },
  resources: {
    enabled: true,
    count: 2, // Numero di risorse da testare
    name: 'Dettaglio Risorsa',
    // Fallback: ID specifici da testare se la scoperta automatica fallisce
    fallbackIds: []
  }
};

/**
 * Recupera dataset e risorse reali dall'API CKAN
 */
async function fetchDynamicPages(page, baseUrl) {
  const pages = [];
  
  try {
    // Recupera alcuni dataset dall'API CKAN
    if (DYNAMIC_PAGES_CONFIG.datasets.enabled) {
      console.log('\n🔍 Recupero dataset dall\'API CKAN...');
      
      try {
        const apiUrl = CONFIG.ckanApiUrl;
        const searchEndpoint = `${apiUrl}/package_search?rows=${DYNAMIC_PAGES_CONFIG.datasets.count}&sort=metadata_modified desc`;
        
        console.log(`   📡 API CKAN: ${apiUrl}`);
        
        // Usa fetch personalizzato con User Agent appropriato
        const data = await fetchJSON(searchEndpoint);
        
        if (data.success && data.result.results.length > 0) {
          console.log(`   ✓ Trovati ${data.result.results.length} dataset dall'API CKAN`);
          
          // Per ogni dataset, aggiungi la pagina
          for (const dataset of data.result.results) {
            pages.push({
              url: `/dataset/${dataset.name}`,
              name: `${DYNAMIC_PAGES_CONFIG.datasets.name}: ${dataset.title}`,
              id: dataset.name
            });
            
            // Se vogliamo testare anche le risorse
            if (DYNAMIC_PAGES_CONFIG.resources.enabled && dataset.resources && dataset.resources.length > 0) {
              const resourcesToAdd = Math.ceil(DYNAMIC_PAGES_CONFIG.resources.count / DYNAMIC_PAGES_CONFIG.datasets.count);
              const selectedResources = dataset.resources.slice(0, resourcesToAdd);
              
              selectedResources.forEach(resource => {
                pages.push({
                  url: `/risorsa/${resource.id}`,
                  name: `${DYNAMIC_PAGES_CONFIG.resources.name}: ${resource.name || resource.id}`,
                  id: resource.id
                });
              });
              
              if (selectedResources.length > 0) {
                console.log(`   ✓ Trovate ${selectedResources.length} risorse per "${dataset.title}"`);
              }
            }
          }
        } else {
          console.log('   ⚠️  Nessun dataset trovato nell\'API CKAN');
          useFallbackIds(pages);
        }
      } catch (err) {
        console.log(`   ⚠️  Errore nella chiamata API: ${err.message}`);
        useFallbackIds(pages);
      }
    }
  } catch (error) {
    console.log(`   ⚠️  Errore nel recupero dei dati dinamici: ${error.message}`);
    console.log('   Verranno testate solo le pagine statiche');
  }
  
  return pages;
}

/**
 * Usa gli ID di fallback configurati
 */
function useFallbackIds(pages) {
  if (DYNAMIC_PAGES_CONFIG.datasets.fallbackIds.length > 0) {
    console.log(`   ℹ️  Uso ${DYNAMIC_PAGES_CONFIG.datasets.fallbackIds.length} dataset di fallback configurati`);
    DYNAMIC_PAGES_CONFIG.datasets.fallbackIds.forEach(id => {
      pages.push({
        url: `/dataset/${id}`,
        name: `${DYNAMIC_PAGES_CONFIG.datasets.name}: ${id}`,
        id: id
      });
    });
  }
  
  if (DYNAMIC_PAGES_CONFIG.resources.fallbackIds.length > 0) {
    console.log(`   ℹ️  Uso ${DYNAMIC_PAGES_CONFIG.resources.fallbackIds.length} risorse di fallback configurate`);
    DYNAMIC_PAGES_CONFIG.resources.fallbackIds.forEach(id => {
      pages.push({
        url: `/risorsa/${id}`,
        name: `${DYNAMIC_PAGES_CONFIG.resources.name}: ${id}`,
        id: id
      });
    });
  }
}

/**
 * Carica axe-core nel contesto della pagina
 */
async function injectAxe(page) {
  const axeCore = require('axe-core');
  await page.evaluate(axeCore.source);
}

/**
 * Esegue i test di accessibilità su una pagina
 */
async function runAxeTests(page) {
  return await page.evaluate((wcagTags) => {
    return window.axe.run({
      runOnly: {
        type: 'tag',
        values: wcagTags
      },
      // Ottimizzazione: focus su violations e incomplete
      resultTypes: ['violations', 'incomplete'],
      // Opzioni avanzate per reporting dettagliato
      xpath: true,              // Include XPath per elementi
      absolutePaths: true,      // Usa path assoluti
      iframes: true,            // Testa anche iframe
      // Regole aggiuntive strict
      rules: {
        // Abilita regole che richiedono verifica manuale ma sono importanti
        'color-contrast': { enabled: true },
        'link-in-text-block': { enabled: true },
        'p-as-heading': { enabled: true },
        'heading-order': { enabled: true },
        'landmark-one-main': { enabled: true },
        'region': { enabled: true }
      }
    });
  }, CONFIG.wcagTags);
}

/**
 * Formatta i risultati per la console
 */
function formatConsoleOutput(results, pageName) {
  const violations = results.violations.length;
  const incomplete = results.incomplete.length;
  
  // Raggruppa violazioni per impact level
  const byImpact = {
    critical: results.violations.filter(v => v.impact === 'critical'),
    serious: results.violations.filter(v => v.impact === 'serious'),
    moderate: results.violations.filter(v => v.impact === 'moderate'),
    minor: results.violations.filter(v => v.impact === 'minor')
  };
  
  console.log('\n' + '='.repeat(80));
  console.log(`📄 Pagina: ${pageName}`);
  console.log(`🔗 URL: ${results.url}`);
  console.log('='.repeat(80));
  
  console.log('\n📊 RIEPILOGO:');
  console.log(`  🚨 Violazioni totali:   ${violations}`);
  console.log(`     🔴 Critical:         ${byImpact.critical.length}`);
  console.log(`     🟠 Serious:          ${byImpact.serious.length}`);
  console.log(`     🟡 Moderate:         ${byImpact.moderate.length}`);
  console.log(`     🟢 Minor:            ${byImpact.minor.length}`);
  console.log(`  ⚠️  Test incompleti:    ${incomplete}`);
  
  // Verifica threshold
  const exceedsThreshold = 
    byImpact.critical.length > CONFIG.maxViolations.critical ||
    byImpact.serious.length > CONFIG.maxViolations.serious ||
    byImpact.moderate.length > CONFIG.maxViolations.moderate ||
    byImpact.minor.length > CONFIG.maxViolations.minor;
  
  if (exceedsThreshold) {
    console.log('\n  ⛔ ATTENZIONE: Superati i threshold configurati!');
  }
  
  if (violations > 0) {
    console.log('\n🚨 VIOLAZIONI WCAG:\n');
    
    // Ordina per impact (critical -> minor)
    const impactOrder = ['critical', 'serious', 'moderate', 'minor'];
    const sortedViolations = [...results.violations].sort((a, b) => {
      return impactOrder.indexOf(a.impact) - impactOrder.indexOf(b.impact);
    });
    
    sortedViolations.forEach((violation, index) => {
      const impactEmoji = {
        critical: '🔴',
        serious: '🟠',
        moderate: '🟡',
        minor: '🟢'
      }[violation.impact] || '⚪';
      
      console.log(`${index + 1}. ${impactEmoji} ${violation.help}`);
      console.log(`   Impact: ${violation.impact.toUpperCase()}`);
      console.log(`   Descrizione: ${violation.description}`);
      console.log(`   Standard: ${violation.tags.filter(t => t.includes('wcag')).join(', ')}`);
      console.log(`   Elementi interessati: ${violation.nodes.length}`);
      console.log(`   📖 Info: ${violation.helpUrl}`);
      
      // Mostra i primi 3 elementi con problemi
      violation.nodes.slice(0, 3).forEach((node, nodeIndex) => {
        console.log(`\n      Elemento ${nodeIndex + 1}:`);
        console.log(`      Selettore: ${JSON.stringify(node.target)}`);
        if (node.xpath) {
          console.log(`      XPath: ${node.xpath}`);
        }
        console.log(`      HTML: ${node.html.substring(0, 100)}...`);
        if (node.failureSummary) {
          console.log(`      Problema: ${node.failureSummary.split('\n')[0]}`);
        }
      });
      
      if (violation.nodes.length > 3) {
        console.log(`\n      ... e altri ${violation.nodes.length - 3} elementi`);
      }
      console.log('');
    });
  } else {
    console.log('\n✅ Nessuna violazione trovata! Ottimo lavoro!');
  }
  
  if (incomplete > 0) {
    console.log('\n⚠️  TEST CHE RICHIEDONO VERIFICA MANUALE:\n');
    
    results.incomplete.forEach((item, index) => {
      console.log(`${index + 1}. ${item.help}`);
      console.log(`   ${item.description}`);
      console.log(`   Elementi da verificare: ${item.nodes.length}`);
      console.log(`   📖 Info: ${item.helpUrl}\n`);
    });
  }
}

/**
 * Genera un report HTML dettagliato
 */
function generateHTMLReport(allResults) {
  const timestamp = new Date().toISOString();
  const totalViolations = allResults.reduce((sum, r) => sum + r.results.violations.length, 0);
  const totalIncomplete = allResults.reduce((sum, r) => sum + r.results.incomplete.length, 0);
  
  // Calcola statistiche per impact level
  const impactStats = {
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0
  };
  
  allResults.forEach(r => {
    r.results.violations.forEach(v => {
      if (impactStats[v.impact] !== undefined) {
        impactStats[v.impact]++;
      }
    });
  });
  
  const html = `
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Report Accessibilità WCAG (Strict Mode) - ${new Date().toLocaleDateString('it-IT')}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1400px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        h1 { color: #0066cc; margin-bottom: 10px; font-size: 32px; }
        .subtitle { color: #666; margin-bottom: 10px; font-size: 16px; }
        .strict-badge { display: inline-block; background: #d32f2f; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 30px 0; }
        .stat-card { padding: 20px; border-radius: 6px; text-align: center; }
        .stat-card.critical { background: #ffebee; border-left: 4px solid #c62828; }
        .stat-card.serious { background: #fff3e0; border-left: 4px solid #f57c00; }
        .stat-card.moderate { background: #fffde7; border-left: 4px solid #fbc02d; }
        .stat-card.minor { background: #e8f5e9; border-left: 4px solid #66bb6a; }
        .stat-card.incomplete { background: #e3f2fd; border-left: 4px solid #1976d2; }
        .stat-number { font-size: 48px; font-weight: bold; margin-bottom: 5px; }
        .stat-label { font-size: 14px; color: #666; text-transform: uppercase; }
        .threshold-warning { background: #fff3e0; border-left: 4px solid #f57c00; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .threshold-warning strong { color: #f57c00; }
        .page-section { margin: 40px 0; padding: 30px; background: #fafafa; border-radius: 6px; }
        .page-title { font-size: 24px; color: #333; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #0066cc; }
        .violation-item { background: white; border: 1px solid #ddd; border-radius: 4px; padding: 20px; margin-bottom: 15px; }
        .violation-item.critical { border-left: 4px solid #c62828; }
        .violation-item.serious { border-left: 4px solid #f57c00; }
        .violation-item.moderate { border-left: 4px solid #fbc02d; }
        .violation-item.minor { border-left: 4px solid #66bb6a; }
        .violation-header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px; }
        .violation-title { font-size: 18px; font-weight: 600; color: #333; flex: 1; }
        .impact-badge { padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
        .impact-critical { background: #c62828; color: white; }
        .impact-serious { background: #f57c00; color: white; }
        .impact-moderate { background: #fbc02d; color: #333; }
        .impact-minor { background: #66bb6a; color: white; }
        .violation-description { color: #666; margin-bottom: 10px; line-height: 1.6; }
        .help-link { color: #0066cc; text-decoration: none; }
        .help-link:hover { text-decoration: underline; }
        .tags { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0; }
        .tag { background: #e3f2fd; color: #1976d2; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 500; }
        .tag.wcag22aa { background: #f3e5f5; color: #7b1fa2; }
        .tag.wcag21aaa { background: #fce4ec; color: #c2185b; }
        .tag.best-practice { background: #e0f2f1; color: #00695c; }
        .node-item { background: #f8f9fa; padding: 12px; margin: 10px 0; border-radius: 4px; border-left: 3px solid #ddd; }
        .node-target { font-family: 'Courier New', monospace; font-size: 13px; color: #d32f2f; margin-bottom: 8px; }
        .node-xpath { font-family: 'Courier New', monospace; font-size: 11px; color: #666; margin-bottom: 8px; }
        .node-html { font-family: 'Courier New', monospace; font-size: 12px; color: #666; background: white; padding: 8px; border-radius: 3px; overflow-x: auto; margin-bottom: 8px; }
        .timestamp { color: #999; font-size: 14px; margin-top: 30px; text-align: center; }
        .no-violations { color: #388e3c; font-size: 18px; padding: 20px; text-align: center; background: #e8f5e9; border-radius: 6px; }
        .wcag-info { background: #e3f2fd; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .wcag-info ul { margin-left: 20px; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 Report Accessibilità WCAG (Strict Mode)</h1>
        <p class="subtitle">Portale Open Data del Comune di Messina</p>
        <span class="strict-badge">STRICT MODE: WCAG 2.0/2.1/2.2 A/AA/AAA + Best Practices</span>
        
        <div class="wcag-info">
            <strong>📋 Standard testati:</strong>
            <ul>
                <li>WCAG 2.0 Level A, AA, AAA</li>
                <li>WCAG 2.1 Level A, AA, AAA</li>
                <li>WCAG 2.2 Level AA</li>
                <li>Best Practices aggiuntive</li>
            </ul>
        </div>
        
        <div class="summary">
            <div class="stat-card critical">
                <div class="stat-number">${impactStats.critical}</div>
                <div class="stat-label">🔴 Critical</div>
            </div>
            <div class="stat-card serious">
                <div class="stat-number">${impactStats.serious}</div>
                <div class="stat-label">🟠 Serious</div>
            </div>
            <div class="stat-card moderate">
                <div class="stat-number">${impactStats.moderate}</div>
                <div class="stat-label">🟡 Moderate</div>
            </div>
            <div class="stat-card minor">
                <div class="stat-number">${impactStats.minor}</div>
                <div class="stat-label">🟢 Minor</div>
            </div>
            <div class="stat-card incomplete">
                <div class="stat-number">${totalIncomplete}</div>
                <div class="stat-label">⚠️ Incomplete</div>
            </div>
        </div>
        
        ${impactStats.critical > 0 || impactStats.serious > 0 ? `
        <div class="threshold-warning">
            <strong>⚠️ ATTENZIONE:</strong> Trovate violazioni critiche o serie che richiedono intervento immediato!
        </div>
        ` : ''}

        ${allResults.map(pageResult => `
            <div class="page-section">
                <h2 class="page-title">📄 ${pageResult.pageName}</h2>
                <p style="color: #666; margin-bottom: 20px;">URL: ${pageResult.results.url}</p>
                
                ${pageResult.results.violations.length === 0 ? 
                  '<div class="no-violations">✅ Nessuna violazione trovata su questa pagina!</div>' :
                  `<div style="margin-bottom: 10px; font-weight: 600; color: #d32f2f;">
                    🚨 ${pageResult.results.violations.length} violazione/i trovata/e
                  </div>
                  ${pageResult.results.violations
                    .sort((a, b) => {
                      const impactOrder = { critical: 0, serious: 1, moderate: 2, minor: 3 };
                      return impactOrder[a.impact] - impactOrder[b.impact];
                    })
                    .map(violation => `
                    <div class="violation-item ${violation.impact}">
                        <div class="violation-header">
                            <div class="violation-title">${violation.help}</div>
                            <span class="impact-badge impact-${violation.impact}">${violation.impact}</span>
                        </div>
                        <div class="violation-description">${violation.description}</div>
                        <div>
                            <a href="${violation.helpUrl}" target="_blank" class="help-link">📖 Maggiori informazioni</a>
                        </div>
                        <div class="tags">
                            ${violation.tags.map(tag => {
                              let tagClass = '';
                              if (tag === 'wcag22aa') tagClass = 'wcag22aa';
                              else if (tag === 'wcag21aaa' || tag === 'wcag2aaa') tagClass = 'wcag21aaa';
                              else if (tag === 'best-practice') tagClass = 'best-practice';
                              return `<span class="tag ${tagClass}">${tag}</span>`;
                            }).join('')}
                        </div>
                        <div style="margin-top: 15px; font-weight: 600;">
                            📍 Elementi interessati: ${violation.nodes.length}
                        </div>
                        ${violation.nodes.map(node => `
                            <div class="node-item">
                                <div class="node-target"><strong>Selettore:</strong> ${JSON.stringify(node.target)}</div>
                                ${node.xpath ? `<div class="node-xpath"><strong>XPath:</strong> ${node.xpath.join(' ')}</div>` : ''}
                                <div class="node-html">${node.html.substring(0, 300).replace(/</g, '&lt;').replace(/>/g, '&gt;')}${node.html.length > 300 ? '...' : ''}</div>
                                ${node.failureSummary ? `<div style="color: #555; font-size: 13px;">${node.failureSummary}</div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                  `).join('')}`
                }
                
                ${pageResult.results.incomplete.length > 0 ? `
                  <div style="margin-top: 20px;">
                    <div style="font-weight: 600; color: #f57c00; margin-bottom: 10px;">
                      ⚠️ ${pageResult.results.incomplete.length} test da verificare manualmente
                    </div>
                    ${pageResult.results.incomplete.map(item => `
                      <div style="background: #fff3e0; padding: 12px; margin: 8px 0; border-radius: 4px; border-left: 3px solid #f57c00;">
                        <div style="font-weight: 600; color: #f57c00;">${item.help}</div>
                        <div style="color: #666; font-size: 14px; margin-top: 5px;">${item.description}</div>
                        <div style="margin-top: 5px;">
                          <a href="${item.helpUrl}" target="_blank" class="help-link">📖 Maggiori informazioni</a>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
            </div>
        `).join('')}

        <div class="timestamp">
            Report generato il ${new Date(timestamp).toLocaleDateString('it-IT')} alle ${new Date(timestamp).toLocaleTimeString('it-IT')}
        </div>
    </div>
</body>
</html>
  `;
  
  return html;
}

/**
 * Salva i risultati
 */
function saveResults(allResults, format = 'all') {
  // Crea la directory se non esiste
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().split('T')[0];
  
  // Salva JSON
  if (format === 'json' || format === 'all') {
    const jsonPath = path.join(CONFIG.outputDir, `accessibility-report-${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(allResults, null, 2));
    console.log(`\n💾 Report JSON salvato: ${jsonPath}`);
  }
  
  // Salva HTML
  if (format === 'html' || format === 'all') {
    const htmlPath = path.join(CONFIG.outputDir, `accessibility-report-${timestamp}.html`);
    const htmlContent = generateHTMLReport(allResults);
    fs.writeFileSync(htmlPath, htmlContent);
    console.log(`💾 Report HTML salvato: ${htmlPath}`);
  }
}

/**
 * Funzione principale
 */
async function main() {
  console.log('🚀 Avvio test di accessibilità WCAG (Strict Mode)');
  console.log('📋 Standard: WCAG 2.0/2.1/2.2 (A/AA/AAA) + Best Practices');
  console.log(`🔗 Base URL: ${CONFIG.url}`);
  
  const browser = await chromium.launch({
    headless: true
  });
  
  const context = await browser.newContext({
    viewport: CONFIG.viewport,
    ignoreHTTPSErrors: true  // Ignora errori SSL per certificati autofirmati
  });
  
  const page = await context.newPage();
  const allResults = [];
  let totalByImpact = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  
  try {
    // Recupera pagine dinamiche navigando il catalogo
    const dynamicPages = await fetchDynamicPages(page, CONFIG.url);
    
    // Combina pagine statiche e dinamiche
    const allPages = [...STATIC_PAGES, ...dynamicPages];
    
    console.log(`📄 Pagine da testare: ${allPages.length} (${STATIC_PAGES.length} statiche + ${dynamicPages.length} dinamiche)\n`);
    
    for (const pageConfig of allPages) {
      const fullUrl = `${CONFIG.url}${pageConfig.url}`;
      console.log(`\n⏳ Test in corso: ${pageConfig.name}`);
      console.log(`   URL: ${fullUrl}`);
      
      try {
        // Naviga alla pagina con retry logic
        let navigationSuccess = false;
        let lastError = null;
        
        for (let attempt = 1; attempt <= CONFIG.retryAttempts; attempt++) {
          try {
            await page.goto(fullUrl, { 
              waitUntil: 'domcontentloaded',  // Più affidabile di networkidle
              timeout: CONFIG.navigationTimeout 
            });
            navigationSuccess = true;
            break;
          } catch (err) {
            lastError = err;
            if (attempt < CONFIG.retryAttempts) {
              console.log(`   ⚠️  Tentativo ${attempt} fallito, riprovo...`);
              await page.waitForTimeout(1000);
            }
          }
        }
        
        if (!navigationSuccess) {
          throw lastError;
        }
        
        // Attendi che la pagina sia completamente caricata
        await page.waitForTimeout(CONFIG.waitAfterLoad);
        
        // Inietta axe-core
        await injectAxe(page);
        
        // Esegui i test
        const results = await runAxeTests(page);
        
        // Conta violazioni per impact
        results.violations.forEach(v => {
          if (totalByImpact[v.impact] !== undefined) {
            totalByImpact[v.impact]++;
          }
        });
        
        // Salva i risultati
        allResults.push({
          pageName: pageConfig.name,
          pageUrl: pageConfig.url,
          results: results
        });
        
        // Mostra risultati nella console
        formatConsoleOutput(results, pageConfig.name);
        
      } catch (error) {
        console.error(`❌ Errore durante il test di ${pageConfig.name}:`, error.message);
      }
    }
    
    // Salva tutti i risultati
    saveResults(allResults);
    
    // Riepilogo finale
    const totalViolations = allResults.reduce((sum, r) => sum + r.results.violations.length, 0);
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 RIEPILOGO COMPLESSIVO');
    console.log('='.repeat(80));
    console.log(`Pagine testate:         ${allResults.length}`);
    console.log(`\nViolazioni per Impact Level:`);
    console.log(`  🔴 Critical:          ${totalByImpact.critical}`);
    console.log(`  🟠 Serious:           ${totalByImpact.serious}`);
    console.log(`  🟡 Moderate:          ${totalByImpact.moderate}`);
    console.log(`  🟢 Minor:             ${totalByImpact.minor}`);
    console.log(`  📊 Totale:            ${totalViolations}`);
    
    // Verifica threshold
    const exceedsThreshold = 
      totalByImpact.critical > CONFIG.maxViolations.critical ||
      totalByImpact.serious > CONFIG.maxViolations.serious ||
      totalByImpact.moderate > CONFIG.maxViolations.moderate ||
      totalByImpact.minor > CONFIG.maxViolations.minor;
    
    if (totalViolations === 0) {
      console.log('\n🎉 ECCELLENTE! Il sito non presenta violazioni agli standard WCAG!');
      process.exit(0);
    } else if (exceedsThreshold) {
      console.log('\n⛔ FALLITO: Superati i threshold di violazioni configurati!');
      console.log('   Threshold configurati:');
      console.log(`     Critical: max ${CONFIG.maxViolations.critical} (trovate: ${totalByImpact.critical})`);
      console.log(`     Serious:  max ${CONFIG.maxViolations.serious} (trovate: ${totalByImpact.serious})`);
      console.log(`     Moderate: max ${CONFIG.maxViolations.moderate} (trovate: ${totalByImpact.moderate})`);
      console.log(`     Minor:    max ${CONFIG.maxViolations.minor} (trovate: ${totalByImpact.minor})`);
      process.exit(1);
    } else {
      console.log(`\n⚠️  Attenzione: trovate ${totalViolations} violazioni, ma entro i threshold accettabili.`);
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ Errore critico:', error);
    process.exit(1);
  } finally {
    await browser.close();
    console.log('\n✅ Test completati!\n');
  }
}

// Esegui i test
main().catch(console.error);
