using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace mvc_api.Migrations
{
    /// <inheritdoc />
    public partial class DatabaseUpdate1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Minimumprijs",
                table: "Veiling");

            migrationBuilder.DropColumn(
                name: "Assortiment",
                table: "Gebruiker");

            migrationBuilder.DropColumn(
                name: "PersoneelsNr",
                table: "Gebruiker");

            migrationBuilder.RenameColumn(
                name: "Voorraad",
                table: "Veilingproduct",
                newName: "status");

            migrationBuilder.RenameColumn(
                name: "Fust",
                table: "Veilingproduct",
                newName: "VoorraadBloemen");

            migrationBuilder.RenameColumn(
                name: "Naam",
                table: "Gebruiker",
                newName: "BedrijfsNaam");

            migrationBuilder.AddColumn<int>(
                name: "AantalFusten",
                table: "Veilingproduct",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "ImagePath",
                table: "Veilingproduct",
                type: "TEXT",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "Kwekernr",
                table: "Veilingproduct",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "Minimumprijs",
                table: "Veilingproduct",
                type: "TEXT",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "Plaats",
                table: "Veilingproduct",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "beginDatum",
                table: "Veilingproduct",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "VeilingNaam",
                table: "Veiling",
                type: "TEXT",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.InsertData(
                table: "Categorie",
                columns: new[] { "CategorieNr", "Naam" },
                values: new object[,]
                {
                    { 3, "Lelie" },
                    { 4, "Zonnebloem" },
                    { 5, "Chrysant" },
                    { 6, "Pioenroos" }
                });

            migrationBuilder.UpdateData(
                table: "Veiling",
                keyColumn: "VeilingNr",
                keyValue: 201,
                column: "VeilingNaam",
                value: "veiling001");

            migrationBuilder.UpdateData(
                table: "Veiling",
                keyColumn: "VeilingNr",
                keyValue: 202,
                column: "VeilingNaam",
                value: "veiling001");

            migrationBuilder.UpdateData(
                table: "Veilingproduct",
                keyColumn: "VeilingProductNr",
                keyValue: 101,
                columns: new[] { "AantalFusten", "ImagePath", "Kwekernr", "Minimumprijs", "Plaats", "VoorraadBloemen", "beginDatum", "status" },
                values: new object[] { 10, "../../src/assets/pictures/productBloemen", 1, 10m, "Zoetermeer", 500, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false });

            migrationBuilder.UpdateData(
                table: "Veilingproduct",
                keyColumn: "VeilingProductNr",
                keyValue: 102,
                columns: new[] { "AantalFusten", "ImagePath", "Kwekernr", "Minimumprijs", "Plaats", "VoorraadBloemen", "beginDatum", "status" },
                values: new object[] { 10, "../../src/assets/pictures/productBloemen", 1, 15m, "Zoetermeer", 300, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), false });

            migrationBuilder.CreateIndex(
                name: "IX_Veilingproduct_Kwekernr",
                table: "Veilingproduct",
                column: "Kwekernr");

            migrationBuilder.AddForeignKey(
                name: "FK_Veilingproduct_Gebruiker_Kwekernr",
                table: "Veilingproduct",
                column: "Kwekernr",
                principalTable: "Gebruiker",
                principalColumn: "GebruikerNr",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Veilingproduct_Gebruiker_Kwekernr",
                table: "Veilingproduct");

            migrationBuilder.DropIndex(
                name: "IX_Veilingproduct_Kwekernr",
                table: "Veilingproduct");

            migrationBuilder.DeleteData(
                table: "Categorie",
                keyColumn: "CategorieNr",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Categorie",
                keyColumn: "CategorieNr",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Categorie",
                keyColumn: "CategorieNr",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Categorie",
                keyColumn: "CategorieNr",
                keyValue: 6);

            migrationBuilder.DropColumn(
                name: "AantalFusten",
                table: "Veilingproduct");

            migrationBuilder.DropColumn(
                name: "ImagePath",
                table: "Veilingproduct");

            migrationBuilder.DropColumn(
                name: "Kwekernr",
                table: "Veilingproduct");

            migrationBuilder.DropColumn(
                name: "Minimumprijs",
                table: "Veilingproduct");

            migrationBuilder.DropColumn(
                name: "Plaats",
                table: "Veilingproduct");

            migrationBuilder.DropColumn(
                name: "beginDatum",
                table: "Veilingproduct");

            migrationBuilder.DropColumn(
                name: "VeilingNaam",
                table: "Veiling");

            migrationBuilder.RenameColumn(
                name: "status",
                table: "Veilingproduct",
                newName: "Voorraad");

            migrationBuilder.RenameColumn(
                name: "VoorraadBloemen",
                table: "Veilingproduct",
                newName: "Fust");

            migrationBuilder.RenameColumn(
                name: "BedrijfsNaam",
                table: "Gebruiker",
                newName: "Naam");

            migrationBuilder.AddColumn<decimal>(
                name: "Minimumprijs",
                table: "Veiling",
                type: "TEXT",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "Assortiment",
                table: "Gebruiker",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PersoneelsNr",
                table: "Gebruiker",
                type: "TEXT",
                maxLength: 50,
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Gebruiker",
                keyColumn: "GebruikerNr",
                keyValue: 1,
                columns: new[] { "Assortiment", "PersoneelsNr" },
                values: new object[] { 12, "P1001" });

            migrationBuilder.UpdateData(
                table: "Gebruiker",
                keyColumn: "GebruikerNr",
                keyValue: 2,
                columns: new[] { "Assortiment", "PersoneelsNr" },
                values: new object[] { 0, "P0000" });

            migrationBuilder.UpdateData(
                table: "Veiling",
                keyColumn: "VeilingNr",
                keyValue: 201,
                column: "Minimumprijs",
                value: 10m);

            migrationBuilder.UpdateData(
                table: "Veiling",
                keyColumn: "VeilingNr",
                keyValue: 202,
                column: "Minimumprijs",
                value: 15m);

            migrationBuilder.UpdateData(
                table: "Veilingproduct",
                keyColumn: "VeilingProductNr",
                keyValue: 101,
                columns: new[] { "Fust", "Voorraad" },
                values: new object[] { 10, 500 });

            migrationBuilder.UpdateData(
                table: "Veilingproduct",
                keyColumn: "VeilingProductNr",
                keyValue: 102,
                columns: new[] { "Fust", "Voorraad" },
                values: new object[] { 10, 300 });
        }
    }
}
