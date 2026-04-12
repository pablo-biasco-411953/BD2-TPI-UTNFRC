import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export const DashboardMetricas = () => {
    const [pedidos, setPedidos] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        // Llamamos a tu API de C#
        fetch('https://localhost:7094/api/pedidos') // ⚠️ Reemplazá XXXX por tu puerto de C#
            .then(res => res.json())
            .then(data => {
                setPedidos(data);
                setCargando(false);
            })
            .catch(err => {
                console.error("Error al traer pedidos:", err);
                setCargando(false);
            });
    }, []);

    if (cargando) return <div style={{ padding: '20px', fontFamily: 'monospace' }}>CARGANDO MÉTRICAS...</div>;

    // --- 📊 PROCESAMIENTO DE DATOS PARA LAS ESTADÍSTICAS ---

    // 1. Calcular Totales Básicos
    const totalIngresos = pedidos.reduce((acc, ped) => acc + ped.total, 0);
    const totalPedidos = pedidos.length;

    // 2. Agrupar Ventas por Mes
    const ventasPorMesObj = {};
    pedidos.forEach(ped => {
        const fecha = new Date(ped.fecha);
        const mesAnio = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`; // Formato YYYY-MM

        if (!ventasPorMesObj[mesAnio]) {
            ventasPorMesObj[mesAnio] = { mes: mesAnio, total: 0, cantidad: 0 };
        }
        ventasPorMesObj[mesAnio].total += ped.total;
        ventasPorMesObj[mesAnio].cantidad += 1;
    });
    // Ordenamos los meses cronológicamente y los pasamos a Array
    const datosVentasPorMes = Object.values(ventasPorMesObj).sort((a, b) => a.mes.localeCompare(b.mes));

    // 3. Agrupar por Método de Pago
    const pagosObj = {};
    pedidos.forEach(ped => {
        const metodo = ped.metodoPago || "No especificado";
        if (!pagosObj[metodo]) pagosObj[metodo] = 0;
        pagosObj[metodo] += 1;
    });
    const datosPagos = Object.entries(pagosObj).map(([name, value]) => ({ name, value }));

    // Colores para el gráfico de torta (Estilo minimalista/streetwear)
    const COLORES = ['#000000', '#555555', '#999999', '#CCCCCC'];

    return (
        <div style={styles.dashboardContainer}>
            <h1 style={styles.titulo}>DASHBOARD DE VENTAS</h1>

            {/* 📈 Tarjetas de resumen rápido */}
            <div style={styles.cardsGrid}>
                <div style={styles.card}>
                    <span style={styles.cardLabel}>INGRESOS TOTALES</span>
                    <h2 style={styles.cardValue}>${totalIngresos.toLocaleString()}</h2>
                </div>
                <div style={styles.card}>
                    <span style={styles.cardLabel}>PEDIDOS TOTALES</span>
                    <h2 style={styles.cardValue}>{totalPedidos}</h2>
                </div>
                <div style={styles.card}>
                    <span style={styles.cardLabel}>TICKET PROMEDIO</span>
                    <h2 style={styles.cardValue}>${totalPedidos > 0 ? Math.round(totalIngresos / totalPedidos).toLocaleString() : 0}</h2>
                </div>
            </div>

            <div style={styles.chartsGrid}>
                {/* 📊 Gráfico de Barras: Ventas por Mes */}
                <div style={styles.chartCard}>
                    <h3 style={styles.chartTitulo}>INGRESOS POR MES</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={datosVentasPorMes} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                            <XAxis dataKey="mes" stroke="#000" style={{ fontSize: '0.75rem', fontFamily: 'monospace' }} />
                            <YAxis stroke="#000" style={{ fontSize: '0.75rem', fontFamily: 'monospace' }} />
                            <Tooltip contentStyle={{ fontFamily: 'monospace', border: '2px solid #000' }} />
                            <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: '0.75rem' }} />
                            <Bar dataKey="total" name="Monto Vendido ($)" fill="#000000" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* 🍕 Gráfico de Torta: Métodos de Pago */}
                <div style={styles.chartCard}>
                    <h3 style={styles.chartTitulo}>MÉTODOS DE PAGO</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={datosPagos}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                            >
                                {datosPagos.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORES[index % COLORES.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ fontFamily: 'monospace', border: '2px solid #000' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

// Estilos Neumorfistas / Streetwear alineados con la marca Sans Limit
const styles = {
    dashboardContainer: { padding: '30px', backgroundColor: '#fff', fontFamily: 'sans-serif' },
    titulo: { fontSize: '1.5rem', fontWeight: '900', letterSpacing: '0.1em', marginBottom: '30px', borderLeft: '5px solid #000', paddingLeft: '10px' },
    cardsGrid: { display: 'flex', gap: '20px', marginBottom: '40px', flexWrap: 'wrap' },
    card: { flex: 1, minWidth: '200px', border: '2px solid #000', padding: '20px', boxShadow: '5px 5px 0px 0px #000', backgroundColor: '#fff' },
    cardLabel: { fontSize: '0.7rem', fontWeight: 'bold', color: '#666', letterSpacing: '0.05em' },
    cardValue: { fontSize: '1.8rem', fontWeight: '900', marginTop: '10px', letterSpacing: '0.05em' },
    chartsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' },
    chartCard: { border: '2px solid #000', padding: '20px', boxShadow: '5px 5px 0px 0px #000', backgroundColor: '#fff' },
    chartTitulo: { fontSize: '0.9rem', fontWeight: 'bold', letterSpacing: '0.05em', marginBottom: '20px', textTransform: 'uppercase' }
};