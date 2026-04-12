using MongoDB.Driver;
using StackExchange.Redis;
using SansLimt.Api.Models;

namespace SansLimt.Api.Services
{
    public class RecommendationService
    {
        private readonly IMongoCollection<Pedido> _pedidosCollection;
        private readonly IMongoCollection<Producto> _productosCollection;
        private readonly IConnectionMultiplexer _redis;

        public RecommendationService(IMongoDatabase mongoDatabase, IConnectionMultiplexer redis)
        {
            _pedidosCollection = mongoDatabase.GetCollection<Pedido>("Pedidos");
            _productosCollection = mongoDatabase.GetCollection<Producto>("Productos");
            _redis = redis;
        }

        public async Task EntrenarMotorRecomendacionesAsync()
        {
            var dbRedis = _redis.GetDatabase();

            var pedidos = await _pedidosCollection.Find(p => p.Items.Count > 1).ToListAsync();

            foreach (var pedido in pedidos)
            {
                var productosEnCarrito = pedido.Items.Select(i => i.IdProducto).Distinct().ToList();

                for (int i = 0; i < productosEnCarrito.Count; i++)
                {
                    for (int j = i + 1; j < productosEnCarrito.Count; j++)
                    {
                        var productoA = productosEnCarrito[i];
                        var productoB = productosEnCarrito[j];

                        await dbRedis.SortedSetIncrementAsync($"recomendacion:{productoA}", productoB, 1);
                        await dbRedis.SortedSetIncrementAsync($"recomendacion:{productoB}", productoA, 1);
                    }
                }
            }
        }

        public async Task<List<Producto>> ObtenerRecomendacionesParaCarritoAsync(string idProductoAñadido, int cantidadRecomendaciones = 3)
        {
            var dbRedis = _redis.GetDatabase();

            var topIdsAsociados = await dbRedis.SortedSetRangeByRankAsync(
                $"recomendacion:{idProductoAñadido}",
                0,
                cantidadRecomendaciones - 1,
                StackExchange.Redis.Order.Descending);

            if (topIdsAsociados.Length == 0) return new List<Producto>();

            var idsBuscar = topIdsAsociados.Select(id => id.ToString()).ToList();

            var filtro = Builders<Producto>.Filter.In(p => p.Id, idsBuscar);
            var productosRecomendados = await _productosCollection.Find(filtro).ToListAsync();

            return productosRecomendados;
        }
    }
}