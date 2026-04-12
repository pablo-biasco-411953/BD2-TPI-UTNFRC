using MongoDB.Driver;
using SansLimt.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SansLimt.Api.Services
{
    public class PedidosService
    {
        private readonly IMongoCollection<Pedido> _pedidosCollection;

        public PedidosService(IMongoDatabase database)
        {
            
            _pedidosCollection = database.GetCollection<Pedido>("Pedidos");
        }

        
        public async Task<List<Pedido>> GetAsync() =>
            await _pedidosCollection.Find(_ => true).ToListAsync();

        
        public async Task<Pedido?> GetAsync(string id) =>
            await _pedidosCollection.Find(x => x.Id == id).FirstOrDefaultAsync();

        
        public async Task CreateAsync(Pedido nuevoPedido) =>
            await _pedidosCollection.InsertOneAsync(nuevoPedido);

        
        public async Task UpdateAsync(string id, Pedido pedidoActualizado) =>
            await _pedidosCollection.ReplaceOneAsync(x => x.Id == id, pedidoActualizado);
    }
}