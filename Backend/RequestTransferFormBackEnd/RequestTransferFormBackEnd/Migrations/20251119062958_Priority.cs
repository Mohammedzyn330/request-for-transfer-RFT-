using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace RequestTransferFormBackEnd.Migrations
{
    /// <inheritdoc />
    public partial class Priority : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "priorityName",
                table: "Preparedbies",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "priorities",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    priorityName = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_priorities", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "priorities",
                columns: new[] { "Id", "priorityName" },
                values: new object[,]
                {
                    { 1, "First Priority" },
                    { 2, "Second Priority" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "priorities");

            migrationBuilder.DropColumn(
                name: "priorityName",
                table: "Preparedbies");
        }
    }
}
