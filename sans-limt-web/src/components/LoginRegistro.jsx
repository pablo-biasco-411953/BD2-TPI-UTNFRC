import React, { useState } from 'react';
import Swal from 'sweetalert2';

export const LoginRegistro = ({ onLoginSuccess }) => {
    const [esRegistro, setEsRegistro] = useState(false);
    const [loginData, setLoginData] = useState({ username: '', password: '' });

    const [registroData, setRegistroData] = useState({
        Username: '', Password: '', Email: '', NombreCompleto: '', Telefono: '',
        Direccion: { Calle: '', Ciudad: '', CodigoPostal: '' }
    });

    const handleLoginChange = (e) => {
        setLoginData({ ...loginData, [e.target.name]: e.target.value });
    };

    const handleRegistroChange = (e) => {
        const { name, value } = e.target;
        if (['Calle', 'Ciudad', 'CodigoPostal'].includes(name)) {
            setRegistroData({
                ...registroData,
                Direccion: { ...registroData.Direccion, [name]: value }
            });
        } else {
            setRegistroData({ ...registroData, [name]: value });
        }
    };

    // Envío del Login
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        
        // 🔥 INICIA SPINNER DE CARGA
        Swal.fire({
            title: 'Iniciando sesión...',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        try {
            const response = await fetch('https://localhost:7094/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginData)
            });

            const data = await response.json();
            Swal.close(); // Cerramos el spinner

            if (response.ok) {
                // 🔥 BANNER DE BIENVENIDA
                Swal.fire({
                    icon: 'success',
                    title: `¡BIENVENIDO DE NUEVO ${data.username.toUpperCase()}!`,
                    text: 'Acceso concedido.',
                    confirmButtonColor: '#000',
                    timer: 2000,
                    showConfirmButton: false
                });

                if (onLoginSuccess) onLoginSuccess(data);
            } else {
                // 🔥 BANNER ERROR DE CREDENCIALES
                Swal.fire({
                    icon: 'error',
                    title: 'ERROR DE ACCESO',
                    text: data.message || 'Credenciales incorrectas.',
                    confirmButtonColor: '#000'
                });
            }
        } catch (error) {
            Swal.close();
            console.error(error);
            Swal.fire({
                icon: 'error',
                title: 'ERROR DE SERVIDOR',
                text: 'No se pudo conectar con el servidor.',
                confirmButtonColor: '#000'
            });
        }
    };

    // Envío del Registro
    const handleRegistroSubmit = async (e) => {
        e.preventDefault();

        Swal.fire({
            title: 'Creando cuenta...',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        try {
            const response = await fetch('https://localhost:7094/api/auth/registrar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(registroData)
            });

            const data = await response.json();
            Swal.close();

            if (response.ok) {
                // 🔥 BANNER DE REGISTRO EXITOSO
                Swal.fire({
                    icon: 'success',
                    title: '¡CUENTA CREADA!',
                    text: 'Ya podés iniciar sesión con tus datos.',
                    confirmButtonColor: '#000'
                });
                setEsRegistro(false);
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'ERROR EN REGISTRO',
                    text: data.message || 'No se pudo crear la cuenta.',
                    confirmButtonColor: '#000'
                });
            }
        } catch (error) {
            Swal.close();
            console.error(error);
            Swal.fire({
                icon: 'error',
                title: 'ERROR DE SERVIDOR',
                text: 'No se pudo conectar con el servidor.',
                confirmButtonColor: '#000'
            });
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.tabs}>
                    <button
                        style={{ ...styles.tabBtn, borderBottom: !esRegistro ? '2px solid #000' : 'none', fontWeight: !esRegistro ? 'bold' : 'normal' }}
                        onClick={() => setEsRegistro(false)}
                    >
                        INICIAR SESIÓN
                    </button>
                    <button
                        style={{ ...styles.tabBtn, borderBottom: esRegistro ? '2px solid #000' : 'none', fontWeight: esRegistro ? 'bold' : 'normal' }}
                        onClick={() => setEsRegistro(true)}
                    >
                        REGISTRARSE
                    </button>
                </div>

                {!esRegistro ? (
                    <form style={styles.form} onSubmit={handleLoginSubmit}>
                        <h2 style={styles.formTitle}>SANS LIMIT / ACCESO</h2>
                        <input type="text" name="username" placeholder="Usuario" style={styles.input} onChange={handleLoginChange} required />
                        <input type="password" name="password" placeholder="Contraseña" style={styles.input} onChange={handleLoginChange} required />
                        <button type="submit" style={styles.submitBtn}>ENTRAR</button>
                    </form>
                ) : (
                    <form style={styles.form} onSubmit={handleRegistroSubmit}>
                        <h2 style={styles.formTitle}>CREAR CUENTA CLIENTE</h2>

                        <div style={styles.row}>
                            <input type="text" name="Username" placeholder="Usuario para loguearte" style={styles.input} onChange={handleRegistroChange} required />
                            <input type="password" name="Password" placeholder="Contraseña" style={styles.input} onChange={handleRegistroChange} required />
                        </div>

                        <div style={styles.row}>
                            <input type="email" name="Email" placeholder="Correo Electrónico" style={styles.input} onChange={handleRegistroChange} required />
                            <input type="text" name="NombreCompleto" placeholder="Nombre Completo" style={styles.input} onChange={handleRegistroChange} required />
                        </div>

                        <input type="text" name="Telefono" placeholder="Teléfono" style={styles.input} onChange={handleRegistroChange} required />

                        <p style={styles.sectionLabel}>DIRECCIÓN DE ENVÍO</p>
                        <input type="text" name="Calle" placeholder="Calle y Altura" style={styles.input} onChange={handleRegistroChange} required />
                        <div style={styles.row}>
                            <input type="text" name="Ciudad" placeholder="Ciudad" style={styles.input} onChange={handleRegistroChange} required />
                            <input type="text" name="CodigoPostal" placeholder="Cód. Postal" style={styles.input} onChange={handleRegistroChange} required />
                        </div>

                        <button type="submit" style={styles.submitBtn}>CREAR CUENTA</button>
                    </form>
                )}
            </div>
        </div>
    );
};

const styles = {
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', backgroundColor: '#fff', padding: '20px' },
    card: { width: '500px', border: '2px solid #000', backgroundColor: '#fff', boxShadow: '10px 10px 0px 0px #000', padding: '30px' },
    tabs: { display: 'flex', borderBottom: '1px solid #ddd', marginBottom: '20px' },
    tabBtn: { flex: 1, padding: '10px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', letterSpacing: '0.1em' },
    form: { display: 'flex', flexDirection: 'column' },
    formTitle: { fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '20px', letterSpacing: '0.05em' },
    row: { display: 'flex', gap: '15px' },
    input: { padding: '12px', border: '1px solid #000', marginBottom: '15px', fontSize: '0.85rem', width: '100%', boxSizing: 'border-box' },
    sectionLabel: { fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.05em', marginBottom: '10px', color: '#555' },
    submitBtn: { backgroundColor: '#000', color: '#fff', border: 'none', padding: '15px', fontWeight: 'bold', letterSpacing: '0.1em', cursor: 'pointer', transition: '0.3s', marginTop: '10px' }
};

export default LoginRegistro;