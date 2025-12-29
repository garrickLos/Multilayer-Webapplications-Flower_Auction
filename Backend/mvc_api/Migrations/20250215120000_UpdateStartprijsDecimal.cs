using Microsoft.EntityFrameworkCore.Migrations;

namespace mvc_api.Migrations;

public partial class UpdateStartprijsDecimal : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AlterColumn<decimal>(
            name: "Startprijs",
            table: "Veilingproduct",
            type: "decimal(18,2)",
            nullable: true,
            oldClrType: typeof(int),
            oldType: "int",
            oldNullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AlterColumn<int>(
            name: "Startprijs",
            table: "Veilingproduct",
            type: "int",
            nullable: true,
            oldClrType: typeof(decimal),
            oldType: "decimal(18,2)",
            oldNullable: true);
    }
}
