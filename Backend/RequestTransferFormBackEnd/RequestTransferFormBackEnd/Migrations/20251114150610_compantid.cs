using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RequestTransferFormBackEnd.Migrations
{
    /// <inheritdoc />
    public partial class compantid : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "company",
                table: "Users");

            migrationBuilder.AddColumn<int>(
                name: "companyId",
                table: "Users",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CompanyId",
                table: "Preparedbies",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "companyId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "Preparedbies");

            migrationBuilder.AddColumn<string>(
                name: "company",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);
        }
    }
}
