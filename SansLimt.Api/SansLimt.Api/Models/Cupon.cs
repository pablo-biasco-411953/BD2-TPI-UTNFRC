using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;

namespace SansLimt.Api.Models
{
    public class Cupon
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("codigo")]
        public string Codigo { get; set; } = null!;

        [BsonElement("descripcion")]
        public string Descripcion { get; set; } = null!;

        [BsonElement("tipo_descuento")] 
        public string TipoDescuento { get; set; } = null!;

        [BsonElement("valor_descuento")]
        public int ValorDescuento { get; set; }

        [BsonElement("activo")]
        public bool Activo { get; set; }

        [BsonElement("un_solo_uso_por_usuario")]
        public bool UnSoloUsoPorUsuario { get; set; }

        [BsonElement("usuarios_que_lo_usaron")]
        public List<string> UsuariosQueLoUsaron { get; set; } = new();

        [BsonElement("fecha_vencimiento")]
        public DateTime FechaVencimiento { get; set; }

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; }
    }
}