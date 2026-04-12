import React, { useState } from 'react';
import axios from 'axios';
// 🔥 IMPORTAMOS EL COMPONENTE DE MÉTRICAS GRÁFICAS
import { DashboardMetricas } from './DashboardMetricas';

export const AdminDashboard = ({ productos = [], traerProductos }) => {
    const [editandoId, setEditandoId] = useState(null);
    const [prodEditado, setProdEditado] = useState({});
    const [verVariantesId, setVerVariantesId] = useState(null);

    // Estado para controlar el modal de variantes en la creación
    const [mostrarModalVariantes, setMostrarModalVariantes] = useState(false);

    const [nuevoProd, setNuevoProd] = useState({
        nombre: '', precio: 0, categoria: '', imagenUrl: '', mililitros: null, tipo: '', descripcion: '', slug: '',
        variantes: [{ talle: '', color: '', stock: 0, sku: '' }]
    });

    const totalProductos = productos.length;

    const calcularStockTotalProd = (prod) => {
        if (!prod.variantes || !Array.isArray(prod.variantes)) return 0;
        return prod.variantes.reduce((acc, v) => acc + (v.stock ?? 0), 0);
    };

    const sinStock = productos.filter(p => calcularStockTotalProd(p) <= 0).length;

    const agregarVarianteNueva = () => {
        setNuevoProd({
            ...nuevoProd,
            variantes: [...nuevoProd.variantes, { talle: '', color: '', stock: 0, sku: '' }]
        });
    };

    // CORRECCIÓN: Actualización inmutable para evitar bugs de renderizado
    const actualizarVarianteNueva = (index, campo, valor) => {
        const nuevasVars = nuevoProd.variantes.map((v, i) => {
            if (i === index) {
                return { ...v, [campo]: campo === 'stock' ? parseInt(valor) || 0 : valor };
            }
            return v;
        });
        setNuevoProd({ ...nuevoProd, variantes: nuevasVars });
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await axios.post('https://localhost:7094/api/productos', nuevoProd);
            setNuevoProd({ nombre: '', precio: 0, categoria: '', imagenUrl: '', mililitros: null, tipo: '', descripcion: '', slug: '', variantes: [{ talle: '', color: '', stock: 0, sku: '' }] });
            setMostrarModalVariantes(false); // Cerramos el modal tras crear con éxito
            traerProductos();
            alert("¡Producto subido con éxito!");
        } catch (error) {
            console.error("Error al crear:", error.response?.data || error.message);
            alert("Error al subir el producto.");
        }
    };

    const handleEditClick = (prod) => {
        setEditandoId(prod.id);
        setProdEditado({ ...prod, variantes: prod.variantes || [] });
    };

    // CORRECCIÓN: Actualización inmutable para las variantes que se están editando
    const actualizarVarianteEditada = (vIndex, campo, valor) => {
        const nuevasVars = prodEditado.variantes.map((v, i) => {
            if (i === vIndex) {
                return { ...v, [campo]: campo === 'stock' ? parseInt(valor) || 0 : valor };
            }
            return v;
        });
        setProdEditado({ ...prodEditado, variantes: nuevasVars });
    };

    const handleSaveEdit = async (id) => {
        try {
            await axios.put(`https://localhost:7094/api/productos/${id}`, prodEditado);
            setEditandoId(null);
            traerProductos();
            alert("¡Producto y variantes actualizados!");
        } catch (error) {
            console.error("Error al actualizar:", error.response?.data || error.message);
            alert("Error al actualizar.");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("¿Seguro querés eliminar este producto?")) {
            try {
                await axios.delete(`https://localhost:7094/api/productos/${id}`);
                traerProductos();
            } catch (error) {
                console.error("Error al eliminar:", error);
            }
        }
    };

    return (
        <div style={styles.container}>

            {/* 🔥 SECCIÓN 1: MÉTRICAS DE VENTAS Y ESTADÍSTICAS */}
            <DashboardMetricas />

            {/* Separador estético */}
            <hr style={{ border: '1px solid #000', margin: '10px 0 20px 0' }} />

            {/* SECCIÓN 2: MÉTRICAS DE STOCK EXISTENTES */}
            <div style={styles.metricsGrid}>
                <div style={styles.metricCard}><h3>{totalProductos}</h3><p>PRODUCTOS EN TIENDA</p></div>
                <div style={{ ...styles.metricCard, borderColor: '#ff4444' }}><h3 style={{ color: '#ff4444' }}>{sinStock}</h3><p>PRODUCTOS SIN STOCK</p></div>
            </div>

            <div style={styles.contentGrid}>
                {/* 📝 FORMULARIO DE ALTA */}
                <div style={styles.card}>
                    <h2 style={styles.cardTitle}>NUEVO PRODUCTO</h2>
                    <form onSubmit={handleCreate} style={styles.form}>
                        <div style={styles.inputGroup}><label style={styles.label}>Nombre</label><input type="text" style={styles.input} value={nuevoProd.nombre} onChange={(e) => setNuevoProd({ ...nuevoProd, nombre: e.target.value })} required /></div>
                        <div style={styles.inputGroup}><label style={styles.label}>Slug</label><input type="text" style={styles.input} value={nuevoProd.slug} onChange={(e) => setNuevoProd({ ...nuevoProd, slug: e.target.value })} required /></div>
                        <div style={styles.inputGroup}><label style={styles.label}>Descripción</label><input type="text" style={styles.input} value={nuevoProd.descripcion} onChange={(e) => setNuevoProd({ ...nuevoProd, descripcion: e.target.value })} required /></div>
                        <div style={styles.inputGroup}><label style={styles.label}>Precio</label><input type="number" style={styles.input} value={nuevoProd.precio || ''} onChange={(e) => setNuevoProd({ ...nuevoProd, precio: parseInt(e.target.value) || 0 })} required /></div>
                        <div style={styles.inputGroup}><label style={styles.label}>Categoría</label><input type="text" style={styles.input} value={nuevoProd.categoria} onChange={(e) => setNuevoProd({ ...nuevoProd, categoria: e.target.value })} required /></div>
                        <div style={styles.inputGroup}><label style={styles.label}>Imagen</label><input type="text" style={styles.input} value={nuevoProd.imagenUrl} onChange={(e) => setNuevoProd({ ...nuevoProd, imagenUrl: e.target.value })} required /></div>

                        <button type="button" onClick={() => setMostrarModalVariantes(true)} style={styles.variantOpenBtn}>
                            CONFIGURAR VARIANTES ({nuevoProd.variantes.length})
                        </button>

                        <button type="submit" style={styles.submitBtn}>SUBIR A TIENDA</button>
                    </form>
                </div>

                {/* 📋 TABLA DE GESTIÓN */}
                <div style={{ ...styles.card, flex: 2 }}>
                    <h2 style={styles.cardTitle}>LISTADO Y GESTIÓN</h2>
                    <div style={styles.tableWrapper}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>ID</th>
                                    <th style={styles.th}>NOMBRE</th>
                                    <th style={styles.th}>CATEGORÍA</th>
                                    <th style={styles.th}>PRECIO</th>
                                    <th style={styles.th}>VARIANTES</th>
                                    <th style={styles.th}>ACCIONES</th>
                                </tr>
                            </thead>
                            <tbody>
                                {productos.map(prod => (
                                    <React.Fragment key={prod.id}>
                                        <tr style={styles.tr}>
                                            <td style={styles.td}>{prod.id}</td>
                                            <td style={styles.td}>
                                                {editandoId === prod.id ? (
                                                    <input type="text" style={styles.tableInput} value={prodEditado.nombre} onChange={(e) => setProdEditado({ ...prodEditado, nombre: e.target.value })} />
                                                ) : prod.nombre}
                                            </td>
                                            <td style={styles.td}>{prod.categoria}</td>
                                            <td style={styles.td}>
                                                {editandoId === prod.id ? (
                                                    <input type="number" style={styles.tableInput} value={prodEditado.precio} onChange={(e) => setProdEditado({ ...prodEditado, precio: parseInt(e.target.value) || 0 })} />
                                                ) : `$${prod.precio.toLocaleString()}`}
                                            </td>
                                            <td style={styles.td}>
                                                <button
                                                    style={{ ...styles.smallBtn, backgroundColor: verVariantesId === prod.id ? '#000' : '#eee', color: verVariantesId === prod.id ? '#fff' : '#000' }}
                                                    onClick={() => setVerVariantesId(verVariantesId === prod.id ? null : prod.id)}
                                                >
                                                    {verVariantesId === prod.id ? 'Ocultar' : `Ver (${prod.variantes?.length || 0})`}
                                                </button>
                                            </td>
                                            <td style={styles.td}>
                                                {editandoId === prod.id ? (
                                                    <div style={styles.btnActionGroup}>
                                                        <button style={styles.saveBtn} onClick={() => handleSaveEdit(prod.id)}>Guardar</button>
                                                        <button style={styles.cancelBtn} onClick={() => setEditandoId(null)}>X</button>
                                                    </div>
                                                ) : (
                                                    <div style={styles.btnActionGroup}>
                                                        <button style={styles.editBtn} onClick={() => handleEditClick(prod)}>Editar</button>
                                                        <button style={styles.deleteBtn} onClick={() => handleDelete(prod.id)}>Borrar</button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                        {verVariantesId === prod.id && (
                                            <tr style={{ backgroundColor: '#fafafa' }}>
                                                <td colSpan="6" style={{ padding: '15px 30px' }}>
                                                    <div style={{ border: '1px solid #ddd', padding: '15px', backgroundColor: '#fff' }}>
                                                        <h4 style={{ fontSize: '0.8rem', letterSpacing: '0.1em', marginBottom: '10px' }}>STOCK POR VARIANTE</h4>
                                                        {(editandoId === prod.id ? prodEditado.variantes : (prod.variantes || [])).map((v, vIndex) => (
                                                            <div key={vIndex} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                                                <div style={{ flex: 1 }}><label style={styles.label}>Talle</label><input type="text" style={styles.tableInput} value={v.talle} onChange={(e) => actualizarVarianteEditada(vIndex, 'talle', e.target.value)} disabled={editandoId !== prod.id} /></div>
                                                                <div style={{ flex: 1 }}><label style={styles.label}>Color</label><input type="text" style={styles.tableInput} value={v.color} onChange={(e) => actualizarVarianteEditada(vIndex, 'color', e.target.value)} disabled={editandoId !== prod.id} /></div>
                                                                <div style={{ flex: 1 }}><label style={styles.label}>Stock</label><input type="number" style={styles.tableInput} value={v.stock} onChange={(e) => actualizarVarianteEditada(vIndex, 'stock', e.target.value)} disabled={editandoId !== prod.id} /></div>
                                                                <div style={{ flex: 2 }}><label style={styles.label}>SKU</label><input type="text" style={styles.tableInput} value={v.sku} onChange={(e) => actualizarVarianteEditada(vIndex, 'sku', e.target.value)} disabled={editandoId !== prod.id} /></div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* 🪟 MODAL FLOTANTE PARA VARIANTES */}
            {mostrarModalVariantes && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
                            <h2 style={{ fontSize: '1rem', fontWeight: '900', letterSpacing: '0.1em' }}>CONFIGURAR VARIANTES</h2>
                            <button type="button" onClick={agregarVarianteNueva} style={styles.smallBtn}>+ Agregar Fila</button>
                        </div>

                        <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
                            {nuevoProd.variantes.map((v, i) => (
                                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                                    <div style={{ flex: 1 }}><label style={styles.label}>Talle</label><input type="text" style={styles.input} value={v.talle} onChange={(e) => actualizarVarianteNueva(i, 'talle', e.target.value)} required /></div>
                                    <div style={{ flex: 1 }}><label style={styles.label}>Color</label><input type="text" style={styles.input} value={v.color} onChange={(e) => actualizarVarianteNueva(i, 'color', e.target.value)} required /></div>
                                    <div style={{ flex: 1 }}><label style={styles.label}>Stock</label><input type="number" style={styles.input} value={v.stock || ''} onChange={(e) => actualizarVarianteNueva(i, 'stock', e.target.value)} required /></div>
                                    <div style={{ flex: 2 }}><label style={styles.label}>SKU</label><input type="text" style={styles.input} value={v.sku} onChange={(e) => actualizarVarianteNueva(i, 'sku', e.target.value)} required /></div>
                                </div>
                            ))}
                        </div>

                        <button type="button" onClick={() => setMostrarModalVariantes(false)} style={styles.submitBtn}>
                            GUARDAR Y CERRAR
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ... (Tus estilos se mantienen intactos aquí abajo)

const styles = {
    container: { display: 'flex', flexDirection: 'column', gap: '30px' },
    metricsGrid: { display: 'flex', gap: '20px' },
    metricCard: { flex: 1, padding: '20px', border: '1px solid #000', textAlign: 'center', backgroundColor: '#fff', boxShadow: '5px 5px 0px 0px #000' },
    contentGrid: { display: 'flex', gap: '30px', flexWrap: 'wrap' },
    card: { border: '1px solid #000', padding: '25px', minWidth: '320px', backgroundColor: '#fff', alignSelf: 'flex-start', boxShadow: '5px 5px 0px 0px #000' },
    cardTitle: { fontSize: '1rem', fontWeight: '900', marginBottom: '25px', letterSpacing: '0.15em', borderBottom: '2px solid #000', paddingBottom: '10px' },
    form: { display: 'flex', flexDirection: 'column', gap: '12px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
    label: { fontSize: '0.70rem', fontWeight: 'bold', letterSpacing: '0.05em', color: '#333' },
    input: { padding: '9px', border: '1px solid #eee', backgroundColor: '#fafafa', fontSize: '0.80rem', width: '100%', boxSizing: 'border-box' },
    variantOpenBtn: { background: '#fff', color: '#000', padding: '10px', border: '1px solid #000', fontWeight: 'bold', cursor: 'pointer', letterSpacing: '0.05em', marginTop: '5px' },
    submitBtn: { background: '#000', color: '#fff', padding: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer', letterSpacing: '0.1em', marginTop: '5px', width: '100%' },
    tableWrapper: { overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' },
    th: { padding: '12px', borderBottom: '2px solid #000', fontWeight: 'bold', letterSpacing: '0.05em' },
    tr: { borderBottom: '1px solid #eee' },
    td: { padding: '12px', verticalAlign: 'middle' },
    tableInput: { width: '100%', padding: '6px', border: '1px solid #ddd', fontSize: '0.75rem', boxSizing: 'border-box' },
    btnActionGroup: { display: 'flex', gap: '5px' },
    saveBtn: { background: '#000', color: '#fff', border: 'none', padding: '6px 12px', cursor: 'pointer', fontWeight: 'bold' },
    cancelBtn: { background: '#999', color: '#fff', border: 'none', padding: '6px 12px', cursor: 'pointer' },
    editBtn: { background: '#000', color: '#fff', border: 'none', padding: '6px 12px', cursor: 'pointer', letterSpacing: '0.05em' },
    deleteBtn: { background: '#ff4444', color: '#fff', border: 'none', padding: '6px 12px', cursor: 'pointer', letterSpacing: '0.05em' },
    smallBtn: { padding: '4px 10px', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { backgroundColor: '#fff', padding: '30px', width: '600px', border: '2px solid #000', boxShadow: '10px 10px 0px 0px #000' }
};