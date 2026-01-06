using System;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using mvc_api.Models;

namespace mvc_api.Data;

public static class DataSeeder
{
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
        )
    ];

    public static async Task Seed(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var provider    = scope.ServiceProvider;

        var roleManager = provider.GetRequiredService<RoleManager<IdentityRole<int>>>();
        var userManager = provider.GetRequiredService<UserManager<Gebruiker>>();
        var dbContext   = provider.GetRequiredService<AppDbContext>();
        
        await EnsureRoles(roleManager);
        await EnsureUsers(userManager);
        await EnsureVeilingproducten(dbContext, userManager);
        await EnsureBiedingen(dbContext, userManager);
    }

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
    
    private static async Task EnsureVeilingproducten(AppDbContext dbContext, UserManager<Gebruiker> userManager)
    {
        var kweker = await userManager.FindByEmailAsync("mario123@gmail.com");
        if (kweker == null)
        {
            return;
        }

        if (kweker.GebruikerNr != kweker.Id)
        {
            kweker.GebruikerNr = kweker.Id;
            await userManager.UpdateAsync(kweker);
        }

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
                Startprijs       = 120.00m,
                CategorieNr      = 1,
                VeilingNr        = 201,
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
                Startprijs       = 200.00m,
                CategorieNr      = 2,
                VeilingNr        = 202,
                Plaats           = "Eelde",
                Minimumprijs     = 15,
                Kwekernr         = kweker.Id,
                BeginDatum       = startdag,
                ImagePath        = "../../src/assets/pictures/productBloemen/EleganteTulpCrimsonGlory.webp"
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
        if (koper == null)
        {
            return;
        }
        
        var producten = await dbContext.Veilingproducten
            .Where(vp => vp.Naam == "Tulp Mix" || vp.Naam == "Rode Roos")
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
                BedragPerFust    = 21,
                AantalStuks      = 3,
                GebruikerNr      = koper.Id,
                VeilingproductNr = producten.GetValueOrDefault("Rode Roos")
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
