using Microsoft.AspNetCore.Mvc;
using StackExchange.Redis;
using MongoDB.Driver;
using SansLimt.Api.Models;
using System;
using System.Linq;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SansLimt.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SocialController : ControllerBase
    {
        private readonly IConnectionMultiplexer _redis;
        private readonly IMongoCollection<Producto> _productosCollection;

        public SocialController(IConnectionMultiplexer redis, IMongoClient mongoClient)
        {
            _redis = redis;
            var database = mongoClient.GetDatabase("SansLimitDB");
            _productosCollection = database.GetCollection<Producto>("Productos");
        }

        [HttpPost("actividad")]
        public async Task<IActionResult> RegistrarActividad([FromBody] ActividadDto dto)
        {
            var db = _redis.GetDatabase();
            var mensaje = $"{dto.NombreUsuario.ToUpper()} acaba de añadir {dto.NombreProducto.ToUpper()} al carrito 🔥";

            await db.ListLeftPushAsync("social:actividad_reciente", mensaje);
            await db.ListTrimAsync("social:actividad_reciente", 0, 4);
            await db.KeyExpireAsync("social:actividad_reciente", TimeSpan.FromMinutes(10));

            return Ok(new { success = true, mensaje });
        }

        [HttpGet("actividad")]
        public async Task<IActionResult> ObtenerActividad()
        {
            var db = _redis.GetDatabase();
            var actividadesRaw = await db.ListRangeAsync("social:actividad_reciente", 0, -1);
            var actividades = actividadesRaw.Select(x => x.ToString()).ToList();
            return Ok(actividades);
        }

        [HttpPost("viewing/{productoId}/{usuarioId}")]
        public async Task<IActionResult> PingViewing(string productoId, string usuarioId)
        {
            var db = _redis.GetDatabase();
            string key = $"viewing:{productoId}:{usuarioId}";
            await db.StringSetAsync(key, "1", TimeSpan.FromSeconds(10));

            var server = _redis.GetServer(_redis.GetEndPoints().First());
            var pattern = $"viewing:{productoId}:*";
            var llavesVivas = server.Keys(pattern: pattern).ToList();

            return Ok(new { count = llavesVivas.Count });
        }

        [HttpGet("sugerencias")]
        public async Task<IActionResult> GetSugerencias([FromQuery] string productoId, [FromQuery] string? categoria = null)
        {
            if (string.IsNullOrEmpty(productoId))
                return BadRequest(new { message = "El productoId es obligatorio" });

            var dbRedis = _redis.GetDatabase();

            var relacionadosRedis = await dbRedis.SortedSetRangeByRankWithScoresAsync(
                $"relacion:{productoId}", 0, 2, Order.Descending);

            if (relacionadosRedis.Length > 0)
            {
                var ids = relacionadosRedis.Select(r => r.Element.ToString()).ToList();
                return Ok(new { fuente = "Redis (Popularidad)", ids });
            }

            FilterDefinition<Producto> filter;
            if (!string.IsNullOrEmpty(categoria))
            {
                filter = Builders<Producto>.Filter.And(
                    Builders<Producto>.Filter.Ne(p => p.Id, productoId),
                                                       Builders<Producto>.Filter.Eq(p => p.Categoria, categoria),
                                                       Builders<Producto>.Filter.Eq(p => p.Active, true)
                );
            }
            else
            {
                filter = Builders<Producto>.Filter.And(
                    Builders<Producto>.Filter.Ne(p => p.Id, productoId),
                                                       Builders<Producto>.Filter.Eq(p => p.Active, true)
                );
            }

            var sugeridosMongo = await _productosCollection.Find(filter).Limit(3).ToListAsync();
            var idsMongo = sugeridosMongo.Select(p => p.Id).ToList();
            return Ok(new { fuente = "MongoDB (Similitud)", ids = idsMongo });
        }

        [HttpPost("registrar-interes")]
        public async Task<IActionResult> RegistrarInteres([FromBody] InteresDto dto)
        {
            var db = _redis.GetDatabase();
            // Guardamos en Redis: "preferencia:pablo@gmail.com" -> "Oversize"
            await db.StringSetAsync($"preferencia:{dto.Email}", dto.Categoria);
            return Ok();
        }

        public class InteresDto {
            public string Email { get; set; }
            public string Categoria { get; set; }
        }

        [HttpPost("registrar-compra/{username}")]
        public async Task<IActionResult> RegistrarCompra(string username, [FromBody] List<string> productoIds)
        {
            if (productoIds == null || productoIds.Count == 0) return BadRequest();

            var db = _redis.GetDatabase();

            // 🔥 1. Guardamos el último producto comprado para recomendaciones futuras del usuario
            // Usamos el primer ID de la lista como referencia principal de interés
            await db.StringSetAsync($"usuario:{username}:ultimo_comprado", productoIds[0], TimeSpan.FromDays(30));

            // 2. Si compró más de uno, creamos relaciones cruzadas en Redis
            if (productoIds.Count >= 2)
            {
                for (int i = 0; i < productoIds.Count; i++)
                {
                    for (int j = i + 1; j < productoIds.Count; j++)
                    {
                        string idA = productoIds[i];
                        string idB = productoIds[j];
                        await db.SortedSetIncrementAsync($"relacion:{idA}", idB, 1);
                        await db.SortedSetIncrementAsync($"relacion:{idB}", idA, 1);
                    }
                }
            }

            return Ok(new { success = true });
        }

        [HttpGet("recomendaciones-usuario/{username}")]
        public async Task<IActionResult> GetRecomendacionesUsuario(string username)
        {
            var db = _redis.GetDatabase();
            var ultimoId = await db.StringGetAsync($"usuario:{username}:ultimo_comprado");

            if (ultimoId.IsNullOrEmpty) return Ok(new { ids = new List<string>() });

            // Buscamos en Redis qué productos tienen más afinidad con lo último que compró Pablo
            var sugeridos = await db.SortedSetRangeByRankAsync($"relacion:{ultimoId}", 0, 5, Order.Descending);

            return Ok(new { ids = sugeridos.Select(s => s.ToString()).ToList() });
        }
    } // Cierre de Clase

    public class ActividadDto
    {
        public string NombreUsuario { get; set; } = string.Empty;
        public string NombreProducto { get; set; } = string.Empty;
    }
} // Cierre de Namespace
