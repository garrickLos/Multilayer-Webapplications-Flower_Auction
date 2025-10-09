// cd mvc_api
// dotnet ef migrations add InitialCreate
// dotnet ef database update


// "ConnectionStrings": {
//     "Default": "Server=localhost;Database=BloemenVeiling;Trusted_Connection=True;TrustServerCertificate=True"
// }


using Microsoft.OpenApi.Models;
using Microsoft.EntityFrameworkCore;
using mvc_api.Data;

var builder = WebApplication.CreateBuilder(args);

// ------------------------------
// SERVICES
// ------------------------------
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "API", Version = "v1" });
});

// ORM / DbContext
var connectionString = builder.Configuration.GetConnectionString("Default");

// Gebruik SQLite als standaard (kan eenvoudig naar SQL Server worden omgezet)
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(connectionString));
    // options.UseSqlServer(connectionString));


var app = builder.Build();

// ------------------------------
// APP PIPELINE
// ------------------------------
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    // Alleen in development automatisch migreren
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

app.UseHttpsRedirection();
app.MapControllers();
app.Run();
