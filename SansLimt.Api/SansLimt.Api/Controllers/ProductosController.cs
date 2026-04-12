using Microsoft.AspNetCore.Mvc;
using SansLimt.Api.Models;
using SansLimt.Api.Services;
using StackExchange.Redis;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SansLimt.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductosController : ControllerBase
    {
        private readonly ProductosService _productosService;
        private readonly IConnectionMultiplexer _redis;

        public ProductosController(ProductosService productosService, IConnectionMultiplexer redis)
        {
            _productosService = productosService;
            _redis = redis;
        }

        // --- ÚNICO MÉTODO GET (Trae, Resta Stock y Ordena) ---
        [HttpGet]
        public async Task<ActionResult<List<Producto>>> Get([FromQuery] string? userEmail)
        {
            // 1. Traer de MongoDB
            var lista = await _productosService.GetAsync();
            var db = _redis.GetDatabase();
            var server = _redis.GetServer(_redis.GetEndPoints().First());

            // 2. Lógica de Stock (Restar reservas de Redis)
            foreach (var p in lista)
            {
                // Stock Simple
                if (p.Stock.HasValue)
                {
                    var keys = server.Keys(pattern: $"reserva:{p.Id}:unico:*").ToList();
                    int res = keys.Sum(k => (int?)db.StringGet(k) ?? 0);
                    p.Stock -= res;
                }

                // Variantes (Ropa)
                if (p.Variantes != null)
                {
                    foreach (var v in p.Variantes)
                    {
                        var keysV = server.Keys(pattern: $"reserva:{p.Id}:{v.Talle}:*").ToList();
                        int resV = keysV.Sum(k => (int?)db.StringGet(k) ?? 0);
                        v.Stock -= resV;
                    }
                }
            }

            // 3. Lógica de Recomendaciones (Ordenar por interés en Redis)
            if (!string.IsNullOrEmpty(userEmail))
            {
                var favCat = await db.StringGetAsync($"preferencia:{userEmail}");
                if (favCat.HasValue)
                {
                    string categoriaFavorita = favCat.ToString();

                    // Marcamos los sugeridos para el Badge del Front
                    foreach (var p in lista.Where(x => x.Categoria == categoriaFavorita))
                    {
                        p.EsSugerido = true;
                    }

                    // Reordenamos la lista: favoritos arriba
                    lista = lista
                    .OrderByDescending(x => x.Categoria == categoriaFavorita)
                    .ThenBy(x => x.Nombre)
                    .ToList();
                }
            }

            return Ok(lista);
        }

        // --- GET POR ID (Sigue siendo único porque recibe un parámetro string) ---
        [HttpGet("{id:length(24)}")]
        public async Task<ActionResult<Producto>> GetById(string id)
        {
            var producto = await _productosService.GetAsync(id);
            if (producto is null) return NotFound();
            return Ok(producto);
        }

        [HttpPost]
        public async Task<IActionResult> Post(Producto nuevoProducto)
        {
            nuevoProducto.Id = null;
            await _productosService.CreateAsync(nuevoProducto);
            return CreatedAtAction(nameof(Get), new { id = nuevoProducto.Id }, nuevoProducto);
        }

        [HttpDelete("{id:length(24)}")]
        public async Task<IActionResult> Delete(string id)
        {
            var p = await _productosService.GetAsync(id);
            if (p is null) return NotFound();
            await _productosService.RemoveAsync(id);
            return NoContent();
        }
    }
}
