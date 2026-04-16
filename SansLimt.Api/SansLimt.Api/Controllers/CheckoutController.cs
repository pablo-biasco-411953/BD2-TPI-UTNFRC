using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace YourProject.Controllers
{
    public class CheckoutController : Controller
    {
        private readonly IDistributedCache _cache;
        private readonly ILogger<CheckoutController> _logger;

        public CheckoutController(IDistributedCache cache, ILogger<CheckoutController> logger)
        {
            _cache = cache;
            _logger = logger;
        }

        // Acción para retornar la Vista (MVC)
        [HttpGet("/checkout")]
        public async Task<IActionResult> Checkout([FromQuery] decimal subtotal, [FromQuery] decimal shipping = 5.00m)
        {
            var summary = await ComputeSummary(subtotal, shipping);

            ViewBag.Subtotal = summary.Subtotal;
            ViewBag.DescuentoAplicado = summary.DescuentoAplicado;
            ViewBag.CostoEnvio = summary.CostoEnvio;
            ViewBag.TotalFinal = summary.TotalFinal;

            return View("Checkout"); // Asegurate de tener el archivo Checkout.cshtml
        }

        // Endpoint tipo API
        [HttpGet("/api/checkout")]
        [Produces("application/json")]
        public async Task<ActionResult<CheckoutSummary>> ApiCheckout([FromQuery] decimal subtotal, [FromQuery] decimal shipping = 5.00m)
        {
            return await ComputeSummary(subtotal, shipping);
        }

        private async Task<CheckoutSummary> ComputeSummary(decimal subtotal, decimal shippingCost)
        {
            decimal descuentoAplicado = 0;

            // En .NET, el usuario se saca del HttpContext
            var userId = User.Identity?.IsAuthenticated == true ? User.Identity.Name : "anonymous";
            var key = $"premio_activo:{userId}";

            try
            {
                var premioJson = await _cache.GetStringAsync(key);

                if (!string.IsNullOrWhiteSpace(premioJson))
                {
                    var premio = JsonSerializer.Deserialize<Reward>(premioJson, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    if (premio != null && !string.IsNullOrEmpty(premio.Tipo))
                    {
                        var tipo = premio.Tipo.Trim().ToUpper();

                        if (tipo == "DESCUENTO" && premio.Valor.HasValue)
                        {
                            var valor = premio.Valor.Value;
                            if (valor <= 1.0m)
                            {
                                // 0.15 => 15%
                                descuentoAplicado = subtotal * valor;
                            }
                            else
                            {
                                // 15 => 15%
                                descuentoAplicado = (subtotal * valor) / 100;
                            }
                        }
                        else if (tipo.Contains("ENVIO") || tipo.Contains("ENVÍO") || tipo.Contains("GRATIS"))
                        {
                            shippingCost = 0;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Error leyendo premio desde Redis (key={Key}): {Message}", key, ex.Message);
            }

            var total = subtotal - descuentoAplicado + shippingCost;
            if (total < 0) total = 0;

            // Redondeo a 2 decimales
            return new CheckoutSummary
            {
                Subtotal = Math.Round(subtotal, 2),
                DescuentoAplicado = Math.Round(descuentoAplicado, 2),
                CostoEnvio = Math.Round(shippingCost, 2),
                TotalFinal = Math.Round(total, 2)
            };
        }
    }

    // DTOs
    public class CheckoutSummary
    {
        [JsonPropertyName("subtotal")]
        public decimal Subtotal { get; set; }

        [JsonPropertyName("descuento_aplicado")]
        public decimal DescuentoAplicado { get; set; }

        [JsonPropertyName("costo_envio")]
        public decimal CostoEnvio { get; set; }

        [JsonPropertyName("total_final")]
        public decimal TotalFinal { get; set; }
    }

    public class Reward
    {
        public string? Tipo { get; set; }
        public decimal? Valor { get; set; }
    }
}