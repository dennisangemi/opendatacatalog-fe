import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardBody, CardTitle, Badge, Table, Icon, Row, Col, Accordion, AccordionHeader, AccordionBody, notify } from 'design-react-kit';
import { fetchPackageShow, fetchDatastoreSearch, fetchPackageSearch } from '../api/ckan';
import Breadcrumbs from '../components/Breadcrumbs';
import DatasetCard from '../components/DatasetCard';

export default function DettaglioDataset() {
  const { id } = useParams();
  const [dataset, setDataset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previews, setPreviews] = useState({});
  const [collapseOpen, setCollapseOpen] = useState('');
  const [relatedDatasets, setRelatedDatasets] = useState([]);

  useEffect(() => {
    async function loadDataset() {
      try {
        const res = await fetchPackageShow(id);
        if (res.success) {
          setDataset(res.result);
          const tabularResources = res.result.resources.filter(r => r.datastore_active);
          const previewPromises = tabularResources.map(async r => {
            try {
              const preview = await fetchDatastoreSearch({ resource_id: r.id, limit: 5 });
              return [r.id, preview.success ? preview.result : null];
            } catch {
              return [r.id, null];
            }
          });
          const previewResults = await Promise.all(previewPromises);
          setPreviews(Object.fromEntries(previewResults));
          
          // Carica dataset correlati se il dataset ha gruppi
          if (res.result.groups && res.result.groups.length > 0) {
            const firstGroup = res.result.groups[0].name;
            const relatedRes = await fetchPackageSearch({ 
              fq: `groups:${firstGroup}`, 
              rows: 100 
            });
            
            if (relatedRes.success && relatedRes.result.results.length > 1) {
              // Filtra il dataset corrente e seleziona 3 casuali
              const others = relatedRes.result.results.filter(ds => ds.name !== res.result.name);
              const shuffled = others.sort(() => 0.5 - Math.random());
              setRelatedDatasets(shuffled.slice(0, 3));
            }
          }
        }
      } catch (err) {
        setError('Errore nel caricamento del dataset');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadDataset();
  }, [id]);

  if (loading) return (
    <div className="container">
      <div className="text-center my-5 py-5">
        <div className="d-flex flex-column align-items-center justify-content-center">
          <div className="progress-spinner progress-spinner-active size-xl mb-4" role="status">
            <span className="visually-hidden">Caricamento...</span>
          </div>
          <p className="text-muted fw-semibold">Caricamento dataset in corso...</p>
        </div>
      </div>
    </div>
  );
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!dataset) return <div className="alert alert-warning">Dataset non trovato.</div>;

  return (
    <div className="container">
      <Breadcrumbs items={[
        { label: 'Home', to: '/' }, 
        { label: 'Catalogo', to: '/catalogo' }, 
        { label: dataset.title }
      ]} />
      
      {/* Header Section */}
      <section className="py-4 border-bottom">
        <h2 className="mb-3">
          <Icon icon="it-file" className="me-2" />
          {dataset.title}
        </h2>
        <p className="lead text-muted">{dataset.notes}</p>
        <div className="mt-3">
          {dataset.groups?.map(g => (
            <Link 
              key={g.name} 
              to={`/catalogo?tema=${g.name}`}
              className="badge bg-primary text-white text-decoration-none me-2 mb-2"
            >
              <Icon icon="it-folder" size="sm" color="white" className="me-1" />
              {g.display_name}
            </Link>
          ))}
        </div>
      </section>

      <Row className="mt-4">
        {/* Metadata Section */}
        <Col lg={4}>
          <Card className="shadow-sm mb-4 sticky-top dataset-metadata-card" style={{ top: '2rem', marginTop: '1.1rem' }}>
            <div className="card-header bg-light border-bottom py-3 px-4">
              <h5 className="mb-0 fw-semibold">Informazioni Dataset</h5>
            </div>
            <CardBody className="p-0">
              <div className="dataset-info-item px-3 py-3 border-bottom">
                <div className="d-flex align-items-start">
                  <div className="icon-wrapper rounded-circle p-2 me-3">
                    <Icon icon="it-calendar" size="sm" aria-hidden />
                  </div>
                  <div className="flex-grow-1">
                    <div className="small text-muted mb-1">Ultima modifica</div>
                    <div className="fw-normal">{new Date(dataset.metadata_modified).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                  </div>
                </div>
              </div>

              <div className="dataset-info-item px-3 py-3 border-bottom">
                <div className="d-flex align-items-start">
                  <div className="icon-wrapper rounded-circle p-2 me-3">
                    <Icon icon="it-calendar" size="sm" aria-hidden />
                  </div>
                  <div className="flex-grow-1">
                    <div className="small text-muted mb-1">Creato il</div>
                    <div className="fw-normal">{new Date(dataset.metadata_created).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                  </div>
                </div>
              </div>

              {dataset.frequency && (
                <div className="dataset-info-item px-3 py-3 border-bottom">
                  <div className="d-flex align-items-start">
                    <div className="icon-wrapper rounded-circle p-2 me-3">
                      <Icon icon="it-refresh" size="sm" aria-hidden />
                    </div>
                    <div className="flex-grow-1">
                      <div className="small text-muted mb-1">Frequenza aggiornamento</div>
                      <div className="fw-normal">{dataset.frequency}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="dataset-info-item px-3 py-3 border-bottom">
                <div className="d-flex align-items-start">
                  <div className="icon-wrapper rounded-circle p-2 me-3">
                    <Icon icon="it-lock" size="sm" aria-hidden />
                  </div>
                  <div className="flex-grow-1">
                    <div className="small text-muted mb-1">Licenza</div>
                    <div className="fw-normal">{dataset.license_title || 'Non disponibile'}</div>
                  </div>
                </div>
              </div>

              {dataset.organization && (
                <div className="dataset-info-item px-3 py-3 border-bottom">
                  <div className="d-flex align-items-start">
                    <div className="icon-wrapper rounded-circle p-2 me-3">
                      <Icon icon="it-pa" size="sm" aria-hidden />
                    </div>
                    <div className="flex-grow-1">
                      <div className="small text-muted mb-1">Ente titolare</div>
                      <div className="fw-normal">{dataset.organization.title}</div>
                    </div>
                  </div>
                </div>
              )}

              {dataset.author && (
                <div className="dataset-info-item px-3 py-3 border-bottom">
                  <div className="d-flex align-items-start">
                    <div className="icon-wrapper rounded-circle p-2 me-3">
                      <Icon icon="it-user" size="sm" aria-hidden />
                    </div>
                    <div className="flex-grow-1">
                      <div className="small text-muted mb-1">Autore</div>
                      <div className="fw-normal">{dataset.author}</div>
                    </div>
                  </div>
                </div>
              )}

              {dataset.maintainer && (
                <div className="dataset-info-item px-3 py-3 border-bottom">
                  <div className="d-flex align-items-start">
                    <div className="icon-wrapper rounded-circle p-2 me-3">
                      <Icon icon="it-settings" size="sm" aria-hidden />
                    </div>
                    <div className="flex-grow-1">
                      <div className="small text-muted mb-1">Referente tecnico</div>
                      <div className="fw-normal">{dataset.maintainer}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="dataset-info-item px-3 py-3">
                <div className="d-flex align-items-start">
                  <div className="icon-wrapper rounded-circle p-2 me-3">
                    <Icon icon="it-file" size="sm" aria-hidden />
                  </div>
                  <div className="flex-grow-1">
                    <div className="small text-muted mb-1">Risorse disponibili</div>
                    <div className="fw-normal">{dataset.resources?.length || 0} file</div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>

        {/* Resources Section */}
        <Col lg={8}>
          <div className="mb-3">
            <h5 className="mb-0">
              <Icon icon="it-download" className="me-2" />
              Risorse ({dataset.resources?.length || 0})
            </h5>
          </div>
          
          <Accordion>
            {dataset.resources?.map((res, index) => (
              <Card key={res.id} className="mb-3 shadow-sm border-0">
                <AccordionHeader 
                  active={collapseOpen === res.id}
                  onToggle={() => setCollapseOpen(collapseOpen === res.id ? '' : res.id)}
                >
                  <div className="d-flex justify-content-between align-items-center w-100">
                    <div className="d-flex align-items-center">
                      <Icon icon="it-file" className="me-2" />
                      <strong>{res.name || `Risorsa ${index + 1}`}</strong>
                    </div>
                    <Badge color="secondary" className="ms-2">{res.format}</Badge>
                  </div>
                </AccordionHeader>
                
                <AccordionBody active={collapseOpen === res.id}>
                  {res.description && (
                    <p className="text-muted small mb-3">{res.description}</p>
                  )}
                  
                  {res.datastore_active && previews[res.id] && (
                    <div className="mb-3">
                      <h6 className="mb-3">
                        <Icon icon="it-search" size="sm" className="me-2" />
                        Anteprima dati
                      </h6>
                      <div className="border rounded p-3 bg-light">
                        <div className="table-responsive" style={{ maxHeight: '400px', overflowX: 'auto', overflowY: 'auto' }}>
                          <Table bordered size="sm" hover className="mb-0 bg-white">
                            <thead className="table-primary" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                              <tr>
                                {previews[res.id].fields?.slice(1).map(f => (
                                  <th key={f.id} className="text-nowrap px-3 py-2" style={{ minWidth: '150px' }}>
                                    {f.id}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {previews[res.id].records?.slice(0, 5).map((row, idx) => (
                                <tr key={idx}>
                                  {previews[res.id].fields?.slice(1).map(f => (
                                    <td key={f.id} className="text-nowrap px-3 py-2" style={{ minWidth: '150px' }}>
                                      {row[f.id]}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                        <div className="mt-3 pt-3 border-top">
                          <small className="text-muted d-block mb-3">
                            <Icon icon="it-info-circle" size="xs" className="me-1" />
                            Visualizzati i primi 5 record su {previews[res.id].total?.toLocaleString() || 0} totali
                          </small>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="d-grid gap-2 d-md-flex mt-3">
                    <a 
                      href={res.url} 
                      className="btn btn-primary btn-sm" 
                      target="_blank" 
                      rel="noreferrer"
                    >
                      <Icon icon="it-download" size="sm" color="white" className="me-2" />
                      Scarica risorsa
                    </a>
                    
                    <button 
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => {
                        navigator.clipboard.writeText(res.url);
                        notify('URL copiato!', 'L\'URL della risorsa è stato copiato negli appunti.', { state: 'success', duration: 3000 });
                      }}
                    >
                      <Icon icon="it-copy" size="sm" color="primary" className="me-2" />
                      Copia URL
                    </button>
                    
                    {res.datastore_active && (
                      <Link 
                        to={`/risorsa/${res.id}`} 
                        className="btn btn-outline-primary btn-sm"
                      >
                        <Icon icon="it-chart-line" size="sm" color="primary" className="me-2" />
                        Visualizza e analizza
                      </Link>
                    )}
                  </div>
                </AccordionBody>
              </Card>
            ))}
          </Accordion>
        </Col>
      </Row>

      {/* Sezione Dataset Correlati */}
      {relatedDatasets.length > 0 && (
        <section className="mt-5 pt-4">
          <h4 className="mb-4">
            <Icon icon="it-folder" className="me-2" />
            Dataset correlati
          </h4>
          <Row>
            {relatedDatasets.map(ds => (
              <Col key={ds.id} md={6} lg={4} className="mb-4">
                <DatasetCard dataset={ds} />
              </Col>
            ))}
          </Row>
        </section>
      )}
    </div>
  );
}
