import React, { useEffect, useState } from 'react';
import OrderSummary from './OrderSummary';

export default function CheckoutPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  // Example values: in a real app get these from cart state
  const exampleSubtotal = 120.50;
  const exampleShipping = 10.00;

  useEffect(() => {
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchSummary() {
    setLoading(true);
    try {
      const query = `?subtotal=${encodeURIComponent(exampleSubtotal)}&shipping=${encodeURIComponent(exampleShipping)}`;
      const res = await fetch(`/api/checkout${query}`, { credentials: 'include' });
      if (!res.ok) throw new Error('network');
      const data = await res.json();
      setSummary(data);
    } catch (err) {
      console.error('fetch checkout failed', err);
      // fallback local calculation
      setSummary({
        subtotal: exampleSubtotal,
        descuento_aplicado: 0,
        costo_envio: exampleShipping,
        total_final: exampleSubtotal + exampleShipping,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Pago</h2>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600">Método de pago y formulario aquí.</p>
            <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md">Pagar ahora</button>
          </div>
        </div>

        <div>
          {loading && <div className="text-gray-500">Cargando resumen...</div>}
          {!loading && summary && (
            <OrderSummary
              subtotal={summary.subtotal}
              descuento_aplicado={summary.descuento_aplicado}
              costo_envio={summary.costo_envio}
              total_final={summary.total_final}
            />
          )}
        </div>
      </div>
    </div>
  );
}
