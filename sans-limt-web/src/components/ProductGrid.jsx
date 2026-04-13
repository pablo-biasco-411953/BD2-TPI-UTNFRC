import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ProductCard } from './ProductCard';

const injectGridStyles = () => {
  if (document.getElementById('grid-styles')) return;
  const s = document.createElement('style');
  s.id = 'grid-styles';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&display=swap');
    @keyframes modalReveal {
      from { opacity:0; transform:scale(0.97) translateY(8px); }
      to   { opacity:1; transform:scale(1) translateY(0); }
    }
    @keyframes fomoSlide {
      from { opacity:0; transform:translateX(20px); }
      to   { opacity:1; transform:translateX(0); }
    }
    @keyframes viewerPing {
      0%,100% { transform:scale(1); opacity:1; }
      50%      { transform:scale(1.3); opacity:0.6; }
    }

    .modal-talle-btn {
      width: 40px; height: 38px;
      border: 1px solid #e0e0e0;
      background: #fff; color: #000;
      font-size: 0.68rem; font-weight: 700;
      font-family: 'Space Mono', monospace;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .modal-talle-btn:hover:not(:disabled) {
      border-color: #000; background: #f5f5f5;
    }
    .modal-talle-btn.selected {
      background: #000; color: #fff; border-color: #000;
    }
    .modal-talle-btn:disabled { opacity: 0.2; cursor: not-allowed; }

    .modal-add-btn {
      color: #fff; border: none;
      padding: 16px; font-weight: 700;
      letter-spacing: 0.14em; width: 100%;
      font-family: 'Space Mono', monospace;
      font-size: 0.75rem; cursor: pointer;
      transition: all 0.25s ease;
    }
    .modal-add-btn:hover:not(:disabled) {
      letter-spacing: 0.22em;
    }
    .modal-add-btn:disabled { cursor: not-allowed; }

    .mini-card-item {
      width: 76px; cursor: pointer; text-align: center;
      transition: transform 0.2s ease;
    }
    .mini-card-item:hover { transform: translateY(-3px); }

    .grid-fomo-badge {
      position: fixed;
      bottom: 30px; right: 30px;
      background: #fff; color: #000;
      padding: 12px 20px;
      border: 2px solid #000;
      box-shadow: 5px 5px 0 #000;
      z-index: 3000;
      font-size: 0.78rem; font-weight: 900;
      font-family: 'Space Mono', monospace;
      letter-spacing: 0.04em;
      transition: all 0.4s cubic-bezier(0.34,1.56,0.64,1);
    }
  `;
  document.head.appendChild(s);
};

export const ProductGrid = ({
  productos, isAdmin, handleDelete,
  hoveredProductId, setHoveredProductId,
  addToCart, onFilterChange, usuarioLogueado,
  refrescarProductos, recomendadosIds = [],
  externalProductoToOpen = null,
  onExternalProductOpened = null
}) => {
  injectGridStyles();

  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [talleElegido, setTalleElegido] = useState(null);

  const [socialFeed, setSocialFeed] = useState([]);
  const [notificacionActual, setNotificacionActual] = useState(null);
  const ultimoMsgRef = useRef(null);
  const [sugerencias, setSugerencias] = useState([]);
  const [viewersCount, setViewersCount] = useState(1);
  const sessionViewerId = useRef(Math.random().toString(36).substring(2, 10)).current;

  // Cuando el carrusel pide abrir un producto en el modal
  useEffect(() => {
    if (externalProductoToOpen) {
      setProductoSeleccionado(externalProductoToOpen);
      setTalleElegido(null);
      setViewersCount(1);
      if (onExternalProductOpened) onExternalProductOpened();
    }
  }, [externalProductoToOpen]);

  useEffect(() => {
    const fetchSocial = async () => {
      try {
        const res = await axios.get('http://localhost:5286/api/Social/actividad');
        if (res.data?.length > 0) {
          const msg = res.data[0];
          if (msg !== ultimoMsgRef.current) {
            ultimoMsgRef.current = msg;
            if (refrescarProductos) refrescarProductos();
            setSocialFeed(res.data);
          }
        }
      } catch {}
    };
    const t = setInterval(fetchSocial, 2000);
    return () => clearInterval(t);
  }, [refrescarProductos]);

  useEffect(() => {
    if (socialFeed.length > 0) {
      setNotificacionActual(socialFeed[0]);
      const t = setTimeout(() => setNotificacionActual(null), 4000);
      return () => clearTimeout(t);
    }
  }, [socialFeed]);

  useEffect(() => {
    if (!productoSeleccionado) return;
    const id = productoSeleccionado.id || productoSeleccionado._id || productoSeleccionado.slug;
    const uid = usuarioLogueado ? `${usuarioLogueado.username}_${sessionViewerId}` : `anon_${sessionViewerId}`;
    const ping = async () => {
      try {
        const res = await axios.post(`http://localhost:5286/api/Social/viewing/${id}/${uid}`);
        setViewersCount(res.data.count);
      } catch {}
    };
    ping();
    const t = setInterval(ping, 5000);
    return () => clearInterval(t);
  }, [productoSeleccionado, usuarioLogueado, sessionViewerId]);

  useEffect(() => {
    if (!productoSeleccionado) { setSugerencias([]); return; }
    const id = productoSeleccionado.id || productoSeleccionado._id;
    axios.get(`http://localhost:5286/api/Social/sugerencias?productoId=${id}&categoria=${productoSeleccionado.categoria}`)
      .then(res => {
        setSugerencias(productos.filter(p => res.data.ids.includes(p.id || p._id)));
      })
      .catch(() => {});
  }, [productoSeleccionado, productos]);

  const abrirDetalle = prod => {
    setProductoSeleccionado(prod);
    setTalleElegido(null);
    setViewersCount(1);
  };

  const obtenerSrc = prod => {
    const img = prod?.imagenes?.[0] || prod?.imagenUrl;
    return typeof img === 'string' && img.startsWith('http')
      ? img : (img ? `/images/products/${img}` : '/sanslimit_logo.jpeg');
  };

  const handleAgregarDesdeModal = () => {
    if (productoSeleccionado?.variantes?.length > 0 && !talleElegido) {
      alert('Por favor, seleccioná un talle.');
      return;
    }
    addToCart(productoSeleccionado, talleElegido);
    setProductoSeleccionado(null);
  };

  const stockModal = productoSeleccionado
    ? (productoSeleccionado.variantes?.length > 0
        ? productoSeleccionado.variantes.reduce((a,v) => a + (v.stock ?? v.Stock ?? 0), 0)
        : (productoSeleccionado.stock ?? productoSeleccionado.Stock ?? 0))
    : 0;

  return (
    <div style={{ position:'relative' }}>
      {/* FOMO badge bottom-right */}
      <div className="grid-fomo-badge" style={{
        opacity: notificacionActual ? 1 : 0,
        transform: notificacionActual ? 'translateY(0)' : 'translateY(16px)',
        visibility: notificacionActual ? 'visible' : 'hidden',
        animation: notificacionActual ? 'fomoSlide 0.4s ease forwards' : 'none'
      }}>
        🔥 {notificacionActual}
      </div>

      {/* GRID */}
      <div style={S.grid} className="products-grid-responsive">
        {productos.map(prod => (
          <ProductCard
            key={prod.id || prod.slug}
            prod={prod}
            isAdmin={isAdmin}
            handleDelete={handleDelete}
            hoveredProductId={hoveredProductId}
            setHoveredProductId={setHoveredProductId}
            addToCart={addToCart}
            abrirDetalle={abrirDetalle}
            onFilterChange={onFilterChange}
            usuarioLogueado={usuarioLogueado}
            refrescarProductos={refrescarProductos}
            esRecomendado={recomendadosIds.some(r => r.toString() === (prod.id || prod._id).toString())}
          />
        ))}
      </div>

      {/* MODAL */}
      {productoSeleccionado && (
        <div style={S.overlay} onClick={() => setProductoSeleccionado(null)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>

            {/* Close */}
            <button style={S.closeBtnModal} onClick={() => setProductoSeleccionado(null)}>
              <span style={S.closeL1}/><span style={S.closeL2}/>
            </button>

            <div style={S.modalGrid} className="product-modal-grid">
              {/* IMAGE */}
              <div style={S.imgSide} className="product-modal-img-side">
                {stockModal <= 3 && stockModal > 0 && (
                  <div style={S.modalUrgencyBadge}>⚡ ÚLTIMAS {stockModal} UNIDADES</div>
                )}
                <img src={obtenerSrc(productoSeleccionado)} alt={productoSeleccionado.nombre} style={S.modalImg} />
              </div>

              {/* DETAILS */}
              <div style={S.detailSide} className="product-modal-detail-side">
                {productoSeleccionado.categoria && (
                  <span style={S.modalCat}>{productoSeleccionado.categoria}</span>
                )}

                <h2 style={S.modalNombre}>{productoSeleccionado.nombre?.toUpperCase()}</h2>
                <p style={S.modalPrecio}>${productoSeleccionado.precio?.toLocaleString()}</p>

                {/* VIEWERS */}
                {viewersCount > 1 && (
                  <div style={S.viewersBadge}>
                    <span style={{ animation:'viewerPing 1.5s infinite', display:'inline-block' }}>👀</span>
                    <span><strong>{viewersCount}</strong> personas mirando esto ahora</span>
                  </div>
                )}

                {/* DESCRIPTION */}
                <div style={S.descBlock}>
                  <div style={S.descLabel}>DESCRIPCIÓN</div>
                  <p style={S.descText}>{productoSeleccionado.descripcion || 'Sin descripción.'}</p>
                </div>

                {/* TALLES */}
                {productoSeleccionado.variantes?.length > 0 && (
                  <div style={S.talleBlock}>
                    <div style={S.talleLabel}>SELECCIONÁ TU TALLE</div>
                    <div style={S.talleRow}>
                      {productoSeleccionado.variantes.map((v, i) => (
                        <button
                          key={i}
                          className={`modal-talle-btn${talleElegido === v.talle ? ' selected' : ''}`}
                          disabled={v.stock <= 0}
                          onClick={() => setTalleElegido(v.talle)}
                        >
                          {v.talle}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* SUGERENCIAS */}
                {sugerencias.length > 0 && (
                  <div style={S.sugBlock}>
                    <div style={S.sugLabel}>COMPLETÁ TU LOOK</div>
                    <div style={S.sugRow}>
                      {sugerencias.map(s => (
                        <div key={s.id || s._id} className="mini-card-item" onClick={() => abrirDetalle(s)}>
                          <img src={obtenerSrc(s)} style={S.miniImg} alt={s.nombre} />
                          <p style={S.miniName}>{s.nombre?.toUpperCase()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ADD BUTTON */}
                <button
                  className="modal-add-btn"
                  style={{
                    backgroundColor: (productoSeleccionado.variantes?.length > 0 && !talleElegido) ? '#888' : '#000',
                    marginTop:'auto'
                  }}
                  onClick={handleAgregarDesdeModal}
                  disabled={productoSeleccionado.variantes?.length > 0 && !talleElegido}
                >
                  {(productoSeleccionado.variantes?.length > 0 && !talleElegido)
                    ? 'ELEGÍ UN TALLE'
                    : 'AGREGAR AL CARRITO →'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const S = {
  grid: {
    display:'grid',
    gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))',
    gap:'40px'
  },
  overlay: {
    position:'fixed', inset:0,
    backgroundColor:'rgba(0,0,0,0.85)',
    display:'flex', justifyContent:'center', alignItems:'center',
    zIndex:2000, backdropFilter:'blur(6px)'
  },
  modal: {
    backgroundColor:'#fff', width:'880px', maxWidth:'95vw',
    maxHeight:'90vh', position:'relative', overflow:'hidden',
    animation:'modalReveal 0.3s ease forwards',
    boxShadow:'0 40px 100px rgba(0,0,0,0.6)',
    fontFamily:'"Space Mono", monospace'
  },
  closeBtnModal: {
    position:'absolute', top:'16px', right:'16px',
    width:'34px', height:'34px', background:'rgba(0,0,0,0.06)',
    border:'none', cursor:'pointer', zIndex:10,
    display:'flex', alignItems:'center', justifyContent:'center'
  },
  closeL1: {
    position:'absolute', width:'14px', height:'1.5px',
    backgroundColor:'#000', transform:'rotate(45deg)'
  },
  closeL2: {
    position:'absolute', width:'14px', height:'1.5px',
    backgroundColor:'#000', transform:'rotate(-45deg)'
  },
  modalGrid: { display:'flex', height:'100%' },
  imgSide: {
    flex:1, height:'560px',
    backgroundColor:'#f5f5f5',
    display:'flex', justifyContent:'center', alignItems:'center',
    position:'relative', overflow:'hidden'
  },
  modalUrgencyBadge: {
    position:'absolute', top:'14px', left:'14px',
    backgroundColor:'#ffaa00', color:'#000',
    padding:'6px 12px', fontSize:'0.62rem',
    fontWeight:'700', letterSpacing:'0.12em', zIndex:5
  },
  modalImg: { width:'100%', height:'100%', objectFit:'contain' },
  detailSide: {
    flex:1, padding:'36px',
    display:'flex', flexDirection:'column',
    gap:'14px', overflowY:'auto'
  },
  modalCat: {
    fontSize:'0.6rem', color:'#aaa',
    letterSpacing:'0.2em', fontWeight:'700'
  },
  modalNombre: {
    fontSize:'1.4rem', fontFamily:'"Bebas Neue", sans-serif',
    letterSpacing:'0.04em', margin:0, lineHeight:'1.1'
  },
  modalPrecio: {
    fontSize:'1.6rem', fontFamily:'"Bebas Neue", sans-serif',
    letterSpacing:'0.04em', margin:0, color:'#333'
  },
  viewersBadge: {
    display:'inline-flex', alignItems:'center', gap:'8px',
    backgroundColor:'#fff5f5', border:'1px solid #ffcccc',
    color:'#cc0000', padding:'8px 12px',
    borderRadius:'2px', fontSize:'0.68rem', fontWeight:'700'
  },
  descBlock: { borderTop:'1px solid #f0f0f0', paddingTop:'14px' },
  descLabel: { fontSize:'0.6rem', fontWeight:'700', letterSpacing:'0.15em', color:'#aaa', marginBottom:'6px' },
  descText: { fontSize:'0.75rem', color:'#555', lineHeight:'1.7', margin:0 },
  talleBlock: {},
  talleLabel: { fontSize:'0.6rem', fontWeight:'700', letterSpacing:'0.15em', color:'#aaa', marginBottom:'8px' },
  talleRow: { display:'flex', gap:'6px', flexWrap:'wrap' },
  sugBlock: { borderTop:'1px solid #f0f0f0', paddingTop:'14px' },
  sugLabel: { fontSize:'0.6rem', fontWeight:'700', letterSpacing:'0.15em', color:'#aaa', marginBottom:'10px' },
  sugRow: { display:'flex', gap:'10px', flexWrap:'wrap' },
  miniImg: { width:'100%', height:'72px', objectFit:'cover', border:'1px solid #eee' },
  miniName: { fontSize:'0.55rem', fontWeight:'800', margin:'5px 0 0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }
};

export default ProductGrid;