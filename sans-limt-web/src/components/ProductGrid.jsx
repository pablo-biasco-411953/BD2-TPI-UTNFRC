import React, { useState } from 'react';
import { ProductCard } from './ProductCard';

export const ProductGrid = ({ productos, isAdmin, handleDelete, hoveredProductId, setHoveredProductId, addToCart, onFilterChange }) => { // 🔥 Agregado onFilterChange acá
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [talleElegido, setTalleElegido] = useState(null);

    const abrirDetalle = (prod) => {
        setProductoSeleccionado(prod);
        setTalleElegido(null);
    };

    // Función que utiliza tu mismo srcFinal para el Modal
    const obtenerSrcModal = (prod) => {
        const img = prod?.imagenes?.[0] || prod?.imagenUrl;
        const esUrlExt = typeof img === 'string' && img.startsWith('http');
        return esUrlExt ? img : (img ? `/images/products/${img}` : '/sanslimit_logo.jpeg');
    };

    const handleAgregarDesdeModal = () => {
        if (productoSeleccionado?.variantes?.length > 0 && !talleElegido) {
            alert("Por favor, seleccioná un talle.");
            return;
        }
        addToCart({ ...productoSeleccionado, talleElegido });
        setProductoSeleccionado(null); // Opcional: cierra el modal al añadir
    };

    return (
        <div style={{ position: 'relative' }}>
            <div style={styles.grid}>
                {productos.map((prod) => (
                    <ProductCard
                        key={prod.id || prod.slug}
                        prod={prod}
                        isAdmin={isAdmin}
                        handleDelete={handleDelete}
                        hoveredProductId={hoveredProductId}
                        setHoveredProductId={setHoveredProductId}
                        addToCart={addToCart}
                        abrirDetalle={abrirDetalle}
                        onFilterChange={onFilterChange} // 🔥 Le pasamos la función a la tarjeta
                    />
                ))}
            </div>

            {/* 🪟 MODAL DE DETALLE DEL PRODUCTO */}
            {productoSeleccionado && (
                <div style={styles.modalOverlay} onClick={() => setProductoSeleccionado(null)}>
                    <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <button style={styles.btnCerrar} onClick={() => setProductoSeleccionado(null)}>X</button>

                        <div style={styles.modalGrid}>
                            {/* Lado Izquierdo: Foto */}
                            <div style={styles.modalIzquierda}>
                                <img
                                    src={obtenerSrcModal(productoSeleccionado)}
                                    alt={productoSeleccionado.nombre}
                                    style={styles.modalImagen}
                                />
                            </div>

                            {/* Lado Derecho: Info y Talles */}
                            <div style={styles.modalDerecha}>
                                <h2 style={styles.modalNombre}>{productoSeleccionado.nombre?.toUpperCase()}</h2>
                                <p style={styles.modalPrecio}>${productoSeleccionado.precio?.toLocaleString()}</p>

                                <div style={{ marginBottom: '20px' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>DESCRIPCIÓN:</span>
                                    <p style={styles.modalDescripcion}>{productoSeleccionado.descripcion || "Sin descripción disponible."}</p>
                                </div>

                                {productoSeleccionado.mililitros && (
                                    <p style={{ ...styles.modalDescripcion, marginBottom: '20px' }}>
                                        <strong>CONTENIDO:</strong> {productoSeleccionado.mililitros} ML
                                    </p>
                                )}

                                {/* Selector de Talles Inteligente en el Modal */}
                                {productoSeleccionado.variantes?.length > 0 && (
                                    <div style={{ marginBottom: '25px' }}>
                                        <p style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '10px' }}>SELECCIONAR TALLE:</p>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            {productoSeleccionado.variantes.map((v, index) => {
                                                const sinStock = (v.stock ?? 0) <= 0;
                                                const seleccionado = talleElegido === v.talle;

                                                return (
                                                    <button
                                                        key={index}
                                                        disabled={sinStock}
                                                        onClick={() => setTalleElegido(v.talle)}
                                                        style={{
                                                            ...styles.talleBtnModal,
                                                            backgroundColor: seleccionado ? '#000' : '#fff',
                                                            color: seleccionado ? '#fff' : '#000',
                                                            opacity: sinStock ? 0.3 : 1,
                                                            cursor: sinStock ? 'not-allowed' : 'pointer'
                                                        }}
                                                    >
                                                        {v.talle}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <button
                                    style={{
                                        ...styles.btnAgregarCarrito,
                                        backgroundColor: (productoSeleccionado.variantes?.length > 0 && !talleElegido) ? '#999' : '#000',
                                        cursor: (productoSeleccionado.variantes?.length > 0 && !talleElegido) ? 'not-allowed' : 'pointer'
                                    }}
                                    onClick={handleAgregarDesdeModal}
                                    disabled={productoSeleccionado.variantes?.length > 0 && !talleElegido}
                                >
                                    {(productoSeleccionado.variantes?.length > 0 && !talleElegido) ? 'SELECCIONÁ UN TALLE' : 'AGREGAR AL CARRITO'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '50px' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 },
    modalContent: { backgroundColor: '#fff', width: '850px', border: '2px solid #000', position: 'relative', boxShadow: '15px 15px 0px 0px #000' },
    btnCerrar: { position: 'absolute', top: '15px', right: '20px', background: 'none', border: 'none', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer' },
    modalGrid: { display: 'flex' },
    modalIzquierda: { flex: 1, height: '550px', backgroundColor: '#f9f9f9', display: 'flex', justifyContent: 'center', alignItems: 'center' },
    modalImagen: { width: '100%', height: '100%', objectFit: 'contain' },
    modalDerecha: { flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
    modalNombre: { fontSize: '1.4rem', fontWeight: '900', letterSpacing: '0.05em', marginBottom: '10px' },
    modalPrecio: { fontSize: '1.2rem', fontWeight: '400', marginBottom: '20px' },
    modalDescripcion: { fontSize: '0.85rem', color: '#555', lineHeight: '1.6', marginTop: '5px' },
    talleBtnModal: { width: '40px', height: '40px', border: '1px solid #000', fontSize: '0.8rem', fontWeight: '700', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.2s ease' },
    btnAgregarCarrito: { color: '#fff', border: 'none', padding: '15px', fontWeight: 'bold', letterSpacing: '0.1em', marginTop: 'auto', width: '100%', transition: 'background 0.3s ease' }
};