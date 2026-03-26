using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RequestTransferFormBackEnd.Migrations
{
    public partial class FixUserCompanyRelationship : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Step 1: First, ensure there's at least one company
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM Companies)
                BEGIN
                    INSERT INTO Companies (companyName, companyValue) 
                    VALUES ('Default Company', 'default')
                END
            ");

            // Step 2: Get the default company ID
            migrationBuilder.Sql(@"
                DECLARE @DefaultCompanyId INT
                SET @DefaultCompanyId = (SELECT TOP 1 Id FROM Companies ORDER BY Id)
                
                -- Update invalid companyIds to the default company ID
                UPDATE Users 
                SET companyId = @DefaultCompanyId 
                WHERE companyId NOT IN (SELECT Id FROM Companies) OR companyId IS NULL
            ");

            // Step 3: Now add the foreign key constraint
            migrationBuilder.CreateIndex(
                name: "IX_Users_companyId",
                table: "Users",
                column: "companyId");

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Companies_companyId",
                table: "Users",
                column: "companyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Users_Companies_companyId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_companyId",
                table: "Users");
        }
    }
}