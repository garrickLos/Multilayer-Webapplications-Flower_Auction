using Microsoft.EntityFrameworkCore;
using mvc_api.Models;

namespace mvc_api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Gebruiker> Gebruikers => Set<Gebruiker>();
        public DbSet<Bieding> Biedingen => Set<Bieding>();
        public DbSet<Veilingproduct> Veilingproducten => Set<Veilingproduct>();
        public DbSet<Categorie> Categorieen => Set<Categorie>();
        public DbSet<Veiling> Veilingen => Set<Veiling>();

        protected override void OnModelCreating(ModelBuilder b)
        {
            // ----------------------------
            // Tabelnamen
            // ----------------------------
            b.Entity<Gebruiker>().ToTable("Gebruiker");
            b.Entity<Bieding>().ToTable("Bieding");
            b.Entity<Veilingproduct>().ToTable("Veilingproduct");
            b.Entity<Categorie>().ToTable("Categorie");
            b.Entity<Veiling>().ToTable("Veiling");

            // ----------------------------
            // Keys + identity/auto-increment
            // ----------------------------
            b.Entity<Gebruiker>().HasKey(x => x.GebruikerNr);
            b.Entity<Bieding>().HasKey(x => x.BiedNr);
            b.Entity<Veilingproduct>().HasKey(x => x.VeilingNr);
            b.Entity<Categorie>().HasKey(x => x.CategorieNr);
            b.Entity<Veiling>().HasKey(x => x.VeilingNr);

            b.Entity<Gebruiker>().Property(x => x.GebruikerNr).ValueGeneratedOnAdd();
            b.Entity<Bieding>().Property(x => x.BiedNr).ValueGeneratedOnAdd();
            b.Entity<Veilingproduct>().Property(x => x.VeilingNr).ValueGeneratedOnAdd();
            b.Entity<Categorie>().Property(x => x.CategorieNr).ValueGeneratedOnAdd();
            b.Entity<Veiling>().Property(x => x.VeilingNr).ValueGeneratedOnAdd();

            // ----------------------------
            // Relaties
            // ----------------------------
            b.Entity<Bieding>()
                .HasOne(x => x.Gebruiker)
                .WithMany(g => g.Biedingen!)
                .HasForeignKey(x => x.GebruikerNr)
                .OnDelete(DeleteBehavior.Restrict);

            // Bieding.VeilingNr -> Veilingproduct.VeilingNr
            b.Entity<Bieding>()
                .HasOne(x => x.Veiling)
                .WithMany(v => v.Biedingen)
                .HasForeignKey(x => x.VeilingNr)
                .OnDelete(DeleteBehavior.Cascade);

            b.Entity<Veilingproduct>()
                .HasOne(vp => vp.Categorie)
                .WithMany(c => c.Veilingproducten!)
                .HasForeignKey(vp => vp.CategorieNr)
                .OnDelete(DeleteBehavior.Restrict);

            // Veiling.VeilingProduct -> Veilingproduct.VeilingNr
            b.Entity<Veiling>()
                .HasOne(v => v.Veilingproduct)
                .WithMany(p => p.Veilingen!)
                .HasForeignKey(v => v.VeilingProduct)
                .OnDelete(DeleteBehavior.Cascade);

            // ----------------------------
            // Indexen
            // ----------------------------
            b.Entity<Gebruiker>().HasIndex(x => x.Email).IsUnique();
            b.Entity<Veilingproduct>().HasIndex(x => new { x.CategorieNr, x.Naam });

            // ----------------------------
            // Geld-precisie
            // ----------------------------
            b.Entity<Bieding>().Property(x => x.BedragPerFust).HasPrecision(18, 2);
            b.Entity<Veilingproduct>().Property(x => x.Startprijs).HasPrecision(18, 2);

            // ----------------------------
            // Seed data (ALLEEN statische waarden!)
            // ----------------------------
            var loginD1 = new DateTime(2025, 10, 08, 0, 0, 0, DateTimeKind.Utc);
            var loginD2 = new DateTime(2025, 10, 07, 0, 0, 0, DateTimeKind.Utc);
            var geplaatst = new DateTime(2025, 10, 09, 0, 0, 0, DateTimeKind.Utc);

            b.Entity<Gebruiker>().HasData(
                new Gebruiker {
                    GebruikerNr = 1, Naam = "Flora BV", Email = "flora@example.nl",
                    Wachtwoord = "***", LaatstIngelogd = loginD1,
                    Soort = "Bedrijf", Kvk = "12345678", StraatAdres = "Bloemig 10",
                    Postcode = "1234AB", Assortiment = 12, PersoneelsNr = "P1001"
                },
                new Gebruiker {
                    GebruikerNr = 2, Naam = "Jan Jansen", Email = "jan@example.nl",
                    Wachtwoord = "***", LaatstIngelogd = loginD2,
                    Soort = "Koper", Kvk = "00000000", StraatAdres = "Laan 5",
                    Postcode = "2345BC", Assortiment = 0, PersoneelsNr = "P0000"
                }
            );

            b.Entity<Categorie>().HasData(
                new Categorie { CategorieNr = 1, Naam = "Tulpen" },
                new Categorie { CategorieNr = 2, Naam = "Rozen" }
            );

            b.Entity<Veilingproduct>().HasData(
                new Veilingproduct {
                    VeilingNr = 101, Naam = "Tulp Mix", GeplaatstDatum = geplaatst,
                    Fust = 10, Voorraad = 500, Startprijs = 12m, CategorieNr = 1
                },
                new Veilingproduct {
                    VeilingNr = 102, Naam = "Rode Roos", GeplaatstDatum = geplaatst,
                    Fust = 10, Voorraad = 300, Startprijs = 20m, CategorieNr = 2
                }
            );

            // Veiling gebruikt nu DateTime? ipv TimeSpan?
            var dag = new DateTime(2025, 10, 10, 0, 0, 0, DateTimeKind.Utc);
            b.Entity<Veiling>().HasData(
                new Veiling {
                    VeilingNr = 201,
                    Begintijd = dag.AddHours(9),
                    Eindtijd  = dag.AddHours(10),
                    VeilingProduct = 101
                },
                new Veiling {
                    VeilingNr = 202,
                    Begintijd = dag.AddHours(10),
                    Eindtijd  = dag.AddHours(11),
                    VeilingProduct = 102
                }
            );

            b.Entity<Bieding>().HasData(
                new Bieding {
                    BiedNr = 1001, BedragPerFust = 13.50m, AantalStuks = 5,
                    GebruikerNr = 2, VeilingNr = 201 // was 101
                },
                new Bieding {
                    BiedNr = 1002, BedragPerFust = 21.00m, AantalStuks = 3,
                    GebruikerNr = 2, VeilingNr = 202 // was 102
                }
            );
        }
    }
}
