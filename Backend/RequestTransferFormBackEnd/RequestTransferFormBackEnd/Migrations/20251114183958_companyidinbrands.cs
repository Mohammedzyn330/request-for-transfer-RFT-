using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RequestTransferFormBackEnd.Migrations
{
    /// <inheritdoc />
    public partial class companyidinbrands : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CompanyId",
                table: "Amounttopays",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "Amounttopays");
        }
    }
}
