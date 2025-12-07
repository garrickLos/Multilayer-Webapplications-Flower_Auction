using System;
using Microsoft.AspNetCore.Identity;
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
                Email          = "flora@example.nl",
                UserName       = "flora@example.nl",
                LaatstIngelogd = new DateTime(2025, 10, 08, 12, 0, 0, DateTimeKind.Utc),
                Soort          = "Bedrijf",
                Kvk            = "12345678",
                StraatAdres    = "Bloemig 10",
                Postcode       = "1234AB"
            },
            "Test123!",
            "VeilingMeester"
        ),
        (
            new Gebruiker
            {
                BedrijfsNaam   = "Jan Jansen",
                Email          = "jan@example.nl",
                UserName       = "jan@example.nl",
                LaatstIngelogd = new DateTime(2025, 10, 07, 13, 0, 0, DateTimeKind.Utc),
                Soort          = "Koper",
                Kvk            = "00000000",
                StraatAdres    = "Laan 5",
                Postcode       = "2345BC"
            },
            "Test123!",
            "Klant"
        )
    ];

    public static async Task Seed(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var provider    = scope.ServiceProvider;

        var roleManager = provider.GetRequiredService<RoleManager<IdentityRole<int>>>();
        var userManager = provider.GetRequiredService<UserManager<Gebruiker>>();

        await EnsureRoles(roleManager);
        await EnsureUsers(userManager);
    }

    private static async Task EnsureRoles(RoleManager<IdentityRole<int>> roleManager)
    {
        string[] rollen = { "VeilingMeester", "Klant" };

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
}
