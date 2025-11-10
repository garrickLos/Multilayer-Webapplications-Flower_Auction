using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;

public class FloraHolidayContext : DbContext
{
    public DbSet<Gebruiker> Gebruikers { get; set; }
    public DbSet<Bieding> Biedingen { get; set; }
    public DbSet<Veilingproduct> Veilingproducten { get; set; }
    public DbSet<Veiling> Veilingen { get; set; }
    public DbSet<Categorie> Categorieën { get; set; }

    public string DbPath { get; }

    public FloraHolidayContext()
    {
    }

    protected override void OnConfiguring(DbContextOptionsBuilder options)
        => options.UseSqlServer("Server=HIER MOET JE SERVER NAAM;Database=FloraHoliday;Trusted_Connection=True;trustservercertificate=True");


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // === Gebruiker ===
        modelBuilder.Entity<Gebruiker>(entity =>
        {
            entity.HasKey(g => g.GebruikerId);

            entity.HasIndex(g => g.Email).IsUnique();

            entity.Property(g => g.Kvk)
                .HasColumnType("char(1)"); // aangepast: char ipv string

            entity.Property(g => g.Postcode)
                .HasColumnType("char(1)");

            entity.Property(g => g.PersoneelsNr)
                .HasColumnType("char(1)");

            entity.Property(g => g.LaatstIngelogd)
                .HasDefaultValueSql("GETDATE()");
        });

        // === Bieding ===
        modelBuilder.Entity<Bieding>(entity =>
        {
            entity.HasKey(b => b.BiedingId);

            entity.Property(b => b.BedragPE)
                .HasColumnType("decimal(4,2)");

            entity.HasOne(b => b.Gebruiker)
                .WithMany(g => g.Biedingen)
                .HasForeignKey(b => b.GebruikerNummer)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(b => b.Veiling)
                .WithMany() // geen collectie in Veiling
                .HasForeignKey(b => b.VeilingNummer)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // === Categorie ===
        modelBuilder.Entity<Categorie>(entity => { entity.HasKey(c => c.CategorieId); });

        // === Veilingproduct ===
        modelBuilder.Entity<Veilingproduct>(entity =>
        {
            entity.HasKey(vp => vp.VeilingproductId);

            // GeplaatstDatum = DateOnly → moet omgezet worden
            entity.Property(vp => vp.GeplaatstDatum)
                .HasConversion(
                    d => d.ToDateTime(TimeOnly.MinValue),
                    dt => DateOnly.FromDateTime(dt))
                .HasColumnType("date");

            entity.HasOne(vp => vp.Categorie)
                .WithMany(c => c.Veilingproducten)
                .HasForeignKey(vp => vp.CategorieNummer)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(vp => vp.veiling)
                .WithOne(v => v.Veilingproduct)
                .HasForeignKey<Veiling>(v => v.VeilingproductNummer);
        });

        // === Veiling ===
        modelBuilder.Entity<Veiling>(entity =>
        {
            entity.HasKey(v => v.VeilingId);

            // TimeOnly conversie
            entity.Property(v => v.Begintijd)
                .HasConversion(
                    t => t.HasValue ? t.Value.ToTimeSpan() : (TimeSpan?)null,
                    ts => ts.HasValue ? TimeOnly.FromTimeSpan(ts.Value) : (TimeOnly?)null)
                .HasColumnType("time");

            entity.Property(v => v.Endtijd)
                .HasConversion(
                    t => t.HasValue ? t.Value.ToTimeSpan() : (TimeSpan?)null,
                    ts => ts.HasValue ? TimeOnly.FromTimeSpan(ts.Value) : (TimeOnly?)null)
                .HasColumnType("time");
        });
    }
}



public class Gebruiker
{
    public int GebruikerId { get; set; }
    public string Naam { get; set; }
    public string Email { get; set; }
    public string Wachtwoord { get; set; }
    public DateTime LaatstIngelogd { get; set; }
    public string Soort { get; set; }
    public char Kvk { get; set; }
    public string StraatAdres { get; set; }
    public char Postcode { get; set; }
    public int Assortiment { get; set; }
    public char PersoneelsNr { get; set; }

    public ICollection<Bieding> Biedingen { get; set; }
}

public class Bieding
{
    public int BiedingId { get; set; }
    public decimal BedragPE { get; set; }
    public int AantalStuks { get; set; }
    
    public int GebruikerNummer { get; set; } //foreign key van gebruiker
    public Gebruiker Gebruiker { get; set; } //Navigeert naar Gebruiker (lijkt of FOREIGN KEY(GebruikerNr) REFRENCES Gebruiker(GebruikerId)
    
    public int VeilingNummer { get; set; } //foreign key van veilingproduct
    public Veiling Veiling { get; set; } //verwijst naar veilingproduct
}

public class Veilingproduct
{
    public int  VeilingproductId { get; set; } //DIT MOET AANGEPAST WORDEN NAAR INT IDENTITY(1, 1)
    public string Naam { get; set; }
    public DateOnly GeplaatstDatum { get; set; }
    public int Fust { get; set; }
    public int Voorraad { get; set; }
    public int Startprijs { get; set; }
    
    public int CategorieNummer { get; set; } //foreign key van categorie
    public Categorie Categorie { get; set; } //verwijst naar categorie

    public ICollection<Bieding> Biedingen { get; set; }
    
    public Veiling veiling { get; set; } //een op een relatie met veiling
}

public class Categorie
{
    public int CategorieId { get; set; }
    public string Naam { get; set; }

    public ICollection<Veilingproduct> Veilingproducten { get; set; }
}

public class Veiling
{
    public int VeilingId { get; set; }
    public TimeOnly? Begintijd { get; set; }
    public TimeOnly? Endtijd { get; set; }
    
    public int VeilingproductNummer { get; set; } //foreign key veilingproduct
    public Veilingproduct Veilingproduct { get; set; } //verwijst naar veilingproduct
}