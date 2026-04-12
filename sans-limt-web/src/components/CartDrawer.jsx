import React from 'react';

export const CartDrawer = ({ isOpen, onClose, cart, setCart, onCheckout }) => {

    // Calculamos el subtotal sumando precio * cantidad de cada item
    const subtotal = cart.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);

    // Actualizamos buscando por ID y también por el Talle elegido
    const actualizarCantidad = (id, talle, nuevaCantidad) => {
        if (nuevaCantidad < 1) return;
        setCart(cart.map(item =>
            (item.id === id && item.talleElegido === talle)
                ? { ...item, cantidad: nuevaCantidad }
                : item
        ));
    };

    // Eliminamos buscando por ID y también por el Talle elegido
    const eliminarItem = (id, talle) => {
        setCart(cart.filter(item => !(item.id === id && item.talleElegido === talle)));
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Fondo oscuro detrás del carrito */}
            <div style={styles.backdrop} onClick={onClose}></div>

            {/* Menú lateral */}
            <div style={styles.drawer}>
                <div style={styles.header}>
                    <h2 style={styles.title}>TU CARRITO</h2>
                    <button style={styles.closeBtn} onClick={onClose}>✕</button>
                </div>

                <div style={styles.body}>
                    {cart.length === 0 ? (
                        <p style={styles.emptyText}>Tu carrito está vacío.</p>
                    ) : (
                        cart.map((item) => (
                            /* Usamos ID + TALLE como key para que sean únicos */
                            <div key={`${item.id}-${item.talleElegido || 'unico'}`} style={styles.cartItem}>
                                <div style={styles.itemInfo}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={styles.itemName}>{item.nombre?.toUpperCase()}</span>

                                        {/* --- METADATOS: TALLES O ML --- */}
                                        {item.talleElegido && (
                                            <span style={styles.itemMeta}>TALLE: {item.talleElegido}</span>
                                        )}
                                        {item.mililitros && (
                                            <span style={styles.itemMeta}>CONTENIDO: {item.mililitros} ML</span>
                                        )}
                                    </div>
                                    <span style={styles.itemPrice}>${item.precio?.toLocaleString()}</span>
                                </div>
                                <div style={styles.itemActions}>
                                    <div style={styles.quantitySelector}>
                                        <button
                                            style={styles.qtyBtn}
                                            onClick={() => actualizarCantidad(item.id, item.talleElegido, item.cantidad - 1)}
                                        >
                                            -
                                        </button>
                                        <span style={styles.qtyValue}>{item.cantidad}</span>
                                        <button
                                            style={styles.qtyBtn}
                                            onClick={() => actualizarCantidad(item.id, item.talleElegido, item.cantidad + 1)}
                                        >
                                            +
                                        </button>
                                    </div>
                                    <button
                                        style={styles.deleteBtn}
                                        onClick={() => eliminarItem(item.id, item.talleElegido)}
                                    >
                                        Eliminar
                                    </button>
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

                        {/* Texto de aviso para el usuario */}
                        <p style={styles.disclaimer}>
                            Los descuentos por cupones o transferencias se calcularán en el siguiente paso.
                        </p>

                        <button style={styles.checkoutBtn} onClick={onCheckout}>
                            FINALIZAR COMPRA
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

const styles = {
    backdrop: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000 },
    drawer: { position: 'fixed', top: 0, right: 0, width: '400px', height: '100vh', backgroundColor: '#fff', color: '#000', zIndex: 2001, display: 'flex', flexDirection: 'column', boxShadow: '-5px 0 15px rgba(0,0,0,0.1)' },
    header: { padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: '1.2rem', fontWeight: '800', letterSpacing: '0.1em' },
    closeBtn: { background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' },
    body: { flex: 1, padding: '20px', overflowY: 'auto' },
    emptyText: { textAlign: 'center', color: '#666', marginTop: '40px', fontSize: '0.9rem' },
    cartItem: { paddingBottom: '15px', marginBottom: '15px', borderBottom: '1px solid #eee' },
    itemInfo: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px' },
    itemName: { fontSize: '0.85rem', fontWeight: '700' },
    itemPrice: { fontSize: '0.9rem' },
    itemMeta: { fontSize: '0.7rem', color: '#777', marginTop: '3px', letterSpacing: '0.05em', fontWeight: '600' },
    itemActions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    quantitySelector: { display: 'flex', alignItems: 'center', border: '1px solid #ddd' },
    qtyBtn: { background: 'none', border: 'none', width: '30px', height: '30px', cursor: 'pointer', fontSize: '1rem' },
    qtyValue: { padding: '0 10px', fontSize: '0.9rem', fontWeight: 'bold' },
    deleteBtn: { background: 'none', border: 'none', color: '#ff4444', fontSize: '0.75rem', cursor: 'pointer', textTransform: 'uppercase' },
    footer: { padding: '20px', borderTop: '1px solid #eee', backgroundColor: '#fafafa' },
    summaryLine: { display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '10px', fontWeight: '800' },
    disclaimer: { fontSize: '0.75rem', color: '#666', textAlign: 'center', marginBottom: '15px', letterSpacing: '0.05em', lineHeight: '1.4' },
    checkoutBtn: { width: '100%', background: '#000', color: '#fff', border: 'none', padding: '15px', fontSize: '0.8rem', fontWeight: '700', letterSpacing: '0.1em', cursor: 'pointer' }
};

export default CartDrawer;