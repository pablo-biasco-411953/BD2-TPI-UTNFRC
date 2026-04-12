import React, { useState } from 'react';

export const ProductCard = ({ prod, isAdmin, handleDelete, hoveredProductId, setHoveredProductId, addToCart, abrirDetalle, onFilterChange }) => { // 🔥 Agregado onFilterChange acá
  const [talleSeleccionado, setTalleSeleccionado] = useState(null);

  const imagenesArray = prod?.imagenes || [];
  const imgUrlField = prod?.imagenUrl || "";
  const idReferencia = prod?.id || prod?.slug;

  let imgFinal = (hoveredProductId === idReferencia && imagenesArray.length > 1)
    ? imagenesArray[1]
    : (imagenesArray.length > 0 ? imagenesArray[0] : imgUrlField);

  const esUrlExterna = typeof imgFinal === 'string' && imgFinal.startsWith('http');
  const srcFinal = esUrlExterna ? imgFinal : (imgFinal ? `/images/products/${imgFinal}` : '/sanslimit_logo.jpeg');

  const stockTotal = prod?.variantes?.reduce((acc, v) => acc + (v.stock ?? 0), 0) || 0;
  const agotadoTotalmente = stockTotal <= 0;

  const handleAddToCart = (e) => {
    e.stopPropagation(); // Evitamos que se abra el modal al apretar el botón

    if (prod?.variantes?.length > 0 && !talleSeleccionado) {
      alert("Por favor, seleccioná un talle antes de añadir al carrito.");
      return;
    }

    const productoParaCarrito = {
      ...prod,
      talleElegido: talleSeleccionado
    };

    addToCart(productoParaCarrito);
  };

  return (
    <div
      style={{ ...styles.card, cursor: agotadoTotalmente ? 'default' : 'pointer' }}
      onClick={() => !agotadoTotalmente && abrirDetalle && abrirDetalle(prod)} // Al hacer clic se abre el detalle
    >
      <div
        style={styles.imageContainer}
        onMouseEnter={() => setHoveredProductId(idReferencia)}
        onMouseLeave={() => setHoveredProductId(null)}
      >
        {/* Etiqueta de Sin Stock */}
        {agotadoTotalmente && (
          <div style={styles.tagAgotado}>SIN STOCK</div>
        )}

        <img
          src={srcFinal}
          alt={prod?.nombre || "Producto"}
          style={{ ...styles.productImage, opacity: agotadoTotalmente ? 0.4 : 1 }}
          onError={(e) => {
            if (!e.target.dataset.tried) {
              e.target.dataset.tried = "true";
              const currentSrc = e.target.src;
              if (currentSrc.includes('.jpeg')) {
                e.target.src = currentSrc.toLowerCase();
                return;
              }
            }
            e.target.onerror = null;
            e.target.src = '/sanslimit_logo.jpeg';
          }}
        />
      </div>

      <div style={styles.cardContent}>
        <h2 style={styles.productTitle}>{prod?.nombre?.toUpperCase() || "SIN NOMBRE"}</h2>
        <div style={styles.productPrice}>${prod?.precio?.toLocaleString() || 0}</div>

        {prod?.mililitros && (
          <div style={styles.mililitrosLabel}>
            CONTENIDO: {prod.mililitros} ML
          </div>
        )}

        {prod?.variantes?.length > 0 && (
          <div style={styles.tallesContainer}>
            <span style={styles.talleTitle}>TALLES:</span>
            <div style={styles.tallesGrid}>
              {prod.variantes.map((variante, index) => (
                <button
                  key={index}
                  style={{
                    ...styles.talleBtn,
                    backgroundColor: talleSeleccionado === variante.talle ? '#000' : '#fff',
                    color: talleSeleccionado === variante.talle ? '#fff' : '#000',
                    opacity: variante.stock === 0 ? 0.4 : 1,
                    cursor: variante.stock === 0 ? 'not-allowed' : 'pointer'
                  }}
                  onClick={(e) => {
                    e.stopPropagation(); // No abre el modal al tocar el talle
                    if (variante.stock > 0) setTalleSeleccionado(variante.talle);
                  }}
                  disabled={variante.stock === 0}
                >
                  {variante.talle}
                </button>
              ))}
            </div>
          </div>
        )}

        {!isAdmin && (
          <button
            style={{
              ...styles.addToCartBtn,
              background: agotadoTotalmente ? '#ccc' : '#000',
              cursor: agotadoTotalmente ? 'not-allowed' : 'pointer'
            }}
            onClick={handleAddToCart}
            disabled={agotadoTotalmente}
          >
            {agotadoTotalmente ? 'AGOTADO' : 'AÑADIR AL CARRITO'}
          </button>
        )}

        {isAdmin && (
          <div style={styles.adminActions}>
            {/* 🔥 AGREGADO EL STOPPROPAGATION Y LA REDIRECCIÓN AL DASHBOARD AQUÍ ABAJO */}
            <button
              style={styles.editBtn}
              onClick={(e) => {
                e.stopPropagation();
                if (onFilterChange) onFilterChange('DASHBOARD');
              }}
            >
              EDITAR
            </button>
            <button style={styles.deleteBtn} onClick={(e) => { e.stopPropagation(); handleDelete(prod.id); }}>ELIMINAR</button>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  card: { backgroundColor: '#ffffff' },
  imageContainer: { height: '450px', backgroundColor: '#f9f9f9', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '15px', overflow: 'hidden', position: 'relative' },
  productImage: { width: '100%', height: '100%', objectFit: 'contain', transition: 'opacity 0.4s ease' },
  tagAgotado: { position: 'absolute', top: '15px', left: '15px', backgroundColor: '#000', color: '#fff', padding: '6px 12px', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.1em', zIndex: 10 },
  cardContent: { padding: '10px 0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '220px' },
  productTitle: { fontSize: '0.95em', fontWeight: '700', letterSpacing: '0.05em' },
  productPrice: { fontSize: '1.1em', fontWeight: '400', marginTop: '5px' },
  mililitrosLabel: { fontSize: '0.75em', color: '#666', marginTop: '10px', letterSpacing: '0.05em' },
  tallesContainer: { marginTop: '15px' },
  talleTitle: { fontSize: '0.75em', fontWeight: 'bold', letterSpacing: '0.05em' },
  tallesGrid: { display: 'flex', gap: '10px', marginTop: '5px' },
  talleBtn: { width: '35px', height: '35px', border: '1px solid #000', fontSize: '0.75em', fontWeight: '700', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.2s ease' },
  addToCartBtn: { width: '100%', color: '#fff', border: 'none', padding: '12px', fontSize: '0.75em', fontWeight: '700', letterSpacing: '0.1em', marginTop: 'auto', transition: 'background 0.3s ease' },
  adminActions: { display: 'flex', gap: '10px', marginTop: 'auto' },
  editBtn: { flex: 1, background: '#eee', color: '#000', border: 'none', padding: '10px', cursor: 'pointer', fontSize: '0.7em' },
  deleteBtn: { flex: 1, background: '#ff4444', color: '#fff', border: 'none', padding: '10px', cursor: 'pointer', fontSize: '0.7em' },
};