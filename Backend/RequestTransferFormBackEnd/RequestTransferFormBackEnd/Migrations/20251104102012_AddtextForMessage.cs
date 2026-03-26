using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RequestTransferFormBackEnd.Migrations
{
    /// <inheritdoc />
    public partial class AddtextForMessage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "textForMessage",
                table: "Amounttopays",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "textForMessage",
                table: "Amounttopays");
        }
    }
}
