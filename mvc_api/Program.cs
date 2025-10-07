using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// ------------------------------
// SERVICES INSTELLEN
// ------------------------------

// Voeg controllers toe.
// Een controller zorgt dat de API weet wat te doen bij een HTTP-verzoek.
builder.Services.AddControllers();

// Zet het systeem klaar om routes (URL-paden) te gebruiken.
builder.Services.AddRouting();

// Voeg Swagger toe.
// Swagger maakt automatisch een overzicht van alle API-routes.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "API",
        Version = "v1"
    });
});

var app = builder.Build();


// ------------------------------
// DE APP LATEN DRAAIEN
// ------------------------------

// Toon Swagger alleen als we in de ontwikkelomgeving werken.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "API v1");
    });
}

// Zorg dat de app altijd via HTTPS werkt (veiligere verbinding).
app.UseHttpsRedirection();

// Zet routering aan zodat verzoeken bij de juiste controller terechtkomen.
app.UseRouting();

// Koppel de controllers aan de routes.
app.MapControllers();

// Start de webapplicatie.
app.Run();
