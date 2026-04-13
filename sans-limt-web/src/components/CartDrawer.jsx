import React, { useState, useEffect } from 'react';
import axios from 'axios';

const injectDrawerStyles = () => {
  if (document.getElementById('drawer-styles')) return;
  const s = document.createElement('style');
  s.id = 'drawer-styles';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&display=swap');
    @keyframes drawerSlideIn {
      from { transform: translateX(100%); opacity: 0; }
      to   { transform: translateX(0); opacity: 1; }
    }
    @keyframes timerBlink {
      0%,100% { background-color: #c00; }
      50%      { background-color: #ff2200; }
    }
    @keyframes itemFadeIn {
      from { opacity: 0; transform: translateX(10px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    .cart-drawer-root {
      position: fixed;
      top: 0; right: 0;
      width: 420px;
      height: 100vh;
      background: #0a0a0a;
      color: #fff;
      z-index: 2001;
      display: flex;
      flex-direction: column;
      box-shadow: -20px 0 60px rgba(0,0,0,0.6);
      animation: drawerSlideIn 0.35s cubic-bezier(0.25,0.46,0.45,0.94) forwards;
      font-family: 'Space Mono', monospace;
      border-left: 1px solid #1a1a1a;
    }
    .checkout-btn-main {
      width: 100%;
      background: #fff;
      color: #000;
      border: none;
      padding: 18px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.2em;
      cursor: pointer;
      font-family: 'Space Mono', monospace;
      transition: all 0.25s ease;
      position: relative;
      overflow: hidden;
    }
    .checkout-btn-main::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, transparent, rgba(0,255,170,0.15), transparent);
      transform: translateX(-100%);
      transition: transform 0.5s ease;
    }
    .checkout-btn-main:hover::after {
      transform: translateX(100%);
    }
    .checkout-btn-main:hover {
      background: #00ffaa;
    }
    .qty-btn-inner:hover { background: #1a1a1a !important; }
    .delete-inner:hover { color: #ff4444 !important; }
  `;
  document.head.appendChild(s);
};

const CartTimer = ({ expiresAt, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const calcular = () => {
      const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
      if (diff <= 0) { setTimeLeft(0); onExpire(); } else setTimeLeft(diff);
    };
    calcular();
    const t = setInterval(calcular, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);

  const fmt = s => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;
  const isUrgent = timeLeft < 120;

  if (timeLeft <= 0) return null;

  return (
    <div style={{
      ...S.timerBanner,
      animation: isUrgent ? 'timerBlink 0.8s infinite' : 'none',
      backgroundColor: isUrgent ? '#c00' : '#111',
      borderBottom: `1px solid ${isUrgent ? '#ff2200' : '#1a1a1a'}`
    }}>
      <span style={S.timerIcon}>⏳</span>
      <span>RESERVADO POR <strong style={{ color: isUrgent ? '#fff' : '#00ffaa' }}>{fmt(timeLeft)}</strong></span>
    </div>
  );
};

export const CartDrawer = ({
  isOpen, onClose, cart, setCart,
  onCheckout, addToCart, refrescarProductos, usuarioLogueado
}) => {
  injectDrawerStyles();

  const proximaExpiracion = cart.length > 0 ? cart[0].expiresAt : null;
  const subtotal = cart.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);

  const handleExpire = () => {
    if (cart.length > 0) {
      alert('Tu tiempo de reserva ha finalizado. El stock fue liberado.');
      setCart([]);
      localStorage.removeItem('carrito_sanslimit');
      if (refrescarProductos) refrescarProductos();
      onClose();
    }
  };

  const restarCantidad = async (item) => {
    if (item.cantidad <= 1) { eliminarItem(item); return; }
    try {
      await axios.post('http://localhost:5286/api/Pedidos/liberar', {
        ProductoId: item.id || item._id || item.slug,
        Talle: item.talleElegido || 'unico',
        Usuario: usuarioLogueado?.username, Cantidad: 1
      });
      setCart(cart.map(i =>
        (i.id === item.id && i.talleElegido === item.talleElegido)
          ? { ...i, cantidad: i.cantidad - 1 } : i
      ));
      if (refrescarProductos) refrescarProductos();
    } catch (e) { console.error(e); }
  };

  const eliminarItem = async (item) => {
    try {
      await axios.post('http://localhost:5286/api/Pedidos/liberar', {
        ProductoId: item.id || item._id || item.slug,
        Talle: item.talleElegido || 'unico',
        Usuario: usuarioLogueado?.username, Cantidad: item.cantidad
      });
      setCart(cart.filter(i => !(i.id === item.id && i.talleElegido === item.talleElegido)));
      if (refrescarProductos) refrescarProductos();
    } catch (e) { console.error(e); }
  };

  if (!isOpen) return null;

  return (
    <>
      <div style={S.backdrop} onClick={onClose} />
      <div className="cart-drawer-root">
        {/* HEADER */}
        <div style={S.header}>
          <div style={S.headerLeft}>
            <span style={S.headerEyebrow}>CARRITO</span>
            {cart.length > 0 && (
              <span style={S.itemCount}>{cart.reduce((a,b) => a+b.cantidad, 0)} items</span>
            )}
          </div>
          <button style={S.closeBtn} onClick={onClose}>
            <span style={S.closeLine1}/><span style={S.closeLine2}/>
          </button>
        </div>

        {/* TIMER */}
        {cart.length > 0 && proximaExpiracion && (
          <CartTimer expiresAt={proximaExpiracion} onExpire={handleExpire} />
        )}

        {/* BODY */}
        <div style={S.body}>
          {cart.length === 0 ? (
            <div style={S.emptyState}>
              <div style={S.emptyIcon}>🛒</div>
              <p style={S.emptyTitle}>CARRITO VACÍO</p>
              <p style={S.emptySubtitle}>Añadí productos para comenzar</p>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div key={`${item.id}-${item.talleElegido || 'unico'}`}
                style={{ ...S.cartItem, animationDelay:`${idx*0.05}s` }}>
                <div style={S.itemTop}>
                  <div style={S.itemInfo}>
                    <span style={S.itemName}>{item.nombre?.toUpperCase()}</span>
                    {item.talleElegido && (
                      <span style={S.itemMeta}>TALLE: {item.talleElegido}</span>
                    )}
                  </div>
                  <span style={S.itemPrice}>${(item.precio * item.cantidad).toLocaleString()}</span>
                </div>
                <div style={S.itemBottom}>
                  <div style={S.qtyControl}>
                    <button className="qty-btn-inner" style={S.qtyBtn} onClick={() => restarCantidad(item)}>−</button>
                    <span style={S.qtyVal}>{item.cantidad}</span>
                    <button className="qty-btn-inner" style={S.qtyBtn} onClick={() => addToCart(item, item.talleElegido)}>+</button>
                  </div>
                  <button className="delete-inner" style={S.deleteBtn} onClick={() => eliminarItem(item)}>✕ QUITAR</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* FOOTER */}
        {cart.length > 0 && (
          <div style={S.footer}>
            <div style={S.subtotalRow}>
              <span style={S.subtotalLabel}>SUBTOTAL</span>
              <span style={S.subtotalValue}>${subtotal.toLocaleString()}</span>
            </div>
            <p style={S.disclaimer}>Descuentos y cupones se aplican en el checkout</p>
            <button className="checkout-btn-main" onClick={onCheckout}>
              FINALIZAR COMPRA →
            </button>
          </div>
        )}
      </div>
    </>
  );
};

const S = {
  backdrop: {
    position:'fixed', top:0, left:0, width:'100vw', height:'100vh',
    backgroundColor:'rgba(0,0,0,0.7)', zIndex:2000, backdropFilter:'blur(4px)'
  },
  header: {
    padding:'22px 20px',
    borderBottom:'1px solid #1a1a1a',
    display:'flex', justifyContent:'space-between', alignItems:'center',
    backgroundColor:'#0a0a0a'
  },
  headerLeft: { display:'flex', flexDirection:'column', gap:'2px' },
  headerEyebrow: {
    fontSize:'1.4rem', fontWeight:'400',
    fontFamily:'"Bebas Neue", sans-serif',
    letterSpacing:'0.1em', color:'#fff'
  },
  itemCount: {
    fontSize:'0.6rem', color:'#555',
    letterSpacing:'0.15em'
  },
  closeBtn: {
    width:'32px', height:'32px',
    background:'none', border:'1px solid #222',
    cursor:'pointer', position:'relative',
    display:'flex', alignItems:'center', justifyContent:'center'
  },
  closeLine1: {
    position:'absolute', width:'14px', height:'1px',
    backgroundColor:'#fff', transform:'rotate(45deg)'
  },
  closeLine2: {
    position:'absolute', width:'14px', height:'1px',
    backgroundColor:'#fff', transform:'rotate(-45deg)'
  },
  timerBanner: {
    padding:'12px 20px',
    display:'flex', alignItems:'center', gap:'10px',
    fontSize:'0.68rem', letterSpacing:'0.1em',
    color:'#ccc', transition:'background-color 0.3s ease'
  },
  timerIcon: { fontSize:'1rem' },
  body: { flex:1, padding:'16px 20px', overflowY:'auto' },
  emptyState: {
    height:'100%', display:'flex',
    flexDirection:'column', alignItems:'center', justifyContent:'center',
    gap:'12px', paddingTop:'80px'
  },
  emptyIcon: { fontSize:'2.5rem', opacity:0.3 },
  emptyTitle: {
    fontSize:'1.2rem', fontFamily:'"Bebas Neue", sans-serif',
    letterSpacing:'0.12em', color:'#333', margin:0
  },
  emptySubtitle: { fontSize:'0.65rem', color:'#444', margin:0 },
  cartItem: {
    padding:'16px 0',
    borderBottom:'1px solid #141414',
    animation:'itemFadeIn 0.3s ease forwards'
  },
  itemTop: {
    display:'flex', justifyContent:'space-between',
    alignItems:'flex-start', marginBottom:'12px'
  },
  itemInfo: { display:'flex', flexDirection:'column', gap:'4px' },
  itemName: {
    fontSize:'0.78rem', fontWeight:'700',
    letterSpacing:'0.04em', color:'#fff'
  },
  itemMeta: {
    fontSize:'0.6rem', color:'#555',
    letterSpacing:'0.1em'
  },
  itemPrice: {
    fontSize:'0.9rem', fontWeight:'400',
    color:'#ccc', whiteSpace:'nowrap',
    fontFamily:'"Bebas Neue", sans-serif',
    letterSpacing:'0.05em', fontSize:'1rem'
  },
  itemBottom: {
    display:'flex', justifyContent:'space-between', alignItems:'center'
  },
  qtyControl: {
    display:'flex', alignItems:'center',
    border:'1px solid #222'
  },
  qtyBtn: {
    width:'32px', height:'30px',
    background:'#111', border:'none',
    color:'#fff', cursor:'pointer',
    fontSize:'1rem', transition:'background 0.2s'
  },
  qtyVal: {
    width:'36px', textAlign:'center',
    fontSize:'0.78rem', fontWeight:'700',
    borderLeft:'1px solid #222', borderRight:'1px solid #222',
    height:'30px', display:'flex', alignItems:'center', justifyContent:'center'
  },
  deleteBtn: {
    background:'none', border:'none',
    color:'#444', fontSize:'0.6rem',
    cursor:'pointer', letterSpacing:'0.12em',
    fontWeight:'700', transition:'color 0.2s',
    fontFamily:'"Space Mono", monospace'
  },
  footer: {
    padding:'20px',
    borderTop:'1px solid #1a1a1a',
    backgroundColor:'#050505'
  },
  subtotalRow: {
    display:'flex', justifyContent:'space-between',
    alignItems:'baseline', marginBottom:'8px'
  },
  subtotalLabel: {
    fontSize:'0.65rem', color:'#555', letterSpacing:'0.15em'
  },
  subtotalValue: {
    fontSize:'1.6rem', fontWeight:'400', color:'#fff',
    fontFamily:'"Bebas Neue", sans-serif', letterSpacing:'0.04em'
  },
  disclaimer: {
    fontSize:'0.6rem', color:'#444',
    marginBottom:'16px', fontStyle:'italic'
  }
};

export default CartDrawer;