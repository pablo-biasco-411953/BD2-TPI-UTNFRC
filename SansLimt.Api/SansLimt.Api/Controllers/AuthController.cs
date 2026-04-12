using Microsoft.AspNetCore.Mvc;
using SansLimt.Api.Models;
using SansLimt.Api.Services;

namespace SansLimt.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;

        public AuthController(AuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var usuario = await _authService.LoginAsync(request.Username, request.Password);

            if (usuario == null)
            {
                return Unauthorized(new { message = "Usuario o contraseña incorrectos" });
            }

            return Ok(usuario);
        }

        
        [HttpPost("registrar")]
        public async Task<IActionResult> Registrar([FromBody] Usuario request)
        {
            var usuarioCreado = await _authService.RegistrarAsync(request);

            if (usuarioCreado == null)
            {
                return BadRequest(new { message = "El nombre de usuario ya está en uso." });
            }

            return Ok(new { message = "Cliente registrado con éxito", data = usuarioCreado });
        }
    }

    public class LoginRequest
    {
        public string Username { get; set; } = null!;
        public string Password { get; set; } = null!;
    }
}