using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;

namespace SansLimt.Api.Models
{
    public class Pedido
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("es_invitado")]
        public bool EsInvitado { get; set; }

        [BsonElement("id_usuario")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? IdUsuario { get; set; }

        [BsonElement("datos_cliente")]
        public Cliente DatosCliente { get; set; } = null!;

        [BsonElement("items")]
        public List<ItemPedido> Items { get; set; } = new();

        [BsonElement("subtotal")]
        public int Subtotal { get; set; }

        [BsonElement("cupon_aplicado")]
        public CuponAplicado? CuponAplicado { get; set; }

        [BsonElement("total")]
        public int Total { get; set; }

        [BsonElement("metodo_pago")]
        public string MetodoPago { get; set; } = null!;

        [BsonElement("estado")] // "Pendiente", "Enviado", "Entregado"
        public string Estado { get; set; } = null!;

        [BsonElement("fecha")]
        public DateTime Fecha { get; set; }
    }

   
    public class Cliente
    {
        [BsonElement("nombre")]
        public string Nombre { get; set; } = null!;

        [BsonElement("email")]
        public string Email { get; set; } = null!;

        [BsonElement("telefono")]
        public string Telefono { get; set; } = null!;
    }

    public class ItemPedido
    {
        [BsonElement("id_producto")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string IdProducto { get; set; } = null!;

        [BsonElement("nombre")]
        public string Nombre { get; set; } = null!;

        [BsonElement("variante_seleccionada")]
        public string? VarianteSeleccionada { get; set; } // Puede ser nulo para perfumes

        [BsonElement("cantidad")]
        public int Cantidad { get; set; }

        [BsonElement("precio_unitario")]
        public int PrecioUnitario { get; set; }
    }

    public class CuponAplicado
    {
        [BsonElement("codigo")]
        public string Codigo { get; set; } = null!;

        [BsonElement("descuento_aplicado")]
        public int DescuentoAplicado { get; set; }
    }
}