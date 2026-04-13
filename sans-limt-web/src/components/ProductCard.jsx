import React, { useState } from 'react';
import axios from 'axios';

const injectCardStyles = () => {
  if (document.getElementById('card-styles')) return;
  const s = document.createElement('style');
  s.id = 'card-styles';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&display=swap');
    @keyframes badgePulse {
      0%,100% { box-shadow: 0 0 0 0 rgba(255,0,85,0.5); }
      50%      { box-shadow: 0 0 0 6px rgba(255,0,85,0); }
    }
    @keyframes stockBlink {
      0%,100% { opacity:1; }
      50%      { opacity:0.5; }
    }
    @keyframes slideUp {
      from { opacity:0; transform:translateY(8px); }
      to   { opacity:1; transform:translateY(0); }
    }
    .product-card-root {
      background: #fff;
      cursor: pointer;
      position: relative;
      height: 100%;
      display: flex;
      flex-direction: column;
      border: 1px solid #f0f0f0;
      transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
      overflow: hidden;
      font-family: 'Space Mono', monospace;
    }
    .product-card-root:hover {
      transform: translateY(-4px);
      box-shadow: 0 16px 48px rgba(0,0,0,0.12);
      border-color: #000;
    }
    .product-card-root.is-recom {
      border: 2px solid #ff0055 !important;
      box-shadow: 4px 4px 0 #ff0055;
    }
    .product-card-root.is-recom:hover {
      transform: translateY(-4px);
      box-shadow: 6px 10px 0 #ff0055;
    }
    .card-img-wrap {
      height: 380px;
      position: relative;
      overflow: hidden;
      background: #f5f5f5;
    }
    .card-img-wrap img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      transition: transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94);
    }
    .product-card-root:hover .card-img-wrap img {
      transform: scale(1.04);
    }
    .add-btn {
      width: 100%;
      padding: 14px;
      background: #000;
      color: #fff;
      border: none;
      font-weight: 700;
      cursor: pointer;
      letter-spacing: 0.12em;
      font-size: 0.72rem;
      font-family: 'Space Mono', monospace;
      transition: background 0.25s ease, letter-spacing 0.25s ease;
      margin-top: auto;
    }
    .add-btn:hover:not(:disabled) {
      background: #00ffaa;
      color: #000;
      letter-spacing: 0.2em;
    }
    .add-btn:disabled {
      background: #bbb;
      cursor: not-allowed;
    }
    .talle-btn {
      width: 46px;
      height: 42px;
      border: 1px solid #ddd;
      cursor: pointer;
      font-size: 0.68rem;
      font-family: 'Space Mono', monospace;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      transition: all 0.2s ease;
      background: #fff;
      color: #000;
    }
    .talle-btn:hover:not(:disabled) {
      border-color: #000;
      background: #f5f5f5;
    }
    .talle-btn.selected {
      background: #000;
      color: #fff;
      border-color: #000;
    }
    .talle-btn:disabled { opacity: 0.25; cursor: not-allowed; }
  `;
  document.head.appendChild(s);
};

export const ProductCard = ({
  prod, isAdmin, handleDelete,
  hoveredProductId, setHoveredProductId,
  addToCart, abrirDetalle: abrirDetalleProp,
  usuarioLogueado, refrescarProductos, esRecomendado
}) => {
  injectCardStyles();
  const [talleSeleccionado, setTalleSeleccionado] = useState(null);
  const [agregando, setAgregando] = useState(false);

  const imagenesArray = prod?.imagenes || [];
  const srcFinal = imagenesArray.length > 0
    ? (imagenesArray[0].startsWith('http') ? imagenesArray[0] : `/images/products/${imagenesArray[0]}`)
    : '/sanslimit_logo.jpeg';

  const stockTotal = prod?.variantes?.length > 0
    ? prod.variantes.reduce((acc, v) => acc + (v.stock ?? v.Stock ?? 0), 0)
    : (prod?.stock ?? prod?.Stock ?? 0);

  const stockBajo = stockTotal > 0 && stockTotal <= 3;

  const handleAbrirDetalle = async () => {
    if (abrirDetalleProp) abrirDetalleProp(prod);
    if (usuarioLogueado) {
      try {
        await axios.post('http://localhost:5286/api/Social/registrar-interes', {
          Email: usuarioLogueado.email, Categoria: prod.categoria
        });
      } catch {}
    }
  };

  const onAddToCartClick = async (e) => {
    e.stopPropagation();
    if (prod?.variantes?.length > 0 && !talleSeleccionado) {
      return alert('Seleccioná un talle antes de añadir al carrito.');
    }
    setAgregando(true);
    await addToCart(prod, talleSeleccionado);
    setTimeout(() => setAgregando(false), 800);
  };

  return (
    <div
      className={`product-card-root${esRecomendado ? ' is-recom' : ''}`}
      onClick={handleAbrirDetalle}
    >
      {/* BADGES */}
      {esRecomendado && (
        <div style={S.badgeRecom}>
          <span style={S.badgeDot}/>
          PARA VOS
        </div>
      )}

      {stockBajo && stockTotal > 0 && (
        <div style={S.badgeUrgency}>
          ⚡ ÚLTIMAS {stockTotal}
        </div>
      )}

      {stockTotal === 0 && (
        <div style={S.badgeSoldOut}>AGOTADO</div>
      )}

      <div className="card-img-wrap">
        {prod.esSugerido && (
          <div style={S.tagSugerido}>BASADO EN TU INTERÉS</div>
        )}
        <img src={srcFinal} alt={prod.nombre} />
      </div>

      <div style={S.cardBody}>
        {/* Categoría */}
        {prod.categoria && (
          <div style={S.categoria}>{prod.categoria}</div>
        )}

        <h2 style={S.title}>{prod.nombre?.toUpperCase()}</h2>

        <div style={S.priceRow}>
          <span style={S.price}>${prod.precio?.toLocaleString()}</span>
          <span style={{
            ...S.stockChip,
            backgroundColor: stockTotal > 0
              ? (stockBajo ? 'rgba(255,170,0,0.1)' : 'rgba(0,255,170,0.08)')
              : 'rgba(255,0,0,0.08)',
            color: stockTotal > 0 ? (stockBajo ? '#ffaa00' : '#00cc88') : '#ff4444',
            borderColor: stockTotal > 0 ? (stockBajo ? '#ffaa00' : '#00cc88') : '#ff4444',
            animation: stockBajo ? 'stockBlink 1.5s infinite' : 'none'
          }}>
            {stockTotal > 0 ? `${stockTotal} disponibles` : 'Sin stock'}
          </span>
        </div>

        {/* Talles */}
        {prod.variantes?.length > 0 && (
          <div style={S.tallesWrap}>
            {prod.variantes.map((v, i) => {
              const qty = v.stock ?? v.Stock ?? 0;
              return (
                <button
                  key={i}
                  className={`talle-btn${talleSeleccionado === v.talle ? ' selected' : ''}`}
                  disabled={qty <= 0}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (qty > 0) setTalleSeleccionado(v.talle);
                  }}
                >
                  <span style={{ fontWeight:'bold' }}>{v.talle}</span>
                  <span style={{ fontSize:'9px', opacity:0.6 }}>({qty})</span>
                </button>
              );
            })}
          </div>
        )}

        <button
          className="add-btn"
          onClick={onAddToCartClick}
          disabled={stockTotal <= 0}
        >
          {agregando ? '✓ AÑADIDO' : stockTotal > 0 ? 'AÑADIR AL CARRITO' : 'AGOTADO'}
        </button>

        {isAdmin && (
          <div style={S.adminRow}>
            <button style={S.adminEdit}>EDITAR</button>
            <button
              style={S.adminDelete}
              onClick={e => { e.stopPropagation(); handleDelete(prod.id || prod._id); }}
            >ELIMINAR</button>
          </div>
        )}
      </div>
    </div>
  );
};

const S = {
  badgeRecom: {
    position:'absolute', top:'12px', left:'12px', zIndex:20,
    backgroundColor:'#ff0055', color:'#fff',
    padding:'5px 10px', fontSize:'0.6rem', fontWeight:'700',
    letterSpacing:'0.12em',
    display:'flex', alignItems:'center', gap:'6px',
    animation:'badgePulse 2s infinite',
    fontFamily:'"Space Mono", monospace'
  },
  badgeDot: {
    width:'6px', height:'6px', borderRadius:'50%',
    backgroundColor:'#fff', flexShrink:0
  },
  badgeUrgency: {
    position:'absolute', top:'12px', right:'12px', zIndex:20,
    backgroundColor:'#ffaa00', color:'#000',
    padding:'5px 10px', fontSize:'0.6rem', fontWeight:'700',
    letterSpacing:'0.12em',
    fontFamily:'"Space Mono", monospace'
  },
  badgeSoldOut: {
    position:'absolute', top:'12px', right:'12px', zIndex:20,
    backgroundColor:'#111', color:'#666',
    padding:'5px 10px', fontSize:'0.6rem', fontWeight:'700',
    letterSpacing:'0.12em', border:'1px solid #333',
    fontFamily:'"Space Mono", monospace'
  },
  tagSugerido: {
    position:'absolute', bottom:'10px', left:0, right:0,
    textAlign:'center', backgroundColor:'rgba(0,0,0,0.75)',
    color:'#00ffaa', fontSize:'0.6rem',
    fontWeight:'700', letterSpacing:'0.12em',
    padding:'6px', zIndex:10,
    fontFamily:'"Space Mono", monospace'
  },
  cardBody: {
    padding:'16px 14px', display:'flex',
    flexDirection:'column', gap:'6px', flexGrow:1
  },
  categoria: {
    fontSize:'0.6rem', color:'#aaa',
    letterSpacing:'0.15em', textTransform:'uppercase',
    fontFamily:'"Space Mono", monospace'
  },
  title: {
    fontSize:'0.85rem', fontWeight:'700',
    letterSpacing:'0.04em', lineHeight:'1.3',
    margin:0, fontFamily:'"Space Mono", monospace'
  },
  priceRow: {
    display:'flex', justifyContent:'space-between',
    alignItems:'center', marginTop:'2px'
  },
  price: {
    fontSize:'1.15rem', fontWeight:'400',
    fontFamily:'"Bebas Neue", sans-serif',
    letterSpacing:'0.04em'
  },
  stockChip: {
    fontSize:'0.6rem', fontWeight:'700',
    letterSpacing:'0.08em', padding:'3px 8px',
    border:'1px solid', borderRadius:'2px',
    fontFamily:'"Space Mono", monospace'
  },
  tallesWrap: {
    display:'flex', gap:'6px', flexWrap:'wrap', margin:'8px 0'
  },
  adminRow: { display:'flex', gap:'5px', marginTop:'8px' },
  adminEdit: {
    flex:1, padding:'8px', border:'1px solid #ddd',
    backgroundColor:'#fafafa', cursor:'pointer',
    fontSize:'0.65rem', fontWeight:'700', letterSpacing:'0.08em',
    fontFamily:'"Space Mono", monospace'
  },
  adminDelete: {
    flex:1, padding:'8px', border:'none',
    backgroundColor:'#ff4444', color:'#fff',
    cursor:'pointer', fontSize:'0.65rem',
    fontWeight:'700', letterSpacing:'0.08em',
    fontFamily:'"Space Mono", monospace'
  }
};

export default ProductCard;