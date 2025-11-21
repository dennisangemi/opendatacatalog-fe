import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody, CardTitle, CardText, Badge, Icon, Row, Col } from 'design-react-kit';

/**
 * Componente riutilizzabile per visualizzare una card dataset
 * @param {Object} dataset - Oggetto dataset CKAN
 */
export default function DatasetCard({ dataset }) {
  return (
    <Card spacing className="card-bg shadow-sm h-100 d-flex flex-column">
      <CardBody className="d-flex flex-column flex-grow-1 p-4">
        {/* Titolo Dataset */}
        <CardTitle tag="h5" className="mb-3">
          <Link 
            to={`/dataset/${dataset.name}`} 
            className="text-decoration-none"
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              wordBreak: 'break-word',
              lineHeight: '1.4'
            }}
            title={dataset.title}
          >
            {dataset.title}
          </Link>
        </CardTitle>
        
        {/* Badge Temi - Subito sotto il titolo */}
        {dataset.groups && dataset.groups.length > 0 && (
          <div className="mb-3">
            <div className="d-flex flex-wrap gap-2">
              {dataset.groups.slice(0, 2).map(g => (
                <Link 
                  key={g.name}
                  to={`/catalogo?tema=${g.name}`}
                  className="badge bg-primary text-white text-decoration-none px-2 py-1"
                >
                  {g.display_name}
                </Link>
              ))}
              {dataset.groups.length > 2 && (
                <Badge color="primary" pill className="px-2 py-1">
                  +{dataset.groups.length - 2}
                </Badge>
              )}
            </div>
          </div>
        )}
        
        {/* Descrizione */}
        <CardText className="text-muted mb-4 flex-grow-1" style={{ 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          display: '-webkit-box', 
          WebkitLineClamp: 3, 
          WebkitBoxOrient: 'vertical',
          minHeight: '4.5em',
          fontSize: '0.9rem',
          lineHeight: '1.5'
        }}>
          {dataset.notes || 'Nessuna descrizione disponibile'}
        </CardText>
        
        {/* Formati Risorse */}
        {dataset.resources && dataset.resources.length > 0 && (
          <div className="mb-4 pb-3 border-bottom">
            <div className="d-flex flex-wrap gap-2 align-items-center">
              <small className="text-muted fw-bold">
                <Icon icon="it-file" color="primary" size="xs" className="me-1" aria-hidden="true" />
                Formati:
              </small>
              {[...new Set(dataset.resources.map(r => r.format).filter(Boolean))].slice(0, 4).map((format, idx) => (
                <Badge 
                  key={idx}
                  color="secondary"
                  className="font-monospace px-2 py-1"
                >
                  {format}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* Footer Info */}
        <div className="mt-auto">
          <Row className="g-3 mb-3">
            <Col xs={6}>
              <div className="d-flex align-items-center">
                <Icon icon="it-calendar" size="sm" color="primary" className="me-2 flex-shrink-0" />
                <div>
                  <div className="text-uppercase text-muted" style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.5px' }}>
                    Aggiornato
                  </div>
                  <time dateTime={dataset.metadata_modified} className="fw-semibold text-dark" style={{ fontSize: '0.85rem' }}>
                    {new Date(dataset.metadata_modified).toLocaleDateString('it-IT', { 
                      day: '2-digit', 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </time>
                </div>
              </div>
            </Col>
            <Col xs={6}>
              <div className="d-flex align-items-center">
                <Icon icon="it-file" size="sm" color="primary" className="me-2 flex-shrink-0" />
                <div>
                  <div className="text-uppercase text-muted" style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.5px' }}>
                    Risorse
                  </div>
                  <span className="fw-semibold text-dark" style={{ fontSize: '0.85rem' }}>
                    {dataset.resources?.length || 0}
                  </span>
                </div>
              </div>
            </Col>
          </Row>
          
          {/* Organizzazione */}
          {dataset.organization && (
            <div className="mb-3 p-2 bg-light rounded-3">
              <div className="d-flex align-items-center gap-2">
                {/* Avatar organizzazione */}
                <div className="flex-shrink-0">
                  {dataset.organization.image_display_url ? (
                    <div 
                      className="rounded-circle bg-white d-flex align-items-center justify-content-center"
                      style={{ 
                        width: '32px', 
                        height: '32px',
                        overflow: 'hidden',
                        border: '2px solid #e6e9f2'
                      }}
                    >
                      <img 
                        src={dataset.organization.image_display_url} 
                        alt={dataset.organization.title}
                        style={{ 
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain'
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = `
                            <div class="d-flex align-items-center justify-content-center" style="width: 100%; height: 100%; background: #0066cc;">
                              <svg class="icon icon-white icon-xs" aria-hidden="true">
                                <use href="#it-pa"></use>
                              </svg>
                            </div>
                          `;
                        }}
                      />
                    </div>
                  ) : (
                    <div 
                      className="rounded-circle bg-primary d-flex align-items-center justify-content-center"
                      style={{ 
                        width: '32px', 
                        height: '32px'
                      }}
                    >
                      <Icon icon="it-pa" color="white" size="xs" aria-hidden="true" />
                    </div>
                  )}
                </div>
                <span className="text-truncate text-muted small flex-grow-1" title={dataset.organization.title}>
                  {dataset.organization.title}
                </span>
              </div>
            </div>
          )}
          
          {/* Link Dettagli */}
          <Link 
            to={`/dataset/${dataset.name}`} 
            className="btn btn-primary btn-sm w-100 py-2"
          >
            <Icon icon="it-arrow-right" color="white" size="sm" className="me-2" />
            Vedi dettagli
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}
