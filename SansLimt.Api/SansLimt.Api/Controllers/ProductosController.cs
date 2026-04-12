using Microsoft.AspNetCore.Mvc;
using SansLimt.Api.Models;
using SansLimt.Api.Services;

namespace SansLimt.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductosController : ControllerBase
    {
        private readonly ProductosService _productosService;

        public ProductosController(ProductosService productosService)
        {
            _productosService = productosService;
        }

        
        [HttpGet]
        public async Task<ActionResult<List<Producto>>> Get()
        {
            var productos = await _productosService.GetAsync();
            return Ok(productos);
        }

        
        [HttpGet("{id:length(24)}")]
        public async Task<ActionResult<Producto>> Get(string id)
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

       
        [HttpPut("{id:length(24)}")]
        public async Task<IActionResult> Update(string id, Producto productoActualizado)
        {
            var producto = await _productosService.GetAsync(id);

            if (producto is null) return NotFound();

            productoActualizado.Id = producto.Id; 

            await _productosService.UpdateAsync(id, productoActualizado);

            return NoContent();
        }

       
        [HttpDelete("{id:length(24)}")]
        public async Task<IActionResult> Delete(string id)
        {
            var producto = await _productosService.GetAsync(id);

            if (producto is null) return NotFound();

            await _productosService.RemoveAsync(id);
            return NoContent();
        }
    }
}