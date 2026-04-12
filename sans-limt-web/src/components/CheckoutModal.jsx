import React, { useState } from 'react';
import Swal from 'sweetalert2';

export const CheckoutModal = ({ isOpen, onClose, cart, subtotal, cuponGanado, totalActual }) => {
    const [formData, setFormData] = useState({
        nombre: '', email: '', telefono: '',
        direccion: '', ciudad: '', codigoPostal: ''
    });
    const [metodoPago, setMetodoPago] = useState('transferencia');

    if (!isOpen) return null;

    // 1. Calculamos el porcentaje de descuento de la Ruleta dinámicamente según el código ganado
    let porcentajeCupon = 0;
    if (cuponGanado === "RULETA5") porcentajeCupon = 5;
    if (cuponGanado === "RULETA10") porcentajeCupon = 10;
    if (cuponGanado === "RULETA15") porcentajeCupon = 15;

    // El descuento en plata del cupón de la ruleta
    const montoDescuentoCupon = (subtotal * porcentajeCupon) / 100;

    // El precio de las prendas menos el cupón de la ruleta
    const subtotalConCupon = subtotal - montoDescuentoCupon;

    // 2. Calculamos si aplica el 10% OFF extra por transferencia (se calcula sobre lo que quedó)
    const descuentoTransferencia = metodoPago === 'transferencia' ? (subtotalConCupon * 0.10) : 0;

    // 3. El total definitivo arrastrando todos los beneficios
    const totalFinal = subtotalConCupon - descuentoTransferencia;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // 🔥 NOTIFICACIÓN DE COMPRA REALIZADA
        Swal.fire({
            icon: 'success',
            title: '¡PEDIDO REALIZADO!',
            html: `Método: <b>${metodoPago.toUpperCase()}</b><br>Total a pagar: <b>$${totalFinal.toLocaleString()}</b><br><br>Pronto nos comunicaremos al mail <i>${formData.email}</i> para coordinar.`,
            confirmButtonColor: '#000',
            timer: 4500,
            timerProgressBar: true
        });

        onClose();
    };

    return (
        <div style={styles.backdrop}>
            <div style={styles.modal}>
                <button style={styles.closeBtn} onClick={onClose}>✕</button>

                <div style={styles.layout}>
                    {/* COLUMNA IZQUIERDA: FORMULARIO */}
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
                                    <span>Transferencia Bancaria (10% OFF Extra)</span>
                                </label>
                                <label style={{ ...styles.radioLabel, borderColor: metodoPago === 'mercado_pago' ? '#000' : '#ddd' }}>
                                    <input type="radio" name="pago" value="mercado_pago" checked={metodoPago === 'mercado_pago'} onChange={() => setMetodoPago('mercado_pago')} style={styles.radioInput} />
                                    <span>Mercado Pago / Tarjetas</span>
                                </label>
                            </div>

                            <button type="submit" style={styles.submitBtn}>CONFIRMAR PEDIDO</button>
                        </form>
                    </div>

                    {/* COLUMNA DERECHA: RESUMEN DE COMPRA */}
                    <div style={styles.summarySection}>
                        <h3 style={styles.subTitle}>RESUMEN</h3>
                        <div style={styles.itemsList}>
                            {cart.map((item, index) => (
                                <div key={index} style={styles.itemRow}>
                                    <div>
                                        <div style={styles.itemName}>{item.nombre.toUpperCase()}</div>
                                        <div style={styles.itemMeta}>
                                            Cant: {item.cantidad} {item.talleElegido ? `| Talle: ${item.talleElegido}` : ''}
                                        </div>
                                    </div>
                                    <span style={styles.itemPrice}>${(item.precio * item.cantidad).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>

                        <div style={styles.totals}>
                            <div style={styles.totalRow}>
                                <span>Subtotal:</span>
                                <span>${subtotal.toLocaleString()}</span>
                            </div>

                            {/* Mostrar el descuento dinámico de la ruleta solo si ganaron algo */}
                            {porcentajeCupon > 0 && (
                                <div style={styles.totalRow}>
                                    <span>Cupón Ruleta ({cuponGanado}):</span>
                                    <span style={{ color: '#00bb77' }}>- ${montoDescuentoCupon.toLocaleString()}</span>
                                </div>
                            )}

                            {/* Mostrar el descuento del 10% si eligen transferencia */}
                            {metodoPago === 'transferencia' && (
                                <div style={styles.totalRow}>
                                    <span>Beneficio Transferencia (10%):</span>
                                    <span style={{ color: '#00bb77' }}>- ${descuentoTransferencia.toLocaleString()}</span>
                                </div>
                            )}

                            <div style={styles.finalTotalRow}>
                                <span>TOTAL FINAL:</span>
                                <span>${totalFinal.toLocaleString()}</span>
                            </div>
                        </div>

                        {metodoPago === 'transferencia' && (
                            <div style={styles.bankInfo}>
                                <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>Datos para la transferencia:</p>
                                <p>Alias: SANS.LIMIT.STREET</p>
                                <p>CBU: 0110599520000000000000</p>
                                <p>Banco Nación</p>
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
    modal: { position: 'relative', width: '900px', maxWidth: '95%', height: 'auto', maxHeight: '90vh', backgroundColor: '#fff', color: '#000', borderRadius: '4px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
    closeBtn: { position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', zIndex: 10 },
    layout: { display: 'flex', height: '100%', overflowY: 'auto' },
    formSection: { flex: 1.5, padding: '40px', borderRight: '1px solid #eee' },
    summarySection: { flex: 1, padding: '40px', backgroundColor: '#fafafa', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
    title: { fontSize: '1.5rem', fontWeight: '900', letterSpacing: '0.1em', marginBottom: '20px' },
    subTitle: { fontSize: '0.85rem', fontWeight: '800', letterSpacing: '0.05em', marginBottom: '15px', textTransform: 'uppercase' },
    form: { display: 'flex', flexDirection: 'column', gap: '10px' },
    input: { padding: '12px', border: '1px solid #ddd', fontSize: '0.85rem', letterSpacing: '0.05em', textTransform: 'uppercase' },
    paymentMethods: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '10px' },
    radioLabel: { display: 'flex', alignItems: 'center', gap: '10px', padding: '15px', border: '1px solid #ddd', cursor: 'pointer', fontSize: '0.85rem' },
    radioInput: { accentColor: '#000' },
    submitBtn: { width: '100%', background: '#000', color: '#fff', border: 'none', padding: '15px', fontSize: '0.85rem', fontWeight: '700', letterSpacing: '0.1em', cursor: 'pointer', marginTop: '10px' },
    itemsList: { flex: 1, overflowY: 'auto', marginBottom: '20px' },
    itemRow: { display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', marginBottom: '10px', borderBottom: '1px solid #eee' },
    itemName: { fontSize: '0.8rem', fontWeight: '700' },
    itemMeta: { fontSize: '0.7rem', color: '#666' },
    itemPrice: { fontSize: '0.85rem', fontWeight: 'bold' },
    totals: { borderTop: '1px solid #ddd', paddingTop: '15px' },
    totalRow: { display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '10px' },
    finalTotalRow: { display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: '900', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #000' },
    bankInfo: { marginTop: '20px', padding: '15px', backgroundColor: '#000', color: '#fff', fontSize: '0.75rem', letterSpacing: '0.05em' }
};

export default CheckoutModal;