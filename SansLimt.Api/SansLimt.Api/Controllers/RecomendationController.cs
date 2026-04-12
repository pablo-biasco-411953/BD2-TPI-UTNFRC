using Microsoft.AspNetCore.Mvc;
using SansLimt.Api.Services;
using SansLimt.Api.Models;

namespace SansLimt.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RecommendationController : ControllerBase
    {
        private readonly RecommendationService _recommendationService;

        // Inyectamos nuestro servicio épico
        public RecommendationController(RecommendationService recommendationService)
        {
            _recommendationService = recommendationService;
        }

        /// <summary>
        /// Endpoint oculto/admin para entrenar a Redis leyendo el historial de Mongo.
        /// En producción, esto podría correr como un proceso en segundo plano (BackgroundService) o CRON job.
        /// </summary>
        [HttpPost("train")]
        public async Task<IActionResult> TrainRecommendationEngine()
        {
            try
            {
                await _recommendationService.EntrenarMotorRecomendacionesAsync();
                return Ok(new { message = "¡Motor de recomendaciones entrenado con éxito! Redis ya tiene las asociaciones en memoria." });
            }
            catch (Exception ex)
            {
                // En un proyecto real, acá loguearíamos el error
                return StatusCode(500, new { message = "Error al entrenar el motor.", detail = ex.Message });
            }
        }

        /// <summary>
        /// El endpoint de ultra baja latencia que consume React.
        /// Dado un ID de producto, devuelve los 3 productos más comprados junto a él.
        /// </summary>
        /// <param name="idProducto">El ID de Mongo (ej: 65f1a2b3c4d5e6f7a8b9c004)</param>
        [HttpGet("{idProducto}")]
        public async Task<ActionResult<List<Producto>>> GetRecommendations(string idProducto)
        {
            try
            {
                // Buscamos el top 3 de productos afines
                var recomendaciones = await _recommendationService.ObtenerRecomendacionesParaCarritoAsync(idProducto, 3);

                return Ok(recomendaciones);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener recomendaciones.", detail = ex.Message });
            }
        }
    }
}