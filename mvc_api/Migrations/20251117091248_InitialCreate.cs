using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace mvc_api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Categorie",
                columns: table => new
                {
                    CategorieNr = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Naam = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Categorie", x => x.CategorieNr);
                });

            migrationBuilder.CreateTable(
                name: "Gebruiker",
                columns: table => new
                {
                    GebruikerNr = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    BedrijfsNaam = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Email = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Wachtwoord = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    LaatstIngelogd = table.Column<DateTime>(type: "TEXT", nullable: true),
                    Soort = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Kvk = table.Column<string>(type: "TEXT", maxLength: 20, nullable: true),
                    StraatAdres = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    Postcode = table.Column<string>(type: "TEXT", maxLength: 10, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Gebruiker", x => x.GebruikerNr);
                });

            migrationBuilder.CreateTable(
                name: "Veiling",
                columns: table => new
                {
                    VeilingNr = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    VeilingNaam = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Begintijd = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Eindtijd = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Veiling", x => x.VeilingNr);
                });

            migrationBuilder.CreateTable(
                name: "Bieding",
                columns: table => new
                {
                    BiedNr = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    BedragPerFust = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    AantalStuks = table.Column<int>(type: "INTEGER", nullable: false),
                    GebruikerNr = table.Column<int>(type: "INTEGER", nullable: false),
                    VeilingNr = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Bieding", x => x.BiedNr);
                    table.ForeignKey(
                        name: "FK_Bieding_Gebruiker_GebruikerNr",
                        column: x => x.GebruikerNr,
                        principalTable: "Gebruiker",
                        principalColumn: "GebruikerNr",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Bieding_Veiling_VeilingNr",
                        column: x => x.VeilingNr,
                        principalTable: "Veiling",
                        principalColumn: "VeilingNr",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Veilingproduct",
                columns: table => new
                {
                    VeilingProductNr = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Naam = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    GeplaatstDatum = table.Column<DateTime>(type: "TEXT", nullable: false),
                    AantalFusten = table.Column<int>(type: "INTEGER", nullable: false),
                    VoorraadBloemen = table.Column<int>(type: "INTEGER", nullable: false),
                    Startprijs = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    CategorieNr = table.Column<int>(type: "INTEGER", nullable: false),
                    VeilingNr = table.Column<int>(type: "INTEGER", nullable: false),
                    Plaats = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Minimumprijs = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    Kwekernr = table.Column<int>(type: "INTEGER", nullable: false),
                    beginDatum = table.Column<DateTime>(type: "TEXT", nullable: false),
                    status = table.Column<bool>(type: "INTEGER", nullable: false),
                    ImagePath = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Veilingproduct", x => x.VeilingProductNr);
                    table.ForeignKey(
                        name: "FK_Veilingproduct_Categorie_CategorieNr",
                        column: x => x.CategorieNr,
                        principalTable: "Categorie",
                        principalColumn: "CategorieNr",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Veilingproduct_Gebruiker_Kwekernr",
                        column: x => x.Kwekernr,
                        principalTable: "Gebruiker",
                        principalColumn: "GebruikerNr",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Veilingproduct_Veiling_VeilingNr",
                        column: x => x.VeilingNr,
                        principalTable: "Veiling",
                        principalColumn: "VeilingNr",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Categorie",
                columns: new[] { "CategorieNr", "Naam" },
                values: new object[,]
                {
                    { 1, "Tulpen" },
                    { 2, "Rozen" },
                    { 3, "Lelie" },
                    { 4, "Zonnebloem" },
                    { 5, "Chrysant" },
                    { 6, "Pioenroos" }
                });

            migrationBuilder.InsertData(
                table: "Gebruiker",
                columns: new[] { "GebruikerNr", "BedrijfsNaam", "Email", "Kvk", "LaatstIngelogd", "Postcode", "Soort", "StraatAdres", "Wachtwoord" },
                values: new object[,]
                {
                    { 1, "Flora BV", "flora@example.nl", "12345678", new DateTime(2025, 10, 8, 12, 0, 0, 0, DateTimeKind.Utc), "1234AB", "Bedrijf", "Bloemig 10", "***" },
                    { 2, "Jan Jansen", "jan@example.nl", "00000000", new DateTime(2025, 10, 7, 13, 0, 0, 0, DateTimeKind.Utc), "2345BC", "Koper", "Laan 5", "***" }
                });

            migrationBuilder.InsertData(
                table: "Veiling",
                columns: new[] { "VeilingNr", "Begintijd", "Eindtijd", "Status", "VeilingNaam" },
                values: new object[,]
                {
                    { 201, new DateTime(2025, 10, 11, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2025, 10, 11, 1, 0, 0, 0, DateTimeKind.Utc), "active", "veiling001" },
                    { 202, new DateTime(2025, 10, 11, 1, 0, 0, 0, DateTimeKind.Utc), new DateTime(2025, 10, 11, 2, 0, 0, 0, DateTimeKind.Utc), "active", "veiling001" }
                });

            migrationBuilder.InsertData(
                table: "Bieding",
                columns: new[] { "BiedNr", "AantalStuks", "BedragPerFust", "GebruikerNr", "VeilingNr" },
                values: new object[,]
                {
                    { 1001, 5, 13.50m, 2, 201 },
                    { 1002, 3, 21.00m, 2, 202 }
                });

            migrationBuilder.InsertData(
                table: "Veilingproduct",
                columns: new[] { "VeilingProductNr", "AantalFusten", "CategorieNr", "GeplaatstDatum", "ImagePath", "Kwekernr", "Minimumprijs", "Naam", "Plaats", "Startprijs", "VeilingNr", "VoorraadBloemen", "beginDatum", "status" },
                values: new object[,]
                {
                    { 101, 10, 1, new DateTime(2025, 10, 9, 14, 0, 0, 0, DateTimeKind.Utc), "../../src/assets/pictures/productBloemen/DecoratieveDahliaSunsetFlare.webp", 1, 10m, "Tulp Mix", " Aalsmeer", 12m, 201, 500, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false },
                    { 102, 10, 2, new DateTime(2025, 10, 9, 14, 0, 0, 0, DateTimeKind.Utc), "../../src/assets/pictures/productBloemen/EleganteTulpCrimsonGlory.webp", 1, 15m, "Rode Roos", "Eelde", 20m, 202, 300, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Bieding_GebruikerNr",
                table: "Bieding",
                column: "GebruikerNr");

            migrationBuilder.CreateIndex(
                name: "IX_Bieding_VeilingNr",
                table: "Bieding",
                column: "VeilingNr");

            migrationBuilder.CreateIndex(
                name: "IX_Gebruiker_Email",
                table: "Gebruiker",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Veilingproduct_CategorieNr_Naam",
                table: "Veilingproduct",
                columns: new[] { "CategorieNr", "Naam" });

            migrationBuilder.CreateIndex(
                name: "IX_Veilingproduct_Kwekernr",
                table: "Veilingproduct",
                column: "Kwekernr");

            migrationBuilder.CreateIndex(
                name: "IX_Veilingproduct_VeilingNr",
                table: "Veilingproduct",
                column: "VeilingNr");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Bieding");

            migrationBuilder.DropTable(
                name: "Veilingproduct");

            migrationBuilder.DropTable(
                name: "Categorie");

            migrationBuilder.DropTable(
                name: "Gebruiker");

            migrationBuilder.DropTable(
                name: "Veiling");
        }
    }
}
