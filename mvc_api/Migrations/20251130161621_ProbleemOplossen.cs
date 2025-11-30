using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace mvc_api.Migrations
{
    /// <inheritdoc />
    public partial class ProbleemOplossen : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Bieding",
                keyColumn: "BiedNr",
                keyValue: 1001,
                column: "VeilingproductNr",
                value: 101);

            migrationBuilder.UpdateData(
                table: "Bieding",
                keyColumn: "BiedNr",
                keyValue: 1002,
                column: "VeilingproductNr",
                value: 102);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Bieding",
                keyColumn: "BiedNr",
                keyValue: 1001,
                column: "VeilingproductNr",
                value: 0);

            migrationBuilder.UpdateData(
                table: "Bieding",
                keyColumn: "BiedNr",
                keyValue: 1002,
                column: "VeilingproductNr",
                value: 0);
        }
    }
}
