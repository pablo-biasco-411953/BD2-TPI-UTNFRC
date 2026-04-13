import React, { useEffect, useRef, useState } from 'react';

const injectHeroStyles = () => {
  if (document.getElementById('hero-styles')) return;
  const s = document.createElement('style');
  s.id = 'hero-styles';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');

    @keyframes heroReveal {
      0%   { opacity: 0; transform: translateY(30px) skewY(1deg); }
      100% { opacity: 1; transform: translateY(0) skewY(0); }
    }
    @keyframes heroLineExpand {
      0%   { width: 0; opacity: 0; }
      100% { width: 100%; opacity: 1; }
    }
    @keyframes heroBadgeIn {
      0%   { opacity: 0; transform: translateX(-20px); }
      100% { opacity: 1; transform: translateX(0); }
    }
    @keyframes heroSubIn {
      0%   { opacity: 0; transform: translateY(10px); }
      100% { opacity: 0.7; transform: translateY(0); }
    }
    @keyframes heroBtnIn {
      0%   { opacity: 0; transform: translateY(16px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    @keyframes grainMove {
      0%   { transform: translate(0, 0); }
      10%  { transform: translate(-1%, -2%); }
      20%  { transform: translate(2%, 1%); }
      30%  { transform: translate(-1%, 3%); }
      40%  { transform: translate(3%, -1%); }
      50%  { transform: translate(-2%, 2%); }
      60%  { transform: translate(1%, -3%); }
      70%  { transform: translate(-3%, 1%); }
      80%  { transform: translate(2%, -2%); }
      90%  { transform: translate(-1%, 3%); }
      100% { transform: translate(0, 0); }
    }
    @keyframes scrollBounce {
      0%,100% { transform: translateX(-50%) translateY(0); }
      50%      { transform: translateX(-50%) translateY(6px); }
    }
    @keyframes tickerScroll {
      0%   { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    @keyframes counterUp {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes glowPulse {
      0%,100% { opacity: 0.4; }
      50%      { opacity: 0.8; }
    }
    @keyframes shimmerSlide {
      0%   { background-position: -400% center; }
      100% { background-position: 400% center; }
    }

    .hero-root {
      width: 100%;
      height: 100vh;
      min-height: 560px;
      position: relative;
      overflow: hidden;
      background: #060606;
      font-family: 'Space Mono', monospace;
    }

    /* BG Image */
    .hero-bg {
      position: absolute;
      inset: 0;
      background-image: url('/images/hero-city.png');
      background-size: cover;
      background-position: center 30%;
      transform-origin: center;
      transition: transform 8s ease-out;
      filter: brightness(0.35) saturate(0.8);
    }
    .hero-bg.loaded { transform: scale(1.04); }

    /* Grain overlay */
    .hero-grain {
      position: absolute;
      inset: -50%;
      width: 200%;
      height: 200%;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
      background-repeat: repeat;
      animation: grainMove 0.8s steps(1) infinite;
      pointer-events: none;
      z-index: 2;
      opacity: 0.5;
    }

    /* Gradient layers */
    .hero-grad-bottom {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top,
        rgba(0,0,0,0.98) 0%,
        rgba(0,0,0,0.5) 40%,
        rgba(0,0,0,0.1) 70%,
        transparent 100%
      );
      z-index: 3;
    }
    .hero-grad-left {
      position: absolute;
      inset: 0;
      background: linear-gradient(to right,
        rgba(0,0,0,0.7) 0%,
        transparent 60%
      );
      z-index: 3;
    }

    /* Accent glow */
    .hero-glow {
      position: absolute;
      bottom: 20%;
      left: -10%;
      width: 60%;
      height: 40%;
      background: radial-gradient(ellipse, rgba(0,255,170,0.06) 0%, transparent 70%);
      z-index: 3;
      animation: glowPulse 4s ease-in-out infinite;
    }

    /* Content */
    .hero-content {
      position: absolute;
      inset: 0;
      z-index: 10;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding: 0 60px 80px;
      max-width: 900px;
    }

    /* Badge */
    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(0,255,170,0.1);
      border: 1px solid rgba(0,255,170,0.35);
      color: #00ffaa;
      font-size: 0.6rem;
      font-weight: 700;
      letter-spacing: 0.25em;
      padding: 6px 14px;
      margin-bottom: 24px;
      width: fit-content;
      opacity: 0;
      animation: heroBadgeIn 0.6s ease 0.3s forwards;
    }
    .hero-badge-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: #00ffaa;
      box-shadow: 0 0 8px #00ffaa;
      animation: glowPulse 1.5s ease-in-out infinite;
    }

    /* Main title */
    .hero-title-wrap {
      overflow: hidden;
      margin-bottom: 6px;
    }
    .hero-title-line {
      display: block;
      font-family: 'Bebas Neue', sans-serif;
      font-size: clamp(3.5rem, 10vw, 8rem);
      line-height: 0.92;
      letter-spacing: -0.01em;
      color: #fff;
      opacity: 0;
    }
    .hero-title-line.l1 { animation: heroReveal 0.7s cubic-bezier(0.16,1,0.3,1) 0.5s forwards; }
    .hero-title-line.l2 {
      animation: heroReveal 0.7s cubic-bezier(0.16,1,0.3,1) 0.65s forwards;
      background: linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.4) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero-title-line.l3 { animation: heroReveal 0.7s cubic-bezier(0.16,1,0.3,1) 0.8s forwards; }

    /* Divider line */
    .hero-divider {
      height: 2px;
      background: linear-gradient(90deg, #00ffaa, #ff0055, transparent);
      width: 0;
      opacity: 0;
      margin: 20px 0;
      animation: heroLineExpand 0.8s ease 1s forwards;
    }

    /* Subtitle */
    .hero-sub {
      font-size: clamp(0.7rem, 2vw, 0.9rem);
      color: #fff;
      letter-spacing: 0.12em;
      line-height: 1.7;
      max-width: 480px;
      opacity: 0;
      animation: heroSubIn 0.6s ease 1.1s forwards;
    }

    /* CTA row */
    .hero-cta-row {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-top: 32px;
      flex-wrap: wrap;
    }

    .hero-btn-primary {
      background: #fff;
      color: #000;
      border: none;
      padding: 16px 36px;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.18em;
      cursor: pointer;
      font-family: 'Space Mono', monospace;
      position: relative;
      overflow: hidden;
      opacity: 0;
      animation: heroBtnIn 0.5s ease 1.3s forwards;
      transition: all 0.3s ease;
      white-space: nowrap;
    }
    .hero-btn-primary::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, transparent, rgba(0,255,170,0.3), transparent);
      background-size: 200% 100%;
      opacity: 0;
      transition: opacity 0.3s;
    }
    .hero-btn-primary:hover {
      background: #00ffaa;
      letter-spacing: 0.24em;
    }
    .hero-btn-primary:hover::before { opacity: 1; }

    .hero-btn-secondary {
      background: transparent;
      color: #fff;
      border: 1px solid rgba(255,255,255,0.3);
      padding: 16px 28px;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.18em;
      cursor: pointer;
      font-family: 'Space Mono', monospace;
      opacity: 0;
      animation: heroBtnIn 0.5s ease 1.45s forwards;
      transition: all 0.3s ease;
      white-space: nowrap;
    }
    .hero-btn-secondary:hover {
      border-color: #fff;
      background: rgba(255,255,255,0.06);
    }

    /* Stats */
    .hero-stats {
      position: absolute;
      top: 50%;
      right: 60px;
      transform: translateY(-50%);
      display: flex;
      flex-direction: column;
      gap: 32px;
      z-index: 10;
      opacity: 0;
      animation: heroBtnIn 0.6s ease 1.6s forwards;
    }
    .hero-stat {
      text-align: right;
      border-right: 2px solid rgba(255,255,255,0.15);
      padding-right: 20px;
    }
    .hero-stat-num {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 2.2rem;
      color: #fff;
      line-height: 1;
      letter-spacing: 0.04em;
    }
    .hero-stat-label {
      font-size: 0.55rem;
      color: rgba(255,255,255,0.4);
      letter-spacing: 0.2em;
      font-weight: 700;
      margin-top: 2px;
    }

    /* Scroll indicator */
    .hero-scroll {
      position: absolute;
      bottom: 32px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      opacity: 0;
      animation: heroBtnIn 0.5s ease 1.8s forwards;
    }
    .hero-scroll-line {
      width: 1px;
      height: 40px;
      background: linear-gradient(to bottom, rgba(255,255,255,0.5), transparent);
      animation: scrollBounce 1.8s ease-in-out infinite;
    }
    .hero-scroll-text {
      font-size: 0.5rem;
      color: rgba(255,255,255,0.4);
      letter-spacing: 0.3em;
      font-weight: 700;
    }

    /* Bottom ticker */
    .hero-ticker-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 36px;
      background: rgba(0,0,0,0.85);
      border-top: 1px solid rgba(255,255,255,0.08);
      overflow: hidden;
      z-index: 10;
      display: flex;
      align-items: center;
    }
    .hero-ticker-track {
      display: flex;
      white-space: nowrap;
      animation: tickerScroll 20s linear infinite;
    }
    .hero-ticker-item {
      font-size: 0.58rem;
      font-weight: 700;
      letter-spacing: 0.2em;
      color: rgba(255,255,255,0.5);
      padding: 0 40px;
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .hero-ticker-sep {
      color: #00ffaa;
      opacity: 0.6;
    }

    /* ── RESPONSIVE ── */
    @media (max-width: 900px) {
      .hero-stats { display: none; }
      .hero-content { padding: 0 32px 72px; }
    }

    @media (max-width: 600px) {
      .hero-root { height: 100svh; min-height: 500px; }
      .hero-content {
        padding: 0 20px 64px;
        max-width: 100%;
      }
      .hero-badge { font-size: 0.55rem; padding: 5px 10px; }
      .hero-cta-row { gap: 12px; }
      .hero-btn-primary, .hero-btn-secondary {
        padding: 14px 22px;
        font-size: 0.65rem;
        letter-spacing: 0.14em;
      }
      .hero-sub { font-size: 0.68rem; }
      .hero-divider { margin: 14px 0; }
      .hero-scroll { display: none; }
    }
  `;
  document.head.appendChild(s);
};

export const Hero = ({ onShopNow }) => {
  injectHeroStyles();
  const bgRef = useRef(null);
  const [bgLoaded, setBgLoaded] = useState(false);

  // Ken Burns subtle parallax on scroll
  useEffect(() => {
    const onScroll = () => {
      if (!bgRef.current) return;
      const scrollY = window.scrollY;
      const shift = scrollY * 0.15;
      bgRef.current.style.transform = `scale(1.04) translateY(${shift}px)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Trigger loaded state for Ken Burns
  useEffect(() => {
    const timer = setTimeout(() => setBgLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const tickerItems = [
    '3 Y 6 CUOTAS SIN INTERÉS',
    'ENVÍOS A TODO EL PAÍS',
    '10% OFF CON TRANSFERENCIA',
    'NUEVA TEMPORADA 2026',
    'COLECCIÓN EXCLUSIVA',
    'STOCK LIMITADO',
  ];

  return (
    <section className="hero-root">
      {/* Background */}
      <div ref={bgRef} className={`hero-bg${bgLoaded ? ' loaded' : ''}`} />

      {/* Overlays */}
      <div className="hero-grain" />
      <div className="hero-grad-bottom" />
      <div className="hero-grad-left" />
      <div className="hero-glow" />

      {/* Main content */}
      <div className="hero-content">
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          TEMPORADA 2026 · NUEVA COLECCIÓN
        </div>

        <div className="hero-title-wrap">
          <span className="hero-title-line l1">DRESS LIKE</span>
        </div>
        <div className="hero-title-wrap">
          <span className="hero-title-line l2">YOU'RE</span>
        </div>
        <div className="hero-title-wrap">
          <span className="hero-title-line l3">LIMITLESS.</span>
        </div>

        <div className="hero-divider" />

        <p className="hero-sub">
          Streetwear sin límites. Cada pieza diseñada<br />
          para los que van más allá.
        </p>

        <div className="hero-cta-row">
          <button
            className="hero-btn-primary"
            onClick={() => {
              const main = document.querySelector('main');
              if (main) main.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            VER COLECCIÓN →
          </button>
          <button className="hero-btn-secondary">
            NUESTRA HISTORIA
          </button>
        </div>
      </div>

      {/* Side stats */}
      <div className="hero-stats">
        <div className="hero-stat">
          <div className="hero-stat-num">4K+</div>
          <div className="hero-stat-label">CLIENTES</div>
        </div>
        <div className="hero-stat">
          <div className="hero-stat-num">120+</div>
          <div className="hero-stat-label">PRODUCTOS</div>
        </div>
        <div className="hero-stat">
          <div className="hero-stat-num">26</div>
          <div className="hero-stat-label">TEMPORADA</div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="hero-scroll">
        <span className="hero-scroll-text">SCROLL</span>
        <div className="hero-scroll-line" />
      </div>

      {/* Ticker bar */}
      <div className="hero-ticker-bar">
        <div className="hero-ticker-track">
          {[...tickerItems, ...tickerItems, ...tickerItems].map((item, i) => (
            <span key={i} className="hero-ticker-item">
              {item}
              <span className="hero-ticker-sep">✦</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;