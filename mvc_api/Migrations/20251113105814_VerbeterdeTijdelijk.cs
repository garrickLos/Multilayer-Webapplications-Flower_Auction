using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace mvc_api.Migrations
{
    /// <inheritdoc />
    public partial class VerbeterdeTijdelijk : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "StartPrijs",
                table: "Tijdelijk");

            migrationBuilder.AddColumn<int>(
                name: "Fusten",
                table: "Tijdelijk",
                type: "INTEGER",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Fusten",
                table: "Tijdelijk");

            migrationBuilder.AddColumn<decimal>(
                name: "StartPrijs",
                table: "Tijdelijk",
                type: "TEXT",
                nullable: true);
        }
    }
}
