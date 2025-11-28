using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;

public static class DataSeeder
{
    public static async Task InitialiseerRollen(IServiceProvider serviceProvider)
    {
        // 1. Let op de <int> hier
        var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole<int>>>();

        string[] rollen = { "VeilingMeester", "Klant" };

        foreach (var rolNaam in rollen)
        {
            var rolBestaat = await roleManager.RoleExistsAsync(rolNaam);

            if (!rolBestaat)
            {
                // 2. Let op de <int> hier bij het aanmaken
                await roleManager.CreateAsync(new IdentityRole<int> { Name = rolNaam });
            }
        }
    }
}