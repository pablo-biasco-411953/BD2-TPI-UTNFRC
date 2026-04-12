using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using StackExchange.Redis;
using SansLimt.Api.Models;
using SansLimt.Api.Services;

namespace SansLimt.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PedidosController : ControllerBase
    {
        private readonly PedidosService _pedidosService;
        private readonly IMongoCollection<Producto> _productosCollection;
        private readonly IDatabase _redis;

        public PedidosController(PedidosService pedidosService, IMongoDatabase database, IConnectionMultiplexer redis)
        {
            _pedidosService = pedidosService;
            _productosCollection = database.GetCollection<Producto>("Productos");
            _redis = redis.GetDatabase();
        }


        [HttpPost("liberar")]
        public async Task<IActionResult> LiberarStock([FromBody] ReservaDto reserva)
        {
            var db = _redis; // Tu inyección de IConnectionMultiplexer
            string talleKey = string.IsNullOrEmpty(reserva.Talle) ? "unico" : reserva.Talle;
            string key = $"reserva:{reserva.ProductoId}:{talleKey}:{reserva.Usuario}";

            // Le restamos a Redis la cantidad que el usuario eliminó del carrito
            var cantidadRestante = await db.StringDecrementAsync(key, reserva.Cantidad);

            // Si la cantidad llega a 0 (o menos), borramos la llave para limpiar la memoria
            if (cantidadRestante <= 0) {
                await db.KeyDeleteAsync(key);
            }

            return Ok(new { success = true, message = "Stock liberado en Redis" });
        }

        [HttpPost("reservar")]
        public async Task<IActionResult> ReservarStock([FromBody] ReservaDto reserva)
        {
            var db = _redis; // Usamos la DB de Redis inyectada
            string talleKey = string.IsNullOrEmpty(reserva.Talle) ? "unico" : reserva.Talle;

            // 1. Buscamos el producto en MONGODB para saber el stock real original
            var producto = await _productosCollection.Find(p => p.Id == reserva.ProductoId).FirstOrDefaultAsync();
            if (producto == null) return NotFound("Producto no encontrado.");

            int stockReal = 0;
            if (producto.Variantes != null && talleKey != "unico") {
                var variante = producto.Variantes.FirstOrDefault(v => v.Talle == talleKey);
                if (variante != null) stockReal = variante.Stock;
            } else {
                stockReal = producto.Stock ?? 0;
            }

            // 2. Contamos cuántas reservas YA EXISTEN en Redis para este producto y talle
            var server = _redis.Multiplexer.GetServer(_redis.Multiplexer.GetEndPoints().First());
            var patternBusqueda = $"reserva:{reserva.ProductoId}:{talleKey}:*";
            var llaves = server.Keys(pattern: patternBusqueda).ToList();

            int totalReservado = 0;
            foreach (var k in llaves) {
                var val = await db.StringGetAsync(k);
                if (val.HasValue) totalReservado += (int)val;
            }

            // 3. VALIDACIÓN: ¿Hay lugar para esta nueva reserva?
            if ((stockReal - totalReservado) < reserva.Cantidad) {
                return BadRequest(new { success = false, message = "Sin stock disponible por el momento." });
            }

            // 4. GUARDAR RESERVA
            // Usamos el usuario en la key para que cada uno tenga su propio timer/reserva
            string key = $"reserva:{reserva.ProductoId}:{talleKey}:{reserva.Usuario}";

            // Incrementamos la cantidad reservada
            await db.StringIncrementAsync(key, reserva.Cantidad);

            // Seteamos el TTL (Tiempo de vida) de 15 minutos
            await db.KeyExpireAsync(key, TimeSpan.FromMinutes(15));

            // 5. RESPUESTA
            // Devolvemos el tiempo de expiración para que el Frontend setee el Timer
            var tiempoExpiracion = DateTime.UtcNow.AddMinutes(15);

            return Ok(new {
                success = true,
                key = key,
                expiresAt = tiempoExpiracion,
                message = "Stock reservado por 15 minutos"
            });
        }
    }
    public class ReservaDto {
        public string ProductoId { get; set; } = null!;
        public string? Talle { get; set; }
        public string Usuario { get; set; } = null!;
        public int Cantidad { get; set; }
    }
}
