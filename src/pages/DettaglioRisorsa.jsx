import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Card, CardBody, CardTitle, CardText, 
  Table, Button, Badge, Icon, 
  Container, Row, Col, Input, FormGroup, Label
} from 'design-react-kit';
import { fetchDatastoreSearch, fetchResourceShow } from '../api/ckan';
import Breadcrumbs from '../components/Breadcrumbs';

export default function DettaglioRisorsa() {
  const { id } = useParams();
  const [resource, setResource] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({});
  const [searchText, setSearchText] = useState('');
  const limit = 500;

  useEffect(() => {
    async function loadResource() {
      try {
        // Carica i metadati della risorsa
        const resourceRes = await fetchResourceShow(id);
        if (resourceRes.success) {
          setResource(resourceRes.result);
          
          // Se non è un file GeoJSON, prova a caricare i dati dalla datastore
          const format = resourceRes.result.format?.toLowerCase() || '';
          if (format !== 'geojson' && format !== 'json') {
            const datastoreRes = await fetchDatastoreSearch({ resource_id: id, limit, offset: page * limit });
            if (datastoreRes.success) {
              setData(datastoreRes.result);
            }
          }
        }
      } catch (err) {
        setError('Errore nel caricamento della risorsa');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadResource();
  }, [id, page]);

  const handleCopy = () => {
    const url = `https://opendata.comune.messina.it/api/3/action/datastore_search?resource_id=${id}`;
    navigator.clipboard.writeText(url);
    alert('URL copiato negli appunti!');
  };

  // Filtra i dati in base ai filtri impostati
  const filteredRecords = useMemo(() => {
    if (!data?.records) return [];
    
    let filtered = data.records;
    
    // Filtra per ricerca testuale globale
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(row => {
        return data.fields?.slice(1).some(field => {
          const value = row[field.id];
          return value && String(value).toLowerCase().includes(searchLower);
        });
      });
    }
    
    // Filtra per colonna specifica
    Object.entries(filters).forEach(([fieldId, filterValue]) => {
      if (filterValue.trim()) {
        const filterLower = filterValue.toLowerCase();
        filtered = filtered.filter(row => {
          const value = row[fieldId];
          return value && String(value).toLowerCase().includes(filterLower);
        });
      }
    });
    
    return filtered;
  }, [data, filters, searchText]);

  const handleFilterChange = (fieldId, value) => {
    setFilters(prev => ({
      ...prev,
      [fieldId]: value
    }));
    setPage(0);
  };

  const clearAllFilters = () => {
    setFilters({});
    setSearchText('');
    setPage(0);
  };

  const hasActiveFilters = searchText.trim() || Object.values(filters).some(v => v.trim());

  if (loading) return (
    <Container>
      <div className="text-center my-5 py-5">
        <div className="d-flex flex-column align-items-center justify-content-center">
          <div className="progress-spinner progress-spinner-active size-xl mb-4" role="status">
            <span className="visually-hidden">Caricamento...</span>
          </div>
          <p className="text-muted fw-semibold">Caricamento risorsa in corso...</p>
        </div>
      </div>
    </Container>
  );
  if (error) return <Container><div className="alert alert-danger mt-4">{error}</div></Container>;
  
  const isGeoJSON = resource?.format?.toLowerCase() === 'geojson' || 
                    (resource?.format?.toLowerCase() === 'json' && resource?.url?.includes('geojson'));
  
  if (!data && !isGeoJSON) return <Container><div className="alert alert-warning mt-4">Risorsa non trovata o non tabellare.</div></Container>;

  return (
    <Container className="my-4">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Catalogo', to: '/catalogo' }, { label: 'Dettaglio Risorsa' }]} />
      
      {/* Header Risorsa */}
      <Row className="mb-4">
        <Col lg={12}>
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <h2 className="mb-2">{resource?.name || 'Risorsa'}</h2>
              <Badge color="primary" className="me-2">
                <Icon icon="it-file" size="sm" color="white" className="me-1" />
                {resource?.format || 'N/D'}
              </Badge>
            </div>
          </div>
        </Col>
      </Row>

      {/* Sezioni */}
      <Row>
        <Col lg={12}>
          {data && (
            <>
              {/* Anteprima Dati */}
              <section className="mb-5">
                <h5 className="mb-3">
                  <Icon icon="it-file" size="sm" className="me-2" />
                  Anteprima Dati
                </h5>

                {/* Barra di ricerca globale e filtri */}
                <Card className="shadow-sm border-primary mb-4" style={{ borderWidth: '2px' }}>
                  <CardBody className="p-4">
                    <Row className="align-items-end">
                      <Col md={hasActiveFilters ? 9 : 12}>
                        <FormGroup className="mb-0">
                          <Label htmlFor="global-search" className="fw-semibold">
                            <Icon icon="it-search" size="sm" className="me-2" color="primary" />
                            Ricerca nei dati
                          </Label>
                          <Input
                            id="global-search"
                            type="text"
                            placeholder="Cerca in tutti i campi della tabella..."
                            value={searchText}
                            onChange={(e) => {
                              setSearchText(e.target.value);
                              setPage(0);
                            }}
                          />
                        </FormGroup>
                      </Col>
                      {hasActiveFilters && (
                        <Col md={3}>
                          <Button 
                            color="danger" 
                            outline 
                            block
                            onClick={clearAllFilters}
                            className="mb-0"
                          >
                            <Icon icon="it-close" size="sm" color="danger" className="me-2" />
                            Cancella filtri
                          </Button>
                        </Col>
                      )}
                    </Row>
                    
                    {hasActiveFilters && (
                      <div className="mt-3 pt-3 border-top">
                        <small className="text-muted d-flex align-items-center">
                          <Icon icon="it-funnel" size="xs" className="me-2" />
                          <strong>Filtri attivi:</strong>
                          <span className="ms-2">
                            {searchText && `Ricerca globale: "${searchText}"`}
                            {searchText && Object.values(filters).some(v => v.trim()) && ', '}
                            {Object.entries(filters).filter(([_, v]) => v.trim()).length > 0 && 
                              `${Object.entries(filters).filter(([_, v]) => v.trim()).length} filtro/i per colonna`}
                          </span>
                        </small>
                      </div>
                    )}
                  </CardBody>
                </Card>

                <div className="table-responsive" style={{ maxHeight: '400px', overflowX: 'auto', overflowY: 'auto' }}>
                  <Table bordered size="sm" hover className="mb-0 bg-white">
                    <thead className="table-primary" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                      <tr>
                        {data.fields?.slice(1).map(f => (
                          <th key={f.id} className="px-3 py-2" style={{ minWidth: '150px' }}>
                            <div className="text-nowrap mb-2 fw-bold">{f.id}</div>
                            <Input
                              type="text"
                              size="sm"
                              placeholder={`Filtra ${f.id}...`}
                              value={filters[f.id] || ''}
                              onChange={(e) => handleFilterChange(f.id, e.target.value)}
                              className="form-control-sm"
                              style={{ fontSize: '0.75rem' }}
                            />
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.length > 0 ? (
                        filteredRecords.map((row, idx) => (
                          <tr key={idx}>
                            {data.fields?.slice(1).map(f => (
                              <td key={f.id} className="text-nowrap px-3 py-2" style={{ minWidth: '150px' }}>
                                {row[f.id]}
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={data.fields?.length - 1 || 1} className="text-center py-4 text-muted">
                            <Icon icon="it-info-circle" className="me-2" />
                            Nessun record trovato con i filtri applicati
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
                
                {/* Info risultati filtrati */}
                {hasActiveFilters && filteredRecords.length > 0 && (
                  <div className="mt-3">
                    <div className="alert alert-info mb-0" role="alert">
                      <strong>Risultati filtrati:</strong> visualizzati {filteredRecords.length} record su {data.total} totali
                    </div>
                  </div>
                )}
                
                {/* Paginazione - mostra solo se ci sono più di 500 record */}
                {data.total > 500 && (
                  <div className="d-flex align-items-center justify-content-between mt-4 p-3 bg-light rounded">
                    <Button 
                      color="primary" 
                      outline 
                      disabled={page === 0} 
                      onClick={() => setPage(p => p - 1)}
                    >
                      <Icon icon="it-arrow-left" size="sm" className="me-1" />
                      Precedente
                    </Button>
                    
                    <div className="text-center">
                      <Badge color="primary" pill className="px-3 py-2">
                        Record {page * limit + 1} - {Math.min((page + 1) * limit, data.total)} di {data.total.toLocaleString()}
                      </Badge>
                    </div>
                    
                    <Button 
                      color="primary" 
                      outline 
                      disabled={(page + 1) * limit >= data.total} 
                      onClick={() => setPage(p => p + 1)}
                    >
                      Successivo
                      <Icon icon="it-arrow-right" size="sm" className="ms-1" />
                    </Button>
                  </div>
                )}

              </section>

              {/* Info Risorsa e Endpoint */}
              <div className="mt-4 mb-5 p-4 bg-primary-light rounded-3 border border-primary" style={{ borderWidth: '2px !important' }}>
                  <div className="d-flex align-items-center mb-3">
                    <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                      <Icon icon="it-info-circle" size="sm" color="white" />
                    </div>
                    <h5 className="mb-0 text-primary fw-bold">Informazioni Tecniche</h5>
                  </div>
                  
                  <Row className="g-3">
                    <Col md={6}>
                      <div className="bg-white p-3 rounded-3 shadow-sm h-100">
                        <div className="d-flex align-items-start mb-2">
                          <div className="rounded bg-primary-light p-2 me-3">
                            <Icon icon="it-password-visible" size="sm" color="primary" />
                          </div>
                          <div className="flex-grow-1">
                            <div className="text-uppercase text-muted fw-semibold mb-1" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                              ID Risorsa
                            </div>
                            <code className="d-block bg-light p-2 rounded border text-break small text-dark">{id}</code>
                          </div>
                        </div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="bg-white p-3 rounded-3 shadow-sm h-100">
                        <div className="d-flex align-items-start">
                          <div className="rounded bg-primary-light p-2 me-3">
                            <Icon icon="it-chart-line" size="sm" color="primary" />
                          </div>
                          <div className="flex-grow-1">
                            <div className="text-uppercase text-muted fw-semibold mb-1" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                              Totale Record
                            </div>
                            <div className="h3 mb-0 text-primary fw-bold">{data.total.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    </Col>
                  </Row>
                  
                  <div className="mt-3 bg-white p-3 rounded-3 shadow-sm">
                    <div className="d-flex align-items-start mb-3">
                      <div className="rounded bg-primary-light p-2 me-3">
                        <Icon icon="it-link" size="sm" color="primary" />
                      </div>
                      <div className="flex-grow-1">
                        <div className="text-uppercase text-muted fw-semibold mb-2" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                          Endpoint API
                        </div>
                        <div className="d-flex flex-column flex-lg-row align-items-lg-center gap-2">
                          <code className="flex-grow-1 text-break small bg-light p-3 rounded border text-primary mb-0">
                            https://opendata.comune.messina.it/api/3/action/datastore_search?resource_id={id}
                          </code>
                          <Button color="primary" size="sm" className="flex-shrink-0" onClick={handleCopy}>
                            <Icon icon="it-copy" color="white" size="sm" className="me-1" />
                            Copia URL
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              {/* Data Dictionary */}
              <section className="mb-5">
                <h5 className="mb-3">
                  <Icon icon="it-bookmark" size="sm" className="me-2" />
                  Dizionario Dati
                </h5>
                <CardText className="mb-3">
                  Descrizione dettagliata delle colonne presenti nella risorsa.
                </CardText>
                <div className="table-responsive">
                  <Table className="table-striped">
                    <thead>
                      <tr>
                        <th>
                          <Icon icon="it-folder" size="xs" className="me-1" />
                          Nome Colonna
                        </th>
                        <th>
                          <Icon icon="it-code-circle" size="xs" className="me-1" />
                          Tipo Dato
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.fields?.slice(1).map(f => (
                        <tr key={f.id}>
                          <td><strong>{f.id}</strong></td>
                          <td>
                            <Badge color="secondary" className="font-monospace">
                              {f.type}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </section>

              {/* Esporta */}
              <section className="mb-5">
                <div className="d-flex align-items-center mb-4">
                  <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                    <Icon icon="it-download" size="sm" color="white" />
                  </div>
                  <div>
                    <h5 className="mb-1">Esporta Dati</h5>
                    <p className="text-muted mb-0 small">Scarica l'intera risorsa nei formati disponibili</p>
                  </div>
                </div>
                
                <Row className="g-3">
                  <Col md={6}>
                    <Card className="shadow-sm border-0 h-100">
                      <CardBody className="d-flex flex-column align-items-center text-center p-4">
                        <div className="rounded-circle bg-primary-light d-flex align-items-center justify-content-center mb-3" style={{ width: '60px', height: '60px' }}>
                          <Icon icon="it-file" size="lg" color="primary" />
                        </div>
                        <CardTitle tag="h6" className="fw-bold mb-2">Formato CSV</CardTitle>
                        <CardText className="small text-muted mb-4 flex-grow-1">
                          Download in formato Comma-Separated Values, compatibile con Excel e altri fogli di calcolo
                        </CardText>
                        <a 
                          href={`https://opendata.comune.messina.it/datastore/dump/${id}?format=csv&bom=true`}
                          className="btn btn-primary w-100"
                          target="_blank" 
                          rel="noreferrer"
                        >
                          <Icon icon="it-download" size="sm" color="white" className="me-2" aria-hidden="true" />
                          Scarica CSV
                        </a>
                      </CardBody>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="shadow-sm border-0 h-100">
                      <CardBody className="d-flex flex-column align-items-center text-center p-4">
                        <div className="rounded-circle bg-primary-light d-flex align-items-center justify-content-center mb-3" style={{ width: '60px', height: '60px' }}>
                          <Icon icon="it-code-circle" size="lg" color="primary" />
                        </div>
                        <CardTitle tag="h6" className="fw-bold mb-2">Formato JSON</CardTitle>
                        <CardText className="small text-muted mb-4 flex-grow-1">
                          Download in formato JavaScript Object Notation, ideale per applicazioni e API
                        </CardText>
                        <a 
                          href={`https://opendata.comune.messina.it/datastore/dump/${id}?format=json`}
                          className="btn btn-primary w-100"
                          target="_blank" 
                          rel="noreferrer"
                        >
                          <Icon icon="it-download" size="sm" color="white" className="me-2" aria-hidden="true" />
                          Scarica JSON
                        </a>
                      </CardBody>
                    </Card>
                  </Col>
                </Row>
              </section>
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
}
