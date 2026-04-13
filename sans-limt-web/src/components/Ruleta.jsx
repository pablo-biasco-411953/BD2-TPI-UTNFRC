import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import "../styles/responsive.css";
const DEBUG_MODE = false;

/* ─── INLINE KEYFRAMES injected once ─── */
const injectStyles = () => {
  if (document.getElementById('ruleta-styles')) return;
  const s = document.createElement('style');
  s.id = 'ruleta-styles';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&display=swap');

    @keyframes glitch {
      0%,100% { text-shadow: -2px 0 #ff0055, 2px 0 #00ffaa; transform: translate(0); }
      20%      { text-shadow:  2px 0 #ff0055,-2px 0 #00ffaa; transform: translate(-2px,1px); }
      40%      { text-shadow: -2px 0 #ff0055, 2px 0 #00ffaa; transform: translate(2px,-1px); }
      60%      { text-shadow:  2px 0 #ff0055,-2px 0 #00ffaa; transform: translate(0); }
    }
    @keyframes badgePop {
      0%   { opacity:0; transform:scale(0.6) translateY(12px); }
      60%  { transform:scale(1.08) translateY(-3px); }
      100% { opacity:1; transform:scale(1) translateY(0); }
    }
    @keyframes badgeOut {
      0%   { opacity:1; transform:scale(1); }
      100% { opacity:0; transform:scale(0.7) translateY(8px); }
    }
    @keyframes scanline {
      0%   { background-position: 0 0; }
      100% { background-position: 0 100%; }
    }
    @keyframes pulseRing {
      0%   { box-shadow: 0 0 0 0 rgba(0,255,170,0.6); }
      70%  { box-shadow: 0 0 0 18px rgba(0,255,170,0); }
      100% { box-shadow: 0 0 0 0 rgba(0,255,170,0); }
    }
    @keyframes shimmer {
      0%   { background-position: -400px 0; }
      100% { background-position: 400px 0; }
    }
    @keyframes countdownBlink {
      0%,100% { opacity:1; }
      50%      { opacity:0.4; }
    }
    .ruleta-spin-btn:hover:not(:disabled) {
      background: #00ffaa !important;
      color: #000 !important;
      transform: translateY(-2px) !important;
      box-shadow: 0 8px 30px rgba(0,255,170,0.4) !important;
    }
    .ruleta-spin-btn:active:not(:disabled) {
      transform: translateY(0) !important;
    }
    @media (max-width: 900px) {
      .ruleta-inner { flex-direction: column !important; align-items: center !important; text-align: center; gap: 48px !important; }
      .ruleta-text-side { align-items: center; }
      .ruleta-warning-box, .ruleta-user-box { text-align: left; }
    }
    @media (max-width: 600px) {
      .ruleta-section { padding: 48px 20px !important; margin: 20px 0 !important; }
      .ruleta-title-h2 { font-size: 3.2rem !important; }
      .ruleta-spin-btn { width: 100% !important; min-width: unset !important; }
    }
  `;
  document.head.appendChild(s);
};

export const Ruleta = ({ onWinCupon, usuarioLogueado }) => {
  injectStyles();

  const [girando, setGirando] = useState(false);
  const [premio, setPremio] = useState(null);
  const [anguloRotacion, setAnguloRotacion] = useState(0);
  const [codigoCupon, setCodigoCupon] = useState('');
  const [notificacionActual, setNotificacionActual] = useState(null);
  const [badgeStyle, setBadgeStyle] = useState({ bottom: '5%', right: '5%' });
  const [notificacionesQueue, setNotificacionesQueue] = useState([]);
  const [historialMostrados, setHistorialMostrados] = useState(new Set());
  const [bloqueado, setBloqueado] = useState(false);
  const [tiempoRestante, setTiempoRestante] = useState(0);
  const [badgeVisible, setBadgeVisible] = useState(false);
  const [particulas, setParticulas] = useState([]);

  const opciones = ['10% OFF','Sigue Participando','15% OFF','Envío Gratis','5% OFF','Suerte la próxima'];
  const mapeoCupones = { '10% OFF':'RULETA10','15% OFF':'RULETA15','5% OFF':'RULETA5','Envío Gratis':'FREESHIP' };

  useEffect(() => {
    if (!usuarioLogueado || DEBUG_MODE) { setBloqueado(false); return; }
    const checkEstado = async () => {
      try {
        const res = await axios.get(`http://localhost:5286/api/Ruleta/estado/${usuarioLogueado.username}`);
        if (res.data.bloqueado) { setBloqueado(true); setTiempoRestante(res.data.segundosRestantes); }
      } catch (e) { console.error(e); }
    };
    checkEstado();
  }, [usuarioLogueado]);

  useEffect(() => {
    if (tiempoRestante <= 0) { if (tiempoRestante === 0 && bloqueado) setBloqueado(false); return; }
    const interval = setInterval(() => setTiempoRestante(p => p - 1), 1000);
    return () => clearInterval(interval);
  }, [tiempoRestante, bloqueado]);

  useEffect(() => {
    const fetchGanadores = async () => {
      try {
        const res = await axios.get('http://localhost:5286/api/Ruleta/ganadores');
        if (res.data?.length > 0) {
          const nuevos = [];
          const hist = new Set(historialMostrados);
          res.data.forEach(g => {
            const id = `${g.nombreUsuario}-${g.premio}`;
            if (!hist.has(id)) { nuevos.push(g); hist.add(id); }
          });
          if (nuevos.length > 0) { setHistorialMostrados(hist); setNotificacionesQueue(p => [...p, ...nuevos]); }
        }
      } catch (e) { console.error(e); }
    };
    fetchGanadores();
    const polling = setInterval(fetchGanadores, 8000);
    return () => clearInterval(polling);
  }, [historialMostrados]);

  useEffect(() => {
    if (girando || notificacionesQueue.length === 0 || notificacionActual) return;
    const g = notificacionesQueue[0];
    const zones = [
      { bottom:'5%', right:'5%', top:'auto', left:'auto' },
      { top:'5%', right:'5%', bottom:'auto', left:'auto' },
      { bottom:'5%', left:'5%', top:'auto', right:'auto' }
    ];
    setBadgeStyle(zones[Math.floor(Math.random() * zones.length)]);
    setNotificacionActual(`${g.nombreUsuario} ganó ${g.premio} 🔥`);
    setBadgeVisible(true);
    setTimeout(() => {
      setBadgeVisible(false);
      setTimeout(() => { setNotificacionActual(null); setNotificacionesQueue(p => p.slice(1)); }, 400);
    }, 3100);
  }, [notificacionesQueue, girando, notificacionActual]);

  const formatearTiempo = s => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), seg = s % 60;
    return `${h}h ${m}m ${seg}s`;
  };

  const lanzarParticulas = () => {
    const ps = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      color: Math.random() > 0.5 ? '#00ffaa' : '#ff0055',
      size: Math.random() * 6 + 3,
      delay: Math.random() * 0.4
    }));
    setParticulas(ps);
    setTimeout(() => setParticulas([]), 1200);
  };

  const girarRuleta = () => {
    if (!usuarioLogueado) {
      Swal.fire({ icon:'warning', title:'¡Epa!', text:'Iniciá sesión para jugar.', confirmButtonColor:'#000', background:'#111', color:'#fff' });
      return;
    }
    if (girando || premio || (bloqueado && !DEBUG_MODE)) return;

    setGirando(true);
    setCodigoCupon('');
    setNotificacionActual(null);

    const indiceGanador = Math.floor(Math.random() * opciones.length);
    const anguloPremio = (indiceGanador * 60) + 30;
    const nuevoAngulo = anguloRotacion + 1800 + (360 - anguloPremio);
    setAnguloRotacion(nuevoAngulo);

    setTimeout(async () => {
      setGirando(false);
      const resultado = opciones[indiceGanador];
      setPremio(resultado);
      lanzarParticulas();
      const codigoAsociado = mapeoCupones[resultado];

      if (codigoAsociado) {
        try {
          const response = await axios.get(`http://localhost:5286/api/cupones/${codigoAsociado}`);
          if (response.status === 200 && response.data.activo) {
            setCodigoCupon(response.data.codigo);
            onWinCupon(response.data.codigo);
            await axios.post('http://localhost:5286/api/Ruleta/ganar', {
              nombreUsuario: usuarioLogueado.username, premio: resultado
            });
            if (!DEBUG_MODE) { setBloqueado(true); setTiempoRestante(86400); }
          }
        } catch (e) { console.error(e); }
      }
    }, 3000);
  };

  const isDisabled = girando || !!premio || (bloqueado && !DEBUG_MODE);

  return (
    <section style={S.section} className="ruleta-section">
      {/* Scanline overlay */}
      <div style={S.scanlines} />
      {/* Grid bg */}
      <div style={S.gridBg} />

      {/* Partículas de premio */}
      {particulas.map(p => (
        <div key={p.id} style={{
          position:'absolute', left:`${p.x}%`, top:`${p.y}%`,
          width:`${p.size}px`, height:`${p.size}px`,
          backgroundColor: p.color, borderRadius:'50%',
          animation:`badgePop 1s ease forwards`,
          animationDelay:`${p.delay}s`, zIndex:20, pointerEvents:'none'
        }}/>
      ))}

      <div style={S.container} className="ruleta-inner">
        {/* TEXT SIDE */}
        <div style={S.textSide}>
          <div style={S.eyebrow}>⚡ EXCLUSIVO PARA MIEMBROS</div>
          <h2 style={S.title} className="ruleta-title-h2">RULETA<br/>DE LA<br/>SUERTE</h2>
          <div style={S.titleUnderline}/>
          <p style={S.subtitle}>Girá la rueda y desbloqueá un descuento exclusivo en tu próxima compra.</p>

          {!usuarioLogueado ? (
            <div style={S.warningBox}>
              <span style={S.warningIcon}>⚠</span>
              <span>Iniciá sesión para participar</span>
            </div>
          ) : (
            <div style={S.userBox}>
              <span style={S.userDot}/>
              <span style={S.userLabel}>JUGANDO COMO</span>
              <strong style={S.userName}>{usuarioLogueado.username.toUpperCase()}</strong>
            </div>
          )}

          {premio && (
            <div style={codigoCupon ? S.premioBoxWin : S.premioBoxLose}>
              {codigoCupon ? (
                <>
                  <div style={S.premioEyebrow}>🎯 ¡PREMIO DESBLOQUEADO!</div>
                  <div style={S.premioValue}>{premio}</div>
                  <div style={S.cuponRow}>
                    <span style={S.cuponLabel}>CÓDIGO:</span>
                    <span style={S.cuponCode}>{codigoCupon}</span>
                  </div>
                </>
              ) : (
                <>
                  <div style={S.premioEyebrow}>😬 ESTA VEZ NO FUE</div>
                  <div style={S.premioValueLose}>{premio}</div>
                </>
              )}
            </div>
          )}

          <button
            className="ruleta-spin-btn"
            onClick={girarRuleta}
            disabled={isDisabled}
            style={{
              ...S.spinBtn,
              opacity: isDisabled ? 0.45 : 1,
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              animation: !isDisabled && !premio ? 'pulseRing 2s infinite' : 'none'
            }}
          >
            {girando ? (
              <span style={S.btnSpinning}>
                <span style={S.spinner}/>GIRANDO...
              </span>
            ) : (bloqueado && !DEBUG_MODE) ? (
              <span style={{ animation:'countdownBlink 1s infinite' }}>
                ⏳ {formatearTiempo(tiempoRestante)}
              </span>
            ) : '⚡ PROBAR SUERTE'}
          </button>
        </div>

        {/* WHEEL SIDE */}
        <div style={S.wheelSide}>
          <div style={S.wheelGlow}/>
          <div style={S.wheelWrapper}>
            <div style={S.pointerOuter}>
              <div style={S.pointer}/>
            </div>
            <img
              src="/ruleta-sanslimit.png"
              alt="Ruleta"
              style={{
                ...S.wheelImage,
                transform: `rotate(${anguloRotacion}deg)`,
                transition: girando ? 'transform 3s cubic-bezier(0.1,1,0.1,1)' : 'none',
                filter: girando ? 'brightness(1.2) saturate(1.4)' : 'brightness(1)'
              }}
            />
            <div style={S.wheelCenter}>
              <span style={S.wheelCenterText}>SLMT</span>
            </div>
          </div>
          {/* Decorative rings */}
          <div style={S.ring1}/>
          <div style={S.ring2}/>
        </div>
      </div>

      {/* FOMO Badge */}
      <div style={{
        ...S.fomoBadge,
        ...badgeStyle,
        opacity: badgeVisible ? 1 : 0,
        transform: badgeVisible ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(10px)',
        animation: badgeVisible ? 'badgePop 0.4s ease forwards' : 'none'
      }}>
        <span style={S.fomoIcon}>🔥</span>
        {notificacionActual}
      </div>
    </section>
  );
};

const S = {
  section: {
    backgroundColor:'#050505', color:'#fff',
    padding:'80px 40px', margin:'40px 0',
    position:'relative', overflow:'hidden',
    fontFamily:'"Space Mono", monospace',
    borderTop:'1px solid #1a1a1a', borderBottom:'1px solid #1a1a1a'
  },
  scanlines: {
    position:'absolute', inset:0, pointerEvents:'none', zIndex:1,
    background:'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
  },
  gridBg: {
    position:'absolute', inset:0, pointerEvents:'none', zIndex:0,
    backgroundImage:'linear-gradient(rgba(0,255,170,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,170,0.03) 1px, transparent 1px)',
    backgroundSize:'40px 40px'
  },
  container: {
    maxWidth:'1200px', margin:'0 auto',
    display:'flex', alignItems:'center',
    justifyContent:'space-between', gap:'60px',
    position:'relative', zIndex:2
  },
  textSide: { flex:1 },
  eyebrow: {
    fontSize:'0.65rem', fontWeight:'700',
    letterSpacing:'0.25em', color:'#00ffaa',
    marginBottom:'16px', opacity:0.8
  },
  title: {
    fontSize:'4.5rem', fontWeight:'400',
    lineHeight:'0.95', letterSpacing:'-0.02em',
    fontFamily:'"Bebas Neue", sans-serif',
    marginBottom:'10px',
    background:'linear-gradient(135deg, #fff 0%, #888 100%)',
    WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'
  },
  titleUnderline: {
    width:'60px', height:'3px',
    background:'linear-gradient(90deg, #00ffaa, #ff0055)',
    marginBottom:'20px'
  },
  subtitle: {
    fontSize:'0.78rem', color:'#777',
    lineHeight:'1.7', marginBottom:'28px',
    letterSpacing:'0.03em', maxWidth:'360px'
  },
  warningBox: {
    display:'flex', alignItems:'center', gap:'10px',
    padding:'12px 16px', marginBottom:'24px',
    backgroundColor:'rgba(255,68,68,0.08)',
    border:'1px solid rgba(255,68,68,0.3)',
    borderRadius:'2px', fontSize:'0.75rem', color:'#ff8888'
  },
  warningIcon: { fontSize:'1rem' },
  userBox: {
    display:'flex', alignItems:'center', gap:'10px',
    padding:'12px 16px', marginBottom:'24px',
    backgroundColor:'rgba(0,255,170,0.06)',
    border:'1px solid rgba(0,255,170,0.25)',
    borderRadius:'2px', fontSize:'0.75rem'
  },
  userDot: {
    width:'8px', height:'8px', borderRadius:'50%',
    backgroundColor:'#00ffaa', flexShrink:0,
    boxShadow:'0 0 8px #00ffaa', animation:'pulseRing 2s infinite'
  },
  userLabel: { color:'#555', fontSize:'0.65rem', letterSpacing:'0.1em' },
  userName: { color:'#00ffaa', fontSize:'0.8rem', letterSpacing:'0.1em' },
  premioBoxWin: {
    backgroundColor:'rgba(0,255,170,0.06)',
    border:'1px solid rgba(0,255,170,0.4)',
    padding:'20px', marginBottom:'24px',
    borderRadius:'2px', position:'relative', overflow:'hidden'
  },
  premioBoxLose: {
    backgroundColor:'rgba(255,0,85,0.06)',
    border:'1px solid rgba(255,0,85,0.3)',
    padding:'20px', marginBottom:'24px', borderRadius:'2px'
  },
  premioEyebrow: {
    fontSize:'0.6rem', letterSpacing:'0.2em',
    color:'#00ffaa', marginBottom:'8px', fontWeight:'700'
  },
  premioValue: {
    fontSize:'2rem', fontWeight:'400',
    fontFamily:'"Bebas Neue", sans-serif',
    letterSpacing:'0.05em', marginBottom:'14px'
  },
  premioValueLose: {
    fontSize:'2rem', fontWeight:'400',
    fontFamily:'"Bebas Neue", sans-serif',
    letterSpacing:'0.05em', color:'#555', marginTop:'6px'
  },
  cuponRow: { display:'flex', alignItems:'center', gap:'12px' },
  cuponLabel: { fontSize:'0.6rem', color:'#555', letterSpacing:'0.15em' },
  cuponCode: {
    backgroundColor:'#000', border:'1px solid #00ffaa',
    color:'#00ffaa', padding:'6px 14px',
    fontSize:'0.9rem', fontWeight:'700',
    letterSpacing:'0.2em',
    background:'linear-gradient(90deg, rgba(0,255,170,0.1), rgba(0,255,170,0.05))',
    backgroundSize:'400px 100%', animation:'shimmer 2s infinite'
  },
  spinBtn: {
    padding:'16px 36px', fontSize:'0.85rem',
    fontWeight:'700', letterSpacing:'0.2em',
    transition:'all 0.25s ease',
    minWidth:'260px', border:'2px solid #fff',
    backgroundColor:'transparent', color:'#fff',
    fontFamily:'"Space Mono", monospace',
    borderRadius:'1px', position:'relative', overflow:'hidden'
  },
  btnSpinning: { display:'flex', alignItems:'center', gap:'10px', justifyContent:'center' },
  spinner: {
    display:'inline-block', width:'14px', height:'14px',
    border:'2px solid rgba(255,255,255,0.3)',
    borderTopColor:'#fff', borderRadius:'50%',
    animation:'spin 0.7s linear infinite'
  },
  wheelSide: {
    flex:1, display:'flex', justifyContent:'center',
    alignItems:'center', position:'relative'
  },
  wheelGlow: {
    position:'absolute', width:'380px', height:'380px',
    borderRadius:'50%',
    background:'radial-gradient(circle, rgba(0,255,170,0.08) 0%, transparent 70%)',
    pointerEvents:'none'
  },
  wheelWrapper: { position:'relative', width:'300px', height:'300px', zIndex:2 },
  pointerOuter: {
    position:'absolute', top:'-22px', left:'50%',
    transform:'translateX(-50%)', zIndex:10,
    filter:'drop-shadow(0 0 8px #fff)'
  },
  pointer: {
    width:0, height:0,
    borderLeft:'12px solid transparent',
    borderRight:'12px solid transparent',
    borderTop:'22px solid #fff'
  },
  wheelImage: {
    width:'300px', height:'300px',
    borderRadius:'50%', border:'4px solid #fff',
    boxShadow:'0 0 40px rgba(255,255,255,0.1), inset 0 0 20px rgba(0,0,0,0.3)'
  },
  wheelCenter: {
    position:'absolute', width:'56px', height:'56px',
    backgroundColor:'#000', border:'3px solid #fff',
    borderRadius:'50%', top:'50%', left:'50%',
    transform:'translate(-50%,-50%)',
    display:'flex', alignItems:'center', justifyContent:'center', zIndex:5,
    boxShadow:'0 0 20px rgba(0,255,170,0.3)'
  },
  wheelCenterText: {
    fontSize:'0.65rem', fontWeight:'700',
    letterSpacing:'0.05em', color:'#fff'
  },
  ring1: {
    position:'absolute', width:'340px', height:'340px',
    border:'1px solid rgba(0,255,170,0.12)',
    borderRadius:'50%', pointerEvents:'none'
  },
  ring2: {
    position:'absolute', width:'390px', height:'390px',
    border:'1px solid rgba(0,255,170,0.06)',
    borderRadius:'50%', pointerEvents:'none'
  },
  fomoBadge: {
    position:'absolute', zIndex:20,
    backgroundColor:'rgba(0,0,0,0.9)',
    border:'1px solid #00ffaa',
    color:'#00ffaa', padding:'10px 18px',
    fontSize:'0.75rem', fontWeight:'700',
    letterSpacing:'0.05em',
    transition:'opacity 0.4s ease, transform 0.4s cubic-bezier(0.34,1.56,0.64,1)',
    pointerEvents:'none', whiteSpace:'nowrap',
    boxShadow:'0 0 20px rgba(0,255,170,0.2), inset 0 0 20px rgba(0,255,170,0.03)'
  },
  fomoIcon: { marginRight:'8px' }
};

/* ── RESPONSIVE PATCH ── Inject via separate style tag */
const injectRuletaResponsive = () => {
  if (document.getElementById('ruleta-responsive')) return;
  const s = document.createElement('style');
  s.id = 'ruleta-responsive';
  s.textContent = `
    @media (max-width: 900px) {
      .ruleta-container-inner {
        flex-direction: column !important;
        gap: 40px !important;
        text-align: center;
      }
      .ruleta-wheel-side {
        order: -1;
      }
    }
    @media (max-width: 600px) {
      .ruleta-section-root {
        padding: 48px 20px !important;
        margin: 20px 0 !important;
      }
      .ruleta-title-big {
        font-size: 3rem !important;
      }
      .ruleta-spin-btn {
        width: 100% !important;
        min-width: unset !important;
      }
      .ruleta-wheel-img {
        width: 240px !important;
        height: 240px !important;
      }
      .ruleta-wheel-wrapper {
        width: 240px !important;
        height: 240px !important;
      }
    }
  `;
  document.head.appendChild(s);
};