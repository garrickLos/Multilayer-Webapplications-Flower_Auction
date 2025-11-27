// cd mvc_api
//     
// dotnet ef database drop --force
//     
// dotnet ef migrations add InitialCreate
// dotnet ef database update


// "ConnectionStrings": {
//     "Default": "Server=localhost;Database=BloemenVeiling;Trusted_Connection=True;TrustServerCertificate=True"
// }


using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using mvc_api.Data;
using mvc_api.Models;
using System.Globalization;

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

// Identity configuratie (alleen registratie, verdere auth volgt later)
builder.Services.AddIdentity<Gebruiker, IdentityRole<int>>(options =>
    {
        options.User.RequireUniqueEmail = true;
        options.Password.RequireDigit = false;
        options.Password.RequireNonAlphanumeric = false;
        options.Password.RequireUppercase = false;
        options.Password.RequireLowercase = false;
        options.Password.RequiredLength = 6;
    })
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

// Nodig zodat UserManager/SignInManager goed werken
builder.Services.AddAuthentication();
builder.Services.AddAuthorization();


var app = builder.Build();

var culture = CultureInfo.InvariantCulture;
CultureInfo.DefaultThreadCurrentCulture = culture;
CultureInfo.DefaultThreadCurrentUICulture = culture;


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
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
