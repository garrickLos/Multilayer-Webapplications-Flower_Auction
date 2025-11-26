using Microsoft.AspNetCore.Identity;

public static class DataSeeder
{
    // Deze methode controleert en maakt de rollen aan
    public static async Task InitialiseerRollen(IServiceProvider serviceProvider)
    {
        // Haal de RoleManager service op uit de container
        var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();

        // Definieer de rollen die je wilt hebben
        string[] rollen = { "VeilingMeester", "Klant" };

        foreach (var rolNaam in rollen)
        {
            // Check of de rol al bestaat in de database
            var rolBestaat = await roleManager.RoleExistsAsync(rolNaam);

            if (!rolBestaat)
            {
                // De rol bestaat niet, dus we maken hem aan
                await roleManager.CreateAsync(new IdentityRole(rolNaam));
            }
        }
    }
}