using Microsoft.AspNetCore.Mvc;
using SansLimt.Api.Models;
using SansLimt.Api.Services;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SansLimt.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PedidosController : ControllerBase
    {
        private readonly PedidosService _pedidosService;

        public PedidosController(PedidosService pedidosService)
        {
            _pedidosService = pedidosService;
        }

        
        [HttpGet]
        public async Task<ActionResult<List<Pedido>>> Get()
        {
            var pedidos = await _pedidosService.GetAsync();
            return Ok(pedidos);
        }

       
        [HttpPost]
        public async Task<IActionResult> Post(Pedido nuevoPedido)
        {
            nuevoPedido.Id = null;
            nuevoPedido.Fecha = DateTime.UtcNow; // guardamos la fecha exacta

            await _pedidosService.CreateAsync(nuevoPedido);
            return CreatedAtAction(nameof(Get), new { id = nuevoPedido.Id }, nuevoPedido);
        }

       
        [HttpPut("{id:length(24)}")]
        public async Task<IActionResult> Update(string id, Pedido pedidoActualizado)
        {
            var pedido = await _pedidosService.GetAsync(id);

            if (pedido is null) return NotFound();

            pedidoActualizado.Id = pedido.Id;
            await _pedidosService.UpdateAsync(id, pedidoActualizado);

            return NoContent();
        }

        
        [HttpPost("generar-ficticios")]
        public async Task<IActionResult> GenerarPedidosFicticios()
        {
            var random = new Random();

            
            var nombres = new[] { "Juan Pérez", "Marta Gómez", "Lucas Rodríguez", "Sofía Clear", "Bautista Silva", "Mateo Romero" };
            var emails = new[] { "juan@test.com", "marta@test.com", "lucas@test.com", "sofia@test.com", "bauti@test.com", "mateo@test.com" };
            var metodosPago = new[] { "MercadoPago", "Transferencia", "Efectivo" };
            var estados = new[] { "Entregado", "Entregado", "Entregado", "Enviado", "Pendiente" }; 

          
            var productosDisponibles = new[]
            {
            new { Id = "65f1a2b3c4d5e6f7a8b9c001", Nombre = "Remera Oversize Black", Precio = 25000, Talles = new[] { "S", "M", "L", "XL" } },
            new { Id = "65f1a2b3c4d5e6f7a8b9c002", Nombre = "Hoodie Sans Limit", Precio = 45000, Talles = new[] { "M", "L", "XL" } },
            new { Id = "65f1a2b3c4d5e6f7a8b9c003", Nombre = "Perfume SLMT 100ml", Precio = 30000, Talles = new string[] { } }, 
            new { Id = "65f1a2b3c4d5e6f7a8b9c004", Nombre = "Gorra Trucker SL", Precio = 15000, Talles = new[] { "Único" } },
            new { Id = "65f1a2b3c4d5e6f7a8b9c005", Nombre = "Pantalon Cargo Dark", Precio = 55000, Talles = new[] { "40", "42", "44" } }
    };

            var pedidosSimulados = new List<Pedido>();

            
            for (int i = 0; i < 50; i++)
            {
                int clienteIndex = random.Next(nombres.Length);

                
                var fechaAleatoria = DateTime.UtcNow.AddDays(-random.Next(1, 120));

                var itemsDelPedido = new List<ItemPedido>();
                int cantidadProductos = random.Next(1, 4); 
                int subtotal = 0;

                for (int j = 0; j < cantidadProductos; j++)
                {
                    var prodRandom = productosDisponibles[random.Next(productosDisponibles.Length)];
                    int cant = random.Next(1, 3); 

                    string? talle = prodRandom.Talles.Length > 0
                        ? prodRandom.Talles[random.Next(prodRandom.Talles.Length)]
                        : null;

                    itemsDelPedido.Add(new ItemPedido
                    {
                        IdProducto = prodRandom.Id,
                        Nombre = prodRandom.Nombre,
                        VarianteSeleccionada = talle,
                        Cantidad = cant,
                        PrecioUnitario = prodRandom.Precio
                    });

                    subtotal += prodRandom.Precio * cant;
                }

                
                CuponAplicado? cupon = null;
                int total = subtotal;
                if (random.Next(1, 10) > 8)
                {
                    int descuento = (int)(subtotal * 0.15); 
                    cupon = new CuponAplicado { Codigo = "OFF15", DescuentoAplicado = descuento };
                    total -= descuento;
                }

                var nuevoPedido = new Pedido
                {
                    EsInvitado = true,
                    IdUsuario = null,
                    DatosCliente = new Cliente
                    {
                        Nombre = nombres[clienteIndex],
                        Email = emails[clienteIndex],
                        Telefono = "11" + random.Next(11111111, 99999999)
                    },
                    Items = itemsDelPedido,
                    Subtotal = subtotal,
                    CuponAplicado = cupon,
                    Total = total,
                    MetodoPago = metodosPago[random.Next(metodosPago.Length)],
                    Estado = estados[random.Next(estados.Length)],
                    Fecha = fechaAleatoria
                };

                pedidosSimulados.Add(nuevoPedido);
            }

            // Guardamos todos los pedidos generados en MongoDB
            foreach (var ped in pedidosSimulados)
            {
                await _pedidosService.CreateAsync(ped);
            }

            return Ok(new { mensaje = "¡Se crearon 50 pedidos ficticios con éxito para tus estadísticas!" });
        }
    }
}