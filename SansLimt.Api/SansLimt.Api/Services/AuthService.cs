using MongoDB.Driver;
using SansLimt.Api.Models;
using Microsoft.Extensions.Options;

namespace SansLimt.Api.Services
{
    public class AuthService
    {
        private readonly IMongoCollection<Usuario> _usuariosCollection;

        public AuthService(IMongoDatabase database)
        {
            _usuariosCollection = database.GetCollection<Usuario>("Usuarios");
        }

        public async Task<Usuario?> LoginAsync(string username, string password)
        {
            return await _usuariosCollection
                .Find(u => u.Username == username && u.Password == password)
                .FirstOrDefaultAsync();
        }

       
        public async Task<Usuario?> RegistrarAsync(Usuario nuevoUsuario)
        {
            // Validamos si ya existe alguien con ese Username
            var usuarioExistente = await _usuariosCollection
                .Find(u => u.Username == nuevoUsuario.Username)
                .FirstOrDefaultAsync();

            if (usuarioExistente != null)
            {
                return null; // Retornamos null para avisar que el usuario ya existe
            }

            // Forzamos que el rol sea "Cliente" por seguridad
            nuevoUsuario.Rol = "Cliente";

            await _usuariosCollection.InsertOneAsync(nuevoUsuario);
            return nuevoUsuario;
        }
    }
}