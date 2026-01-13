# Backend (ASP.NET Core API)

Deze map bevat de ASP.NET Core Web API voor het bloemenveiling-domein. De API gebruikt Entity Framework Core met migraties en stelt REST-endpoints beschikbaar voor de belangrijkste entiteiten (zoals `Gebruiker`, `Bieding`, `Categorie`, `Veilingproduct` en `Veiling`). Deze README legt uitgebreid uit wat waar staat en hoe je de backend lokaal draait.

## Inhoud

- [Vereisten](#vereisten)
- [Herstellen & builden](#herstellen--builden)
- [Database setup](#database-setup)
- [API starten](#api-starten)
- [Tests](#tests)
- [Belangrijke mappen](#belangrijke-mappen)
- [Belangrijke bestanden](#belangrijke-bestanden)
- [Configuratie](#configuratie)
- [Migraties beheren](#migraties-beheren)
- [Swagger & API documentatie](#swagger--api-documentatie)
- [Veelvoorkomende problemen](#veelvoorkomende-problemen)
- [Contributie](#contributie)

## Vereisten

- .NET SDK 8.x (of de versie die in de oplossing is gespecificeerd)
- SQLite of SQL Server (afhankelijk van je configuratie)

## Herstellen & builden

```bash
dotnet restore
```

```bash
dotnet build
```

## Database setup

1. Controleer de connection string in `mvc_api/appsettings.Development.json`.
2. Voer de migraties uit:
   ```bash
   dotnet ef database update --project mvc_api
   ```

> Tip: als je `dotnet ef` niet hebt, installeer dan de tooling met `dotnet tool install --global dotnet-ef`.

## API starten

```bash
dotnet run --project mvc_api
```

Swagger is meestal beschikbaar op `https://localhost:5001/swagger` (of de poort die in de console wordt getoond).

## Tests

```bash
dotnet test
```

## Belangrijke mappen

- `mvc_api/Controllers` — API controllers en endpoints.
- `mvc_api/Models` — domeinmodellen.
- `mvc_api/Data` — database context en seed data.
- `mvc_api/Migrations` — EF Core migraties.
- `mvc_api/Properties` — launch settings.
- `mvc_api/Auth` — authenticatie/authorisatie helpers (indien gebruikt).

## Belangrijke bestanden

- `mvc_api/Program.cs` — applicatie startpunt, middleware en dependency injection.
- `mvc_api/appsettings.json` — standaard configuratie.
- `mvc_api/appsettings.Development.json` — ontwikkelconfiguratie.
- `mvc_api/mvc_api.csproj` — projectbestand met dependencies.
- `mvc_api/mvc_api.http` — HTTP requests voor lokaal testen.

## Configuratie

- Connection strings staan in `appsettings*.json`.
- CORS en middleware zijn doorgaans in `Program.cs` te vinden.
- Logging levels kun je aanpassen in `appsettings.json`.

## Migraties beheren

Nieuwe migratie toevoegen:

```bash
dotnet ef migrations add <Naam> --project mvc_api
```

Database updaten met de nieuwste migraties:

```bash
dotnet ef database update --project mvc_api
```

## Swagger & API documentatie

- Swagger UI is beschikbaar via `/swagger` als de API draait.
- Gebruik Swagger om endpoints te testen en request/response modellen te bekijken.

## Veelvoorkomende problemen

- **Database foutmeldingen**: controleer of de connection string klopt en of de database bereikbaar is.
- **CORS issues**: pas de CORS-configuratie aan in `mvc_api/Program.cs` als de front-end geen requests mag doen.
- **HTTPS certificaat warnings**: vertrouw het ontwikkelcertificaat met `dotnet dev-certs https --trust`.
- **Migrations out-of-sync**: draai `dotnet ef database update` opnieuw en controleer de migratiegeschiedenis.

## Contributie

- Gebruik bestaande patterns in controllers en services.
- Houd de models en DTO’s consistent.
- Voeg migraties toe bij modelwijzigingen en update de database.
