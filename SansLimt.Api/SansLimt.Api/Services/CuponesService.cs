using MongoDB.Driver;
using SansLimt.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SansLimt.Api.Services
{
    public class CuponesService
    {
        private readonly IMongoCollection<Cupon> _cuponesCollection;

        public CuponesService(IMongoDatabase database)
        {
            
            _cuponesCollection = database.GetCollection<Cupon>("Cupones");
        }

        
        public async Task<List<Cupon>> GetAsync() =>
            await _cuponesCollection.Find(_ => true).ToListAsync();

        
        public async Task<Cupon?> GetByCodigoAsync(string codigo) =>
            await _cuponesCollection.Find(x => x.Codigo == codigo).FirstOrDefaultAsync();

        
        public async Task CreateAsync(Cupon nuevoCupon) =>
            await _cuponesCollection.InsertOneAsync(nuevoCupon);

        
        public async Task UpdateAsync(string id, Cupon cuponActualizado) =>
            await _cuponesCollection.ReplaceOneAsync(x => x.Id == id, cuponActualizado);
    }
}