using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace mvc_api.Migrations
{
    /// <inheritdoc />
    public partial class Test : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "BedragPerFust",
                table: "Bieding",
                type: "INTEGER",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "TEXT",
                oldPrecision: 18,
                oldScale: 2);

            migrationBuilder.UpdateData(
                table: "Bieding",
                keyColumn: "BiedNr",
                keyValue: 1001,
                column: "BedragPerFust",
                value: 13);

            migrationBuilder.UpdateData(
                table: "Bieding",
                keyColumn: "BiedNr",
                keyValue: 1002,
                column: "BedragPerFust",
                value: 21);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<decimal>(
                name: "BedragPerFust",
                table: "Bieding",
                type: "TEXT",
                precision: 18,
                scale: 2,
                nullable: false,
                oldClrType: typeof(int),
                oldType: "INTEGER");

            migrationBuilder.UpdateData(
                table: "Bieding",
                keyColumn: "BiedNr",
                keyValue: 1001,
                column: "BedragPerFust",
                value: 13.50m);

            migrationBuilder.UpdateData(
                table: "Bieding",
                keyColumn: "BiedNr",
                keyValue: 1002,
                column: "BedragPerFust",
                value: 21.00m);
        }
    }
}
