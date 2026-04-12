import React, { useState } from 'react';
import axios from 'axios';

export const Ruleta = ({ onWinCupon }) => {
    const [girando, setGirando] = useState(false);
    const [premio, setPremio] = useState(null);
    const [anguloRotacion, setAnguloRotacion] = useState(0);
    const [codigoCupon, setCodigoCupon] = useState("");

    // Opciones en orden (Mismo orden que la imagen)
    const opciones = [
        "10% OFF",
        "Sigue Participando",
        "15% OFF",
        "Envío Gratis",
        "5% OFF",
        "Suerte la próxima"
    ];

    // Mapeamos los premios con los cupones reales que creamos en tu base de datos
    const mapeoCupones = {
        "10% OFF": "RULETA10",
        "15% OFF": "RULETA15",
        "5% OFF": "RULETA5",
        "Envío Gratis": "FREESHIP"
    };

    const girarRuleta = () => {
        if (girando || premio) return;

        setGirando(true);
        setCodigoCupon("");

        const indiceGanador = Math.floor(Math.random() * opciones.length);
        const gradosPorcion = 60;
        const anguloPremio = (indiceGanador * gradosPorcion) + 30;

        const nuevoAngulo = anguloRotacion + 1800 + (360 - anguloPremio);
        setAnguloRotacion(nuevoAngulo);

        // Esperamos los 3 segundos de animación para mostrar el resultado y llamar a la API
        setTimeout(async () => {
            setGirando(false);
            const resultado = opciones[indiceGanador];
            setPremio(resultado);

            const codigoAsociado = mapeoCupones[resultado];
            if (codigoAsociado) {
                try {
                    const response = await axios.get(`https://localhost:7094/api/cupones/${codigoAsociado}`);

                    if (response.status === 200 && response.data.activo) {
                        setCodigoCupon(response.data.codigo);
                        onWinCupon(response.data.codigo); // <-- LE AVISAMOS A APP
                    }
                } catch (error) {
                    console.error("Error validando el cupón en la API:", error);
                    setCodigoCupon(codigoAsociado);
                    onWinCupon(codigoAsociado); // <-- LE AVISAMOS A APP AUNQUE FALLE
                }
            }
        }, 3000);
    };

    return (
        <section style={styles.ruletaSection}>
            <div style={styles.container}>
                <div style={styles.textSide}>
                    <h2 style={styles.title}>RULETA DE LA SUERTE</h2>
                    <p style={styles.subtitle}>Girá y obtené un cupón de descuento para tu compra.</p>

                    {premio && (
                        <div style={styles.premioBox}>
                            {codigoCupon ? (
                                <>
                                    ¡FELICITACIONES! Te ganaste un <strong>{premio}</strong>.<br />
                                    Usá el código: <strong style={styles.cuponHighlight}>{codigoCupon}</strong>
                                </>
                            ) : (
                                premio.includes("OFF") || premio.includes("Gratis") ? (
                                    <>¡FELICITACIONES! Te ganaste un <strong>{premio}</strong>.</>
                                ) : (
                                    <>¡Qué lástima! Te tocó: <strong>{premio}</strong></>
                                )
                            )}
                        </div>
                    )}

                    <button
                        onClick={girarRuleta}
                        style={styles.spinBtn}
                        disabled={girando || premio}
                    >
                        {girando ? 'GIRANDO...' : 'PROBAR SUERTE'}
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

                        <div style={styles.wheelCenter}>
                            <span>SLMT</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const styles = {
    ruletaSection: { backgroundColor: '#000', color: '#fff', padding: '60px 40px', margin: '40px 0' },
    container: { maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '40px' },
    textSide: { flex: 1 },
    title: { fontSize: '2rem', fontWeight: '800', letterSpacing: '0.1em', marginBottom: '10px' },
    subtitle: { fontSize: '1rem', color: '#aaa', marginBottom: '30px' },
    spinBtn: { background: '#fff', color: '#000', border: 'none', padding: '15px 30px', fontSize: '0.8em', fontWeight: 'bold', letterSpacing: '0.1em', cursor: 'pointer' },
    premioBox: { backgroundColor: '#111', padding: '15px', border: '1px solid #333', marginBottom: '20px', fontSize: '0.9em', letterSpacing: '0.05em', lineHeight: '1.6' },
    cuponHighlight: { color: '#00ffaa', fontSize: '1.1em', letterSpacing: '0.1em' }, // Color llamativo para el código
    wheelSide: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' },
    wheelWrapper: { position: 'relative', width: '300px', height: '300px' },
    pointer: { position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', width: '0', height: '0', borderLeft: '15px solid transparent', borderRight: '15px solid transparent', borderTop: '25px solid #fff', zIndex: 10 },
    wheelImage: { width: '300px', height: '300px', borderRadius: '50%', border: '5px solid #fff' },
    wheelCenter: { position: 'absolute', width: '60px', height: '60px', backgroundColor: '#000', border: '3px solid #fff', borderRadius: '50%', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75em', fontWeight: 'bold', letterSpacing: '0.1em', zIndex: 5 }
};