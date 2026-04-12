import { useEffect, useState, useRef } from 'react'
import axios from 'axios'

// IMPORTACIÓN DE COMPONENTES
import { Ruleta } from './components/Ruleta'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { ProductGrid } from './components/ProductGrid'
import { CartDrawer } from './components/CartDrawer'
import { CheckoutModal } from './components/CheckoutModal'
import { AdminDashboard } from './components/AdminDashboard'
import { LoginRegistro } from './components/LoginRegistro'

// IMPORTACIÓN DE ESTILOS
import './styles/App.css'

function App() {
  const [cart, setCart] = useState([])
  const [showCart, setShowCart] = useState(false)
  const [productos, setProductos] = useState([])

  // ESTADOS DE USUARIO
  const [usuario, setUsuario] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showLoginScreen, setShowLoginScreen] = useState(false)

  const [hoveredProductId, setHoveredProductId] = useState(null)
  const [categoriaActual, setCategoriaActual] = useState('ALL')
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [cuponGanado, setCuponGanado] = useState("")

  const gridRef = useRef(null)

  const traerProductos = async () => {
    try {
      const response = await axios.get('https://localhost:7094/api/productos')
      setProductos(response.data)
    } catch (error) {
      console.error("Error conectando a la API:", error)
    }
  }

  useEffect(() => {
    traerProductos()

    // Recuperamos el objeto usuario del localStorage al recargar la página
    const usuarioGuardado = localStorage.getItem('usuario')
    if (usuarioGuardado) {
      const userObj = JSON.parse(usuarioGuardado)
      setUsuario(userObj)
      if (userObj.rol === 'Admin') {
        setIsAdmin(true)
      }
    }
  }, [])

  useEffect(() => {
    if (categoriaActual !== 'ALL' && gridRef.current) {
      gridRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [categoriaActual])

  // Función: Al completar con éxito el Login o Registro
  const onLoginSuccess = (datosUsuario) => {
    setUsuario(datosUsuario)
    localStorage.setItem('usuario', JSON.stringify(datosUsuario))

    if (datosUsuario.rol === 'Admin') {
      setIsAdmin(true)
    }
    setShowLoginScreen(false) // Ocultamos la pantalla de login y volvemos a la tienda
  }

  const handleLogout = () => {
    setUsuario(null)
    setIsAdmin(false)
    setCategoriaActual('ALL')
    localStorage.removeItem('usuario')
    localStorage.removeItem('carrito')
    setCart([])
  }

  const handleDelete = async (id) => {
    if (window.confirm("¿Seguro querés eliminar este producto?")) {
      try {
        await axios.delete(`https://localhost:7094/api/productos/${id}`)
        traerProductos()
      } catch (error) {
        console.error("Error al eliminar:", error)
      }
    }
  }

  const addToCart = (producto) => {
    setCart((prevCart) => {
      const existeItem = prevCart.find(
        (item) => item.id === producto.id && item.talleElegido === producto.talleElegido
      );
      if (existeItem) {
        return prevCart.map((item) =>
          item.id === producto.id && item.talleElegido === producto.talleElegido
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      }
      return [...prevCart, { ...producto, cantidad: 1 }];
    });
    setShowCart(true);
  };

  const calcularSubtotal = () => {
    return cart.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
  };

  const productosFiltrados = productos.filter((prod) => {
    if (categoriaActual === 'ALL') return true;
    return prod.categoria?.toUpperCase() === categoriaActual.toUpperCase();
  });

  return (
    <div style={styles.app}>

      <Header
        isAdmin={isAdmin}
        usuario={usuario}
        setShowLogin={() => setShowLoginScreen(true)}
        setShowLoginScreen={setShowLoginScreen} // 🔥 Prop corregida
        handleLogout={handleLogout}
        cartCount={cart.reduce((acc, item) => acc + item.cantidad, 0)}
        setShowCart={setShowCart}
        onFilterChange={setCategoriaActual}
      />

      <CartDrawer
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        cart={cart}
        setCart={setCart}
        onCheckout={() => {
          setShowCart(false);
          setIsCheckoutOpen(true);
        }}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        subtotal={calcularSubtotal()}
        cuponGanado={cuponGanado}
        totalActual={calcularSubtotal()}
      />

      {!showLoginScreen && <Hero />}
      {!showLoginScreen && <Ruleta onWinCupon={(codigo) => setCuponGanado(codigo)} />}

      <main style={styles.main} ref={gridRef}>

        <div style={styles.titleContainer}>
          <h1 style={styles.mainTitle}>
            {showLoginScreen
              ? "SANS LIMIT / MI CUENTA"
              : categoriaActual === 'DASHBOARD'
                ? "PANEL DE CONTROL"
                : `SANS LIMIT - ${categoriaActual === 'ALL' ? 'NUEVA TEMPORADA' : categoriaActual}`}
          </h1>
        </div>

        {/* LÓGICA DE RENDERIZADO PRINCIPAL */}
        {showLoginScreen ? (
          <LoginRegistro onLoginSuccess={onLoginSuccess} />
        ) : categoriaActual === 'DASHBOARD' ? (
          <AdminDashboard productos={productos} traerProductos={traerProductos} />
        ) : productosFiltrados.length === 0 ? (
          <div style={styles.comingSoonContainer}>
            <h2 style={styles.comingSoonTitle}>COMING SOON</h2>
            <p style={styles.comingSoonSubtitle}>Estamos preparando los mejores ingresos para esta categoría.</p>
          </div>
        ) : (
          <ProductGrid
            productos={productosFiltrados}
            isAdmin={isAdmin}
            handleDelete={handleDelete}
            hoveredProductId={hoveredProductId}
            setHoveredProductId={setHoveredProductId}
            addToCart={addToCart}
            onFilterChange={setCategoriaActual}
          />
        )}

      </main>
    </div>
  )
}

const styles = {
  app: { backgroundColor: '#ffffff', minHeight: '100vh', fontFamily: "'Inter', sans-serif" },
  main: { padding: '60px 40px', maxWidth: '1400px', margin: '0 auto' },
  titleContainer: { borderBottom: '2px solid #000', marginBottom: '40px', display: 'inline-block' },
  mainTitle: { fontSize: '1.2em', fontWeight: '800', letterSpacing: '0.1em' },
  comingSoonContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 20px', textAlign: 'center' },
  comingSoonTitle: { fontSize: '2.5rem', fontWeight: '900', letterSpacing: '0.2em', color: '#000', marginBottom: '10px' },
  comingSoonSubtitle: { fontSize: '0.9rem', color: '#666', letterSpacing: '0.05em' }
}

export default App