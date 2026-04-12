using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Collections.Generic;

namespace SansLimt.Api.Models
{
    [BsonIgnoreExtraElements]
    public class Producto
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("nombre")]
        public string Nombre { get; set; } = null!;

        [BsonElement("slug")]
        public string Slug { get; set; } = null!;

        [BsonElement("categoria")]
        public string Categoria { get; set; } = null!;

        [BsonElement("precio")]
        public int Precio { get; set; }

        [BsonElement("descripcion")]
        public string Descripcion { get; set; } = null!;

        [BsonElement("imagenes")]
        public List<string> Imagenes { get; set; } = new();

        [BsonElement("active")]
        public bool Active { get; set; }

        [BsonElement("mililitros")]
        public int? Mililitros { get; set; }

        [BsonElement("variantes")]
        public List<Variante>? Variantes { get; set; }

        // 👇 NUEVO: Fundamental para el motor de recomendaciones en Mongo
        [BsonElement("tags")]
        [BsonIgnoreIfNull]
        public List<string>? Tags { get; set; }

        // 👇 NUEVO: Para soportar el stock de los perfumes (que no tienen variantes)
        [BsonElement("stock")]
        [BsonIgnoreIfNull]
        public int? Stock { get; set; }
    }

    [BsonIgnoreExtraElements]
    public class Variante
    {
        [BsonElement("color")]
        public string Color { get; set; } = null!;

        [BsonElement("talle")]
        public string Talle { get; set; } = null!;

        [BsonElement("stock")]
        public int Stock { get; set; }

        [BsonElement("sku")]
        public string Sku { get; set; } = null!;
    }
}