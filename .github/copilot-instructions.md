# Copilot Instructions: Open Data Catalog Frontend

## Project Overview
React + Vite frontend for Comune di Messina's CKAN-based open data portal. Read-only catalog interface using Bootstrap Italia design system.

## Architecture

### Core Structure
- **Router**: `Router.jsx` defines all routes, wraps pages with `Header`/`Footer` layout
- **API Layer**: `src/api/ckan.js` centralizes all CKAN v3 API calls
- **Config**: `src/config.js` uses `VITE_CKAN_BASE_URL` env var for CKAN endpoint
- **Design System**: Bootstrap Italia via `design-react-kit` package, not vanilla Bootstrap

### Key Routes
```
/                    → Home (stats + recent datasets)
/catalogo            → Catalogo (search, filters, dataset cards)
/dataset/:id         → DettaglioDataset (metadata + resources + tabular previews)
/risorsa/:id         → DettaglioRisorsa (resource details, data table, export)
/temi                → Temi (groups/categories listing)
/enti                → Enti (organizations listing)
/informazioni        → Informazioni (static info page)
```

## Critical Patterns

### CKAN API Integration
- **All API calls** go through `src/api/ckan.js` helper functions
- Base URL configured via env var: `VITE_CKAN_BASE_URL=/api/3/action` (proxied in dev via `vite.config.js`)
- Responses follow structure: `{ success: boolean, result: any, error?: object }`
- Always check `response.success` before accessing `response.result`

**Common API patterns:**
```javascript
// Search with filters
fetchPackageSearch({ 
  q: searchTerm, 
  rows: 100, 
  fq: `groups:${theme}`,  // Filter by group/theme
  sort: 'metadata_modified desc' 
})

// Tabular data preview (DataStore)
fetchDatastoreSearch({ resource_id, limit: 5 })

// Entity details
fetchPackageShow(datasetId)
fetchGroupShow(groupId)
fetchOrganizationShow(orgId)
```

### Vite Proxy Configuration
Dev server proxies `/api` to CKAN instance (see `vite.config.js`):
```javascript
proxy: { '/api': { target: 'https://127.0.0.1:8443', secure: false } }
```
Production requires `VITE_CKAN_BASE_URL` pointing to actual CKAN URL.

### Bootstrap Italia Components
- Import from `design-react-kit`: `Icon`, `Card`, `CardBody`, `Badge`, `Button`, `Form`, `Input`, etc.
- Use `Icon` component with `icon="it-*"` props (e.g., `it-file`, `it-calendar`, `it-folder`)
- Header structure: slim wrapper → center wrapper → navbar wrapper (3-tier layout pattern)
- Follow `.it-*` BEM-style class naming from Bootstrap Italia
- **For documentation**: Use Context7 to fetch up-to-date docs for `bootstrap-italia`

**Header structure example:**
```jsx
<header className="it-header-wrapper">
  <div className="it-header-slim-wrapper">{/* Top bar */}</div>
  <div className="it-header-center-wrapper">{/* Logo + title */}</div>
  <div className="it-header-navbar-wrapper">{/* Navigation */}</div>
</header>
```

### Breadcrumbs Component
Reusable `Breadcrumbs` component expects `items` array:
```jsx
<Breadcrumbs items={[
  { label: 'Home', to: '/' },
  { label: 'Catalogo', to: '/catalogo' },
  { label: dataset.title } // Last item without 'to' = active
]} />
```

### Map Visualization
`MapPreview.jsx` uses `react-leaflet` to render GeoJSON data:
- Handles CORS errors gracefully (offers manual file upload fallback)
- Converts various formats (GeoJSON, lat/lon arrays) to GeoJSON FeatureCollection
- Only use for geographic resources (check format or metadata)

### Data Table Previews
Dataset detail pages fetch DataStore previews for `datastore_active` resources:
```javascript
const tabularResources = dataset.resources.filter(r => r.datastore_active);
// Then fetch preview: fetchDatastoreSearch({ resource_id: r.id, limit: 5 })
```

## Development Workflow

### Commands
```bash
npm run dev      # Start dev server on :3000 with CKAN proxy
npm run build    # Production build
npm run preview  # Preview production build
```

### Adding New Pages
1. Create page in `src/pages/`
2. Add route to `Router.jsx` inside `<Routes>`
3. Link from Header or other pages using `<Link to="/path">`
4. Import Bootstrap Italia components from `design-react-kit`

### Styling Guidelines
- Custom styles in `src/styles/main.scss` (imported in `main.jsx`)
- Primary color: `#0066cc` (Bootstrap Italia blue)
- Use `.hover-card` class for interactive card hover effects
- Cards use `shadow-sm`, `border-0`, `rounded-3` utilities
- Main content uses `flex: 1` to push footer to bottom

### State Management Pattern
Pages fetch data in `useEffect`, manage local state:
```javascript
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  async function loadData() {
    try {
      const res = await fetchSomeData();
      if (res.success) setData(res.result);
      else setError('Error message');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  loadData();
}, [dependencies]);
```

## Common Gotchas

- **CKAN groups vs organizations**: "Temi" = groups, "Enti" = organizations
- **DataStore vs regular resources**: Not all resources have `datastore_active=true`
- **Proxy in dev only**: In production, ensure `VITE_CKAN_BASE_URL` points to real CKAN API
- **Bootstrap Italia vs Bootstrap**: Use `design-react-kit` components, not `react-bootstrap`
- **Icon names**: Use `it-` prefix (Bootstrap Italia icons), not generic icon names
- **Vite env vars**: Must start with `VITE_` prefix to be exposed to client

## Key Files to Reference

- **API patterns**: `src/api/ckan.js`
- **Routing setup**: `Router.jsx`
- **Layout structure**: `components/Header.jsx`, `components/Footer.jsx`
- **Search/filter logic**: `pages/Catalogo.jsx`
- **Detail page patterns**: `pages/DettaglioDataset.jsx`, `pages/DettaglioRisorsa.jsx`
- **PRD requirements**: `PRD.md` (complete feature specifications)
- **Design system guide**: `scheletro_react_italia.md` (Bootstrap Italia integration)
