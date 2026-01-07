using System;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using mvc_api.Models;

namespace mvc_api.Data;

public class AppDbContext : IdentityDbContext<Gebruiker, IdentityRole<int>, int>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
    public DbSet<RefreshToken>  RefreshTokens { get; set; }

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
            .HasOne(x => x.Veilingproduct)
            .WithMany(v => v.Biedingen)
            .HasForeignKey(x => x.VeilingproductNr)
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
            .OnDelete(DeleteBehavior.SetNull);

        // Indexen en status-mapping
        b.Entity<Gebruiker>()
            .HasIndex(x => x.Email)
            .IsUnique();

        b.Entity<Gebruiker>()
            .Property(x => x.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(ModelStatus.Active);

        b.Entity<Veilingproduct>()
            .HasIndex(x => new { x.CategorieNr, x.Naam });

        b.Entity<Veilingproduct>()
            .Property(x => x.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(ModelStatus.Active);

        // Geld-precisie (Bieding/Veilingproduct via attributen, hier extra voor Minimumprijs)
        b.Entity<Veilingproduct>()
            .Property(v => v.Minimumprijs)
            .HasPrecision(18, 2);

        b.Entity<Veilingproduct>()
            .Property(v => v.Startprijs)
            .HasPrecision(18, 2);
    }
}
