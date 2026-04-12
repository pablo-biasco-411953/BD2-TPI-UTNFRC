import React, { useState, useEffect } from 'react';
import axios from 'axios';

// --- COMPONENTE INTERNO: EL TIMER DE RESERVA ---
const CartTimer = ({ expiresAt, onExpire }) => {
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        const calcular = () => {
            const ahora = new Date().getTime();
            const fin = new Date(expiresAt).getTime();
            const diferencia = Math.floor((fin - ahora) / 1000);

            if (diferencia <= 0) {
                setTimeLeft(0);
                onExpire(); 
            } else {
                setTimeLeft(diferencia);
            }
        };

        calcular(); 
        const timer = setInterval(calcular, 1000);
        return () => clearInterval(timer);
    }, [expiresAt]);

    const format = (s) => {
        const m = Math.floor(s / 60);
        const seg = s % 60;
        return `${m}:${seg < 10 ? '0' : ''}${seg}`;
    };

    if (timeLeft <= 0) return null;

    return (
        <div style={styles.timerBanner}>
            <span style={{ fontSize: '0.7rem', marginRight: '5px' }}>⏳</span>
            EL STOCK ESTÁ RESERVADO POR: <strong>{format(timeLeft)}</strong>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL: DRAWER DEL CARRITO ---
export const CartDrawer = ({ 
    isOpen, 
    onClose, 
    cart, 
    setCart, 
    onCheckout, 
    addToCart, 
    refrescarProductos,
    usuarioLogueado // 🔥 NUEVO: Necesitamos saber quién es para liberar su stock
}) => {
    
    const proximaExpiracion = cart.length > 0 ? cart[0].expiresAt : null;
    const subtotal = cart.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);

    const handleExpire = () => {
        if (cart.length > 0) {
            alert("Tu tiempo de reserva ha finalizado. El stock fue liberado.");
            setCart([]); 
            localStorage.removeItem('carrito_sanslimit'); 
            if (refrescarProductos) refrescarProductos(); 
            onClose();
        }
    };

    // 🔥 NUEVA LÓGICA: Restar unidad y devolverla a Redis
    const restarCantidad = async (item) => {
        if (item.cantidad <= 1) {
            eliminarItem(item);
            return;
        }

        try {
            // Le avisamos a Redis que devuelva 1 unidad
            await axios.post('http://localhost:5286/api/Pedidos/liberar', {
                ProductoId: item.id || item._id || item.slug,
                Talle: item.talleElegido || "unico",
                Usuario: usuarioLogueado?.username,
                Cantidad: 1
            });

            // Actualizamos la UI
            setCart(cart.map(i => 
                (i.id === item.id && i.talleElegido === item.talleElegido)
                    ? { ...i, cantidad: i.cantidad - 1 }
                    : i
            ));
            if (refrescarProductos) refrescarProductos();
        } catch (e) {
            console.error("Error al liberar stock", e);
        }
    };

    // 🔥 NUEVA LÓGICA: Eliminar todo el item y devolver el stock completo
    const eliminarItem = async (item) => {
        try {
            // Le avisamos a Redis que devuelva TODAS las unidades que tenía reservadas de esto
            await axios.post('http://localhost:5286/api/Pedidos/liberar', {
                ProductoId: item.id || item._id || item.slug,
                Talle: item.talleElegido || "unico",
                Usuario: usuarioLogueado?.username,
                Cantidad: item.cantidad
            });

            // Lo volamos de la UI local
            setCart(cart.filter(i => !(i.id === item.id && i.talleElegido === item.talleElegido)));
            if (refrescarProductos) refrescarProductos();
        } catch (e) {
            console.error("Error al eliminar item", e);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div style={styles.backdrop} onClick={onClose}></div>
            <div style={styles.drawer}>
                <div style={styles.header}>
                    <h2 style={styles.title}>TU CARRITO</h2>
                    <button style={styles.closeBtn} onClick={onClose}>✕</button>
                </div>

                {cart.length > 0 && proximaExpiracion && (
                    <CartTimer expiresAt={proximaExpiracion} onExpire={handleExpire} />
                )}

                <div style={styles.body}>
                    {cart.length === 0 ? (
                        <div style={styles.emptyContainer}>
                            <p style={styles.emptyText}>Tu carrito está vacío.</p>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div key={`${item.id}-${item.talleElegido || 'unico'}`} style={styles.cartItem}>
                                <div style={styles.itemInfo}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={styles.itemName}>{item.nombre?.toUpperCase()}</span>
                                        {item.talleElegido && (
                                            <span style={styles.itemMeta}>TALLE: {item.talleElegido}</span>
                                        )}
                                    </div>
                                    <span style={styles.itemPrice}>${item.precio?.toLocaleString()}</span>
                                </div>
                                
                                <div style={styles.itemActions}>
                                    <div style={styles.quantitySelector}>
                                        {/* Botón Restar */}
                                        <button style={styles.qtyBtn} onClick={() => restarCantidad(item)}>-</button>
                                        <span style={styles.qtyValue}>{item.cantidad}</span>
                                        {/* Botón Sumar (reserva en Redis) */}
                                        <button style={styles.qtyBtn} onClick={() => addToCart(item, item.talleElegido)}>+</button>
                                    </div>
                                    {/* Botón Eliminar */}
                                    <button style={styles.deleteBtn} onClick={() => eliminarItem(item)}>Eliminar</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {cart.length > 0 && (
                    <div style={styles.footer}>
                        <div style={styles.summaryLine}>
                            <span>SUBTOTAL:</span>
                            <span>${subtotal.toLocaleString()}</span>
                        </div>
                        <p style={styles.disclaimer}>Los descuentos se aplicarán en el checkout.</p>
                        <button style={styles.checkoutBtn} onClick={onCheckout}>FINALIZAR COMPRA</button>
                    </div>
                )}
            </div>
        </>
    );
};

const styles = {
    backdrop: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 2000, backdropFilter: 'blur(2px)' },
    drawer: { position: 'fixed', top: 0, right: 0, width: '420px', height: '100vh', backgroundColor: '#fff', color: '#000', zIndex: 2001, display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 30px rgba(0,0,0,0.2)' },
    header: { padding: '25px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: '1.1rem', fontWeight: '900', letterSpacing: '0.15em' },
    closeBtn: { background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', fontWeight: '300' },
    timerBanner: { backgroundColor: '#000', color: '#fff', padding: '12px', textAlign: 'center', fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: '0.1em', textTransform: 'uppercase' },
    body: { flex: 1, padding: '20px', overflowY: 'auto' },
    emptyContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' },
    emptyText: { color: '#888', fontSize: '0.8rem', letterSpacing: '0.05em' },
    cartItem: { paddingBottom: '20px', marginBottom: '20px', borderBottom: '1px solid #f5f5f5' },
    itemInfo: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px' },
    itemName: { fontSize: '0.8rem', fontWeight: '800', letterSpacing: '0.05em' },
    itemPrice: { fontSize: '0.85rem', fontWeight: '400' },
    itemMeta: { fontSize: '0.65rem', color: '#999', marginTop: '4px', fontWeight: '600' },
    itemActions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    quantitySelector: { display: 'flex', alignItems: 'center', border: '1px solid #000' },
    qtyBtn: { background: 'none', border: 'none', width: '32px', height: '32px', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', justifyContent: 'center', alignItems: 'center' },
    qtyValue: { padding: '0 12px', fontSize: '0.8rem', fontWeight: '900', borderLeft: '1px solid #000', borderRight: '1px solid #000', height: '32px', display: 'flex', alignItems: 'center' },
    deleteBtn: { background: 'none', border: 'none', color: '#ff0000', fontSize: '0.65rem', cursor: 'pointer', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em' },
    footer: { padding: '30px 20px', borderTop: '1px solid #eee', backgroundColor: '#fff' },
    summaryLine: { display: 'flex', justifyContent: 'space-between', fontSize: '1rem', marginBottom: '10px', fontWeight: '900' },
    disclaimer: { fontSize: '0.65rem', color: '#aaa', textAlign: 'center', marginBottom: '20px', fontStyle: 'italic' },
    checkoutBtn: { width: '100%', background: '#000', color: '#fff', border: 'none', padding: '18px', fontSize: '0.75rem', fontWeight: '900', letterSpacing: '0.2em', cursor: 'pointer', transition: 'all 0.3s ease' }
};

export default CartDrawer;