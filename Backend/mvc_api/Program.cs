// cd mvc_api
//     
// dotnet ef database drop --force
// dotnet ef migrations remove

// dotnet ef migrations add InitialCreate 
// dotnet ef database update

using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using mvc_api.Data;
using mvc_api.Models;
using System.Globalization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using ApiGetFilters;
using mvc_api.statusPrinter;
using mvc_api.Controllers;

using mvc_api.Auth.GenereerAccessTokens;

/*
**************************
** Imports van de repos **
**************************
*/
using mvc_api.Repo;
using mvc_api.Repo.Interfaces;
var builder = WebApplication.CreateBuilder(args);

// ------------------------------
// SERVICES
// ------------------------------
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "API", Version = "v1" });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Voer in: Bearer {token}",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// // Blob Storage
// builder.Services.AddSingleton(_ =>
//     new Azure.Storage.Blobs.BlobServiceClient(
//         builder.Configuration.GetConnectionString("AzureBlobStorage")
//     )
// );

// builder.Services.AddScoped<IImageStorageService, AzureBlobImageStorageService>();

// Repositories
builder.Services.AddScoped<IVeilingproductRepository, VeilingproductRepository>();


// ORM / DbContext
var connectionString = builder.Configuration.GetConnectionString("Default");
var corsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
var allowCredentials = builder.Configuration.GetValue<bool>("Cors:AllowCredentials");

var jwtSettings = builder.Configuration.GetSection("Jwt");
var key = Encoding.UTF8.GetBytes(jwtSettings["Key"]);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString));

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

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key), // Dezelfde sleutel als in AuthController
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        ClockSkew = TimeSpan.Zero // Voorkomt wachttijd bij verlopen tokens
    };
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("ConfiguredCors", policy =>
    {
        if (corsOrigins is { Length: > 0 })
        {
            policy.WithOrigins(corsOrigins)
                .AllowAnyHeader()
                .AllowAnyMethod();

            if (allowCredentials)
            {
                policy.AllowCredentials();
            }
        }
    });
});

builder.Services.ConfigureApplicationCookie(options =>
{
    options.ExpireTimeSpan = TimeSpan.FromHours(6);
    // options.SlidingExpiration = false;
    options.Cookie.Name = "Asp.NetCookie";

    // Voorkom redirect naar /Account/Login bij 401 (Niet ingelogd)
    options.Events.OnRedirectToLogin = context =>
    {
        context.Response.StatusCode = 401;
        return Task.CompletedTask;
    };
    
    // Voorkom redirect naar /Account/AccessDenied bij 403 (Geen rechten)
    options.Events.OnRedirectToAccessDenied = context =>
    {
        context.Response.StatusCode = 403;
        return Task.CompletedTask;
    };
});

// // Nodig zodat UserManager/SignInManager goed werken
// builder.Services.AddAuthentication();
builder.Services.AddAuthorization();
builder.Services.AddScoped<IGenereerAccessTokens, GenereerBearerToken>();
builder.Services.AddScoped<IBiedingRepo, BiedingRepository>();
builder.Services.AddScoped<IVeilingproductRepository, VeilingproductRepository>();
builder.Services.AddScoped<IPrijsHistorieRepository, PrijsHistorieRepository>();
builder.Services.AddScoped<IVeilingControllerFilter, VeilingControllerFilter>();
builder.Services.AddTransient<ProjectieVeilingController>();
builder.Services.AddSingleton<NormalizeStatus>();

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
}

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var db       = services.GetRequiredService<AppDbContext>();

    try
    {
        db.Database.Migrate();
        await DataSeeder.Seed(services);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Fout bij het seeden van de database.");
    }
}

app.UseHttpsRedirection();

if (corsOrigins is { Length: > 0 })
{
    app.UseCors("ConfiguredCors");
}
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();


app.Run();
