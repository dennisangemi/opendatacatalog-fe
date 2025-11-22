import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Card, CardBody, CardTitle, CardText, 
  Table, Button, Badge, Icon, 
  Container, Row, Col, Input, FormGroup, Label, notify
} from 'design-react-kit';
import { fetchDatastoreSearch, fetchResourceShow, fetchPackageShow } from '../api/ckan';
import { CKAN_BASE_URL } from '../config';
import Breadcrumbs from '../components/Breadcrumbs';

export default function DettaglioRisorsa() {
  const { id } = useParams();
  const [resource, setResource] = useState(null);
  const [dataset, setDataset] = useState(null);
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
          
          // Carica il dataset a cui appartiene la risorsa
          if (resourceRes.result.package_id) {
            const datasetRes = await fetchPackageShow(resourceRes.result.package_id);
            if (datasetRes.success) {
              setDataset(datasetRes.result);
            }
          }
          
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
    const baseUrl = CKAN_BASE_URL.replace('/api/3/action', '');
    const url = `${baseUrl}/api/3/action/datastore_search?resource_id=${id}`;
    navigator.clipboard.writeText(url);
    notify('URL copiato!', 'L\'URL API della risorsa è stato copiato negli appunti.', { state: 'success', duration: 3000 });
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

  // Calcola l'URL endpoint API
  const apiEndpoint = useMemo(() => {
    const baseUrl = CKAN_BASE_URL.replace('/api/3/action', '');
    return `${baseUrl}/api/3/action/datastore_search?resource_id=${id}`;
  }, [id]);

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
      <Breadcrumbs items={[
        { label: 'Home', to: '/' }, 
        { label: 'Catalogo', to: '/catalogo' }, 
        ...(dataset ? [{ label: dataset.title, to: `/dataset/${dataset.id}` }] : []),
        { label: resource?.name || 'Risorsa' }
      ]} />
      
      {/* Header Risorsa */}
      <Row className="mb-4">
        <Col lg={12}>
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <h2 className="mb-2">{resource?.name || 'Risorsa'}</h2>
              <Badge color="secondary">
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
              {/* Tabella Dati */}
              <section className="mb-5">
                <h5 className="mb-3">
                  <Icon icon="it-search" size="sm" className="me-2" />
                  Esploratore
                </h5>

                {/* Barra di ricerca globale e filtri */}
                <Card className="shadow-sm border-primary mb-4" style={{ borderWidth: '2px' }}>
                  <CardBody className="p-4">
                    <Row className="align-items-end">
                      <Col md={hasActiveFilters ? 9 : 12}>
                        <FormGroup className="mb-0">
                          <Label htmlFor="global-search" className="fw-semibold">
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
                  <Card className="shadow-sm border-0 mt-4">
                    <CardBody className="p-3">
                      <div className="d-flex align-items-center justify-content-between">
                        <Button 
                          color="primary" 
                          outline
                          size="sm"
                          disabled={page === 0} 
                          onClick={() => setPage(p => p - 1)}
                        >
                          <Icon icon="it-arrow-left" size="sm" className="me-1" />
                          Precedente
                        </Button>
                        
                        <div className="text-muted small">
                          Record <strong className="text-dark">{page * limit + 1} - {Math.min((page + 1) * limit, data.total)}</strong> di <strong className="text-dark">{data.total.toLocaleString()}</strong>
                        </div>
                        
                        <Button 
                          color="primary" 
                          outline
                          size="sm"
                          disabled={(page + 1) * limit >= data.total} 
                          onClick={() => setPage(p => p + 1)}
                        >
                          Successivo
                          <Icon icon="it-arrow-right" size="sm" className="ms-1" />
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                )}

              </section>

              {/* Info Risorsa e Endpoint */}
              <section className="mb-5">
                <h5 className="mb-3">
                  <Icon icon="it-info-circle" size="sm" className="me-2" />
                  Informazioni
                </h5>
                
                <Card className="shadow-sm border-0 mb-3">
                  <CardBody className="p-4">
                    <Row className="g-4">
                      <Col md={6}>
                        <div className="d-flex align-items-start">
                          <Icon icon="it-password-visible" size="sm" color="primary" className="me-3 mt-1" />
                          <div className="flex-grow-1">
                            <div className="text-uppercase text-muted fw-semibold mb-2" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                              ID Risorsa
                            </div>
                            <code className="d-block bg-light p-2 rounded text-break small">{id}</code>
                          </div>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="d-flex align-items-start">
                          <Icon icon="it-chart-line" size="sm" color="primary" className="me-3 mt-1" />
                          <div className="flex-grow-1">
                            <div className="text-uppercase text-muted fw-semibold mb-2" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                              Totale Record
                            </div>
                            <div className="h4 mb-0 text-primary fw-bold">{data.total.toLocaleString()}</div>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </CardBody>
                </Card>
                
                <Card className="shadow-sm border-0">
                  <CardBody className="p-4">
                    <div className="d-flex align-items-start">
                      <Icon icon="it-link" size="sm" color="primary" className="me-3 mt-1" />
                      <div className="flex-grow-1">
                        <div className="text-uppercase text-muted fw-semibold mb-3" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                          Endpoint API
                        </div>
                        <div className="d-flex flex-column flex-lg-row align-items-lg-center gap-2">
                          <code className="flex-grow-1 text-break small bg-light p-3 rounded mb-0">
                            {apiEndpoint}
                          </code>
                          <Button color="primary" size="sm" className="flex-shrink-0" onClick={handleCopy}>
                            <Icon icon="it-copy" color="white" size="sm" className="me-1" />
                            Copia URL
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </section>

              {/* Data Dictionary */}
              <section className="mb-5">
                <h5 className="mb-3">
                  <Icon icon="it-bookmark" size="sm" className="me-2" />
                  Dizionario dei dati
                </h5>
                <Card className="shadow-sm border-0">
                  <CardBody className="p-0">
                    <div className="table-responsive">
                      <Table className="mb-0">
                        <thead className="table-light">
                          <tr>
                            <th className="px-4 py-3" style={{ width: '30%' }}>
                              <Icon icon="it-folder" size="xs" className="me-2" />
                              Nome Colonna
                            </th>
                            <th className="px-4 py-3" style={{ width: '15%', whiteSpace: 'nowrap' }}>
                              <Icon icon="it-code-circle" size="xs" className="me-2" />
                              Tipo Dato
                            </th>
                            <th className="px-4 py-3" style={{ width: '55%' }}>
                              <Icon icon="it-info-circle" size="xs" className="me-2" />
                              Descrizione
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.fields?.slice(1).map(f => (
                            <tr key={f.id}>
                              <td className="px-4 py-3" style={{ wordBreak: 'break-word' }}><strong>{f.id}</strong></td>
                              <td className="px-4 py-3" style={{ whiteSpace: 'nowrap' }}>
                                <Badge color="secondary" className="font-monospace">
                                  {f.type}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-muted">{f.info?.notes || '—'}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </CardBody>
                </Card>
              </section>

              {/* Esporta */}
              <section className="mb-5">
                <h5 className="mb-3">
                  <Icon icon="it-download" size="sm" className="me-2" />
                  Esporta Dati
                </h5>
                
                <Row className="g-3">
                  <Col md={6}>
                    <Card className="shadow-sm border-0 h-100">
                      <CardBody className="p-4">
                        <div className="d-flex align-items-start mb-3">
                          <Icon icon="it-file" size="sm" color="primary" className="me-3 mt-1" />
                          <div className="flex-grow-1">
                            <CardTitle tag="h6" className="fw-bold mb-2">Formato CSV</CardTitle>
                            <CardText className="small text-muted mb-3">
                              Download in formato Comma-Separated Values, compatibile con Excel e altri fogli di calcolo
                            </CardText>
                          </div>
                        </div>
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
                      <CardBody className="p-4">
                        <div className="d-flex align-items-start mb-3">
                          <Icon icon="it-code-circle" size="sm" color="primary" className="me-3 mt-1" />
                          <div className="flex-grow-1">
                            <CardTitle tag="h6" className="fw-bold mb-2">Formato JSON</CardTitle>
                            <CardText className="small text-muted mb-3">
                              Download in formato JavaScript Object Notation, ideale per applicazioni e API
                            </CardText>
                          </div>
                        </div>
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
