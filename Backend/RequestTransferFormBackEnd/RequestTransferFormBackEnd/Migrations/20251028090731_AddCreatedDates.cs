using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RequestTransferFormBackEnd.Migrations
{
    /// <inheritdoc />
    public partial class AddCreatedDates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "userCreatedDate",
                table: "Preparedbies",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "userCreatedDate",
                table: "BankPositions",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "userCreatedDate",
                table: "Amounttopays",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "userCreatedDate",
                table: "Preparedbies");

            migrationBuilder.DropColumn(
                name: "userCreatedDate",
                table: "BankPositions");

            migrationBuilder.DropColumn(
                name: "userCreatedDate",
                table: "Amounttopays");
        }
    }
}
