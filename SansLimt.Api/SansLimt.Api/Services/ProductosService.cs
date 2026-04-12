using MongoDB.Driver;
using SansLimt.Api.Models;

namespace SansLimt.Api.Services
{
    public class ProductosService
    {
        private readonly IMongoCollection<Producto> _productosCollection;

        
        public ProductosService(IMongoDatabase database)
        {
            
            _productosCollection = database.GetCollection<Producto>("Productos");
        }

       
        public async Task<List<Producto>> GetAsync() =>
            await _productosCollection.Find(_ => true).ToListAsync();

       
        public async Task<Producto?> GetAsync(string id) =>
            await _productosCollection.Find(x => x.Id == id).FirstOrDefaultAsync();

        
        public async Task CreateAsync(Producto nuevoProducto) =>
            await _productosCollection.InsertOneAsync(nuevoProducto);

       
        public async Task UpdateAsync(string id, Producto productoActualizado) =>
            await _productosCollection.ReplaceOneAsync(x => x.Id == id, productoActualizado);

        
        public async Task RemoveAsync(string id) =>
            await _productosCollection.DeleteOneAsync(x => x.Id == id);
    }
}