using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace mvc_api.Migrations
{
    /// <inheritdoc />
    public partial class changes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Veilingproduct_Veiling_VeilingNr",
                table: "Veilingproduct");

            migrationBuilder.AddForeignKey(
                name: "FK_Veilingproduct_Veiling_VeilingNr",
                table: "Veilingproduct",
                column: "VeilingNr",
                principalTable: "Veiling",
                principalColumn: "VeilingNr",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Veilingproduct_Veiling_VeilingNr",
                table: "Veilingproduct");

            migrationBuilder.AddForeignKey(
                name: "FK_Veilingproduct_Veiling_VeilingNr",
                table: "Veilingproduct",
                column: "VeilingNr",
                principalTable: "Veiling",
                principalColumn: "VeilingNr",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
