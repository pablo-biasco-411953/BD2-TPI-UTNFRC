import React, { useState } from 'react';
import Swal from 'sweetalert2';
import axios from 'axios';

export const CheckoutModal = ({ 
    isOpen, 
    onClose, 
    cart, 
    setCart, 
    subtotal, 
    cuponGanado, 
    actualizarRecomendacionesPostCompra // 🔥 Recibimos la función para reordenar el catálogo
}) => {
    const [formData, setFormData] = useState({
        nombre: '', email: '', telefono: '',
        direccion: '', ciudad: '', codigoPostal: ''
    });
    const [metodoPago, setMetodoPago] = useState('transferencia');

    if (!isOpen) return null;

    // 1. Lógica de beneficios y totales
    let porcentajeCupon = 0;
    if (cuponGanado === "RULETA5") porcentajeCupon = 5;
    if (cuponGanado === "RULETA10") porcentajeCupon = 10;
    if (cuponGanado === "RULETA15") porcentajeCupon = 15;

    const montoDescuentoCupon = (subtotal * porcentajeCupon) / 100;
    const subtotalConCupon = subtotal - montoDescuentoCupon;
    const descuentoTransferencia = metodoPago === 'transferencia' ? (subtotalConCupon * 0.10) : 0;
    const totalFinal = subtotalConCupon - descuentoTransferencia;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

const handleSubmit = async (e) => {
    e.preventDefault();
    const productosIds = cart.map(item => item.id || item._id);

    try {
        // 1. Mandamos a Redis
await axios.post(`http://localhost:5286/api/Social/registrar-compra/${formData.nombre}`, productosIds);
        // 2. Pedimos las nuevas sugerencias (usando el primer item del carrito)
        const idPrincipal = productosIds[0];
        const res = await axios.get(`http://localhost:5286/api/Social/sugerencias?productoId=${idPrincipal}`);

        // 3. Ejecutamos la función mágica de App.jsx
        if (actualizarRecomendacionesPostCompra) {
            actualizarRecomendacionesPostCompra(res.data.ids, productosIds);
        }

        Swal.fire({
            icon: 'success',
            title: '¡PEDIDO REALIZADO!',
            confirmButtonColor: '#000',
            timer: 3000
        });

        setCart([]);
        onClose();
    } catch (error) {
        console.error(error);
        // Si entra acá es porque algo en el proceso de arriba (axios o la función) falló
        onClose();
    }
};
    return (
        <div style={styles.backdrop}>
            <div style={styles.modal}>
                <button style={styles.closeBtn} onClick={onClose}>✕</button>

                <div style={styles.layout}>
                    <div style={styles.formSection}>
                        <h2 style={styles.title}>CHECKOUT</h2>
                        <form onSubmit={handleSubmit} style={styles.form}>
                            <h3 style={styles.subTitle}>1. Datos de Contacto</h3>
                            <input type="text" name="nombre" placeholder="NOMBRE COMPLETO" required onChange={handleChange} style={styles.input} />
                            <input type="email" name="email" placeholder="EMAIL" required onChange={handleChange} style={styles.input} />
                            <input type="tel" name="telefono" placeholder="TELÉFONO" required onChange={handleChange} style={styles.input} />

                            <h3 style={styles.subTitle}>2. Entrega</h3>
                            <input type="text" name="direccion" placeholder="CALLE Y NÚMERO" required onChange={handleChange} style={styles.input} />
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input type="text" name="ciudad" placeholder="LOCALIDAD" required onChange={handleChange} style={{ ...styles.input, flex: 2 }} />
                                <input type="text" name="codigoPostal" placeholder="C.P." required onChange={handleChange} style={{ ...styles.input, flex: 1 }} />
                            </div>

                            <h3 style={styles.subTitle}>3. Método de Pago</h3>
                            <div style={styles.paymentMethods}>
                                <label style={{ ...styles.radioLabel, borderColor: metodoPago === 'transferencia' ? '#000' : '#ddd' }}>
                                    <input type="radio" name="pago" value="transferencia" checked={metodoPago === 'transferencia'} onChange={() => setMetodoPago('transferencia')} style={styles.radioInput} />
                                    <span>Transferencia (10% OFF Extra)</span>
                                </label>
                                <label style={{ ...styles.radioLabel, borderColor: metodoPago === 'mercado_pago' ? '#000' : '#ddd' }}>
                                    <input type="radio" name="pago" value="mercado_pago" checked={metodoPago === 'mercado_pago'} onChange={() => setMetodoPago('mercado_pago')} style={styles.radioInput} />
                                    <span>Mercado Pago / Tarjetas</span>
                                </label>
                            </div>

                            <button type="submit" style={styles.submitBtn}>CONFIRMAR PEDIDO</button>
                        </form>
                    </div>

                    <div style={styles.summarySection}>
                        <h3 style={styles.subTitle}>RESUMEN</h3>
                        <div style={styles.itemsList}>
                            {cart.map((item, index) => (
                                <div key={index} style={styles.itemRow}>
                                    <div>
                                        <div style={styles.itemName}>{item.nombre.toUpperCase()}</div>
                                        <div style={styles.itemMeta}>Cant: {item.cantidad} {item.talleElegido ? `| ${item.talleElegido}` : ''}</div>
                                    </div>
                                    <span style={styles.itemPrice}>${(item.precio * item.cantidad).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>

                        <div style={styles.totals}>
                            <div style={styles.totalRow}><span>Subtotal:</span><span>${subtotal.toLocaleString()}</span></div>
                            {porcentajeCupon > 0 && (
                                <div style={styles.totalRow}>
                                    <span>Cupón Ruleta:</span>
                                    <span style={{ color: '#00bb77' }}>- ${montoDescuentoCupon.toLocaleString()}</span>
                                </div>
                            )}
                            {metodoPago === 'transferencia' && (
                                <div style={styles.totalRow}>
                                    <span>Beneficio Transferencia:</span>
                                    <span style={{ color: '#00bb77' }}>- ${descuentoTransferencia.toLocaleString()}</span>
                                </div>
                            )}
                            <div style={styles.finalTotalRow}><span>TOTAL FINAL:</span><span>${totalFinal.toLocaleString()}</span></div>
                        </div>

                        {metodoPago === 'transferencia' && (
                            <div style={styles.bankInfo}>
                                <p style={{ fontWeight: 'bold' }}>Transferencia:</p>
                                <p>Alias: SANS.LIMIT.STREET</p>
                                <p>CBU: 0110599520000000000000</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    backdrop: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center' },
    modal: { position: 'relative', width: '900px', maxWidth: '95%', backgroundColor: '#fff', color: '#000', borderRadius: '4px', overflow: 'hidden' },
    closeBtn: { position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', zIndex: 10 },
    layout: { display: 'flex', height: '100%' },
    formSection: { flex: 1.5, padding: '40px', borderRight: '1px solid #eee' },
    summarySection: { flex: 1, padding: '40px', backgroundColor: '#fafafa', display: 'flex', flexDirection: 'column' },
    title: { fontSize: '1.5rem', fontWeight: '900', marginBottom: '20px' },
    subTitle: { fontSize: '0.85rem', fontWeight: '800', marginBottom: '15px', textTransform: 'uppercase' },
    form: { display: 'flex', flexDirection: 'column', gap: '10px' },
    input: { padding: '12px', border: '1px solid #ddd', fontSize: '0.85rem' },
    paymentMethods: { display: 'flex', flexDirection: 'column', gap: '10px' },
    radioLabel: { display: 'flex', alignItems: 'center', gap: '10px', padding: '15px', border: '1px solid #ddd', cursor: 'pointer', fontSize: '0.85rem' },
    radioInput: { accentColor: '#000' },
    submitBtn: { width: '100%', background: '#000', color: '#fff', border: 'none', padding: '15px', fontWeight: '700', cursor: 'pointer' },
    itemsList: { marginBottom: '20px' },
    itemRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid #eee' },
    itemName: { fontSize: '0.8rem', fontWeight: '700' },
    itemMeta: { fontSize: '0.7rem', color: '#666' },
    itemPrice: { fontSize: '0.85rem', fontWeight: 'bold' },
    totals: { borderTop: '1px solid #ddd', paddingTop: '15px' },
    totalRow: { display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '10px' },
    finalTotalRow: { display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: '900', borderTop: '1px solid #000', paddingTop: '10px' },
    bankInfo: { marginTop: '20px', padding: '15px', backgroundColor: '#000', color: '#fff', fontSize: '0.75rem' }
};

export default CheckoutModal;