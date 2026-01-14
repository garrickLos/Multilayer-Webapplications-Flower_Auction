using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using mvc_api.Models;

namespace mvc_api.Data;

public static class DataSeeder
{
    // Centrale constants
    private const string EmailVeilingmeester = "flora@gmail.com";
    private const string EmailKoper1         = "luigi@gmail.com";
    private const string EmailKoper2         = "anna.koper@gmail.com";
    private const string EmailKwekerMario    = "mario123@gmail.com";
    private const string EmailKwekerGroen    = "groenveld@kwekerij.nl";

    private const string ProductSpecifiek = "Tulp Mix";

    public static async Task Seed(IServiceProvider services)
    {
        ArgumentNullException.ThrowIfNull(services);

        using var scope = services.CreateScope();
        var provider = scope.ServiceProvider;

        var roleManager = provider.GetRequiredService<RoleManager<IdentityRole<int>>>();
        var userManager = provider.GetRequiredService<UserManager<Gebruiker>>();
        var dbContext   = provider.GetRequiredService<AppDbContext>();

        await EnsureRoles(roleManager);
        await EnsureUsers(userManager);

        await EnsureCategorie(dbContext);
        await EnsureVeiling(dbContext);

        await EnsureVeilingproducten(dbContext, userManager);
        await EnsureBiedingen(dbContext, userManager);
    }

    private static readonly (Gebruiker user, string password, string role)[] _gebruikers =
    [
        (
            new Gebruiker
            {
                BedrijfsNaam   = "Flora BV",
                Email          = EmailVeilingmeester,
                UserName       = EmailVeilingmeester,
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
                Email          = EmailKoper1,
                UserName       = EmailKoper1,
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
                Email          = EmailKwekerMario,
                UserName       = EmailKwekerMario,
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
                Email          = EmailKwekerGroen,
                UserName       = EmailKwekerGroen,
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
                Email          = EmailKoper2,
                UserName       = EmailKoper2,
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
                var result = await roleManager.CreateAsync(new IdentityRole<int> { Name = rolNaam });
                if (!result.Succeeded)
                {
                    throw new InvalidOperationException($"Kon rol '{rolNaam}' niet aanmaken: {string.Join(", ", result.Errors.Select(e => e.Description))}");
                }
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
                    throw new InvalidOperationException(
                        $"Kon user '{gebruiker.Email}' niet aanmaken: {string.Join(", ", createResult.Errors.Select(e => e.Description))}");
                }

                bestaand = gebruiker;
            }

            if (bestaand.GebruikerNr != bestaand.Id)
            {
                bestaand.GebruikerNr = bestaand.Id;
                var update = await userManager.UpdateAsync(bestaand);
                if (!update.Succeeded)
                {
                    throw new InvalidOperationException(
                        $"Kon user '{bestaand.Email}' niet updaten: {string.Join(", ", update.Errors.Select(e => e.Description))}");
                }
            }

            if (!await userManager.IsInRoleAsync(bestaand, role))
            {
                var addRole = await userManager.AddToRoleAsync(bestaand, role);
                if (!addRole.Succeeded)
                {
                    throw new InvalidOperationException(
                        $"Kon rol '{role}' niet toekennen aan '{bestaand.Email}': {string.Join(", ", addRole.Errors.Select(e => e.Description))}");
                }
            }
        }
    }

    private static async Task EnsureCategorie(AppDbContext dbContext)
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
            var bestaat = await dbContext.Categorieen.AnyAsync(c => c.Naam == categorie.Naam);
            if (!bestaat)
            {
                dbContext.Categorieen.Add(categorie);
            }
        }

        await dbContext.SaveChangesAsync();
    }
    
    private static async Task EnsureVeiling(AppDbContext dbContext)
    {
        var veilingBasis = DateTime.UtcNow.AddDays(-10);
        if (!await dbContext.Veiling.AnyAsync())
        {
            // Forceer start-id (SQL Server specifiek)
            await dbContext.Database.ExecuteSqlRawAsync("DBCC CHECKIDENT ('Veiling', RESEED, 200)");
        }

        var veilingen = new[]
        {
            new Veiling { VeilingNaam = "veiling001", Begintijd = veilingBasis.AddDays(1).AddHours(9),  Eindtijd = veilingBasis.AddDays(1).AddHours(10), Status = "active" },
            new Veiling { VeilingNaam = "veiling001", Begintijd = veilingBasis.AddDays(2).AddHours(10), Eindtijd = veilingBasis.AddDays(2).AddHours(11), Status = "active" },
            new Veiling { VeilingNaam = "veiling002", Begintijd = veilingBasis.AddDays(3).AddHours(12), Eindtijd = veilingBasis.AddDays(3).AddHours(13), Status = "active" },
            new Veiling { VeilingNaam = "veiling003", Begintijd = veilingBasis.AddDays(4).AddHours(14), Eindtijd = veilingBasis.AddDays(4).AddHours(15), Status = "active" }
        };

        foreach (var veiling in veilingen)
        {
            var bestaat = await dbContext.Veiling.AnyAsync(v =>
                v.VeilingNaam == veiling.VeilingNaam &&
                v.Begintijd == veiling.Begintijd &&
                v.Eindtijd == veiling.Eindtijd);

            if (!bestaat)
            {
                dbContext.Veiling.Add(veiling);
            }
        }

        await dbContext.SaveChangesAsync();
    }

    private static async Task EnsureVeilingproducten(AppDbContext dbContext, UserManager<Gebruiker> userManager)
    {
        var kwekerMario = await userManager.FindByEmailAsync(EmailKwekerMario);
        var kwekerGroen = await userManager.FindByEmailAsync(EmailKwekerGroen);

        if (kwekerMario == null) return;

        if (kwekerMario.GebruikerNr != kwekerMario.Id)
        {
            kwekerMario.GebruikerNr = kwekerMario.Id;
            await userManager.UpdateAsync(kwekerMario);
        }

        if (kwekerGroen != null && kwekerGroen.GebruikerNr != kwekerGroen.Id)
        {
            kwekerGroen.GebruikerNr = kwekerGroen.Id;
            await userManager.UpdateAsync(kwekerGroen);
        }

        var categories = await dbContext.Categorieen
            .ToDictionaryAsync(c => c.Naam, c => c.CategorieNr);

        var geplaatst = DateTime.UtcNow.AddDays(-6).AddHours(14);
        var startdag  = DateOnly.FromDateTime(geplaatst.Date.AddDays(1));

        var seedProducten = new[]
        {
            new Veilingproduct
            {
                Naam            = "Tulp Mix",
                GeplaatstDatum  = geplaatst,
                AantalFusten    = 10,
                VoorraadBloemen = 500,
                Startprijs      = 1200000,
                CategorieNr     = categories.GetValueOrDefault("Tulpen"),
                VeilingNr       = 200,
                Plaats          = "Aalsmeer",
                Minimumprijs    = 10,
                Kwekernr        = kwekerMario.Id,
                BeginDatum      = startdag,
                ImagePath       = "productBloemen/DecoratieveDahliaSunsetFlare.webp"
            },
            new Veilingproduct
            {
                Naam            = "Rode Roos",
                GeplaatstDatum  = geplaatst,
                AantalFusten    = 10,
                VoorraadBloemen = 300,
                Startprijs      = 2000000,
                CategorieNr     = categories.GetValueOrDefault("Rozen"),
                VeilingNr       = 201,
                Plaats          = "Eelde",
                Minimumprijs    = 15,
                Kwekernr        = kwekerMario.Id,
                BeginDatum      = startdag,
                ImagePath       = "productBloemen/EleganteTulpCrimsonGlory.webp"
            },
            new Veilingproduct
            {
                Naam            = "Zonnebloem Gold",
                GeplaatstDatum  = geplaatst.AddHours(1),
                AantalFusten    = 8,
                VoorraadBloemen = 400,
                Startprijs      = 950000,
                CategorieNr     = categories.GetValueOrDefault("Zonnebloem"),
                VeilingNr       = 202,
                Plaats          = "Aalsmeer",
                Minimumprijs    = 12,
                Kwekernr        = kwekerMario.Id,
                BeginDatum      = startdag,
                ImagePath       = "productBloemen/DecoratieveDahliaSunsetFlare.webp"
            },
            new Veilingproduct
            {
                Naam            = "Witte Lelie",
                GeplaatstDatum  = geplaatst.AddHours(2),
                AantalFusten    = 6,
                VoorraadBloemen = 240,
                Startprijs      = 1750000,
                CategorieNr     = categories.GetValueOrDefault("Lelie"),
                VeilingNr       = 202,
                Plaats          = "Naaldwijk",
                Minimumprijs    = 18,
                Kwekernr        = kwekerGroen?.Id ?? kwekerMario.Id,
                BeginDatum      = startdag,
                ImagePath       = "productBloemen/EleganteTulpCrimsonGlory.webp"
            },
            new Veilingproduct
            {
                Naam            = "Pioenroos Pastel",
                GeplaatstDatum  = geplaatst.AddHours(3),
                AantalFusten    = 5,
                VoorraadBloemen = 180,
                Startprijs      = 2200000,
                CategorieNr     = categories.GetValueOrDefault("Pioenroos"),
                VeilingNr       = 203,
                Plaats          = "Eelde",
                Minimumprijs    = 20,
                Kwekernr        = kwekerGroen?.Id ?? kwekerMario.Id,
                BeginDatum      = startdag,
                ImagePath       = "productBloemen/DecoratieveDahliaSunsetFlare.webp"
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
        var koper1 = await userManager.FindByEmailAsync(EmailKoper1);
        var koper2 = await userManager.FindByEmailAsync(EmailKoper2);

        if (koper1 == null) return;

        // 1) 10 biedingen alleen op 1 specifiek product (Tulp Mix)
        var product = await dbContext.Veilingproducten
            .AsNoTracking()
            .FirstOrDefaultAsync(vp => vp.Naam == ProductSpecifiek);

        if (product != null)
        {
            var productBiedingen = new[]
            {
                new Bieding { BedragPerFust = 11, AantalStuks = 2, GebruikerNr = koper1.Id,             VeilingproductNr = product.VeilingProductNr },
                new Bieding { BedragPerFust = 12, AantalStuks = 3, GebruikerNr = (koper2?.Id ?? koper1.Id), VeilingproductNr = product.VeilingProductNr },
                new Bieding { BedragPerFust = 13, AantalStuks = 1, GebruikerNr = koper1.Id,             VeilingproductNr = product.VeilingProductNr },
                new Bieding { BedragPerFust = 14, AantalStuks = 4, GebruikerNr = (koper2?.Id ?? koper1.Id), VeilingproductNr = product.VeilingProductNr },
                new Bieding { BedragPerFust = 15, AantalStuks = 2, GebruikerNr = koper1.Id,             VeilingproductNr = product.VeilingProductNr },
                new Bieding { BedragPerFust = 16, AantalStuks = 5, GebruikerNr = (koper2?.Id ?? koper1.Id), VeilingproductNr = product.VeilingProductNr },
                new Bieding { BedragPerFust = 17, AantalStuks = 3, GebruikerNr = koper1.Id,             VeilingproductNr = product.VeilingProductNr },
                new Bieding { BedragPerFust = 18, AantalStuks = 2, GebruikerNr = (koper2?.Id ?? koper1.Id), VeilingproductNr = product.VeilingProductNr },
                new Bieding { BedragPerFust = 19, AantalStuks = 6, GebruikerNr = koper1.Id,             VeilingproductNr = product.VeilingProductNr },
                new Bieding { BedragPerFust = 20, AantalStuks = 1, GebruikerNr = (koper2?.Id ?? koper1.Id), VeilingproductNr = product.VeilingProductNr },
            };

            await AddBidsIfMissing(dbContext, productBiedingen);
        }

        // 2) 10 biedingen alleen op producten van 1 specifieke kweker (Mario)
        var kwekerMario = await userManager.FindByEmailAsync(EmailKwekerMario);
        if (kwekerMario != null)
        {
            var marioProducten = await dbContext.Veilingproducten
                .AsNoTracking()
                .Where(vp => vp.Kwekernr == kwekerMario.Id)
                .OrderBy(vp => vp.VeilingProductNr)
                .ToListAsync();

            if (marioProducten.Count > 0)
            {
                // We verdelen 10 biedingen over Mario z'n producten (maar nog steeds 1 kweker)
                // Gebruik hogere bedragen zodat het niet botst met de "Tulp Mix"-set.
                Bieding MakeBid(int index, int bedrag, int aantal, int gebruikerId)
                {
                    var gekozenProduct = marioProducten[index % marioProducten.Count];
                    return new Bieding
                    {
                        BedragPerFust    = bedrag,
                        AantalStuks      = aantal,
                        GebruikerNr      = gebruikerId,
                        VeilingproductNr = gekozenProduct.VeilingProductNr
                    };
                }

                var koper2Id = koper2?.Id ?? koper1.Id;

                var kwekerBiedingen = new[]
                {
                    MakeBid(0, 31, 2, koper1.Id),
                    MakeBid(1, 32, 3, koper2Id),
                    MakeBid(2, 33, 1, koper1.Id),
                    MakeBid(3, 34, 4, koper2Id),
                    MakeBid(4, 35, 2, koper1.Id),
                    MakeBid(5, 36, 5, koper2Id),
                    MakeBid(6, 37, 3, koper1.Id),
                    MakeBid(7, 38, 2, koper2Id),
                    MakeBid(8, 39, 6, koper1.Id),
                    MakeBid(9, 40, 1, koper2Id),
                };

                await AddBidsIfMissing(dbContext, kwekerBiedingen);
            }
        }
    }

    // Voegt biedingen toe als ze nog niet bestaan.
    // Bestaat-check: VeilingproductNr + GebruikerNr + BedragPerFust.
    private static async Task AddBidsIfMissing(AppDbContext dbContext, Bieding[] biedingen)
    {
        foreach (var bieding in biedingen)
        {
            if (bieding.VeilingproductNr <= 0) continue;

            var bestaat = await dbContext.Biedingen.AnyAsync(b =>
                b.VeilingproductNr == bieding.VeilingproductNr &&
                b.GebruikerNr      == bieding.GebruikerNr &&
                b.BedragPerFust    == bieding.BedragPerFust);

            if (!bestaat)
            {
                dbContext.Biedingen.Add(bieding);
            }
        }

        await dbContext.SaveChangesAsync();
    }
}
