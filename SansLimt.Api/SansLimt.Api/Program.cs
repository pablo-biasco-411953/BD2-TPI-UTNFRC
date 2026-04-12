using SansLimt.Api.Services;
using MongoDB.Driver;
using StackExchange.Redis; //  NUEVO: Importamos la librería de Redis

var builder = WebApplication.CreateBuilder(args);

// --- CONFIGURACIÓN DE MONGODB ---

var dbSection = builder.Configuration.GetSection("SansLimitDatabase");

var connectionString = dbSection.GetValue<string>("ConnectionString");
var databaseName = dbSection.GetValue<string>("DatabaseName");


if (string.IsNullOrEmpty(connectionString))
{
    throw new Exception("ERROR: No se encuentra 'ConnectionString' en appsettings.json. Revisá el nombre de la sección.");
}

var mongoClient = new MongoClient(connectionString);
var mongoDatabase = mongoClient.GetDatabase(databaseName);

// --- REGISTRO DE SERVICIOS ---
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Inyectamos la base de datos para que los servicios la usen
builder.Services.AddSingleton<IMongoDatabase>(mongoDatabase);

// --- CONFIGURACIÓN DE REDIS --- //  NUEVO: Conectamos con el motor en memoria
// Intenta leer "Redis" desde appsettings.json, si no lo encuentra, usa localhost por defecto
var redisConnectionString = builder.Configuration.GetConnectionString("Redis") ?? "localhost:6379";
builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
    ConnectionMultiplexer.Connect(redisConnectionString)
);

// Servicios
builder.Services.AddSingleton<ProductosService>();
builder.Services.AddSingleton<AuthService>();
builder.Services.AddSingleton<CuponesService>();
builder.Services.AddSingleton<PedidosService>();
builder.Services.AddSingleton<RecommendationService>(); //  NUEVO: Nuestro motor inteligente

// --- CORS ---
builder.Services.AddCors(options => {
    options.AddPolicy("AllowReactApp", policy => {
        policy.WithOrigins("http://localhost:5173", "http://localhost:5174")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowReactApp");
app.UseAuthorization();
app.MapControllers();
app.Run();