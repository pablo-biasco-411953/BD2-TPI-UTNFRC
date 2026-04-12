import { useEffect, useState, useRef } from 'react';
import axios from 'axios';

// 🔥 IMPORTACIONES DIRECTAS
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ProductGrid } from './components/ProductGrid';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { AdminDashboard } from './components/AdminDashboard';
import { LoginRegistro } from './components/LoginRegistro';
import { Ruleta } from './components/Ruleta';

import './styles/App.css';

export default function App() {
  // --- ESTADOS BASE ---
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = window.localStorage.getItem('carrito_sanslimit');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error("Error leyendo el carrito local", error);
      return [];
    }
  });

  const [showCart, setShowCart] = useState(false);
  const [productos, setProductos] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginScreen, setShowLoginScreen] = useState(false);
  const [categoriaActual, setCategoriaActual] = useState('ALL');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [cuponGanado, setCuponGanado] = useState("");
  
  // --- ESTADOS PARA RECOMENDACIONES (REDIS) ---
  const [recomendadosIds, setRecomendadosIds] = useState([]);
  const [esReordenado, setEsReordenado] = useState(false);
  const [hoveredProductId, setHoveredProductId] = useState(null);
  const gridRef = useRef(null);

  // --- PERSISTENCIA DEL CARRITO ---
  useEffect(() => {
    window.localStorage.setItem('carrito_sanslimit', JSON.stringify(cart));
  }, [cart]);

  // 🔥 EFECTO INICIAL MEJORADO: Trae productos + Recomendaciones de Redis
  useEffect(() => {
    const inicializarApp = async () => {
      // 1. Traemos los productos de Mongo siempre
      await traerProductos();
      
      // 2. Si hay usuario, le preguntamos a Redis qué le gusta
      const storedUser = JSON.parse(localStorage.getItem('usuario'));
      if (storedUser) { 
        setUsuario(storedUser); 
        setIsAdmin(storedUser.rol === 'Admin'); 

        // 🚀 CONSULTA A REDIS: Basado en su última compra guardada
        try {
          const res = await axios.get(`http://localhost:5286/api/Social/recomendaciones-usuario/${storedUser.username}`);
          if (res.data.ids && res.data.ids.length > 0) {
            setRecomendadosIds(res.data.ids);
            setEsReordenado(true);
            console.log("Catálogo personalizado por historial de Redis");
          }
        } catch (e) {
          console.log("No hay historial previo para este usuario en Redis.");
        }
      }
    };
    inicializarApp();
  }, []);
  
const traerProductos = async () => {
    // Recuperamos el usuario del localStorage
    const user = JSON.parse(localStorage.getItem('usuario'));
    const email = user ? user.email : "";

    try {
        // Le mandamos el email como Query Param
        const { data } = await axios.get(`http://localhost:5286/api/productos?userEmail=${email}`);
        setProductos(data);
    } catch (e) { console.error(e); }
};

  

const actualizarRecomendacionesPostCompra = (idsSugeridos, idsComprados) => {
    console.log("--- MOTOR DE RECOMENDACIONES DISPARADO ---");
    console.log("Sugeridos por el backend:", idsSugeridos);
    console.log("Comprados por el usuario:", idsComprados);

    const soloNuevos = idsSugeridos.filter(id => !idsComprados.includes(id));
    
    console.log("IDs que deberían tener BADGE:", soloNuevos);

    setRecomendadosIds(soloNuevos);
    setEsReordenado(true);

    setTimeout(() => {
        window.scrollTo({ top: 450, behavior: 'smooth' });
    }, 500);
};
const productosFinales = esReordenado 
    ? [...productos].sort((a, b) => {
        const aId = (a.id || a._id || "").toString();
        const bId = (b.id || b._id || "").toString();
        
        // Buscamos si el ID de este producto está en el array que mandó Redis
        const aEsRec = recomendadosIds.some(recId => recId.toString() === aId) ? -1 : 1;
        const bEsRec = recomendadosIds.some(recId => recId.toString() === bId) ? -1 : 1;
        
        return aEsRec - bEsRec;
      })
    : productos.filter(p => categoriaActual === 'ALL' || p.categoria === categoriaActual);

  const addToCart = async (producto, talleElegido) => {
    if (!usuario) { alert("Iniciá sesión."); setShowLoginScreen(true); return; }
    const mongoId = producto.id || producto._id;
    const talleDef = talleElegido || "unico";

    try {
      const { data } = await axios.post('http://localhost:5286/api/Pedidos/reservar', {
        ProductoId: mongoId, Talle: talleDef, Usuario: usuario.username, Cantidad: 1
      });
      setProductos(prev => prev.map(p => {
        if ((p.id || p._id) === mongoId) {
          const copia = { ...p };
          if (copia.variantes?.length > 0) {
            copia.variantes = copia.variantes.map(v => v.talle === talleDef ? { ...v, stock: v.stock - 1 } : v);
          } else { copia.stock -= 1; }
          return copia;
        }
        return p;
      }));
      setCart(prev => {
        const existe = prev.find(i => (i.id || i._id) === mongoId && i.talleElegido === talleDef);
        if (existe) {
          return prev.map(i => ((i.id || i._id) === mongoId && i.talleElegido === talleDef) 
            ? { ...i, cantidad: i.cantidad + 1, expiresAt: data.expiresAt } : i);
        }
        return [...prev, { ...producto, talleElegido: talleDef, cantidad: 1, expiresAt: data.expiresAt }];
      });
      setShowCart(true);
    } catch (err) { alert("Sin stock."); traerProductos(); }
  };

  const handleLogout = () => {
    setUsuario(null); setIsAdmin(false); setCart([]);
    localStorage.removeItem('usuario'); localStorage.removeItem('carrito_sanslimit');
    setEsReordenado(false); // Al salir, la tienda vuelve a ser genérica
  };

  return (
    <div style={styles.app}>
      <Header 
        isAdmin={isAdmin} usuario={usuario} 
        setShowLogin={() => setShowLoginScreen(true)} handleLogout={handleLogout} 
        cartCount={cart.reduce((a, b) => a + b.cantidad, 0)} 
        setShowCart={setShowCart} onFilterChange={setCategoriaActual} 
      />
      
      <CartDrawer 
        isOpen={showCart} onClose={() => setShowCart(false)} 
        cart={cart} setCart={setCart} 
        onCheckout={() => { setShowCart(false); setIsCheckoutOpen(true); }} 
        addToCart={addToCart} refrescarProductos={traerProductos} usuarioLogueado={usuario}
      />

      <CheckoutModal 
          isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} 
          cart={cart} setCart={setCart}
          subtotal={cart.reduce((a, b) => a + (b.precio * b.cantidad), 0)}
          cuponGanado={cuponGanado}
          actualizarRecomendacionesPostCompra={actualizarRecomendacionesPostCompra}
      />

      {!showLoginScreen && (
        <>
          <Hero />
          <Ruleta onWinCupon={setCuponGanado} usuarioLogueado={usuario} />
          <main style={styles.main} ref={gridRef}>
            <ProductGrid 
              productos={productosFinales} 
              recomendadosIds={recomendadosIds} 
              isAdmin={isAdmin}
              handleDelete={(id) => axios.delete(`http://localhost:5286/api/productos/${id}`).then(traerProductos)}
              addToCart={addToCart}
              usuarioLogueado={usuario}
              refrescarProductos={traerProductos}
              setHoveredProductId={setHoveredProductId}
              hoveredProductId={hoveredProductId}
              
            />
          </main>
        </>
      )}

      {showLoginScreen && (
        <LoginRegistro onLoginSuccess={(u) => { setUsuario(u); setIsAdmin(u.rol === 'Admin'); setShowLoginScreen(false); localStorage.setItem('usuario', JSON.stringify(u)); window.location.reload(); }} />
      )}
    </div>
  );
}

const styles = {
  app: { backgroundColor: '#fff', minHeight: '100vh', fontFamily: 'Inter, sans-serif' },
  main: { padding: '40px', maxWidth: '1400px', margin: '0 auto' }
};