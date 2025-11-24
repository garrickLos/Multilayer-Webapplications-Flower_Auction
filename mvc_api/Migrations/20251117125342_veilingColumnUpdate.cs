using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace mvc_api.Migrations
{
    /// <inheritdoc />
    public partial class veilingColumnUpdate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "VeilingproductNr",
                table: "Bieding",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Bieding",
                keyColumn: "BiedNr",
                keyValue: 1001,
                column: "VeilingproductNr",
                value: null);

            migrationBuilder.UpdateData(
                table: "Bieding",
                keyColumn: "BiedNr",
                keyValue: 1002,
                column: "VeilingproductNr",
                value: null);

            migrationBuilder.CreateIndex(
                name: "IX_Bieding_VeilingproductNr",
                table: "Bieding",
                column: "VeilingproductNr");

            migrationBuilder.AddForeignKey(
                name: "FK_Bieding_Veilingproduct_VeilingproductNr",
                table: "Bieding",
                column: "VeilingproductNr",
                principalTable: "Veilingproduct",
                principalColumn: "VeilingProductNr");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Bieding_Veilingproduct_VeilingproductNr",
                table: "Bieding");

            migrationBuilder.DropIndex(
                name: "IX_Bieding_VeilingproductNr",
                table: "Bieding");

            migrationBuilder.DropColumn(
                name: "VeilingproductNr",
                table: "Bieding");
        }
    }
}
