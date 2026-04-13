import React, { useState, useEffect, useRef } from 'react';

const injectHeaderStyles = () => {
  if (document.getElementById('header-styles')) return;
  const s = document.createElement('style');
  s.id = 'header-styles';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&display=swap');

    @keyframes marqueeAnim {
      0%   { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    @keyframes mobileMenuIn {
      from { opacity: 0; transform: translateY(-8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes dropdownIn {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes cartBadgePop {
      0%   { transform: scale(0.5); }
      70%  { transform: scale(1.2); }
      100% { transform: scale(1); }
    }

    /* ── ANNOUNCEMENT BAR ── */
    .ann-bar {
      background: #0a0a0a;
      overflow: hidden;
      padding: 9px 0;
      border-bottom: 1px solid #1a1a1a;
    }
    .ann-track {
      display: inline-flex;
      animation: marqueeAnim 28s linear infinite;
      white-space: nowrap;
    }
    .ann-item {
      font-family: 'Space Mono', monospace;
      font-size: 0.6rem;
      font-weight: 700;
      letter-spacing: 0.22em;
      color: rgba(255,255,255,0.6);
      padding: 0 32px;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .ann-sep { color: #00ffaa; opacity: 0.8; font-size: 0.5rem; }

    /* ── HEADER ── */
    .site-header {
      background: #000;
      height: 68px;
      padding: 0 40px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 1000;
      border-bottom: 1px solid #111;
    }

    /* Logo */
    .header-logo {
      display: flex;
      align-items: center;
      cursor: pointer;
      flex-shrink: 0;
    }
    .header-logo img {
      height: 48px;
      width: auto;
    }
    .header-logo-text {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 1.6rem;
      letter-spacing: 0.08em;
      color: #fff;
      display: none;
    }

    /* Desktop Nav */
    .header-nav {
      display: flex;
      align-items: center;
      gap: 32px;
    }
    .header-nav-link {
      font-family: 'Space Mono', monospace;
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.18em;
      color: rgba(255,255,255,0.75);
      text-decoration: none;
      padding: 6px 0;
      position: relative;
      transition: color 0.2s ease;
      cursor: pointer;
      border: none;
      background: none;
      white-space: nowrap;
    }
    .header-nav-link::after {
      content: '';
      position: absolute;
      bottom: 0; left: 0;
      width: 0; height: 1px;
      background: #00ffaa;
      transition: width 0.25s ease;
    }
    .header-nav-link:hover { color: #fff; }
    .header-nav-link:hover::after { width: 100%; }
    .header-nav-link.accent-red { color: #ff4444; }
    .header-nav-link.accent-red:hover { color: #ff6666; }
    .header-nav-link.accent-green { color: #00cc77; font-size: 0.6rem; }
    .header-nav-link.accent-muted { color: rgba(255,255,255,0.35); }
    .header-nav-link.accent-muted:hover { color: rgba(255,255,255,0.6); }

    /* Dropdown */
    .nav-dropdown-wrap {
      position: relative;
    }
    .nav-dropdown {
      position: absolute;
      top: calc(100% + 20px);
      left: -16px;
      background: #0a0a0a;
      border: 1px solid #1a1a1a;
      min-width: 180px;
      z-index: 100;
      animation: dropdownIn 0.2s ease forwards;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }
    .nav-dropdown-item {
      display: block;
      font-family: 'Space Mono', monospace;
      font-size: 0.62rem;
      font-weight: 700;
      letter-spacing: 0.14em;
      color: rgba(255,255,255,0.6);
      padding: 12px 20px;
      border-bottom: 1px solid #111;
      cursor: pointer;
      text-decoration: none;
      transition: color 0.15s ease, background 0.15s ease;
      border: none;
      background: none;
      width: 100%;
      text-align: left;
    }
    .nav-dropdown-item:last-child { border-bottom: none; }
    .nav-dropdown-item:hover {
      color: #fff;
      background: rgba(255,255,255,0.04);
      padding-left: 26px;
    }

    /* Right section */
    .header-right {
      display: flex;
      align-items: center;
      gap: 20px;
      flex-shrink: 0;
    }

    /* Cart button */
    .header-cart-btn {
      position: relative;
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s ease;
    }
    .header-cart-btn:hover { transform: scale(1.1); }
    .header-cart-icon {
      font-size: 1.1rem;
      line-height: 1;
    }
    .header-cart-badge {
      position: absolute;
      top: 2px; right: 2px;
      background: #fff;
      color: #000;
      border-radius: 50%;
      width: 16px; height: 16px;
      font-size: 0.55rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Space Mono', monospace;
      animation: cartBadgePop 0.3s ease;
    }

    /* Login/user */
    .header-login-btn {
      background: transparent;
      color: rgba(255,255,255,0.7);
      border: 1px solid rgba(255,255,255,0.15);
      padding: 8px 16px;
      font-size: 0.6rem;
      font-weight: 700;
      letter-spacing: 0.15em;
      cursor: pointer;
      font-family: 'Space Mono', monospace;
      transition: all 0.2s ease;
      white-space: nowrap;
    }
    .header-login-btn:hover {
      border-color: #fff;
      color: #fff;
    }
    .header-user-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .header-username {
      font-family: 'Space Mono', monospace;
      font-size: 0.6rem;
      color: #00ffaa;
      font-weight: 700;
      letter-spacing: 0.08em;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .header-username-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: #00ffaa;
      box-shadow: 0 0 6px #00ffaa;
      flex-shrink: 0;
    }
    .header-logout-btn {
      background: none;
      border: none;
      color: rgba(255,68,68,0.8);
      font-size: 0.58rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      cursor: pointer;
      font-family: 'Space Mono', monospace;
      transition: color 0.2s;
    }
    .header-logout-btn:hover { color: #ff4444; }
    .header-admin-badge {
      background: #ff4444;
      color: #fff;
      font-size: 0.55rem;
      font-weight: 700;
      padding: 4px 10px;
      letter-spacing: 0.1em;
      font-family: 'Space Mono', monospace;
    }

    /* ── HAMBURGER ── */
    .header-hamburger {
      display: none;
      flex-direction: column;
      gap: 5px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px;
      z-index: 1001;
    }
    .ham-line {
      width: 22px; height: 1.5px;
      background: #fff;
      transition: all 0.3s ease;
      transform-origin: center;
    }
    .ham-line.open:nth-child(1) { transform: rotate(45deg) translate(4.5px, 4.5px); }
    .ham-line.open:nth-child(2) { opacity: 0; transform: scaleX(0); }
    .ham-line.open:nth-child(3) { transform: rotate(-45deg) translate(4.5px, -4.5px); }

    /* ── MOBILE MENU ── */
    .mobile-menu {
      display: none;
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: #000;
      z-index: 999;
      flex-direction: column;
      padding: 100px 32px 48px;
      animation: mobileMenuIn 0.3s ease forwards;
      overflow-y: auto;
    }
    .mobile-menu.open { display: flex; }

    .mobile-nav-item {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 2.4rem;
      letter-spacing: 0.04em;
      color: rgba(255,255,255,0.7);
      border: none;
      background: none;
      text-align: left;
      padding: 14px 0;
      cursor: pointer;
      border-bottom: 1px solid #111;
      transition: color 0.2s ease, padding-left 0.2s ease;
      width: 100%;
    }
    .mobile-nav-item:hover { color: #fff; padding-left: 8px; }
    .mobile-nav-item.red { color: rgba(255,68,68,0.7); }
    .mobile-nav-item.red:hover { color: #ff4444; }
    .mobile-nav-item.green { color: rgba(0,204,119,0.7); }
    .mobile-nav-item.green:hover { color: #00cc77; }

    .mobile-nav-sub {
      font-family: 'Space Mono', monospace;
      font-size: 0.7rem;
      letter-spacing: 0.15em;
      color: rgba(255,255,255,0.35);
      padding: 10px 0 10px 20px;
      cursor: pointer;
      border: none;
      background: none;
      text-align: left;
      transition: color 0.2s ease;
      width: 100%;
    }
    .mobile-nav-sub:hover { color: rgba(255,255,255,0.7); }

    .mobile-menu-footer {
      margin-top: auto;
      padding-top: 32px;
      border-top: 1px solid #111;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .mobile-menu-footer-text {
      font-size: 0.55rem;
      color: rgba(255,255,255,0.2);
      letter-spacing: 0.2em;
      font-family: 'Space Mono', monospace;
    }

    /* ── RESPONSIVE BREAKPOINTS ── */
    @media (max-width: 900px) {
      .header-nav { display: none; }
      .header-hamburger { display: flex; }
      .site-header { padding: 0 20px; }
    }

    @media (max-width: 600px) {
      .site-header { height: 60px; padding: 0 16px; }
      .header-login-btn { padding: 7px 12px; font-size: 0.56rem; }
      .header-username { max-width: 80px; overflow: hidden; white-space: nowrap; }
    }

    @media (max-width: 400px) {
      .header-username { display: none; }
    }
  `;
  document.head.appendChild(s);
};

export const Header = ({
  usuario, isAdmin, setShowLogin, setShowLoginScreen,
  handleLogout, cartCount = 0, setShowCart, onFilterChange
}) => {
  injectHeaderStyles();
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropRef = useRef(null);

  // Close mobile menu on resize
  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 900) setMobileOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const nav = (cat, closeMobile = false) => {
    if (setShowLoginScreen) setShowLoginScreen(false);
    if (onFilterChange) onFilterChange(cat);
    if (closeMobile) setMobileOpen(false);
  };

  const annItems = [
    '3 Y 6 CUOTAS SIN INTERÉS',
    'ENVÍOS A TODO EL PAÍS',
    '10% OFF CON TRANSFERENCIA',
    'NUEVA TEMPORADA 2026',
    'DEVOLUCIONES SIN COSTO',
  ];

  return (
    <>
      {/* ANNOUNCEMENT BAR */}
      <div className="ann-bar">
        <div className="ann-track">
          {[...annItems, ...annItems].map((item, i) => (
            <span key={i} className="ann-item">
              {item}
              <span className="ann-sep">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* HEADER */}
      <header className="site-header">
        {/* Logo */}
        <div className="header-logo" onClick={() => nav('ALL')}>
          <img
            src="/sanslimit_logo.png"
            alt="Sans Limit"
            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
          />
          <span className="header-logo-text" style={{ display:'none' }}>SANS LIMIT</span>
        </div>

        {/* Desktop Nav */}
        <nav className="header-nav">
          <button className="header-nav-link" onClick={() => nav('NEW')}>NEW IN</button>

          <div
            className="nav-dropdown-wrap"
            onMouseEnter={() => setShowDropdown(true)}
            onMouseLeave={() => setShowDropdown(false)}
          >
            <button className="header-nav-link" onClick={() => nav('ALL')}>PRODUCTOS</button>
            {showDropdown && (
              <div className="nav-dropdown">
                {['HOODIES','T-SHIRTS','PANTS','ACCESSORIES'].map(cat => (
                  <button key={cat} className="nav-dropdown-item" onClick={() => { nav(cat); setShowDropdown(false); }}>
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="header-nav-link" onClick={() => nav('PERFUMES')}>PERFUMES</button>
          <button className="header-nav-link accent-muted" onClick={() => nav('WINTER')}>WINTER '26</button>
          <button className="header-nav-link accent-red" onClick={() => nav('OUTLET')}>OUTLET</button>

          {isAdmin && (
            <button className="header-nav-link accent-green" onClick={() => nav('DASHBOARD')}>
              DASHBOARD
            </button>
          )}
        </nav>

        {/* Right */}
        <div className="header-right">
          {/* Cart */}
          <button className="header-cart-btn" onClick={() => setShowCart(true)} aria-label="Carrito">
            <span className="header-cart-icon">🛒</span>
            {cartCount > 0 && (
              <span className="header-cart-badge" key={cartCount}>{cartCount}</span>
            )}
          </button>

          {/* User / Login */}
          {!usuario ? (
            <button className="header-login-btn" onClick={() => setShowLogin(true)}>
              INGRESAR
            </button>
          ) : (
            <div className="header-user-info">
              {isAdmin && <span className="header-admin-badge">ADMIN</span>}
              <span className="header-username">
                <span className="header-username-dot" />
                {(usuario.username || usuario.Username)?.toUpperCase()}
              </span>
              <button className="header-logout-btn" onClick={handleLogout}>SALIR</button>
            </div>
          )}

          {/* Hamburger */}
          <button
            className="header-hamburger"
            onClick={() => setMobileOpen(p => !p)}
            aria-label="Menú"
          >
            <span className={`ham-line${mobileOpen ? ' open' : ''}`} />
            <span className={`ham-line${mobileOpen ? ' open' : ''}`} />
            <span className={`ham-line${mobileOpen ? ' open' : ''}`} />
          </button>
        </div>
      </header>

      {/* MOBILE MENU */}
      <div className={`mobile-menu${mobileOpen ? ' open' : ''}`}>
        <button className="mobile-nav-item" onClick={() => nav('ALL', true)}>INICIO</button>
        <button className="mobile-nav-item" onClick={() => nav('NEW', true)}>NEW IN</button>
        <button className="mobile-nav-item" onClick={() => nav('ALL', true)}>PRODUCTOS</button>
        {['HOODIES','T-SHIRTS','PANTS','ACCESSORIES'].map(cat => (
          <button key={cat} className="mobile-nav-sub" onClick={() => nav(cat, true)}>
            → {cat}
          </button>
        ))}
        <button className="mobile-nav-item" onClick={() => nav('PERFUMES', true)}>PERFUMES</button>
        <button className="mobile-nav-item accent-muted" style={{ fontSize:'1.8rem', color:'rgba(255,255,255,0.35)' }} onClick={() => nav('WINTER', true)}>WINTER '26</button>
        <button className="mobile-nav-item red" onClick={() => nav('OUTLET', true)}>OUTLET</button>
        {isAdmin && (
          <button className="mobile-nav-item green" onClick={() => nav('DASHBOARD', true)}>DASHBOARD</button>
        )}

        <div className="mobile-menu-footer">
          {!usuario ? (
            <button className="header-login-btn" style={{ alignSelf:'flex-start' }} onClick={() => { setShowLogin(true); setMobileOpen(false); }}>
              INICIAR SESIÓN
            </button>
          ) : (
            <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
              <span className="header-username" style={{ fontSize:'0.7rem' }}>
                <span className="header-username-dot" />
                {(usuario.username || usuario.Username)?.toUpperCase()}
              </span>
              <button className="header-logout-btn" style={{ fontSize:'0.65rem' }} onClick={() => { handleLogout(); setMobileOpen(false); }}>
                SALIR
              </button>
            </div>
          )}
          <span className="mobile-menu-footer-text">SANS LIMIT · STREETWEAR · 2026</span>
        </div>
      </div>
    </>
  );
};

export default Header;