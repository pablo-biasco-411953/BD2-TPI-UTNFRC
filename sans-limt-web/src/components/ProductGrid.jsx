import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ProductCard } from './ProductCard';

export const ProductGrid = ({ 
    productos, 
    isAdmin, 
    handleDelete, 
    hoveredProductId, 
    setHoveredProductId, 
    addToCart, 
    onFilterChange, 
    usuarioLogueado, 
    refrescarProductos,
    recomendadosIds = [] // 🔥 ESTO ES LO QUE TE FALTA RECIBIR
}) => {
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [talleElegido, setTalleElegido] = useState(null);
    const [socialFeed, setSocialFeed] = useState([]);
    const [notificacionActual, setNotificacionActual] = useState(null);
    const ultimoMsgRef = useRef(null);
    
    // 🔥 ESTADO PARA SUGERENCIAS (Motor Híbrido Redis/Mongo)
    const [sugerencias, setSugerencias] = useState([]);

    // 🔥 ESTADOS PARA PRESENCIA (FOMO)
    const [viewersCount, setViewersCount] = useState(1);
    const sessionViewerId = useRef(Math.random().toString(36).substring(2, 10)).current; 

    // 🔥 POLLING DE REDIS (Social Feed)
    useEffect(() => {
        const fetchSocial = async () => {
            try {
                const res = await axios.get('http://localhost:5286/api/Social/actividad');
                if (res.data && res.data.length > 0) {
                    const nuevoMsg = res.data[0];
                    if (nuevoMsg !== ultimoMsgRef.current) {
                        ultimoMsgRef.current = nuevoMsg;
                        if (refrescarProductos) refrescarProductos();
                        setSocialFeed(res.data);
                    }
                }
            } catch (e) { console.error("Error polling Redis:", e); }
        };
        const interval = setInterval(fetchSocial, 2000);
        return () => clearInterval(interval);
    }, [refrescarProductos]);

    // 🔥 NOTIFICACIÓN FOMO
    useEffect(() => {
        if (socialFeed.length > 0) {
            setNotificacionActual(socialFeed[0]);
            const timer = setTimeout(() => setNotificacionActual(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [socialFeed]);

    // 🔥 EFECTO DE PRESENCIA EN EL MODAL (Ping cada 5 seg)
    useEffect(() => {
        if (!productoSeleccionado) return;

        const mongoId = productoSeleccionado.id || productoSeleccionado._id || productoSeleccionado.slug;
        const userId = usuarioLogueado ? `${usuarioLogueado.username}_${sessionViewerId}` : `anon_${sessionViewerId}`;

        const avisarPresencia = async () => {
            try {
                const res = await axios.post(`http://localhost:5286/api/Social/viewing/${mongoId}/${userId}`);
                setViewersCount(res.data.count);
            } catch (e) { console.error("Error al registrar presencia:", e); }
        };

        avisarPresencia();
        const interval = setInterval(avisarPresencia, 5000);
        return () => clearInterval(interval);
    }, [productoSeleccionado, usuarioLogueado, sessionViewerId]);

    // 🔥 EFECTO PARA TRAER SUGERENCIAS (Redis -> Fallback Mongo)
    useEffect(() => {
        if (productoSeleccionado) {
            const id = productoSeleccionado.id || productoSeleccionado._id;
            axios.get(`http://localhost:5286/api/Social/sugerencias?productoId=${id}&categoria=${productoSeleccionado.categoria}`)
                .then(res => {
                    // Mapeamos los IDs que vienen del server con los objetos completos de 'productos'
                    const recomendados = productos.filter(p => res.data.ids.includes(p.id || p._id));
                    setSugerencias(recomendados);
                })
                .catch(err => console.error("Error al traer sugerencias:", err));
        } else {
            setSugerencias([]);
        }
    }, [productoSeleccionado, productos]);

    const abrirDetalle = (prod) => {
        setProductoSeleccionado(prod);
        setTalleElegido(null);
        setViewersCount(1);
    };

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
        addToCart(productoSeleccionado, talleElegido);
        setProductoSeleccionado(null); 
    };

    return (
        <div style={{ position: 'relative' }}>
            {/* Live Feed emergente */}
            <div style={{
                ...styles.socialBadge,
                opacity: notificacionActual ? 1 : 0,
                transform: notificacionActual ? 'translateY(0)' : 'translateY(20px)',
                visibility: notificacionActual ? 'visible' : 'hidden'
            }}>
                <span style={{ marginRight: '8px' }}>🔥</span>
                {notificacionActual}
            </div>

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
                        onFilterChange={onFilterChange} 
                        usuarioLogueado={usuarioLogueado} 
                        refrescarProductos={refrescarProductos} 
esRecomendado={recomendadosIds.some(recId => recId.toString() === (prod.id || prod._id).toString())}
                    />
                ))}
            </div>

            {/* MODAL DE DETALLE DEL PRODUCTO */}
            {productoSeleccionado && (
                <div style={styles.modalOverlay} onClick={() => setProductoSeleccionado(null)}>
                    <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <button style={styles.btnCerrar} onClick={() => setProductoSeleccionado(null)}>X</button>

                        <div style={styles.modalGrid}>
                            <div style={styles.modalIzquierda}>
                                <img src={obtenerSrcModal(productoSeleccionado)} alt={productoSeleccionado.nombre} style={styles.modalImagen} />
                            </div>

                            <div style={styles.modalDerecha}>
                                <h2 style={styles.modalNombre}>{productoSeleccionado.nombre?.toUpperCase()}</h2>
                                <p style={styles.modalPrecio}>${productoSeleccionado.precio?.toLocaleString()}</p>

                                {viewersCount > 1 && (
                                    <div style={styles.fomoBadge}>
                                        <span style={{ marginRight: '5px' }}>👀</span>
                                        <strong>{viewersCount} personas</strong> están mirando esto
                                    </div>
                                )}

                                <div style={{ marginBottom: '15px' }}>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>DESCRIPCIÓN:</span>
                                    <p style={styles.modalDescripcion}>{productoSeleccionado.descripcion || "Sin descripción."}</p>
                                </div>

                                {productoSeleccionado.variantes?.length > 0 && (
                                    <div style={{ marginBottom: '20px' }}>
                                        <p style={{ fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '8px' }}>TALLES:</p>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {productoSeleccionado.variantes.map((v, index) => (
                                                <button
                                                    key={index}
                                                    disabled={v.stock <= 0}
                                                    onClick={() => setTalleElegido(v.talle)}
                                                    style={{
                                                        ...styles.talleBtnModal,
                                                        backgroundColor: talleElegido === v.talle ? '#000' : '#fff',
                                                        color: talleElegido === v.talle ? '#fff' : '#000',
                                                        opacity: v.stock <= 0 ? 0.3 : 1
                                                    }}
                                                >
                                                    {v.talle}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* 🔥 SECCIÓN DE SUGERENCIAS */}
                                {sugerencias.length > 0 && (
                                    <div style={styles.sugerenciasSeccion}>
                                        <p style={styles.sugerenciasTitulo}>COMPLETÁ TU LOOK:</p>
                                        <div style={styles.sugerenciasFlex}>
                                            {sugerencias.map(s => (
                                                <div key={s.id || s._id} onClick={() => abrirDetalle(s)} style={styles.miniCard}>
                                                    <img src={obtenerSrcModal(s)} style={styles.miniImg} alt={s.nombre} />
                                                    <p style={styles.miniNombre}>{s.nombre.toUpperCase()}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <button
                                    style={{
                                        ...styles.btnAgregarCarrito,
                                        backgroundColor: (productoSeleccionado.variantes?.length > 0 && !talleElegido) ? '#999' : '#000',
                                        marginTop: '20px'
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
    socialBadge: { position: 'fixed', bottom: '30px', left: '30px', backgroundColor: '#fff', color: '#000', padding: '12px 25px', border: '2px solid #000', boxShadow: '6px 6px 0px #000', zIndex: 3000, fontSize: '0.8rem', fontWeight: '900', transition: 'all 0.4s ease' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 },
    modalContent: { backgroundColor: '#fff', width: '850px', border: '2px solid #000', position: 'relative', boxShadow: '15px 15px 0px 0px #000' },
    btnCerrar: { position: 'absolute', top: '15px', right: '20px', background: 'none', border: 'none', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer' },
    modalGrid: { display: 'flex' },
    modalIzquierda: { flex: 1, height: '580px', backgroundColor: '#f9f9f9', display: 'flex', justifyContent: 'center', alignItems: 'center' },
    modalImagen: { width: '100%', height: '100%', objectFit: 'contain' },
    modalDerecha: { flex: 1, padding: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' },
    modalNombre: { fontSize: '1.3rem', fontWeight: '900', letterSpacing: '0.05em', marginBottom: '5px' },
    modalPrecio: { fontSize: '1.1rem', fontWeight: '400', marginBottom: '15px' },
    fomoBadge: { display: 'inline-block', backgroundColor: '#ffeaea', color: '#cc0000', padding: '6px 10px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700', marginBottom: '15px', border: '1px solid #ffcccc' },
    modalDescripcion: { fontSize: '0.8rem', color: '#555', lineHeight: '1.5', marginTop: '3px' },
    talleBtnModal: { width: '35px', height: '35px', border: '1px solid #000', fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s ease' },
    
    // 🔥 ESTILOS SUGERENCIAS
    sugerenciasSeccion: { marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' },
    sugerenciasTitulo: { fontSize: '0.65rem', fontWeight: '900', marginBottom: '10px', letterSpacing: '0.1em' },
    sugerenciasFlex: { display: 'flex', gap: '12px' },
    miniCard: { width: '75px', cursor: 'pointer', textAlign: 'center' },
    miniImg: { width: '100%', height: '75px', objectFit: 'cover', border: '1px solid #eee', borderRadius: '3px' },
    miniNombre: { fontSize: '0.55rem', fontWeight: '800', marginTop: '5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },

    btnAgregarCarrito: { color: '#fff', border: 'none', padding: '15px', fontWeight: 'bold', letterSpacing: '0.1em', width: '100%', transition: 'background 0.3s ease' }
};

export default ProductGrid;