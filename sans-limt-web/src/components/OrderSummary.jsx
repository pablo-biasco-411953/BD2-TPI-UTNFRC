import React from 'react';

export default function OrderSummary({ subtotal = 0, descuento_aplicado = 0, costo_envio = 0, total_final = 0 }) {
  const parse = (v) => {
    if (typeof v === 'number') return v;
    const n = Number(String(v).replace(/[^0-9.-]+/g, ''));
    return Number.isFinite(n) ? n : 0;
  };

  const sub = parse(subtotal);
  const discount = parse(descuento_aplicado);
  const shipping = parse(costo_envio);
  const total = parse(total_final);

  const format = (n) => '$' + n.toFixed(2);

  return (
    <div className="bg-gray-900 text-white p-6 rounded-xl shadow-lg max-w-md mx-auto">
      <h3 className="text-xl font-semibold mb-4">Resumen de Orden</h3>

      <div className="flex justify-between mb-2">
        <span className="text-sm text-gray-300">Subtotal</span>
        <span className="text-sm">{format(sub)}</span>
      </div>

      {discount > 0 && (
        <div className="flex justify-between mb-2">
          <span className="text-sm text-green-400">Descuento por Premio</span>
          <span className="text-sm text-green-400">-{format(discount)}</span>
        </div>
      )}

      <div className="flex justify-between mb-2">
        <span className="text-sm text-gray-300">Delivery</span>
        <div>
          {shipping === 0 ? (
            <span className="text-sm text-green-400 font-semibold">GRATIS</span>
          ) : (
            <span className="text-sm">{format(shipping)}</span>
          )}
        </div>
      </div>

      <div className="border-t border-gray-700 mt-4 pt-4 flex justify-between items-center">
        <span className="text-lg font-bold">Total</span>
        <span className="text-xl font-extrabold">{format(total)}</span>
      </div>
    </div>
  );
}
