import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardBody, Icon, Row, Col, Input } from 'design-react-kit';
import { fetchPackageSearch, fetchGroupList, enrichDatasetsWithOrgDetails } from '../api/ckan';
import DatasetCard from '../components/DatasetCard';
import NetworkBackground from '../components/NetworkBackground';

export default function Home() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ datasets: 0, themes: 0 });
  const [recentDatasets, setRecentDatasets] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingDatasets, setLoadingDatasets] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadStats() {
      try {
        const [datasetsRes, themesRes] = await Promise.all([
          fetchPackageSearch({ rows: 1 }),
          fetchGroupList()
        ]);
        
        if (datasetsRes.success && themesRes.success) {
          setStats({
            datasets: datasetsRes.result.count,
            themes: themesRes.result.length
          });
        }
      } catch (err) {
        console.error('Errore caricamento statistiche:', err);
      } finally {
        setLoadingStats(false);
      }
    }
    loadStats();
  }, []);

  useEffect(() => {
    async function loadRecentDatasets() {
      try {
        const datasetsRes = await fetchPackageSearch({ rows: 6, sort: 'metadata_modified desc' });
        
        if (datasetsRes.success) {
          const enrichedDatasets = await enrichDatasetsWithOrgDetails(datasetsRes.result.results);
          setRecentDatasets(enrichedDatasets);
        }
      } catch (err) {
        setError('Errore nel caricamento dei dataset recenti');
        console.error(err);
      } finally {
        setLoadingDatasets(false);
      }
    }
    loadRecentDatasets();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalogo?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="homepage-wrapper">
      {/* Hero Section con Barra di Ricerca */}
      <section className="it-hero-wrapper it-overlay it-dark" style={{ 
        background: 'linear-gradient(135deg, #0066cc 0%, #004d99 100%)',
        padding: '4rem 0 3rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Animazione Network Background */}
        <NetworkBackground />
        
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <Row className="justify-content-center">
            <Col lg={10}>
              <div className="text-center mb-4">
                <h1 className="text-white display-4 fw-bold mb-3">
                  Cerca i dati aperti
                </h1>
                <p className="lead text-white opacity-90 mb-0">
                  Consulta, ricerca e scarica i dati pubblici in formato aperto.
                  Trasparenza, partecipazione e innovazione per la città di Messina.
                </p>
              </div>
              
              {/* Barra di Ricerca Grande */}
              <div className="form-group mb-3">
                <form onSubmit={handleSearch}>
                  <div className="input-group input-group-lg shadow-lg" style={{
                    borderRadius: '50px',
                    overflow: 'hidden',
                    background: 'white'
                  }}>
                    <span className="input-group-text border-0 bg-white ps-4" style={{ borderRadius: '50px 0 0 50px' }}>
                      <Icon icon="it-search" color="primary" size="sm" aria-hidden="true" />
                    </span>
                    <input
                      type="search"
                      className="form-control border-0 shadow-none"
                      placeholder="Cerca dataset per nome, descrizione o parola chiave..."
                      aria-label="Cerca nel catalogo"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      style={{
                        fontSize: '1.1rem',
                        padding: '0.75rem 1rem'
                      }}
                    />
                    <button
                      type="submit"
                      className="btn btn-primary border-0 px-5"
                      style={{
                        borderRadius: '0 50px 50px 0',
                        fontWeight: '600'
                      }}
                      aria-label="Avvia ricerca"
                    >
                      Cerca
                    </button>
                  </div>
                </form>
              </div>
              
              {/* Link rapidi */}
              <div className="text-center mt-3 mb-4">
                <Link to="/catalogo" className="btn btn-outline-light btn-lg me-3 px-4 py-3">
                  <Icon icon="it-list" color="white" size="sm" className="me-2" aria-hidden="true" />
                  <span className="fw-semibold">Sfoglia il catalogo</span>
                </Link>
                <Link to="/temi" className="btn btn-outline-light btn-lg px-4 py-3">
                  <Icon icon="it-folder" color="white" size="sm" className="me-2" aria-hidden="true" />
                  <span className="fw-semibold">Esplora per tema</span>
                </Link>
              </div>

              {/* Stats inline nella hero */}
              <div className="mt-5 pt-3">
                <Row className="g-4 justify-content-center">
                  <Col xs="auto">
                    <div className="text-center px-3">
                      {loadingStats ? (
                        <div className="progress-spinner progress-spinner-active size-sm d-inline-block" role="status">
                          <span className="visually-hidden">Caricamento...</span>
                        </div>
                      ) : (
                        <>
                          <div className="d-flex align-items-center justify-content-center">
                            <Icon icon="it-file" color="white" size="lg" className="me-2" aria-hidden="true" />
                            <span className="display-6 text-white fw-bold">{stats.datasets}</span>
                          </div>
                          <p className="text-white-50 mb-0 small mt-1">Dataset</p>
                        </>
                      )}
                    </div>
                  </Col>
                  <Col xs="auto">
                    <div className="text-center px-3 border-start border-white-50">
                      {loadingStats ? (
                        <div className="progress-spinner progress-spinner-active size-sm d-inline-block" role="status">
                          <span className="visually-hidden">Caricamento...</span>
                        </div>
                      ) : (
                        <>
                          <div className="d-flex align-items-center justify-content-center">
                            <Icon icon="it-folder" color="white" size="lg" className="me-2" aria-hidden="true" />
                            <span className="display-6 text-white fw-bold">{stats.themes}</span>
                          </div>
                          <p className="text-white-50 mb-0 small mt-1">Temi</p>
                        </>
                      )}
                    </div>
                  </Col>
                </Row>
              </div>
            </Col>
          </Row>
        </div>
      </section>
      
      {/* Recent Datasets Section */}
      <section className="section" style={{ paddingTop: '2.5rem', paddingBottom: '3rem' }}>
        <div className="section-content">
          <div className="container">
            <div className="mb-4 text-center">
              <h2 className="h3 mb-2 fw-bold">
                <Icon icon="it-calendar" className="me-2" color="primary" aria-hidden="true" />
                Dataset aggiornati di recente
              </h2>
              <p className="text-muted mb-0">
                Consulta i dataset più recentemente aggiornati nel nostro catalogo
              </p>
            </div>
          
            {loadingDatasets ? (
              <div className="text-center my-5 py-5">
                <div className="d-flex flex-column align-items-center justify-content-center">
                  <div className="progress-spinner progress-spinner-active size-xl mb-4" role="status">
                    <span className="visually-hidden">Caricamento...</span>
                  </div>
                  <p className="text-muted fw-semibold">Caricamento dataset recenti...</p>
                </div>
              </div>
            ) : error ? (
              <div className="alert alert-danger" role="alert">
                <Icon icon="it-warning-circle" className="me-2" aria-hidden="true" />
                {error}
              </div>
            ) : (
              <>
                <Row className="g-4">
                  {recentDatasets.map(ds => (
                    <Col md={6} lg={4} key={ds.id}>
                      <DatasetCard dataset={ds} />
                    </Col>
                  ))}
                </Row>
                <div className="text-center mt-5">
                  <Link to="/catalogo" className="btn btn-outline-primary btn-lg px-5">
                    <Icon icon="it-list" color="primary" className="me-2" aria-hidden="true" />
                    Vedi tutti i dataset
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
