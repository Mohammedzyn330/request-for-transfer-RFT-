using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RequestTransferFormBackEnd.Migrations
{
    /// <inheritdoc />
    public partial class RemoveuserCreatedDateFromTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "userCreatedDate",
                table: "BankPositions");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "userCreatedDate",
                table: "BankPositions",
                type: "datetime2",
                nullable: true);
        }
    }
}
