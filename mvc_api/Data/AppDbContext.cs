using System;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using mvc_api.Models;

namespace mvc_api.Data;

public class AppDbContext : IdentityDbContext<Gebruiker, IdentityRole<int>, int>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Gebruiker>      Gebruikers       => Set<Gebruiker>();
    public DbSet<Bieding>        Biedingen        => Set<Bieding>();
    public DbSet<Veilingproduct> Veilingproducten => Set<Veilingproduct>();
    public DbSet<Categorie>      Categorieen      => Set<Categorie>();
    public DbSet<Veiling>        Veilingen        => Set<Veiling>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);

        // Relaties
        b.Entity<Bieding>()
            .HasOne(x => x.Gebruiker)
            .WithMany(g => g.Biedingen)
            .HasForeignKey(x => x.GebruikerNr)
            .OnDelete(DeleteBehavior.Restrict);

        b.Entity<Bieding>()
            .HasOne(x => x.Veiling)
            .WithMany(v => v.Biedingen)
            .HasForeignKey(x => x.VeilingNr)
            .OnDelete(DeleteBehavior.Cascade);

        b.Entity<Veilingproduct>()
            .HasOne(vp => vp.Categorie)
            .WithMany(c => c.Veilingproducten)
            .HasForeignKey(vp => vp.CategorieNr)
            .OnDelete(DeleteBehavior.Restrict);

        b.Entity<Veiling>()
            .HasMany(v => v.Veilingproducten)
            .WithOne(p => p.Veiling)
            .HasForeignKey(p => p.VeilingNr)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexen
        b.Entity<Gebruiker>()
            .HasIndex(x => x.Email)
            .IsUnique();

        // Bewaar legacy kolomnaam "Wachtwoord" als shadow property zodat bestaande schema's geen kolommen verliezen.
        b.Entity<Gebruiker>()
            .Property<string?>("Wachtwoord")
            .HasMaxLength(200);

        b.Entity<Veilingproduct>()
            .HasIndex(x => new { x.CategorieNr, x.Naam });

        // Geld-precisie (Bieding/Veilingproduct via attributen, hier extra voor Minimumprijs)
        b.Entity<Veilingproduct>()
            .Property(v => v.Minimumprijs)
            .HasPrecision(18, 2);

        // Seed data (alle waarden statisch houden voor een deterministisch model)
        var loginD1   = new DateTime(2025, 10, 08, 12, 0, 0, DateTimeKind.Utc);
        var loginD2   = new DateTime(2025, 10, 07, 13, 0, 0, DateTimeKind.Utc);
        var geplaatst = new DateTime(2025, 10, 09, 14, 0, 0, DateTimeKind.Utc);
        var dag       = new DateTime(2025, 10, 10, 15, 0, 0, DateTimeKind.Utc);
        
        b.Entity<Gebruiker>().HasData(
            new Gebruiker
            {
                Id             = 1,
                GebruikerNr    = 1,
                BedrijfsNaam   = "Flora BV",
                Email          = "flora@example.nl",
                NormalizedEmail = "FLORA@EXAMPLE.NL",
                UserName       = "flora@example.nl",
                NormalizedUserName = "FLORA@EXAMPLE.NL",
                LaatstIngelogd = loginD1,
                Soort          = "Bedrijf",
                Kvk            = "12345678",
                StraatAdres    = "Bloemig 10",
                Postcode       = "1234AB",
                SecurityStamp  = "STATIC-USER-1",
                ConcurrencyStamp = "STATIC-CONC-1"
            },
            new Gebruiker
            {
                Id             = 2,
                GebruikerNr    = 2,
                BedrijfsNaam   = "Jan Jansen",
                Email          = "jan@example.nl",
                NormalizedEmail = "JAN@EXAMPLE.NL",
                UserName       = "jan@example.nl",
                NormalizedUserName = "JAN@EXAMPLE.NL",
                LaatstIngelogd = loginD2,
                Soort          = "Koper",
                Kvk            = "00000000",
                StraatAdres    = "Laan 5",
                Postcode       = "2345BC",
                SecurityStamp  = "STATIC-USER-2",
                ConcurrencyStamp = "STATIC-CONC-2"
            }
        );

        b.Entity<Categorie>().HasData(
            new Categorie { CategorieNr = 1, Naam = "Tulpen" },
            new Categorie { CategorieNr = 2, Naam = "Rozen" },
            new Categorie { CategorieNr = 3, Naam = "Lelie" },
            new Categorie { CategorieNr = 4, Naam = "Zonnebloem" },
            new Categorie { CategorieNr = 5, Naam = "Chrysant" },
            new Categorie { CategorieNr = 6, Naam = "Pioenroos" }
        );

        b.Entity<Veiling>().HasData(
            new Veiling
            {
                VeilingNr    = 201,
                VeilingNaam  = "veiling001",
                Begintijd    = dag.AddHours(9),
                Eindtijd     = dag.AddHours(10),
                Status       = "active",
            },
            new Veiling
            {
                VeilingNr    = 202,
                VeilingNaam  = "veiling001",
                Begintijd    = dag.AddHours(10),
                Eindtijd     = dag.AddHours(11),
                Status       = "active"
            }
        );

        b.Entity<Veilingproduct>().HasData(
            new Veilingproduct
            {
                VeilingProductNr = 101,
                Naam             = "Tulp Mix",
                GeplaatstDatum   = geplaatst,
                AantalFusten     = 10,
                VoorraadBloemen  = 500,
                Startprijs       = 12m,
                CategorieNr      = 1,
                VeilingNr        = 201,
                Plaats           = " Aalsmeer",
                Minimumprijs     = 10,
                Kwekernr         = 1,
                ImagePath        = "../../src/assets/pictures/productBloemen/DecoratieveDahliaSunsetFlare.webp"
            },
            new Veilingproduct
            {
                VeilingProductNr = 102,
                Naam             = "Rode Roos",
                GeplaatstDatum   = geplaatst,
                AantalFusten     = 10,
                VoorraadBloemen  = 300,
                Startprijs       = 20m,
                CategorieNr      = 2,
                VeilingNr        = 202,
                Plaats           = "Eelde",
                Minimumprijs     = 15,
                Kwekernr         = 1,
                ImagePath        = "../../src/assets/pictures/productBloemen/EleganteTulpCrimsonGlory.webp"
            }
        );

        b.Entity<Bieding>().HasData(
            new Bieding
            {
                BiedNr        = 1001,
                BedragPerFust = 13,
                AantalStuks   = 5,
                GebruikerNr   = 2,
                VeilingNr     = 201
            },
            new Bieding
            {
                BiedNr        = 1002,
                BedragPerFust = 21,
                AantalStuks   = 3,
                GebruikerNr   = 2,
                VeilingNr     = 202
            }
        );
    }
}
