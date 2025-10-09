using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EFGetStarted.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Categorieën",
                columns: table => new
                {
                    CategorieId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Naam = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Categorieën", x => x.CategorieId);
                });

            migrationBuilder.CreateTable(
                name: "Gebruikers",
                columns: table => new
                {
                    GebruikerId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Naam = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Wachtwoord = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LaatstIngelogd = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETDATE()"),
                    Soort = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Kvk = table.Column<string>(type: "char(1)", nullable: false),
                    StraatAdres = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Postcode = table.Column<string>(type: "char(1)", nullable: false),
                    Assortiment = table.Column<int>(type: "int", nullable: false),
                    PersoneelsNr = table.Column<string>(type: "char(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Gebruikers", x => x.GebruikerId);
                });

            migrationBuilder.CreateTable(
                name: "Veilingproducten",
                columns: table => new
                {
                    VeilingproductId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Naam = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    GeplaatstDatum = table.Column<DateTime>(type: "date", nullable: false),
                    Fust = table.Column<int>(type: "int", nullable: false),
                    Voorraad = table.Column<int>(type: "int", nullable: false),
                    Startprijs = table.Column<int>(type: "int", nullable: false),
                    CategorieNummer = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Veilingproducten", x => x.VeilingproductId);
                    table.ForeignKey(
                        name: "FK_Veilingproducten_Categorieën_CategorieNummer",
                        column: x => x.CategorieNummer,
                        principalTable: "Categorieën",
                        principalColumn: "CategorieId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Veilingen",
                columns: table => new
                {
                    VeilingId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Begintijd = table.Column<TimeSpan>(type: "time", nullable: true),
                    Endtijd = table.Column<TimeSpan>(type: "time", nullable: true),
                    VeilingproductNummer = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Veilingen", x => x.VeilingId);
                    table.ForeignKey(
                        name: "FK_Veilingen_Veilingproducten_VeilingproductNummer",
                        column: x => x.VeilingproductNummer,
                        principalTable: "Veilingproducten",
                        principalColumn: "VeilingproductId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Biedingen",
                columns: table => new
                {
                    BiedingId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BedragPE = table.Column<decimal>(type: "decimal(4,2)", nullable: false),
                    AantalStuks = table.Column<int>(type: "int", nullable: false),
                    GebruikerNummer = table.Column<int>(type: "int", nullable: false),
                    VeilingNummer = table.Column<int>(type: "int", nullable: false),
                    VeilingproductId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Biedingen", x => x.BiedingId);
                    table.ForeignKey(
                        name: "FK_Biedingen_Gebruikers_GebruikerNummer",
                        column: x => x.GebruikerNummer,
                        principalTable: "Gebruikers",
                        principalColumn: "GebruikerId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Biedingen_Veilingen_VeilingNummer",
                        column: x => x.VeilingNummer,
                        principalTable: "Veilingen",
                        principalColumn: "VeilingId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Biedingen_Veilingproducten_VeilingproductId",
                        column: x => x.VeilingproductId,
                        principalTable: "Veilingproducten",
                        principalColumn: "VeilingproductId");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Biedingen_GebruikerNummer",
                table: "Biedingen",
                column: "GebruikerNummer");

            migrationBuilder.CreateIndex(
                name: "IX_Biedingen_VeilingNummer",
                table: "Biedingen",
                column: "VeilingNummer");

            migrationBuilder.CreateIndex(
                name: "IX_Biedingen_VeilingproductId",
                table: "Biedingen",
                column: "VeilingproductId");

            migrationBuilder.CreateIndex(
                name: "IX_Gebruikers_Email",
                table: "Gebruikers",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Veilingen_VeilingproductNummer",
                table: "Veilingen",
                column: "VeilingproductNummer",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Veilingproducten_CategorieNummer",
                table: "Veilingproducten",
                column: "CategorieNummer");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Biedingen");

            migrationBuilder.DropTable(
                name: "Gebruikers");

            migrationBuilder.DropTable(
                name: "Veilingen");

            migrationBuilder.DropTable(
                name: "Veilingproducten");

            migrationBuilder.DropTable(
                name: "Categorieën");
        }
    }
}
