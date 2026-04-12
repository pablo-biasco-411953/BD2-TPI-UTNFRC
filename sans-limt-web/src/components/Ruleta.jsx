import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

// 🔥 MODO DEBUG: Si está en true, ignora el bloqueo de 24hs para que puedas probar mil veces.
const DEBUG_MODE = false; 

export const Ruleta = ({ onWinCupon, usuarioLogueado }) => {
    const [girando, setGirando] = useState(false);
    const [premio, setPremio] = useState(null);
    const [anguloRotacion, setAnguloRotacion] = useState(0);
    const [codigoCupon, setCodigoCupon] = useState("");
    
    // Estados para el FOMO (Notificaciones dinámicas)
    const [notificacionActual, setNotificacionActual] = useState(null);
    const [badgeStyle, setBadgeStyle] = useState({ bottom: '5%', right: '5%' });
    const [notificacionesQueue, setNotificacionesQueue] = useState([]);
    const [historialMostrados, setHistorialMostrados] = useState(new Set());

    // Estados para el Bloqueo y Timer
    const [bloqueado, setBloqueado] = useState(false);
    const [tiempoRestante, setTiempoRestante] = useState(0);

    const opciones = ["10% OFF", "Sigue Participando", "15% OFF", "Envío Gratis", "5% OFF", "Suerte la próxima"];
    const mapeoCupones = { "10% OFF": "RULETA10", "15% OFF": "RULETA15", "5% OFF": "RULETA5", "Envío Gratis": "FREESHIP" };

    // 1. EFECTO: Chequear si el usuario ya giró (Consultando a Redis)
    useEffect(() => {
        if (!usuarioLogueado || DEBUG_MODE) {
            setBloqueado(false);
            return;
        }

        const checkEstado = async () => {
            try {
                const res = await axios.get(`http://localhost:5286/api/Ruleta/estado/${usuarioLogueado.username}`);
                if (res.data.bloqueado) {
                    setBloqueado(true);
                    setTiempoRestante(res.data.segundosRestantes);
                }
            } catch (e) {
                console.error("Error al chequear bloqueo:", e);
            }
        };

        checkEstado();
    }, [usuarioLogueado]);

    // 2. EFECTO: Timer que descuenta segundo a segundo
    useEffect(() => {
        if (tiempoRestante <= 0) {
            if (tiempoRestante === 0 && bloqueado) setBloqueado(false);
            return;
        }

        const interval = setInterval(() => {
            setTiempoRestante(prev => prev - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [tiempoRestante, bloqueado]);

    // 3. EFECTO: Traer ganadores de Redis para el Live Feed
    useEffect(() => {
        const fetchGanadores = async () => {
            try {
                const res = await axios.get('http://localhost:5286/api/Ruleta/ganadores');
                if (res.data && res.data.length > 0) {
                    const nuevosEncontrados = [];
                    const nuevoHistorial = new Set(historialMostrados);

                    res.data.forEach(ganador => {
                        const idUnico = `${ganador.nombreUsuario}-${ganador.premio}`;
                        if (!nuevoHistorial.has(idUnico)) {
                            nuevosEncontrados.push(ganador);
                            nuevoHistorial.add(idUnico);
                        }
                    });

                    if (nuevosEncontrados.length > 0) {
                        setHistorialMostrados(nuevoHistorial);
                        setNotificacionesQueue(prev => [...prev, ...nuevosEncontrados]);
                    }
                }
            } catch (e) { console.error(e); }
        };

        fetchGanadores();
        const polling = setInterval(fetchGanadores, 8000);
        return () => clearInterval(polling);
    }, [historialMostrados]);

    // 4. EFECTO: Procesar cola de notificaciones (Badges saltarines)
    useEffect(() => {
        if (girando || notificacionesQueue.length === 0 || notificacionActual) return;

        const ganadorAMostrar = notificacionesQueue[0];
        const safeZones = [
            { bottom: '5%', right: '5%' },
            { top: '5%', right: '5%' },
            { bottom: '5%', left: '5%' }
        ];
        
        const zonaActual = safeZones[Math.floor(Math.random() * safeZones.length)];
        setBadgeStyle({ 
            top: zonaActual.top || 'auto', 
            bottom: zonaActual.bottom || 'auto', 
            left: zonaActual.left || 'auto',
            right: zonaActual.right || 'auto'
        });

        setNotificacionActual(`${ganadorAMostrar.nombreUsuario} acaba de ganar ${ganadorAMostrar.premio} 🔥`);

        setTimeout(() => {
            setNotificacionActual(null);
            setNotificacionesQueue(prev => prev.slice(1));
        }, 3500);

    }, [notificacionesQueue, girando, notificacionActual]);

    const formatearTiempo = (segundos) => {
        const h = Math.floor(segundos / 3600);
        const m = Math.floor((segundos % 3600) / 60);
        const s = segundos % 60;
        return `${h}h ${m}m ${s}s`;
    };

    const girarRuleta = () => {
        if (!usuarioLogueado) {
            Swal.fire({ icon: 'warning', title: '¡Epa!', text: 'Iniciá sesión para jugar.', confirmButtonColor: '#000' });
            return;
        }

        if (girando || premio || (bloqueado && !DEBUG_MODE)) return;

        setGirando(true);
        setCodigoCupon("");
        setNotificacionActual(null); 

        const indiceGanador = Math.floor(Math.random() * opciones.length);
        const anguloPremio = (indiceGanador * 60) + 30;
        const nuevoAngulo = anguloRotacion + 1800 + (360 - anguloPremio);
        setAnguloRotacion(nuevoAngulo);

        setTimeout(async () => {
            setGirando(false);
            const resultado = opciones[indiceGanador];
            setPremio(resultado);
            const codigoAsociado = mapeoCupones[resultado];

            if (codigoAsociado) {
                try {
                    const response = await axios.get(`http://localhost:5286/api/cupones/${codigoAsociado}`);
                    if (response.status === 200 && response.data.activo) {
                        setCodigoCupon(response.data.codigo);
                        onWinCupon(response.data.codigo);

                        // Al ganar, el backend en .NET se encarga de poner el bloqueo en Redis
                        await axios.post('http://localhost:5286/api/Ruleta/ganar', {
                            nombreUsuario: usuarioLogueado.username,
                            premio: resultado
                        });

                        if (!DEBUG_MODE) {
                            setBloqueado(true);
                            setTiempoRestante(86400); // 24hs simuladas hasta el próximo refresh
                        }
                    }
                } catch (e) { console.error(e); }
            }
        }, 3000);
    };

    return (
        <section style={styles.ruletaSection}>
            <div style={styles.container}>
                <div style={styles.textSide}>
                    <h2 style={styles.title}>RULETA DE LA SUERTE</h2>
                    <p style={styles.subtitle}>Girá y obtené un cupón de descuento para tu compra.</p>

                    {!usuarioLogueado ? (
                        <div style={styles.loginWarning}>⚠️ Iniciá sesión para poder jugar.</div>
                    ) : (
                        <div style={styles.userGreeting}>
                            Jugando como: <strong>{usuarioLogueado.username.toUpperCase()}</strong>
                        </div>
                    )}

                    {premio && (
                        <div style={styles.premioBox}>
                            {codigoCupon ? (
                                <>¡FELICITACIONES! Te ganaste un <strong>{premio}</strong>.<br />
                                Usá el código: <strong style={styles.cuponHighlight}>{codigoCupon}</strong></>
                            ) : (
                                <>¡Qué lástima! Te tocó: <strong>{premio}</strong></>
                            )}
                        </div>
                    )}

                    <button 
                        onClick={girarRuleta} 
                        style={{
                            ...styles.spinBtn, 
                            opacity: (!usuarioLogueado || girando || premio || (bloqueado && !DEBUG_MODE)) ? 0.5 : 1,
                            cursor: (!usuarioLogueado || girando || premio || (bloqueado && !DEBUG_MODE)) ? 'not-allowed' : 'pointer',
                            backgroundColor: (bloqueado && !DEBUG_MODE) ? '#333' : '#fff',
                            color: (bloqueado && !DEBUG_MODE) ? '#666' : '#000',
                            border: (bloqueado && !DEBUG_MODE) ? '1px solid #444' : 'none'
                        }} 
                        disabled={girando || premio || (bloqueado && !DEBUG_MODE)}
                    >
                        {girando ? 'GIRANDO...' : 
                         (bloqueado && !DEBUG_MODE) ? `PRÓXIMO INTENTO EN: ${formatearTiempo(tiempoRestante)}` : 
                         'PROBAR SUERTE'}
                    </button>
                </div>

                <div style={styles.wheelSide}>
                    <div style={styles.wheelWrapper}>
                        <div style={styles.pointer}></div>
                        <img 
                            src="/ruleta-sanslimit.png" 
                            alt="Ruleta" 
                            style={{
                                ...styles.wheelImage,
                                transform: `rotate(${anguloRotacion}deg)`,
                                transition: girando ? 'transform 3s cubic-bezier(0.1, 1, 0.1, 1)' : 'none'
                            }} 
                        />
                        <div style={styles.wheelCenter}><span>SLMT</span></div>
                    </div>
                </div>
            </div>

            {/* Badge de Ganadores Live */}
            <div style={{
                ...styles.fomoBadge,
                top: badgeStyle.top,
                bottom: badgeStyle.bottom,
                left: badgeStyle.left,
                right: badgeStyle.right,
                opacity: notificacionActual ? 1 : 0,
                transform: notificacionActual ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(10px)'
            }}>
                {notificacionActual}
            </div>
        </section>
    );
};

const styles = {
    ruletaSection: { backgroundColor: '#000', color: '#fff', padding: '60px 40px', margin: '40px 0', position: 'relative', overflow: 'hidden' },
    container: { maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '40px', position: 'relative', zIndex: 2 },
    textSide: { flex: 1, position: 'relative' },
    title: { fontSize: '2rem', fontWeight: '800', letterSpacing: '0.1em', marginBottom: '10px' },
    subtitle: { fontSize: '1rem', color: '#aaa', marginBottom: '20px' },
    loginWarning: { padding: '10px', width: '80%', marginBottom: '20px', backgroundColor: '#331111', border: '1px solid #ff4444', color: '#ffaaaa', borderRadius: '4px', fontSize: '0.9rem' },
    userGreeting: { padding: '10px', width: '80%', marginBottom: '20px', backgroundColor: '#113311', border: '1px solid #44ff44', color: '#aaffaa', borderRadius: '4px', fontSize: '0.9rem', letterSpacing: '0.05em' },
    spinBtn: { padding: '15px 30px', fontSize: '0.8em', fontWeight: 'bold', letterSpacing: '0.1em', transition: '0.3s', minWidth: '250px' },
    premioBox: { backgroundColor: '#111', padding: '15px', border: '1px solid #333', marginBottom: '20px', fontSize: '0.9em', letterSpacing: '0.05em', lineHeight: '1.6' },
    cuponHighlight: { color: '#00ffaa', fontSize: '1.1em', letterSpacing: '0.1em' },
    fomoBadge: { 
        position: 'absolute', backgroundColor: 'rgba(0, 255, 170, 0.15)', border: '1px solid #00ffaa', 
        color: '#00ffaa', padding: '10px 20px', borderRadius: '50px', fontSize: '0.85rem', 
        transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)', pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 10 
    },
    wheelSide: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' },
    wheelWrapper: { position: 'relative', width: '300px', height: '300px' },
    pointer: { position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', width: '0', height: '0', borderLeft: '15px solid transparent', borderRight: '15px solid transparent', borderTop: '25px solid #fff', zIndex: 10 },
    wheelImage: { width: '300px', height: '300px', borderRadius: '50%', border: '5px solid #fff' },
    wheelCenter: { position: 'absolute', width: '60px', height: '60px', backgroundColor: '#000', border: '3px solid #fff', borderRadius: '50%', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75em', fontWeight: 'bold', letterSpacing: '0.1em', zIndex: 5 }
};