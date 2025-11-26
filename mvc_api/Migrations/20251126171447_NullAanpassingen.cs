using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace mvc_api.Migrations
{
    /// <inheritdoc />
    public partial class NullAanpassingen : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "VeilingNr",
                table: "Veilingproduct",
                type: "INTEGER",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "INTEGER");

            migrationBuilder.AlterColumn<int>(
                name: "Startprijs",
                table: "Veilingproduct",
                type: "INTEGER",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "TEXT",
                oldPrecision: 18,
                oldScale: 2);

            migrationBuilder.UpdateData(
                table: "Veilingproduct",
                keyColumn: "VeilingProductNr",
                keyValue: 101,
                column: "Startprijs",
                value: 12);

            migrationBuilder.UpdateData(
                table: "Veilingproduct",
                keyColumn: "VeilingProductNr",
                keyValue: 102,
                column: "Startprijs",
                value: 20);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "VeilingNr",
                table: "Veilingproduct",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "INTEGER",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "Startprijs",
                table: "Veilingproduct",
                type: "TEXT",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m,
                oldClrType: typeof(int),
                oldType: "INTEGER",
                oldNullable: true);

            migrationBuilder.UpdateData(
                table: "Veilingproduct",
                keyColumn: "VeilingProductNr",
                keyValue: 101,
                column: "Startprijs",
                value: 12m);

            migrationBuilder.UpdateData(
                table: "Veilingproduct",
                keyColumn: "VeilingProductNr",
                keyValue: 102,
                column: "Startprijs",
                value: 20m);
        }
    }
}
