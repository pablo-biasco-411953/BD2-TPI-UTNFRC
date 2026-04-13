import React, { useState } from 'react';
import Swal from 'sweetalert2';
import axios from 'axios';

const injectCheckoutStyles = () => {
  if (document.getElementById('checkout-styles')) return;
  const s = document.createElement('style');
  s.id = 'checkout-styles';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&display=swap');
    @keyframes modalIn {
      from { opacity:0; transform: scale(0.96) translateY(12px); }
      to   { opacity:1; transform: scale(1) translateY(0); }
    }
    @keyframes shimmer {
      0%   { background-position: -600px 0; }
      100% { background-position: 600px 0; }
    }
    .checkout-input {
      padding: 12px 14px;
      border: 1px solid #222;
      background: #0d0d0d;
      color: #fff;
      font-size: 0.78rem;
      font-family: 'Space Mono', monospace;
      letter-spacing: 0.04em;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
      outline: none;
      width: 100%;
      box-sizing: border-box;
    }
    .checkout-input::placeholder { color: #444; }
    .checkout-input:focus {
      border-color: #00ffaa;
      box-shadow: 0 0 0 2px rgba(0,255,170,0.1);
    }
    .payment-radio-label {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      border: 1px solid #222;
      cursor: pointer;
      font-size: 0.78rem;
      transition: all 0.2s ease;
      background: #0d0d0d;
      font-family: 'Space Mono', monospace;
    }
    .payment-radio-label:hover {
      border-color: #00ffaa;
      background: rgba(0,255,170,0.04);
    }
    .payment-radio-label.selected {
      border-color: #00ffaa;
      background: rgba(0,255,170,0.06);
      color: #00ffaa;
    }
    .submit-btn-checkout {
      width: 100%;
      background: #fff;
      color: #000;
      border: none;
      padding: 16px;
      font-weight: 700;
      cursor: pointer;
      letter-spacing: 0.15em;
      font-size: 0.78rem;
      font-family: 'Space Mono', monospace;
      transition: all 0.25s ease;
      position: relative;
      overflow: hidden;
    }
    .submit-btn-checkout:hover {
      background: #00ffaa;
      letter-spacing: 0.22em;
    }
  `;
  document.head.appendChild(s);
};

export const CheckoutModal = ({
  isOpen, onClose, cart, setCart,
  subtotal, cuponGanado, actualizarRecomendacionesPostCompra
}) => {
  injectCheckoutStyles();
  const [formData, setFormData] = useState({
    nombre:'', email:'', telefono:'',
    direccion:'', ciudad:'', codigoPostal:''
  });
  const [metodoPago, setMetodoPago] = useState('transferencia');

  if (!isOpen) return null;

  let porcentajeCupon = 0;
  if (cuponGanado === 'RULETA5') porcentajeCupon = 5;
  if (cuponGanado === 'RULETA10') porcentajeCupon = 10;
  if (cuponGanado === 'RULETA15') porcentajeCupon = 15;

  const montoDescuentoCupon = (subtotal * porcentajeCupon) / 100;
  const subtotalConCupon = subtotal - montoDescuentoCupon;
  const descuentoTransferencia = metodoPago === 'transferencia' ? (subtotalConCupon * 0.10) : 0;
  const totalFinal = subtotalConCupon - descuentoTransferencia;

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const productosIds = cart.map(item => item.id || item._id);
    try {
      await axios.post(`http://200.58.98.15:5286/api/Social/registrar-compra/${formData.nombre}`, productosIds);
      const idPrincipal = productosIds[0];
      const res = await axios.get(`http://200.58.98.15:5286/api/Social/sugerencias?productoId=${idPrincipal}`);
      if (actualizarRecomendacionesPostCompra) {
        actualizarRecomendacionesPostCompra(res.data.ids, productosIds);
      }
      Swal.fire({
        icon:'success', title:'¡PEDIDO REALIZADO!',
        confirmButtonColor:'#000', timer:3000,
        background:'#111', color:'#fff'
      });
      setCart([]);
      onClose();
    } catch (error) {
      console.error(error);
      onClose();
    }
  };

  const SectionLabel = ({ n, label }) => (
    <div style={S.sectionLabel}>
      <span style={S.sectionNum}>{n}</span>
      <span style={S.sectionText}>{label}</span>
    </div>
  );

  return (
    <div style={S.backdrop}>
      <div style={S.modal} className="checkout-modal-root">
        <button style={S.closeBtn} onClick={onClose}>✕</button>

        <div style={S.layout} className="checkout-modal-layout">
          {/* FORM SIDE */}
          <div style={S.formSide} className="checkout-form-side">
            <div style={S.modalHeader}>
              <h2 style={S.modalTitle}>CHECKOUT</h2>
              <div style={S.modalTitleBar}/>
            </div>

            <form onSubmit={handleSubmit} style={S.form}>
              <SectionLabel n="01" label="DATOS DE CONTACTO" />
              <div style={S.fieldGroup}>
                <input className="checkout-input" type="text" name="nombre" placeholder="NOMBRE COMPLETO" required onChange={handleChange} />
                <div style={S.row2}>
                  <input className="checkout-input" type="email" name="email" placeholder="EMAIL" required onChange={handleChange} style={{ flex:2 }} />
                  <input className="checkout-input" type="tel" name="telefono" placeholder="TELÉFONO" required onChange={handleChange} style={{ flex:1 }} />
                </div>
              </div>

              <SectionLabel n="02" label="ENTREGA" />
              <div style={S.fieldGroup}>
                <input className="checkout-input" type="text" name="direccion" placeholder="CALLE Y NÚMERO" required onChange={handleChange} />
                <div style={S.row2}>
                  <input className="checkout-input" type="text" name="ciudad" placeholder="LOCALIDAD" required onChange={handleChange} style={{ flex:2 }} />
                  <input className="checkout-input" type="text" name="codigoPostal" placeholder="C.P." required onChange={handleChange} style={{ flex:1 }} />
                </div>
              </div>

              <SectionLabel n="03" label="MÉTODO DE PAGO" />
              <div style={S.fieldGroup}>
                <label
                  className={`payment-radio-label${metodoPago==='transferencia' ? ' selected' : ''}`}
                  onClick={() => setMetodoPago('transferencia')}
                >
                  <input type="radio" name="pago" value="transferencia" checked={metodoPago==='transferencia'} onChange={() => setMetodoPago('transferencia')} style={{ accentColor:'#00ffaa' }} />
                  <div>
                    <div style={{ fontWeight:'700', marginBottom:'2px' }}>TRANSFERENCIA BANCARIA</div>
                    <div style={{ fontSize:'0.65rem', opacity:0.6 }}>+10% de descuento extra</div>
                  </div>
                </label>
                <label
                  className={`payment-radio-label${metodoPago==='mercado_pago' ? ' selected' : ''}`}
                  onClick={() => setMetodoPago('mercado_pago')}
                >
                  <input type="radio" name="pago" value="mercado_pago" checked={metodoPago==='mercado_pago'} onChange={() => setMetodoPago('mercado_pago')} style={{ accentColor:'#00ffaa' }} />
                  <div>
                    <div style={{ fontWeight:'700', marginBottom:'2px' }}>MERCADO PAGO / TARJETAS</div>
                    <div style={{ fontSize:'0.65rem', opacity:0.6 }}>Débito, crédito, cuotas</div>
                  </div>
                </label>
              </div>

              <button type="submit" className="submit-btn-checkout">
                CONFIRMAR PEDIDO →
              </button>
            </form>
          </div>

          {/* SUMMARY SIDE */}
          <div style={S.summarySide} className="checkout-summary-side">
            <div style={S.summaryHeader}>
              <span style={S.summaryTitle}>RESUMEN</span>
              <span style={S.summaryCount}>{cart.length} producto{cart.length !== 1 ? 's' : ''}</span>
            </div>

            <div style={S.itemsList}>
              {cart.map((item, i) => (
                <div key={i} style={S.summaryItem}>
                  <div style={S.summaryItemLeft}>
                    <div style={S.summaryItemName}>{item.nombre?.toUpperCase()}</div>
                    <div style={S.summaryItemMeta}>
                      {item.cantidad}x {item.talleElegido ? `| ${item.talleElegido}` : ''}
                    </div>
                  </div>
                  <span style={S.summaryItemPrice}>${(item.precio * item.cantidad).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div style={S.totalsBlock}>
              <div style={S.totalLine}>
                <span style={S.totalLabelGray}>Subtotal</span>
                <span>${subtotal.toLocaleString()}</span>
              </div>

              {porcentajeCupon > 0 && (
                <div style={S.totalLine}>
                  <span style={S.totalLabelGray}>
                    Cupón Ruleta ({porcentajeCupon}%)
                    <span style={S.cuponTag}>{cuponGanado}</span>
                  </span>
                  <span style={S.discountVal}>- ${montoDescuentoCupon.toLocaleString()}</span>
                </div>
              )}

              {metodoPago === 'transferencia' && (
                <div style={S.totalLine}>
                  <span style={S.totalLabelGray}>Descuento transferencia</span>
                  <span style={S.discountVal}>- ${descuentoTransferencia.toLocaleString()}</span>
                </div>
              )}

              <div style={S.totalFinalRow}>
                <span>TOTAL</span>
                <span style={S.totalFinalVal}>${totalFinal.toLocaleString()}</span>
              </div>
            </div>

            {metodoPago === 'transferencia' && (
              <div style={S.bankBox}>
                <div style={S.bankTitle}>DATOS PARA TRANSFERENCIA</div>
                <div style={S.bankLine}><span style={S.bankKey}>Alias</span><span>SANS.LIMIT.STREET</span></div>
                <div style={S.bankLine}><span style={S.bankKey}>CBU</span><span style={{ fontSize:'0.7rem', letterSpacing:'0.08em' }}>0110599520000000000000</span></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const S = {
  backdrop: {
    position:'fixed', top:0, left:0, width:'100vw', height:'100vh',
    backgroundColor:'rgba(0,0,0,0.85)', zIndex:3000,
    display:'flex', justifyContent:'center', alignItems:'center',
    backdropFilter:'blur(6px)'
  },
  modal: {
    position:'relative', width:'960px', maxWidth:'96vw', maxHeight:'92vh',
    backgroundColor:'#080808', color:'#fff',
    borderRadius:'2px', overflow:'hidden',
    border:'1px solid #1a1a1a',
    animation:'modalIn 0.3s ease forwards',
    boxShadow:'0 40px 120px rgba(0,0,0,0.8)',
    fontFamily:'"Space Mono", monospace'
  },
  closeBtn: {
    position:'absolute', top:'16px', right:'16px',
    background:'none', border:'1px solid #222', color:'#fff',
    width:'32px', height:'32px', cursor:'pointer', zIndex:10,
    fontSize:'0.8rem', display:'flex', alignItems:'center', justifyContent:'center'
  },
  layout: { display:'flex', height:'100%', maxHeight:'92vh' },
  formSide: {
    flex:1.4, padding:'40px',
    borderRight:'1px solid #141414',
    overflowY:'auto'
  },
  summarySide: {
    flex:1, padding:'40px',
    backgroundColor:'#050505',
    display:'flex', flexDirection:'column',
    overflowY:'auto'
  },
  modalHeader: { marginBottom:'32px' },
  modalTitle: {
    fontSize:'2.5rem', fontFamily:'"Bebas Neue", sans-serif',
    letterSpacing:'0.08em', margin:'0 0 8px'
  },
  modalTitleBar: {
    width:'40px', height:'2px',
    background:'linear-gradient(90deg, #00ffaa, #ff0055)'
  },
  form: { display:'flex', flexDirection:'column', gap:'24px' },
  sectionLabel: {
    display:'flex', alignItems:'center', gap:'12px',
    borderBottom:'1px solid #1a1a1a', paddingBottom:'10px'
  },
  sectionNum: {
    fontSize:'0.6rem', color:'#00ffaa',
    letterSpacing:'0.15em', fontWeight:'700'
  },
  sectionText: {
    fontSize:'0.7rem', fontWeight:'700',
    letterSpacing:'0.15em', color:'#888'
  },
  fieldGroup: { display:'flex', flexDirection:'column', gap:'8px' },
  row2: { display:'flex', gap:'8px' },
  summaryHeader: {
    display:'flex', justifyContent:'space-between',
    alignItems:'baseline', marginBottom:'24px',
    borderBottom:'1px solid #141414', paddingBottom:'16px'
  },
  summaryTitle: {
    fontSize:'1.4rem', fontFamily:'"Bebas Neue", sans-serif',
    letterSpacing:'0.1em'
  },
  summaryCount: { fontSize:'0.65rem', color:'#444' },
  itemsList: { flex:1, marginBottom:'20px' },
  summaryItem: {
    display:'flex', justifyContent:'space-between',
    padding:'12px 0', borderBottom:'1px solid #111',
    alignItems:'flex-start'
  },
  summaryItemLeft: { display:'flex', flexDirection:'column', gap:'3px' },
  summaryItemName: { fontSize:'0.75rem', fontWeight:'700', letterSpacing:'0.04em' },
  summaryItemMeta: { fontSize:'0.6rem', color:'#444' },
  summaryItemPrice: { fontSize:'0.85rem', color:'#ccc' },
  totalsBlock: {
    borderTop:'1px solid #1a1a1a',
    paddingTop:'16px',
    display:'flex', flexDirection:'column', gap:'10px'
  },
  totalLine: {
    display:'flex', justifyContent:'space-between',
    fontSize:'0.75rem', alignItems:'center', gap:'8px'
  },
  totalLabelGray: { color:'#555', display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' },
  discountVal: { color:'#00ffaa', fontWeight:'700' },
  cuponTag: {
    backgroundColor:'rgba(0,255,170,0.1)',
    color:'#00ffaa', border:'1px solid rgba(0,255,170,0.3)',
    padding:'2px 6px', fontSize:'0.6rem', letterSpacing:'0.1em'
  },
  totalFinalRow: {
    display:'flex', justifyContent:'space-between',
    borderTop:'1px solid #1a1a1a', paddingTop:'14px', marginTop:'4px',
    fontSize:'0.8rem', fontWeight:'700', letterSpacing:'0.08em'
  },
  totalFinalVal: {
    fontSize:'1.8rem', fontFamily:'"Bebas Neue", sans-serif',
    letterSpacing:'0.04em', color:'#fff'
  },
  bankBox: {
    marginTop:'20px', padding:'16px',
    backgroundColor:'#0d0d0d', border:'1px solid #1a1a1a'
  },
  bankTitle: {
    fontSize:'0.6rem', letterSpacing:'0.2em',
    color:'#00ffaa', marginBottom:'12px', fontWeight:'700'
  },
  bankLine: {
    display:'flex', justifyContent:'space-between',
    fontSize:'0.75rem', marginBottom:'8px', gap:'12px'
  },
  bankKey: { color:'#444', fontSize:'0.6rem', letterSpacing:'0.12em' }
};

export default CheckoutModal;