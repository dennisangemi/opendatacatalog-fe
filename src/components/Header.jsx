import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from 'design-react-kit';

export default function Header() {
  const [isNavOpen, setIsNavOpen] = useState(false);

  const toggleNav = () => {
    console.log('Toggle menu - before:', isNavOpen);
    setIsNavOpen(!isNavOpen);
    console.log('Toggle menu - after:', !isNavOpen);
  };

  return (
    <header className="it-header-wrapper">
      {/* Header Slim */}
      <div className="it-header-slim-wrapper">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="it-header-slim-wrapper-content">
                <Link className="d-none d-lg-block navbar-brand" to="/">
                  Comune di Messina
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Header Center */}
      <div className="it-header-center-wrapper">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="it-header-center-content-wrapper">
                <button
                  className="custom-navbar-toggler d-lg-none"
                  type="button"
                  onClick={toggleNav}
                  aria-controls="nav-menu"
                  aria-expanded={isNavOpen}
                  aria-label="Apri/chiudi menu di navigazione"
                >
                  <Icon icon={isNavOpen ? "it-close" : "it-burger"} color="primary" size="lg" />
                </button>
                <div className="it-brand-wrapper">
                  <Link to="/">
                    <img src="/logo.png" alt="Logo Comune di Messina" style={{ height: '60px', marginRight: '15px' }} />
                    <div className="it-brand-text">
                      <div className="it-brand-title">Portale Open Data</div>
                      <div className="it-brand-tagline d-none d-md-block">
                        Dati aperti del Comune di Messina
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Header Navbar */}
      <div className="it-header-navbar-wrapper">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <nav className="navbar navbar-expand-lg has-megamenu">
                <div className={`navbar-collapsable ${isNavOpen ? 'show' : ''}`} id="nav-menu">
                  <div className="menu-wrapper">
                    <ul className="navbar-nav">
                      <li className="nav-item">
                        <Link className="nav-link" to="/" onClick={() => setIsNavOpen(false)}>
                          <span>Home</span>
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link className="nav-link" to="/catalogo" onClick={() => setIsNavOpen(false)}>
                          <span>Catalogo</span>
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link className="nav-link" to="/temi" onClick={() => setIsNavOpen(false)}>
                          <span>Temi</span>
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link className="nav-link" to="/enti" onClick={() => setIsNavOpen(false)}>
                          <span>Enti</span>
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link className="nav-link" to="/informazioni" onClick={() => setIsNavOpen(false)}>
                          <span>Informazioni</span>
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
