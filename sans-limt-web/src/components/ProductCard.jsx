import React, { useState } from 'react';
import axios from 'axios';

export const ProductCard = ({ 
    prod, isAdmin, handleDelete, hoveredProductId, setHoveredProductId, 
    addToCart, abrirDetalle: abrirDetalleProp, usuarioLogueado, refrescarProductos 
}) => {
  const [talleSeleccionado, setTalleSeleccionado] = useState(null);

  // --- ARREGLO DE IMÁGENES ---
  // Si no hay imágenes, usamos el logo por defecto para que no quede el cuadro blanco
  const imagenesArray = prod?.imagenes || [];
  const srcFinal = imagenesArray.length > 0 
    ? (imagenesArray[0].startsWith('http') ? imagenesArray[0] : `/images/products/${imagenesArray[0]}`)
    : '/sanslimit_logo.jpeg'; 

  const handleAbrirDetalle = async () => {
    if (abrirDetalleProp) abrirDetalleProp(prod);

    if (usuarioLogueado) {
      try {
        // 🔥 Si esto da 404, el try/catch evita que se rompa el resto del componente
        await axios.post('http://localhost:5286/api/Social/registrar-interes', {
          Email: usuarioLogueado.email,
          Categoria: prod.categoria
        });
      } catch (error) {
        console.warn("El endpoint de recomendaciones no responde, pero seguimos...");
      }
    }
  };

  const stockTotal = prod?.variantes?.length > 0 
    ? prod.variantes.reduce((acc, v) => acc + (v.stock ?? 0), 0) 
    : (prod?.stock ?? 0);

  const handleAddToCart = async (e) => {
    e.stopPropagation(); 
    if (prod?.variantes?.length > 0 && !talleSeleccionado) return alert("Seleccioná talle");

    addToCart({ ...prod, talleElegido: talleSeleccionado });

    if (usuarioLogueado) {
      try {
        await axios.post('http://localhost:5286/api/Pedidos/reservar', {
            ProductoId: prod.id || prod._id,
            Talle: talleSeleccionado || "unico",
            Usuario: usuarioLogueado.username,
            Cantidad: 1
        });
        if (refrescarProductos) refrescarProductos();
      } catch (error) { console.error(error); }
    }
  };

  return (
    <div style={styles.card} onClick={handleAbrirDetalle}>
      <div style={styles.imageContainer}>
        {/* Badge de Recomendación persistente */}
        {prod.esSugerido && <div style={styles.tagSugerido}>✨ SUGERIDO PARA VOS</div>}
        
        <img src={srcFinal} alt={prod.nombre} style={styles.productImage} />
      </div>

      <div style={styles.cardContent}>
        <h2 style={styles.productTitle}>{prod.nombre?.toUpperCase()}</h2>
        <div style={styles.productPrice}>${prod.precio?.toLocaleString()}</div>
        <div style={styles.stockLabel}>DISPONIBLES: {stockTotal}</div>

        {prod.variantes?.length > 0 && (
          <div style={styles.tallesGrid}>
            {prod.variantes.map((v, i) => (
              <button key={i} 
                style={{ ...styles.talleBtn, backgroundColor: talleSeleccionado === v.talle ? '#000' : '#fff', color: talleSeleccionado === v.talle ? '#fff' : '#000' }}
                onClick={(e) => { e.stopPropagation(); setTalleSeleccionado(v.talle); }}
              > {v.talle} </button>
            ))}
          </div>
        )}

        <button style={styles.addToCartBtn} onClick={handleAddToCart}> AÑADIR AL CARRITO </button>
      </div>
    </div>
  );
};

const styles = {
  card: { backgroundColor: '#fff', cursor: 'pointer', border: '1px solid #f0f0f0', padding: '10px' },
  imageContainer: { height: '400px', position: 'relative', display: 'flex', justifyContent: 'center', background: '#f9f9f9' },
  productImage: { width: '100%', height: '100%', objectFit: 'contain' },
  tagSugerido: { position: 'absolute', top: '10px', right: '10px', background: '#ff0055', color: '#fff', padding: '5px 10px', fontSize: '0.7rem', fontWeight: 'bold', zIndex: 20 },
  cardContent: { padding: '15px 0' },
  productTitle: { fontSize: '0.9rem', fontWeight: 'bold' },
  productPrice: { fontSize: '1.1rem' },
  stockLabel: { fontSize: '0.7rem', color: '#00ffaa', fontWeight: 'bold' },
  tallesGrid: { display: 'flex', gap: '8px', margin: '10px 0' },
  talleBtn: { width: '35px', height: '35px', border: '1px solid #000' },
  addToCartBtn: { width: '100%', padding: '12px', background: '#000', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }
};