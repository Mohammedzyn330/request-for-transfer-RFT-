using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace RequestTransferFormBackEnd.Migrations
{
    public partial class suppliersandbanks : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Make old BankId nullable
            migrationBuilder.AlterColumn<int>(
                name: "BankId",
                table: "BankFacillities",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            // Add BanksId (nullable)
            migrationBuilder.AddColumn<int>(
                name: "BanksId",
                table: "BankFacillities",
                type: "int",
                nullable: true);

            // Add supplierBfId (nullable)
            migrationBuilder.AddColumn<int>(
                name: "supplierBfId",
                table: "BankFacillities",
                type: "int",
                nullable: true);

            // Create bank1s
            migrationBuilder.CreateTable(
                name: "bank1s",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    banksName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    banksaccount = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_bank1s", x => x.Id);
                });

            // Create suppliersBFs
            migrationBuilder.CreateTable(
                name: "suppliersBFs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    supplierBFName = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_suppliersBFs", x => x.Id);
                });

            // Seed banks
            migrationBuilder.InsertData(
                table: "bank1s",
                columns: new[] { "Id", "banksName", "banksaccount" },
                values: new object[,]
                {
                    { 1, "Bank Al-Jazira 1", "SA25 6000 0000 0271 2639 0001" },
                    { 2, "Bank Al-Jazira 2", "SA95 6000 0000 0271 2639 0002" }
                });

            // Set old rows to NULL (very important!)
            migrationBuilder.Sql("UPDATE BankFacillities SET BanksId = NULL");
            migrationBuilder.Sql("UPDATE BankFacillities SET supplierBfId = NULL");

            // Indexes
            migrationBuilder.CreateIndex(
                name: "IX_BankFacillities_BanksId",
                table: "BankFacillities",
                column: "BanksId");

            migrationBuilder.CreateIndex(
                name: "IX_BankFacillities_supplierBfId",
                table: "BankFacillities",
                column: "supplierBfId");

            // Add FK with safe DeleteBehavior
            migrationBuilder.AddForeignKey(
                name: "FK_BankFacillities_bank1s_BanksId",
                table: "BankFacillities",
                column: "BanksId",
                principalTable: "bank1s",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_BankFacillities_suppliersBFs_supplierBfId",
                table: "BankFacillities",
                column: "supplierBfId",
                principalTable: "suppliersBFs",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BankFacillities_bank1s_BanksId",
                table: "BankFacillities");

            migrationBuilder.DropForeignKey(
                name: "FK_BankFacillities_suppliersBFs_supplierBfId",
                table: "BankFacillities");

            migrationBuilder.DropTable(
                name: "bank1s");

            migrationBuilder.DropTable(
                name: "suppliersBFs");

            migrationBuilder.DropIndex(
                name: "IX_BankFacillities_BanksId",
                table: "BankFacillities");

            migrationBuilder.DropIndex(
                name: "IX_BankFacillities_supplierBfId",
                table: "BankFacillities");

            migrationBuilder.DropColumn(
                name: "BanksId",
                table: "BankFacillities");

            migrationBuilder.DropColumn(
                name: "supplierBfId",
                table: "BankFacillities");

            migrationBuilder.AlterColumn<int>(
                name: "BankId",
                table: "BankFacillities",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);
        }
    }
}
