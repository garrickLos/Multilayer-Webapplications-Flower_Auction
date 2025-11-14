using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace mvc_api.Migrations
{
    /// <inheritdoc />
    public partial class updatedbRows : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Veilingproduct",
                keyColumn: "VeilingProductNr",
                keyValue: 101,
                columns: new[] { "ImagePath", "Plaats" },
                values: new object[] { "../../src/assets/pictures/productBloemen/DecoratieveDahliaSunsetFlare.webp", " Aalsmeer" });

            migrationBuilder.UpdateData(
                table: "Veilingproduct",
                keyColumn: "VeilingProductNr",
                keyValue: 102,
                columns: new[] { "ImagePath", "Plaats" },
                values: new object[] { "../../src/assets/pictures/productBloemen/EleganteTulpCrimsonGlory.webp", "Eelde" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Veilingproduct",
                keyColumn: "VeilingProductNr",
                keyValue: 101,
                columns: new[] { "ImagePath", "Plaats" },
                values: new object[] { "../../src/assets/pictures/productBloemen", "Zoetermeer" });

            migrationBuilder.UpdateData(
                table: "Veilingproduct",
                keyColumn: "VeilingProductNr",
                keyValue: 102,
                columns: new[] { "ImagePath", "Plaats" },
                values: new object[] { "../../src/assets/pictures/productBloemen", "Zoetermeer" });
        }
    }
}
