using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RequestTransferFormBackEnd.Migrations
{
    /// <inheritdoc />
    public partial class otherAmount : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "priorityName",
                table: "Preparedbies",
                newName: "PriorityName");

            migrationBuilder.AddColumn<decimal>(
                name: "otherAmount",
                table: "Approvals",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "otherAmount",
                table: "Approvals");

            migrationBuilder.RenameColumn(
                name: "PriorityName",
                table: "Preparedbies",
                newName: "priorityName");
        }
    }
}
