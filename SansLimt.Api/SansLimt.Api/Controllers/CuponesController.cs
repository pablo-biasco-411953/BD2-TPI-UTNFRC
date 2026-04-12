using Microsoft.AspNetCore.Mvc;
using SansLimt.Api.Models;
using SansLimt.Api.Services;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SansLimt.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CuponesController : ControllerBase
    {
        private readonly CuponesService _cuponesService;

        public CuponesController(CuponesService cuponesService)
        {
            _cuponesService = cuponesService;
        }

       
        [HttpGet]
        public async Task<ActionResult<List<Cupon>>> Get()
        {
            var cupones = await _cuponesService.GetAsync();
            return Ok(cupones);
        }

        
        [HttpGet("{codigo}")]
        public async Task<ActionResult<Cupon>> GetByCodigo(string codigo)
        {
            var cupon = await _cuponesService.GetByCodigoAsync(codigo);

            if (cupon is null)
            {
                return NotFound(new { message = "El cupón no existe." });
            }

            return Ok(cupon);
        }

        
        [HttpPost]
        public async Task<IActionResult> Post(Cupon nuevoCupon)
        {
            nuevoCupon.Id = null; 
            await _cuponesService.CreateAsync(nuevoCupon);
            return CreatedAtAction(nameof(Get), new { id = nuevoCupon.Id }, nuevoCupon);
        }
    }
}