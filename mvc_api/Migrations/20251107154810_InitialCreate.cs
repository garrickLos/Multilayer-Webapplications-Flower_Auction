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
                    Naam = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Email = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Wachtwoord = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    LaatstIngelogd = table.Column<DateTime>(type: "TEXT", nullable: true),
                    Soort = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Kvk = table.Column<string>(type: "TEXT", maxLength: 20, nullable: true),
                    StraatAdres = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    Postcode = table.Column<string>(type: "TEXT", maxLength: 10, nullable: true),
                    Assortiment = table.Column<int>(type: "INTEGER", nullable: true),
                    PersoneelsNr = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Gebruiker", x => x.GebruikerNr);
                });

            migrationBuilder.CreateTable(
                name: "Veilingproduct",
                columns: table => new
                {
                    VeilingProductNr = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Naam = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    GeplaatstDatum = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Fust = table.Column<int>(type: "INTEGER", nullable: false),
                    Voorraad = table.Column<int>(type: "INTEGER", nullable: false),
                    Startprijs = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    CategorieNr = table.Column<int>(type: "INTEGER", nullable: false)
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
                });

            migrationBuilder.CreateTable(
                name: "Veiling",
                columns: table => new
                {
                    VeilingNr = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Begintijd = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Eindtijd = table.Column<DateTime>(type: "TEXT", nullable: false),
                    VeilingProductNr = table.Column<int>(type: "INTEGER", nullable: false),
                    Status = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Veiling", x => x.VeilingNr);
                    table.ForeignKey(
                        name: "FK_Veiling_Veilingproduct_VeilingProductNr",
                        column: x => x.VeilingProductNr,
                        principalTable: "Veilingproduct",
                        principalColumn: "VeilingProductNr",
                        onDelete: ReferentialAction.Cascade);
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

            migrationBuilder.InsertData(
                table: "Categorie",
                columns: new[] { "CategorieNr", "Naam" },
                values: new object[,]
                {
                    { 1, "Tulpen" },
                    { 2, "Rozen" }
                });

            migrationBuilder.InsertData(
                table: "Gebruiker",
                columns: new[] { "GebruikerNr", "Assortiment", "Email", "Kvk", "LaatstIngelogd", "Naam", "PersoneelsNr", "Postcode", "Soort", "StraatAdres", "Wachtwoord" },
                values: new object[,]
                {
                    { 1, 12, "flora@example.nl", "12345678", new DateTime(2025, 10, 8, 12, 0, 0, 0, DateTimeKind.Utc), "Flora BV", "P1001", "1234AB", "Bedrijf", "Bloemig 10", "***" },
                    { 2, 0, "jan@example.nl", "00000000", new DateTime(2025, 10, 7, 13, 0, 0, 0, DateTimeKind.Utc), "Jan Jansen", "P0000", "2345BC", "Koper", "Laan 5", "***" }
                });

            migrationBuilder.InsertData(
                table: "Veilingproduct",
                columns: new[] { "VeilingProductNr", "CategorieNr", "Fust", "GeplaatstDatum", "Naam", "Startprijs", "Voorraad" },
                values: new object[,]
                {
                    { 101, 1, 10, new DateTime(2025, 10, 9, 14, 0, 0, 0, DateTimeKind.Utc), "Tulp Mix", 12m, 500 },
                    { 102, 2, 10, new DateTime(2025, 10, 9, 14, 0, 0, 0, DateTimeKind.Utc), "Rode Roos", 20m, 300 }
                });

            migrationBuilder.InsertData(
                table: "Veiling",
                columns: new[] { "VeilingNr", "Begintijd", "Eindtijd", "Status", "VeilingProductNr" },
                values: new object[,]
                {
                    { 201, new DateTime(2025, 10, 11, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2025, 10, 11, 1, 0, 0, 0, DateTimeKind.Utc), "active", 101 },
                    { 202, new DateTime(2025, 10, 11, 1, 0, 0, 0, DateTimeKind.Utc), new DateTime(2025, 10, 11, 2, 0, 0, 0, DateTimeKind.Utc), "active", 102 }
                });

            migrationBuilder.InsertData(
                table: "Bieding",
                columns: new[] { "BiedNr", "AantalStuks", "BedragPerFust", "GebruikerNr", "VeilingNr" },
                values: new object[,]
                {
                    { 1001, 5, 13.50m, 2, 201 },
                    { 1002, 3, 21.00m, 2, 202 }
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
                name: "IX_Veiling_VeilingProductNr",
                table: "Veiling",
                column: "VeilingProductNr");

            migrationBuilder.CreateIndex(
                name: "IX_Veilingproduct_CategorieNr_Naam",
                table: "Veilingproduct",
                columns: new[] { "CategorieNr", "Naam" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Bieding");

            migrationBuilder.DropTable(
                name: "Gebruiker");

            migrationBuilder.DropTable(
                name: "Veiling");

            migrationBuilder.DropTable(
                name: "Veilingproduct");

            migrationBuilder.DropTable(
                name: "Categorie");
        }
    }
}
