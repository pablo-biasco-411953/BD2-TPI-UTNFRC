using Microsoft.AspNetCore.Mvc;
using StackExchange.Redis;
using System.Text.Json;

namespace SansLimt.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RuletaController : ControllerBase
    {
        private readonly IConnectionMultiplexer _redis;

        public RuletaController(IConnectionMultiplexer redis)
        {
            _redis = redis;
        }

        [HttpPost("ganar")]
        public async Task<IActionResult> RegistrarGanador([FromBody] GanadorDto dto)
        {
            var db = _redis.GetDatabase();

            // 1. Registrar en la lista de notificaciones
            var json = JsonSerializer.Serialize(dto);
            await db.ListLeftPushAsync("ruleta:ultimos_ganadores", json);
            await db.ListTrimAsync("ruleta:ultimos_ganadores", 0, 9);
            await db.KeyExpireAsync("ruleta:ultimos_ganadores", TimeSpan.FromMinutes(15));

            // 2. Bloquear al usuario por 24 horas
            // 🔥 CORREGIDO: Usamos NombreUsuario (con mayúscula)
            var lockKey = $"ruleta:bloqueo:{dto.NombreUsuario}";
            await db.StringSetAsync(lockKey, "bloqueado", TimeSpan.FromHours(24));

            return Ok(new { message = "Ganador registrado y sorteo bloqueado por 24hs" });
        }

        [HttpGet("estado/{username}")]
        public async Task<IActionResult> GetEstado(string username)
        {
            var db = _redis.GetDatabase();
            var key = $"ruleta:bloqueo:{username}";

            var timeLeft = await db.KeyTimeToLiveAsync(key);

            if (timeLeft.HasValue)
            {
                return Ok(new { bloqueado = true, segundosRestantes = (int)timeLeft.Value.TotalSeconds });
            }

            return Ok(new { bloqueado = false });
        }

        [HttpGet("ganadores")]
        public async Task<IActionResult> ObtenerGanadores()
        {
            var db = _redis.GetDatabase();
            var ganadoresJson = await db.ListRangeAsync("ruleta:ultimos_ganadores", 0, 4);

            var ganadores = ganadoresJson
            .Select(g => JsonSerializer.Deserialize<GanadorDto>(g!)) // El ! quita el warning de nulo
            .Where(g => g != null)
            .ToList();

            return Ok(ganadores);
        }
    }

    public class GanadorDto
    {
        public string NombreUsuario { get; set; } = string.Empty;
        public string Premio { get; set; } = string.Empty;
    }
}
