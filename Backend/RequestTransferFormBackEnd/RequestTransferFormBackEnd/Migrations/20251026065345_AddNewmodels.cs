using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace RequestTransferFormBackEnd.Migrations
{
    /// <inheritdoc />
    public partial class AddNewmodels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "rentPaymentsAmount",
                table: "Brands",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "rentPaymentsAmount",
                table: "Amounttopays",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.UpdateData(
                table: "Brands",
                keyColumn: "Id",
                keyValue: 1,
                column: "rentPaymentsAmount",
                value: 0m);

            migrationBuilder.UpdateData(
                table: "Brands",
                keyColumn: "Id",
                keyValue: 2,
                column: "rentPaymentsAmount",
                value: 0m);

            migrationBuilder.UpdateData(
                table: "Brands",
                keyColumn: "Id",
                keyValue: 3,
                column: "rentPaymentsAmount",
                value: 0m);

            migrationBuilder.UpdateData(
                table: "Brands",
                keyColumn: "Id",
                keyValue: 4,
                column: "rentPaymentsAmount",
                value: 0m);

            migrationBuilder.InsertData(
                table: "Brands",
                columns: new[] { "Id", "brandName", "rentPaymentsAmount" },
                values: new object[,]
                {
                    { 5, "RentPayments", 0m },
                    { 6, "Others", 0m }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Brands",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Brands",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.DropColumn(
                name: "rentPaymentsAmount",
                table: "Brands");

            migrationBuilder.DropColumn(
                name: "rentPaymentsAmount",
                table: "Amounttopays");
        }
    }
}
