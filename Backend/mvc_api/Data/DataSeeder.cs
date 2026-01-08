using System;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using mvc_api.Models;

namespace mvc_api.Data;

public static class DataSeeder
{
    public static async Task Seed(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var provider    = scope.ServiceProvider;

        var roleManager = provider.GetRequiredService<RoleManager<IdentityRole<int>>>();
        var userManager = provider.GetRequiredService<UserManager<Gebruiker>>();
        var dbContext   = provider.GetRequiredService<AppDbContext>();
        
        await EnsureRoles(roleManager);
        await EnsureUsers(userManager);
        await EnsureCategorie(dbContext, userManager);
        await EnsureVeiling(dbContext, userManager);
        await EnsureVeilingproducten(dbContext, userManager);
        await EnsureBiedingen(dbContext, userManager);
    }

    private static readonly (Gebruiker user, string password, string role)[] _gebruikers =
    [
        (
            new Gebruiker
            {
                BedrijfsNaam   = "Flora BV",
                Email          = "flora@gmail.com",
                UserName       = "flora@gmail.com",
                LaatstIngelogd = new DateTime(2025, 10, 08, 12, 0, 0, DateTimeKind.Utc),
                Soort          = "VeilingMeester",
                Kvk            = "12345678",
                StraatAdres    = "Bloemig 10",
                Postcode       = "1234AB"
            },
            "abcTest123!@#",
            "VeilingMeester"
        ),
        (
            new Gebruiker
            {
                BedrijfsNaam   = "Jan Jansen",
                Email          = "luigi@gmail.com",
                UserName       = "luigi@gmail.com",
                LaatstIngelogd = new DateTime(2025, 10, 07, 13, 0, 0, DateTimeKind.Utc),
                Soort          = "Koper",
                Kvk            = "00000000",
                StraatAdres    = "Laan 5",
                Postcode       = "2345BC"
            },
            "abcTest123!@#",
            "Koper"
        ),
        (
            new Gebruiker
            {
                BedrijfsNaam   = "Bloemenhandel De Vrolijke Roos",
                Email          = "mario123@gmail.com",
                UserName       = "mario123@gmail.com",
                LaatstIngelogd = new DateTime(2025, 10, 06, 10, 0, 0, DateTimeKind.Utc),
                Soort          = "Bedrijf",
                Kvk            = "87654321",
                StraatAdres    = "Handelsweg 22",
                Postcode       = "3456CD"
            },
            "abcTest123!@#",
            "Bedrijf"
        ),
        (
            new Gebruiker
            {
                BedrijfsNaam   = "Kwekerij Groenveld",
                Email          = "groenveld@kwekerij.nl",
                UserName       = "groenveld@kwekerij.nl",
                LaatstIngelogd = new DateTime(2025, 10, 05, 9, 30, 0, DateTimeKind.Utc),
                Soort          = "Bedrijf",
                Kvk            = "11223344",
                StraatAdres    = "Kassenpad 4",
                Postcode       = "4567DE"
            },
            "abcTest123!@#",
            "Bedrijf"
        ),
        (
            new Gebruiker
            {
                BedrijfsNaam   = "Anna de Koper",
                Email          = "anna.koper@gmail.com",
                UserName       = "anna.koper@gmail.com",
                LaatstIngelogd = new DateTime(2025, 10, 04, 8, 15, 0, DateTimeKind.Utc),
                Soort          = "Koper",
                Kvk            = "00000000",
                StraatAdres    = "Marktstraat 12",
                Postcode       = "5678EF"
            },
            "abcTest123!@#",
            "Koper"
        )
    ];

    private static async Task EnsureRoles(RoleManager<IdentityRole<int>> roleManager)
    {
        string[] rollen = { "VeilingMeester", "Koper", "Bedrijf" };
        foreach (var rolNaam in rollen)
        {
            if (!await roleManager.RoleExistsAsync(rolNaam))
            {
                await roleManager.CreateAsync(new IdentityRole<int> { Name = rolNaam });
            }
        }
    }

    private static async Task EnsureUsers(UserManager<Gebruiker> userManager)
    {
        foreach (var (gebruiker, password, role) in _gebruikers)
        {
            var bestaand = await userManager.FindByEmailAsync(gebruiker.Email!);

            if (bestaand == null)
            {
                var createResult = await userManager.CreateAsync(gebruiker, password);
                if (!createResult.Succeeded)
                {
                    continue;
                }

                bestaand = gebruiker;
            }

            if (bestaand.GebruikerNr != bestaand.Id)
            {
                bestaand.GebruikerNr = bestaand.Id;
                await userManager.UpdateAsync(bestaand);
            }

            if (!await userManager.IsInRoleAsync(bestaand, role))
            {
                await userManager.AddToRoleAsync(bestaand, role);
            }
        }
    }

    private static async Task EnsureCategorie(AppDbContext dbContext, UserManager<Gebruiker> userManager)
    {
        var seedCategorie = new[]
        {
            new Categorie { Naam = "Tulpen" },
            new Categorie { Naam = "Rozen" },
            new Categorie { Naam = "Lelie" },
            new Categorie { Naam = "Zonnebloem" },
            new Categorie { Naam = "Chrysant" },
            new Categorie { Naam = "Pioenroos" }
        };

        foreach (var categorie in seedCategorie)
        {
            var bestaat = await dbContext.Categorieen.AnyAsync(
                c => c.Naam == categorie.Naam);
            
            if (!bestaat)
            {
                dbContext.Categorieen.Add(categorie);
            }
        }

        await dbContext.SaveChangesAsync();
    }

    private static readonly DateTime _vasteVeilingDatum = new DateTime(2026, 1, 8, 0, 0, 0, DateTimeKind.Utc);
    private static async Task EnsureVeiling(AppDbContext dbContext, UserManager<Gebruiker> userManager)
    {
        if (!await dbContext.Veiling.AnyAsync())
        {
            // forceert de database om te beginnen met een specifiek getal voor de veiling
            await dbContext.Database.ExecuteSqlRawAsync("DBCC CHECKIDENT ('Veiling', RESEED, 200)");
        }

        var veilingen = new[]
        {
            new Veiling
            {
                VeilingNaam = "veiling001",
                Begintijd   = _vasteVeilingDatum.AddHours(9),
                Eindtijd    = _vasteVeilingDatum.AddHours(10),
                Status      = "active"
            },
            new Veiling
            {
                VeilingNaam = "veiling001",
                Begintijd   = _vasteVeilingDatum.AddHours(10),
                Eindtijd    = _vasteVeilingDatum.AddHours(11),
                Status      = "active"
            },
            new Veiling
            {
                VeilingNaam = "veiling002",
                Begintijd   = _vasteVeilingDatum.AddHours(12),
                Eindtijd    = _vasteVeilingDatum.AddHours(13),
                Status      = "active"
            },
            new Veiling
            {
                VeilingNaam = "veiling003",
                Begintijd   = _vasteVeilingDatum.AddHours(14),
                Eindtijd    = _vasteVeilingDatum.AddHours(15),
                Status      = "active"
            }
        };

        foreach (var veiling in veilingen)
        {
            // Check of de veiling al bestaat op basis van unieke kenmerken.
            var bestaat = await dbContext.Veiling.AnyAsync(v =>
                v.VeilingNaam == veiling.VeilingNaam &&
                v.Begintijd == veiling.Begintijd &&
                v.Eindtijd == veiling.Eindtijd
            );

            if (!bestaat)
            {
                dbContext.Veiling.Add(veiling);
            }
        }

        await dbContext.SaveChangesAsync();
    }
    
    private static async Task EnsureVeilingproducten(AppDbContext dbContext, UserManager<Gebruiker> userManager)
    {
        var kweker = await userManager.FindByEmailAsync("mario123@gmail.com");
        var kwekerGroenveld = await userManager.FindByEmailAsync("groenveld@kwekerij.nl");
        if (kweker == null) return;

        if (kweker.GebruikerNr != kweker.Id)
        {
            kweker.GebruikerNr = kweker.Id;
            await userManager.UpdateAsync(kweker);
        }
        
        if (kwekerGroenveld != null && kwekerGroenveld.GebruikerNr != kwekerGroenveld.Id)
        {
            kwekerGroenveld.GebruikerNr = kwekerGroenveld.Id;
            await userManager.UpdateAsync(kwekerGroenveld);
        }

        var categories = await dbContext.Categorieen
            .ToDictionaryAsync(c => c.Naam, c => c.CategorieNr);

        var geplaatst = new DateTime(2025, 10, 09, 14, 0, 0, DateTimeKind.Utc);
        var startdag  = DateOnly.FromDateTime(geplaatst.Date.AddDays(1));

        var seedProducten = new[]
        {
            new Veilingproduct
            {
                Naam             = "Tulp Mix",
                GeplaatstDatum   = geplaatst,
                AantalFusten     = 10,
                VoorraadBloemen  = 500,
                Startprijs       = 1200000,
                CategorieNr      = categories.GetValueOrDefault("Tulpen"),
                VeilingNr        = 200, 
                Plaats           = "Aalsmeer",
                Minimumprijs     = 10,
                Kwekernr         = kweker.Id,
                BeginDatum       = startdag,
                ImagePath        = "../../src/assets/pictures/productBloemen/DecoratieveDahliaSunsetFlare.webp"
            },
            new Veilingproduct
            {
                Naam             = "Rode Roos",
                GeplaatstDatum   = geplaatst,
                AantalFusten     = 10,
                VoorraadBloemen  = 300,
                Startprijs       = 2000000,
                CategorieNr      = categories.GetValueOrDefault("Rozen"),
                VeilingNr        = 201,
                Plaats           = "Eelde",
                Minimumprijs     = 15,
                Kwekernr         = kweker.Id,
                BeginDatum       = startdag,
                ImagePath        = "../../src/assets/pictures/productBloemen/EleganteTulpCrimsonGlory.webp"
            },
            new Veilingproduct
            {
                Naam             = "Zonnebloem Gold",
                GeplaatstDatum   = geplaatst.AddHours(1),
                AantalFusten     = 8,
                VoorraadBloemen  = 400,
                Startprijs       = 950000,
                CategorieNr      = categories.GetValueOrDefault("Zonnebloem"),
                VeilingNr        = 202,
                Plaats           = "Aalsmeer",
                Minimumprijs     = 12,
                Kwekernr         = kweker.Id,
                BeginDatum       = startdag,
                ImagePath        = "../../src/assets/pictures/productBloemen/DecoratieveDahliaSunsetFlare.webp"
            },
            new Veilingproduct
            {
                Naam             = "Witte Lelie",
                GeplaatstDatum   = geplaatst.AddHours(2),
                AantalFusten     = 6,
                VoorraadBloemen  = 240,
                Startprijs       = 1750000,
                CategorieNr      = categories.GetValueOrDefault("Lelie"),
                VeilingNr        = 202,
                Plaats           = "Naaldwijk",
                Minimumprijs     = 18,
                Kwekernr         = kwekerGroenveld?.Id ?? kweker.Id,
                BeginDatum       = startdag,
                ImagePath        = "../../src/assets/pictures/productBloemen/EleganteTulpCrimsonGlory.webp"
            },
            new Veilingproduct
            {
                Naam             = "Pioenroos Pastel",
                GeplaatstDatum   = geplaatst.AddHours(3),
                AantalFusten     = 5,
                VoorraadBloemen  = 180,
                Startprijs       = 2200000,
                CategorieNr      = categories.GetValueOrDefault("Pioenroos"),
                VeilingNr        = 203,
                Plaats           = "Eelde",
                Minimumprijs     = 20,
                Kwekernr         = kwekerGroenveld?.Id ?? kweker.Id,
                BeginDatum       = startdag,
                ImagePath        = "../../src/assets/pictures/productBloemen/DecoratieveDahliaSunsetFlare.webp"
            }
        };

        foreach (var product in seedProducten)
        {
            var bestaand = await dbContext.Veilingproducten
                .FirstOrDefaultAsync(vp => vp.Naam == product.Naam && vp.Kwekernr == product.Kwekernr);

            if (bestaand is null)
            {
                dbContext.Veilingproducten.Add(product);
            }
        }

        await dbContext.SaveChangesAsync();
    }

    private static async Task EnsureBiedingen(AppDbContext dbContext, UserManager<Gebruiker> userManager)
    {
        var koper = await userManager.FindByEmailAsync("luigi@gmail.com");
        var koperAnna = await userManager.FindByEmailAsync("anna.koper@gmail.com");
        if (koper == null) return;

        var producten = await dbContext.Veilingproducten
            .Where(vp => vp.Naam == "Tulp Mix" || vp.Naam == "Rode Roos" || vp.Naam == "Zonnebloem Gold" || vp.Naam == "Witte Lelie" || vp.Naam == "Pioenroos Pastel")
            .ToDictionaryAsync(vp => vp.Naam, vp => vp.VeilingProductNr);

        var seedBiedingen = new[]
        {
            new Bieding
            {
                BedragPerFust    = 13,
                AantalStuks      = 5,
                GebruikerNr      = koper.Id,
                VeilingproductNr = producten.GetValueOrDefault("Tulp Mix")
            },
            new Bieding
            {
                BedragPerFust    = 15,
                AantalStuks      = 4,
                GebruikerNr      = koperAnna?.Id ?? koper.Id,
                VeilingproductNr = producten.GetValueOrDefault("Tulp Mix")
            },
            new Bieding
            {
                BedragPerFust    = 21,
                AantalStuks      = 3,
                GebruikerNr      = koper.Id,
                VeilingproductNr = producten.GetValueOrDefault("Rode Roos")
            },
            new Bieding
            {
                BedragPerFust    = 23,
                AantalStuks      = 2,
                GebruikerNr      = koperAnna?.Id ?? koper.Id,
                VeilingproductNr = producten.GetValueOrDefault("Rode Roos")
            },
            new Bieding
            {
                BedragPerFust    = 14,
                AantalStuks      = 6,
                GebruikerNr      = koper.Id,
                VeilingproductNr = producten.GetValueOrDefault("Zonnebloem Gold")
            },
            new Bieding
            {
                BedragPerFust    = 19,
                AantalStuks      = 3,
                GebruikerNr      = koperAnna?.Id ?? koper.Id,
                VeilingproductNr = producten.GetValueOrDefault("Witte Lelie")
            },
            new Bieding
            {
                BedragPerFust    = 24,
                AantalStuks      = 2,
                GebruikerNr      = koper.Id,
                VeilingproductNr = producten.GetValueOrDefault("Pioenroos Pastel")
            }
        };

        foreach (var bieding in seedBiedingen)
        {
            if (bieding.VeilingproductNr == 0)
                continue;

            var bestaat = await dbContext.Biedingen.AnyAsync(b =>
                b.VeilingproductNr == bieding.VeilingproductNr &&
                b.GebruikerNr == bieding.GebruikerNr &&
                b.BedragPerFust == bieding.BedragPerFust);
            if (!bestaat)
            {
                dbContext.Biedingen.Add(bieding);
            }
        }

        await dbContext.SaveChangesAsync();
    }
   
}
