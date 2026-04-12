using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SansLimt.Api.Models
{
    [BsonIgnoreExtraElements] // Agregamos esto por seguridad
    public class Usuario
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("Username")]
        public string Username { get; set; } = null!;

        [BsonElement("Password")]
        public string Password { get; set; } = null!;

        [BsonElement("Rol")]
        public string Rol { get; set; } = "Cliente";

        [BsonElement("Email")]
        public string? Email { get; set; }

        [BsonElement("NombreCompleto")]
        public string? NombreCompleto { get; set; }

        [BsonElement("Telefono")]
        public string? Telefono { get; set; }

        [BsonElement("Direccion")]
        public DireccionEnvio? Direccion { get; set; }
    }

    public class DireccionEnvio
    {
        [BsonElement("Calle")]
        public string? Calle { get; set; }

        [BsonElement("Ciudad")]
        public string? Ciudad { get; set; }

        [BsonElement("CodigoPostal")]
        public string? CodigoPostal { get; set; }
    }
}