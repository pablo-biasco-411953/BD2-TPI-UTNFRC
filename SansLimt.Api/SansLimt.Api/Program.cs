using SansLimt.Api.Services;
using MongoDB.Driver;
using StackExchange.Redis;
using SansLimt.Api.Models;

var builder = WebApplication.CreateBuilder(args);

// --- 1. CONFIGURACIÓN DE MONGODB ---
// Leemos la sección de la base de datos desde appsettings.json
var dbSection = builder.Configuration.GetSection("SansLimitDatabase");
var connectionString = dbSection.GetValue<string>("ConnectionString") ?? "mongodb://localhost:27017";
var databaseName = dbSection.GetValue<string>("DatabaseName") ?? "SansLimitDB";

if (string.IsNullOrEmpty(connectionString))
{
    throw new Exception("ERROR: No se encuentra 'ConnectionString' en appsettings.json.");
}

// Creamos la instancia del cliente y de la base de datos
var mongoClient = new MongoClient(connectionString);
var mongoDatabase = mongoClient.GetDatabase(databaseName);

// 🔥 REGISTROS CRUCIALES PARA INYECCIÓN DE DEPENDENCIAS
// Registramos el CLIENTE (lo pide SocialController)
builder.Services.AddSingleton<IMongoClient>(mongoClient);
// Registramos la BASE DE DATOS (lo piden los otros Servicios)
builder.Services.AddSingleton<IMongoDatabase>(mongoDatabase);


// --- 2. CONFIGURACIÓN DE REDIS ---
// Intentamos leer la conexión, si no existe usamos localhost
var redisConnectionString = builder.Configuration.GetConnectionString("Redis") ?? "localhost:6379";
builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
ConnectionMultiplexer.Connect(redisConnectionString)
);


// --- 3. REGISTRO DE SERVICIOS DE NEGOCIO ---
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddSingleton<ProductosService>();
builder.Services.AddSingleton<AuthService>();
builder.Services.AddSingleton<CuponesService>();
builder.Services.AddSingleton<PedidosService>();
builder.Services.AddSingleton<RecommendationService>();


// --- 4. CONFIGURACIÓN DE CORS ---
builder.Services.AddCors(options => {
    options.AddPolicy("AllowReactApp", policy => {
        policy.WithOrigins("http://localhost:5173", "http://localhost:5174")
        .AllowAnyHeader()
        .AllowAnyMethod();
    });
});


var app = builder.Build();

// --- 5. MIDDLEWARES ---
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Importante: El orden de los middlewares importa
app.UseCors("AllowReactApp");

// Si estás probando local y no tenés certificados, podés comentar HttpsRedirection
// app.UseHttpsRedirection();

app.UseAuthorization();
app.MapControllers();

Console.WriteLine("🚀 Servidor SansLimit levantado en http://localhost:5286");
app.Run();
