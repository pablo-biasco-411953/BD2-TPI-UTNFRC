import { useEffect, useState, useRef } from 'react';
import axios from 'axios';

import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ProductGrid } from './components/ProductGrid';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { AdminDashboard } from './components/AdminDashboard';
import { LoginRegistro } from './components/LoginRegistro';
import { Ruleta } from './components/Ruleta';

import './styles/App.css';

const injectAppStyles = () => {
  if (document.getElementById('app-global-styles')) return;
  const s = document.createElement('style');
  s.id = 'app-global-styles';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&display=swap');
    * { box-sizing: border-box; }
    body { margin:0; background:#fff; font-family:'Space Mono',monospace; -webkit-font-smoothing:antialiased; }

    @keyframes socialSlideIn {
      from { opacity:0; transform:translateX(-24px) scale(0.95); }
      to   { opacity:1; transform:translateX(0) scale(1); }
    }
    @keyframes recomReveal {
      from { opacity:0; transform:translateY(16px); }
      to   { opacity:1; transform:translateY(0); }
    }
    @keyframes tickerMove {
      0%   { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    @keyframes dotPulse {
      0%,100% { box-shadow: 0 0 0 0 rgba(255,0,85,0.6); }
      50%      { box-shadow: 0 0 0 6px rgba(255,0,85,0); }
    }

    .social-badge-item {
      background: rgba(5,5,5,0.96); color:#fff;
      padding:12px 18px 12px 14px; font-size:0.72rem; font-weight:700;
      font-family:'Space Mono',monospace; letter-spacing:0.04em;
      border-left:3px solid #00ffaa; display:flex; align-items:center; gap:10px;
      animation:socialSlideIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards;
      backdrop-filter:blur(8px); max-width:320px;
      box-shadow:4px 4px 0 rgba(0,255,170,0.15);
    }
    .social-badge-item .fire-icon { font-size:1rem; flex-shrink:0; }
    .recom-section { animation:recomReveal 0.5s ease forwards; }

    /* ─── CAROUSEL ─── */
    .carousel-outer {
      position:relative;
      overflow:hidden;
    }
    .carousel-fade-l {
      position:absolute; left:0; top:0; bottom:0; width:100px;
      background:linear-gradient(to right, #fff, transparent);
      pointer-events:none; z-index:3;
    }
    .carousel-fade-r {
      position:absolute; right:0; top:0; bottom:0; width:100px;
      background:linear-gradient(to left, #fff, transparent);
      pointer-events:none; z-index:3;
    }
    .carousel-track {
      display:flex;
      gap:20px;
      width:max-content;
      padding:4px 2px 12px;
      animation: tickerMove var(--dur, 30s) linear infinite;
      cursor:grab;
    }
    .carousel-track:active { cursor:grabbing; }
    .carousel-track:hover,
    .carousel-track.is-paused {
      animation-play-state: paused;
    }

    /* ─── CAROUSEL CARD ─── */
    .cc {
      width:260px; flex-shrink:0;
      background:#fff; border:1px solid #ebebeb;
      position:relative; overflow:hidden;
      transition:transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
      cursor:pointer;
      font-family:'Space Mono',monospace;
    }
    .cc:hover {
      transform:translateY(-6px);
      box-shadow:0 20px 44px rgba(0,0,0,0.11);
      border-color:#000;
    }
    .cc.recom { border-top:3px solid #ff0055; }
    .cc-img-wrap { height:300px; overflow:hidden; background:#f6f6f6; }
    .cc-img {
      width:100%; height:100%; object-fit:contain;
      transition:transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94);
    }
    .cc:hover .cc-img { transform:scale(1.05); }
    .cc-body { padding:12px 13px 0; }
    .cc-cat { font-size:0.56rem; color:#bbb; letter-spacing:0.18em; font-weight:700; margin-bottom:3px; }
    .cc-name { font-size:0.8rem; font-weight:700; letter-spacing:0.02em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:5px; }
    .cc-price { font-family:'Bebas Neue',sans-serif; font-size:1.25rem; letter-spacing:0.04em; color:#111; }
    .cc-stock { font-size:0.58rem; font-weight:700; letter-spacing:0.08em; margin:4px 0 10px; }
    .cc-badge { position:absolute; top:10px; left:10px; background:#ff0055; color:#fff; font-size:0.54rem; font-weight:700; letter-spacing:0.12em; padding:4px 8px; z-index:4; }
    .cc-badge-stock { position:absolute; top:10px; right:10px; background:#ffaa00; color:#000; font-size:0.54rem; font-weight:700; letter-spacing:0.1em; padding:4px 8px; z-index:4; }
    .cc-btn {
      display:block; width:100%; background:#000; color:#fff;
      border:none; padding:12px; font-size:0.63rem; font-weight:700;
      letter-spacing:0.14em; cursor:pointer;
      font-family:'Space Mono',monospace;
      transition:background 0.2s ease, letter-spacing 0.2s ease;
    }
    .cc-btn:hover:not(:disabled) { background:#00ffaa; color:#000; letter-spacing:0.22em; }
    .cc-btn:disabled { background:#ccc; cursor:not-allowed; }

    /* ─── CAROUSEL CONTROLS ─── */
    .carousel-ctrl-btn {
      width:38px; height:38px; border:1.5px solid #000;
      background:#fff; cursor:pointer;
      display:flex; align-items:center; justify-content:center;
      font-size:0.85rem; transition:all 0.2s ease;
      font-family:'Space Mono',monospace; flex-shrink:0;
    }
    .carousel-ctrl-btn:hover { background:#000; color:#fff; }
    .carousel-ctrl-btn.active { background:#000; color:#fff; }
  `;
  document.head.appendChild(s);
};

/* ─── Carousel Card ─── */
const CarouselCard = ({ prod, addToCart, onOpen }) => {
  const [adding, setAdding] = useState(false);

  const img = prod?.imagenes?.[0] || prod?.imagenUrl;
  const src = typeof img === 'string' && img.startsWith('http')
    ? img : (img ? `/images/products/${img}` : '/sanslimit_logo.jpeg');

  const stockTotal = prod?.variantes?.length > 0
    ? prod.variantes.reduce((a, v) => a + (v.stock ?? v.Stock ?? 0), 0)
    : (prod?.stock ?? prod?.Stock ?? 0);
  const stockBajo = stockTotal > 0 && stockTotal <= 3;

  const handleAdd = async (e) => {
    e.stopPropagation();
    if (prod?.variantes?.length > 0) { onOpen(prod); return; }
    setAdding(true);
    await addToCart(prod, null);
    setTimeout(() => setAdding(false), 900);
  };

  return (
    <div className={`cc${prod.esSugerido ? ' recom' : ''}`} onClick={() => onOpen(prod)}>
      {prod.esSugerido && <div className="cc-badge">PARA VOS</div>}
      {stockBajo && stockTotal > 0 && <div className="cc-badge-stock">⚡ {stockTotal} LEFT</div>}
      <div className="cc-img-wrap">
        <img className="cc-img" src={src} alt={prod.nombre} />
      </div>
      <div className="cc-body">
        {prod.categoria && <div className="cc-cat">{prod.categoria}</div>}
        <div className="cc-name">{prod.nombre?.toUpperCase()}</div>
        <div className="cc-price">${prod.precio?.toLocaleString()}</div>
        <div className="cc-stock" style={{ color: stockTotal > 0 ? (stockBajo ? '#e09000' : '#00aa77') : '#e04444' }}>
          {stockTotal > 0 ? `${stockTotal} disponibles` : 'SIN STOCK'}
        </div>
      </div>
      <button className="cc-btn" onClick={handleAdd} disabled={stockTotal <= 0}>
        {adding ? '✓ AÑADIDO' : stockTotal <= 0 ? 'AGOTADO' : prod?.variantes?.length > 0 ? 'ELEGIR TALLE →' : 'AÑADIR →'}
      </button>
    </div>
  );
};

/* ─── Carousel wrapper ─── */
const RecomCarousel = ({ productos, addToCart, onOpen }) => {
  const trackRef = useRef(null);
  const [paused, setPaused] = useState(false);

  // Drag-to-scroll
  const dragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const onMouseDown = (e) => {
    dragging.current = true;
    startX.current = e.pageX;
    // Pause CSS animation and get current visual offset
    const track = trackRef.current;
    if (!track) return;
    const matrix = new DOMMatrix(window.getComputedStyle(track).transform);
    scrollLeft.current = matrix.m41;
    setPaused(true);
    track.style.transform = `translateX(${scrollLeft.current}px)`;
    track.style.animation = 'none';
  };

  const onMouseMove = (e) => {
    if (!dragging.current || !trackRef.current) return;
    const delta = e.pageX - startX.current;
    trackRef.current.style.transform = `translateX(${scrollLeft.current + delta}px)`;
  };

  const onMouseUp = () => {
    dragging.current = false;
    // Re-enable animation after 1.8s idle
    setTimeout(() => {
      if (!dragging.current && trackRef.current) {
        trackRef.current.style.transform = '';
        trackRef.current.style.animation = '';
        setPaused(false);
      }
    }, 1800);
  };

  // Duration scales with item count
  const dur = `${Math.max(20, productos.length * 6)}s`;
  // Duplicate for seamless loop
  const doubled = [...productos, ...productos];

  return (
    <div>
      {/* Controls */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'18px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ width:'7px', height:'7px', borderRadius:'50%', backgroundColor:'#ff0055', animation:'dotPulse 2s infinite' }}/>
          <span style={{ fontSize:'0.58rem', color:'#aaa', fontWeight:'700', letterSpacing:'0.18em' }}>
            RECOMENDACIONES EN TIEMPO REAL · {productos.length} PRODUCTOS
          </span>
        </div>
        <button
          className={`carousel-ctrl-btn${paused ? ' active' : ''}`}
          onClick={() => {
            if (!paused) {
              const track = trackRef.current;
              if (track) {
                const matrix = new DOMMatrix(window.getComputedStyle(track).transform);
                track.style.transform = `translateX(${matrix.m41}px)`;
                track.style.animation = 'none';
              }
              setPaused(true);
            } else {
              if (trackRef.current) {
                trackRef.current.style.transform = '';
                trackRef.current.style.animation = '';
              }
              setPaused(false);
            }
          }}
          title={paused ? 'Reanudar' : 'Pausar'}
        >
          {paused ? '▶' : '⏸'}
        </button>
      </div>

      {/* Track */}
      <div
        className="carousel-outer"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <div className="carousel-fade-l"/>
        <div className="carousel-fade-r"/>
        <div
          ref={trackRef}
          className={`carousel-track${paused ? ' is-paused' : ''}`}
          style={{ '--dur': dur }}
        >
          {doubled.map((prod, i) => (
            <CarouselCard
              key={`${prod.id || prod._id}-${i}`}
              prod={prod}
              addToCart={addToCart}
              onOpen={onOpen}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

/* ─── APP ─── */
export default function App() {
  injectAppStyles();

  const [cart, setCart] = useState(() => {
    try {
      const saved = window.localStorage.getItem('carrito_sanslimit');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [showCart, setShowCart] = useState(false);
  const [productos, setProductos] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginScreen, setShowLoginScreen] = useState(false);
  const [categoriaActual, setCategoriaActual] = useState('ALL');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [cuponGanado, setCuponGanado] = useState('');
  //const [actividades, setActividades] = useState([]);
  const [recomendadosIds, setRecomendadosIds] = useState([]);
  const [hoveredProductId, setHoveredProductId] = useState(null);
  const [productoParaModal, setProductoParaModal] = useState(null);
  const gridRef = useRef(null);

  useEffect(() => { window.localStorage.setItem('carrito_sanslimit', JSON.stringify(cart)); }, [cart]);

  //useEffect(() => {
    //const t = setInterval(async () => {
      //try { const { data } = await axios.get('http://localhost:5286/api/Social/actividad'); setActividades(data); } catch {}
    //}, 3000);
    //return () => clearInterval(t);
  //}, []);

  useEffect(() => {
    traerProductos();
    const t = setInterval(traerProductos, 2000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const init = async () => {
      await traerProductos();
      const storedUser = JSON.parse(localStorage.getItem('usuario'));
      if (storedUser) {
        setUsuario(storedUser);
        setIsAdmin(storedUser.rol === 'Admin');
        try {
          const res = await axios.get(`http://localhost:5286/api/Social/recomendaciones-usuario/${storedUser.username}`);
          if (res.data.ids?.length > 0) setRecomendadosIds(res.data.ids);
        } catch {}
      }
    };
    init();
  }, []);

  const traerProductos = async () => {
    const user = JSON.parse(localStorage.getItem('usuario'));
    try {
      const { data } = await axios.get(`http://localhost:5286/api/productos?userEmail=${user?.email || ''}`);
      setProductos(data);
    } catch (e) { console.error(e); }
  };

  const actualizarRecomendacionesPostCompra = (idsSugeridos, idsComprados) => {
    setRecomendadosIds(idsSugeridos.filter(id => !idsComprados.includes(id)));
    setTimeout(() => window.scrollTo({ top:450, behavior:'smooth' }), 500);
  };

  const productosProcesados = productos.map(p => ({
    ...p,
    esSugerido: p.esSugerido || recomendadosIds.some(r => r.toString() === (p.id || p._id).toString())
  }));
  const sugeridosParaVos = productosProcesados.filter(p => p.esSugerido);
  const productosCatalogo = productosProcesados.filter(p => categoriaActual === 'ALL' || p.categoria === categoriaActual);

const addToCart = async (producto, talleElegido) => {
    if (!usuario) { 
      alert('Iniciá sesión para reservar.'); 
      setShowLoginScreen(true); 
      return; 
    }
    
    const mongoId = (producto.id || producto._id).toString();
    const talleDef = talleElegido || 'unico';
    
    try {
      // 1. RESERVA EN REDIS Y MONGO
      const { data } = await axios.post('http://localhost:5286/api/Pedidos/reservar', {
        ProductoId: mongoId, 
        Talle: talleDef, 
        Usuario: usuario.username, 
        Cantidad: 1
      });

      // 🔥 2. AVISAMOS AL SOCIAL FEED (El toast global) 🔥
      try {
        await axios.post('http://localhost:5286/api/Social/actividad', {
          NombreUsuario: usuario.username,
          NombreProducto: producto.nombre
        });
      } catch (e) {
        console.warn("No se pudo disparar la notificación social", e);
      }

      // 3. OPTIMISTIC UPDATE (Stock visual instantáneo)
      setProductos(prev => prev.map(p => {
        if ((p.id || p._id).toString() !== mongoId) return p;
        const c = { ...p };
        if (c.variantes?.length > 0) c.variantes = c.variantes.map(v => v.talle === talleDef ? { ...v, stock:(v.stock??v.Stock)-1 } : v);
        else c.stock = (c.stock ?? c.Stock) - 1;
        return c;
      }));

      // 4. ACTUALIZACIÓN DEL CARRITO
      setCart(prev => {
        const existe = prev.find(i => (i.id||i._id).toString() === mongoId && i.talleElegido === talleDef);
        if (existe) return prev.map(i => ((i.id||i._id).toString()===mongoId && i.talleElegido===talleDef) ? {...i, cantidad:i.cantidad+1, expiresAt:data.expiresAt} : i);
        return [...prev, {...producto, talleElegido:talleDef, cantidad:1, expiresAt:data.expiresAt}];
      });
      
      setShowCart(true);
      
    } catch { 
      alert('Sin stock disponible.'); 
      traerProductos(); 
    }
  };
  const handleLogout = () => {
    setUsuario(null); setIsAdmin(false); setCart([]);
    localStorage.removeItem('usuario'); localStorage.removeItem('carrito_sanslimit');
    setRecomendadosIds([]);
  };

  return (
    <div style={S.app}>
      {/* <div style={S.socialFeed}>
        {actividades.slice(0,3).map((act,i) => (
          <div key={i} className="social-badge-item"><span className="fire-icon">🔥</span><span>{act}</span></div>
        ))}
      </div> */}

      <Header isAdmin={isAdmin} usuario={usuario} setShowLogin={() => setShowLoginScreen(true)} handleLogout={handleLogout}
        cartCount={cart.reduce((a,b) => a+b.cantidad, 0)} setShowCart={setShowCart} onFilterChange={setCategoriaActual} />

      <CartDrawer isOpen={showCart} onClose={() => setShowCart(false)} cart={cart} setCart={setCart}
        onCheckout={() => { setShowCart(false); setIsCheckoutOpen(true); }}
        addToCart={addToCart} refrescarProductos={traerProductos} usuarioLogueado={usuario} />

      <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)}
        cart={cart} setCart={setCart} subtotal={cart.reduce((a,b) => a+(b.precio*b.cantidad), 0)}
        cuponGanado={cuponGanado} actualizarRecomendacionesPostCompra={actualizarRecomendacionesPostCompra} />

      {!showLoginScreen && (
        <>
          <Hero />
          <Ruleta onWinCupon={setCuponGanado} usuarioLogueado={usuario} />

          <main style={S.main} ref={gridRef}>

            {/* ── CARRUSEL RECOMENDADOS ── */}
            {sugeridosParaVos.length > 0 && categoriaActual === 'ALL' && (
              <section className="recom-section" style={S.recomSection}>
                <div style={S.recomHeader}>
                  <div>
                    <span style={S.recomEyebrow}>Porque vimos que te interesaste en productos similares</span>
                    <h2 style={S.recomTitle}>SELECCIONADO PARA VOS</h2>
                  </div>
                </div>
                <RecomCarousel
                  productos={sugeridosParaVos}
                  addToCart={addToCart}
                  onOpen={setProductoParaModal}
                />
                <div style={S.separator}/>
              </section>
            )}

            {/* ── CATÁLOGO ── */}
            <div style={S.catalogHeader}>
              <div>
                <span style={S.catalogEyebrow}>COLECCIÓN</span>
                <h1 style={S.catalogTitle}>{categoriaActual === 'ALL' ? 'NUEVA TEMPORADA' : categoriaActual}</h1>
              </div>
              <div style={S.catalogLine}/>
            </div>

            <ProductGrid
              productos={productosCatalogo}
              isAdmin={isAdmin}
              handleDelete={id => axios.delete(`http://localhost:5286/api/productos/${id}`).then(traerProductos)}
              addToCart={addToCart}
              usuarioLogueado={usuario}
              refrescarProductos={traerProductos}
              setHoveredProductId={setHoveredProductId}
              hoveredProductId={hoveredProductId}
              externalProductoToOpen={productoParaModal}
              onExternalProductOpened={() => setProductoParaModal(null)}
            />
          </main>
        </>
      )}

      {showLoginScreen && (
        <LoginRegistro onLoginSuccess={u => { setUsuario(u); localStorage.setItem('usuario', JSON.stringify(u)); window.location.reload(); }} />
      )}
    </div>
  );
}

const S = {
  app: { backgroundColor:'#fff', minHeight:'100vh', fontFamily:'"Space Mono",monospace' },
  socialFeed: { position:'fixed', bottom:'24px', left:'24px', zIndex:9999, display:'flex', flexDirection:'column-reverse', gap:'8px', pointerEvents:'none' },
  main: { padding:'60px 40px', maxWidth:'1400px', margin:'0 auto' },
  recomSection: { marginBottom:'80px' },
  recomHeader: { marginBottom:'24px' },
  recomEyebrow: { display:'block', fontSize:'0.6rem', color:'#aaa', letterSpacing:'0.15em', fontWeight:'700', marginBottom:'4px' },
  recomTitle: { fontSize:'1.8rem', fontFamily:'"Bebas Neue",sans-serif', letterSpacing:'0.08em', margin:0, color:'#000' },
  separator: { height:'1px', backgroundColor:'#e8e8e8', marginTop:'60px' },
  catalogHeader: { marginBottom:'48px', display:'flex', alignItems:'flex-end', gap:'24px' },
  catalogEyebrow: { display:'block', fontSize:'0.6rem', color:'#aaa', letterSpacing:'0.2em', fontWeight:'700', marginBottom:'4px' },
  catalogTitle: { fontSize:'2rem', fontFamily:'"Bebas Neue",sans-serif', letterSpacing:'0.06em', margin:0 },
  catalogLine: { flex:1, height:'1px', backgroundColor:'#000', marginBottom:'6px' }
};