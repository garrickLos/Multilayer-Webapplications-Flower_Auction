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
                name: "AspNetRoles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    NormalizedName = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUsers",
                columns: table => new
                {
                    GebruikerNr = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    BedrijfsNaam = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Email = table.Column<string>(type: "TEXT", maxLength: 256, nullable: false),
                    LaatstIngelogd = table.Column<DateTime>(type: "TEXT", nullable: true),
                    Soort = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Kvk = table.Column<string>(type: "TEXT", maxLength: 20, nullable: true),
                    StraatAdres = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    Postcode = table.Column<string>(type: "TEXT", maxLength: 10, nullable: true),
                    UserName = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    NormalizedUserName = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    NormalizedEmail = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    EmailConfirmed = table.Column<bool>(type: "INTEGER", nullable: false),
                    PasswordHash = table.Column<string>(type: "TEXT", nullable: true),
                    SecurityStamp = table.Column<string>(type: "TEXT", nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "TEXT", nullable: true),
                    PhoneNumber = table.Column<string>(type: "TEXT", nullable: true),
                    PhoneNumberConfirmed = table.Column<bool>(type: "INTEGER", nullable: false),
                    TwoFactorEnabled = table.Column<bool>(type: "INTEGER", nullable: false),
                    LockoutEnd = table.Column<DateTimeOffset>(type: "TEXT", nullable: true),
                    LockoutEnabled = table.Column<bool>(type: "INTEGER", nullable: false),
                    AccessFailedCount = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUsers", x => x.GebruikerNr);
                });

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
                name: "AspNetRoleClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    RoleId = table.Column<int>(type: "INTEGER", nullable: false),
                    ClaimType = table.Column<string>(type: "TEXT", nullable: true),
                    ClaimValue = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoleClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetRoleClaims_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    ClaimType = table.Column<string>(type: "TEXT", nullable: true),
                    ClaimValue = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetUserClaims_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "GebruikerNr",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserLogins",
                columns: table => new
                {
                    LoginProvider = table.Column<string>(type: "TEXT", nullable: false),
                    ProviderKey = table.Column<string>(type: "TEXT", nullable: false),
                    ProviderDisplayName = table.Column<string>(type: "TEXT", nullable: true),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserLogins", x => new { x.LoginProvider, x.ProviderKey });
                    table.ForeignKey(
                        name: "FK_AspNetUserLogins_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "GebruikerNr",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserRoles",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    RoleId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserRoles", x => new { x.UserId, x.RoleId });
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "GebruikerNr",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserTokens",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    LoginProvider = table.Column<string>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Value = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserTokens", x => new { x.UserId, x.LoginProvider, x.Name });
                    table.ForeignKey(
                        name: "FK_AspNetUserTokens_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "GebruikerNr",
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
                    Minimumprijs = table.Column<int>(type: "INTEGER", precision: 18, scale: 2, nullable: false),
                    Kwekernr = table.Column<int>(type: "INTEGER", nullable: false),
                    beginDatum = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    status = table.Column<bool>(type: "INTEGER", nullable: false),
                    ImagePath = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Veilingproduct", x => x.VeilingProductNr);
                    table.ForeignKey(
                        name: "FK_Veilingproduct_AspNetUsers_Kwekernr",
                        column: x => x.Kwekernr,
                        principalTable: "AspNetUsers",
                        principalColumn: "GebruikerNr",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Veilingproduct_Categorie_CategorieNr",
                        column: x => x.CategorieNr,
                        principalTable: "Categorie",
                        principalColumn: "CategorieNr",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Veilingproduct_Veiling_VeilingNr",
                        column: x => x.VeilingNr,
                        principalTable: "Veiling",
                        principalColumn: "VeilingNr",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Bieding",
                columns: table => new
                {
                    BiedNr = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    BedragPerFust = table.Column<int>(type: "INTEGER", nullable: false),
                    AantalStuks = table.Column<int>(type: "INTEGER", nullable: false),
                    GebruikerNr = table.Column<int>(type: "INTEGER", nullable: false),
                    VeilingNr = table.Column<int>(type: "INTEGER", nullable: false),
                    VeilingproductNr = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Bieding", x => x.BiedNr);
                    table.ForeignKey(
                        name: "FK_Bieding_AspNetUsers_GebruikerNr",
                        column: x => x.GebruikerNr,
                        principalTable: "AspNetUsers",
                        principalColumn: "GebruikerNr",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Bieding_Veiling_VeilingNr",
                        column: x => x.VeilingNr,
                        principalTable: "Veiling",
                        principalColumn: "VeilingNr",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Bieding_Veilingproduct_VeilingproductNr",
                        column: x => x.VeilingproductNr,
                        principalTable: "Veilingproduct",
                        principalColumn: "VeilingProductNr",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "AspNetUsers",
                columns: new[] { "GebruikerNr", "AccessFailedCount", "BedrijfsNaam", "ConcurrencyStamp", "Email", "EmailConfirmed", "Kvk", "LaatstIngelogd", "LockoutEnabled", "LockoutEnd", "NormalizedEmail", "NormalizedUserName", "PasswordHash", "PhoneNumber", "PhoneNumberConfirmed", "Postcode", "SecurityStamp", "Soort", "StraatAdres", "TwoFactorEnabled", "UserName" },
                values: new object[,]
                {
                    { 1, 0, "Flora BV", "STATIC-CONC-1", "flora@example.nl", false, "12345678", new DateTime(2025, 10, 8, 12, 0, 0, 0, DateTimeKind.Utc), false, null, "FLORA@EXAMPLE.NL", "FLORA@EXAMPLE.NL", "AQAAAAIAAYagAAAAEExampleHashVoorGebruiker1++++++++++++", null, false, "1234AB", "STATIC-USER-1", "Bedrijf", "Bloemig 10", false, "flora@example.nl" },
                    { 2, 0, "Jan Jansen", "STATIC-CONC-2", "jan@example.nl", false, "00000000", new DateTime(2025, 10, 7, 13, 0, 0, 0, DateTimeKind.Utc), false, null, "JAN@EXAMPLE.NL", "JAN@EXAMPLE.NL", "AQAAAAIAAYagAAAAEExampleHashVoorGebruiker2++++++++++++", null, false, "2345BC", "STATIC-USER-2", "Koper", "Laan 5", false, "jan@example.nl" }
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
                table: "Veiling",
                columns: new[] { "VeilingNr", "Begintijd", "Eindtijd", "Status", "VeilingNaam" },
                values: new object[,]
                {
                    { 201, new DateTime(2025, 10, 11, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2025, 10, 11, 1, 0, 0, 0, DateTimeKind.Utc), "active", "veiling001" },
                    { 202, new DateTime(2025, 10, 11, 1, 0, 0, 0, DateTimeKind.Utc), new DateTime(2025, 10, 11, 2, 0, 0, 0, DateTimeKind.Utc), "active", "veiling001" }
                });

            migrationBuilder.InsertData(
                table: "Veilingproduct",
                columns: new[] { "VeilingProductNr", "AantalFusten", "CategorieNr", "GeplaatstDatum", "ImagePath", "Kwekernr", "Minimumprijs", "Naam", "Plaats", "Startprijs", "VeilingNr", "VoorraadBloemen", "beginDatum", "status" },
                values: new object[,]
                {
                    { 101, 10, 1, new DateTime(2025, 10, 9, 14, 0, 0, 0, DateTimeKind.Utc), "../../src/assets/pictures/productBloemen/DecoratieveDahliaSunsetFlare.webp", 1, 10, "Tulp Mix", " Aalsmeer", 12m, 201, 500, new DateOnly(1, 1, 1), false },
                    { 102, 10, 2, new DateTime(2025, 10, 9, 14, 0, 0, 0, DateTimeKind.Utc), "../../src/assets/pictures/productBloemen/EleganteTulpCrimsonGlory.webp", 1, 15, "Rode Roos", "Eelde", 20m, 202, 300, new DateOnly(1, 1, 1), false }
                });

            migrationBuilder.InsertData(
                table: "Bieding",
                columns: new[] { "BiedNr", "AantalStuks", "BedragPerFust", "GebruikerNr", "VeilingNr", "VeilingproductNr" },
                values: new object[,]
                {
                    { 1001, 5, 13, 2, 201, 101 },
                    { 1002, 3, 21, 2, 202, 102 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_AspNetRoleClaims_RoleId",
                table: "AspNetRoleClaims",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "RoleNameIndex",
                table: "AspNetRoles",
                column: "NormalizedName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserClaims_UserId",
                table: "AspNetUserClaims",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserLogins_UserId",
                table: "AspNetUserLogins",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserRoles_RoleId",
                table: "AspNetUserRoles",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "EmailIndex",
                table: "AspNetUsers",
                column: "NormalizedEmail");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_Email",
                table: "AspNetUsers",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UserNameIndex",
                table: "AspNetUsers",
                column: "NormalizedUserName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Bieding_GebruikerNr",
                table: "Bieding",
                column: "GebruikerNr");

            migrationBuilder.CreateIndex(
                name: "IX_Bieding_VeilingNr",
                table: "Bieding",
                column: "VeilingNr");

            migrationBuilder.CreateIndex(
                name: "IX_Bieding_VeilingproductNr",
                table: "Bieding",
                column: "VeilingproductNr");

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
                name: "AspNetRoleClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserLogins");

            migrationBuilder.DropTable(
                name: "AspNetUserRoles");

            migrationBuilder.DropTable(
                name: "AspNetUserTokens");

            migrationBuilder.DropTable(
                name: "Bieding");

            migrationBuilder.DropTable(
                name: "AspNetRoles");

            migrationBuilder.DropTable(
                name: "Veilingproduct");

            migrationBuilder.DropTable(
                name: "AspNetUsers");

            migrationBuilder.DropTable(
                name: "Categorie");

            migrationBuilder.DropTable(
                name: "Veiling");
        }
    }
}
