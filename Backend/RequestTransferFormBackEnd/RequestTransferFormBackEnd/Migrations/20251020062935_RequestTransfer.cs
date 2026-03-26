using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace RequestTransferFormBackEnd.Migrations
{
    /// <inheritdoc />
    public partial class RequestTransfer : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Banks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    bankName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    bankAccount = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Banks", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Brands",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    brandName = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Brands", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CustomerLists",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    customerName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    customerBranch = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CustomerLists", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Roles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    roleName = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Roles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Vendorlists",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    supplierName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    bankName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    bankAccount = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    branchName = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Vendorlists", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    userName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    workEmail = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    password = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    department = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    phoneNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    iqamaNo = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    branch = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    usercreatedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RoleId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Users_Roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Amounttopays",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    amountTOPay = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    amountToPayCreated = table.Column<DateTime>(type: "datetime2", nullable: true),
                    BrandId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Amounttopays", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Amounttopays_Brands_BrandId",
                        column: x => x.BrandId,
                        principalTable: "Brands",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Amounttopays_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BankFacillities",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AmountOFFacillities = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    AmountFacillitiesCreated = table.Column<DateTime>(type: "datetime2", nullable: true),
                    BankId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BankFacillities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BankFacillities_Banks_BankId",
                        column: x => x.BankId,
                        principalTable: "Banks",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_BankFacillities_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "BankPositions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    BankPositionCreated = table.Column<DateTime>(type: "datetime2", nullable: true),
                    BankId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BankPositions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BankPositions_Banks_BankId",
                        column: x => x.BankId,
                        principalTable: "Banks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BankPositions_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CustomerAmounts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AmountOFCusotmers = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    AmountCustomerCreated = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CustomerListId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CustomerAmounts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CustomerAmounts_CustomerLists_CustomerListId",
                        column: x => x.CustomerListId,
                        principalTable: "CustomerLists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CustomerAmounts_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Preparedbies",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    balanceAsPerAdmaShamran = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    balanceAsPerSupplier = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    difference = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    reasonOFDifference = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    paymentDue = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    remarks = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    preparedByCreatedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CurrentStatus = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    VendorId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Preparedbies", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Preparedbies_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Preparedbies_Vendorlists_VendorId",
                        column: x => x.VendorId,
                        principalTable: "Vendorlists",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Approvals",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PreparedbyId = table.Column<int>(type: "int", nullable: false),
                    ApprovedByUserId = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Remarks = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ApprovedDate = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Approvals", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Approvals_Preparedbies_PreparedbyId",
                        column: x => x.PreparedbyId,
                        principalTable: "Preparedbies",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Approvals_Users_ApprovedByUserId",
                        column: x => x.ApprovedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "PaymentCompletions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PreparedbyId = table.Column<int>(type: "int", nullable: false),
                    UpdatedByUserId = table.Column<int>(type: "int", nullable: false),
                    PaymentDone = table.Column<bool>(type: "bit", nullable: false),
                    OdooEntryDone = table.Column<bool>(type: "bit", nullable: false),
                    AttachmentsDone = table.Column<bool>(type: "bit", nullable: false),
                    PaymentDoneDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    OdooEntryDoneDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    AttachmentsDoneDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastUpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    odooReferenceNumber = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PaymentCompletions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PaymentCompletions_Preparedbies_PreparedbyId",
                        column: x => x.PreparedbyId,
                        principalTable: "Preparedbies",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PaymentCompletions_Users_UpdatedByUserId",
                        column: x => x.UpdatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Verifieds",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PreparedbyId = table.Column<int>(type: "int", nullable: false),
                    VerifiedByUserId = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Remarks = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    VerifiedDate = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Verifieds", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Verifieds_Preparedbies_PreparedbyId",
                        column: x => x.PreparedbyId,
                        principalTable: "Preparedbies",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Verifieds_Users_VerifiedByUserId",
                        column: x => x.VerifiedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "PaymentAttachments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PaymentCompletionId = table.Column<int>(type: "int", nullable: false),
                    FileName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FilePath = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FileType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FileSize = table.Column<long>(type: "bigint", nullable: false),
                    UploadDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UploadedByUserId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PaymentAttachments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PaymentAttachments_PaymentCompletions_PaymentCompletionId",
                        column: x => x.PaymentCompletionId,
                        principalTable: "PaymentCompletions",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PaymentAttachments_Users_UploadedByUserId",
                        column: x => x.UploadedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.InsertData(
                table: "Banks",
                columns: new[] { "Id", "bankAccount", "bankName" },
                values: new object[,]
                {
                    { 1, "SA25 6000 0000 0271 2639 0001", "Bank Al-Jazira 1" },
                    { 2, "SA95 6000 0000 0271 2639 0002", "Bank Al-Jazira 2" },
                    { 3, "SA08 8000 0126 6080 1053 2348", "Bank Al-Rajhi" }
                });

            migrationBuilder.InsertData(
                table: "Brands",
                columns: new[] { "Id", "brandName" },
                values: new object[,]
                {
                    { 1, "Golden Star" },
                    { 2, "Premier" },
                    { 3, "Salary" },
                    { 4, "VAT" }
                });

            migrationBuilder.InsertData(
                table: "CustomerLists",
                columns: new[] { "Id", "customerBranch", "customerName" },
                values: new object[] { 1, "Riyadh", "Abdul" });

            migrationBuilder.InsertData(
                table: "Roles",
                columns: new[] { "Id", "roleName" },
                values: new object[,]
                {
                    { 1, "FORM PREPARE" },
                    { 2, "VERIFIER" },
                    { 3, "APPROVER" },
                    { 4, "FINANCE" },
                    { 5, "ADMIN" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Amounttopays_BrandId",
                table: "Amounttopays",
                column: "BrandId");

            migrationBuilder.CreateIndex(
                name: "IX_Amounttopays_UserId",
                table: "Amounttopays",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Approvals_ApprovedByUserId",
                table: "Approvals",
                column: "ApprovedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Approvals_PreparedbyId",
                table: "Approvals",
                column: "PreparedbyId");

            migrationBuilder.CreateIndex(
                name: "IX_BankFacillities_BankId",
                table: "BankFacillities",
                column: "BankId");

            migrationBuilder.CreateIndex(
                name: "IX_BankFacillities_UserId",
                table: "BankFacillities",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_BankPositions_BankId",
                table: "BankPositions",
                column: "BankId");

            migrationBuilder.CreateIndex(
                name: "IX_BankPositions_UserId",
                table: "BankPositions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerAmounts_CustomerListId",
                table: "CustomerAmounts",
                column: "CustomerListId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerAmounts_UserId",
                table: "CustomerAmounts",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentAttachments_PaymentCompletionId",
                table: "PaymentAttachments",
                column: "PaymentCompletionId");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentAttachments_UploadedByUserId",
                table: "PaymentAttachments",
                column: "UploadedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentCompletions_PreparedbyId",
                table: "PaymentCompletions",
                column: "PreparedbyId");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentCompletions_UpdatedByUserId",
                table: "PaymentCompletions",
                column: "UpdatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Preparedbies_UserId",
                table: "Preparedbies",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Preparedbies_VendorId",
                table: "Preparedbies",
                column: "VendorId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_RoleId",
                table: "Users",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "IX_Verifieds_PreparedbyId",
                table: "Verifieds",
                column: "PreparedbyId");

            migrationBuilder.CreateIndex(
                name: "IX_Verifieds_VerifiedByUserId",
                table: "Verifieds",
                column: "VerifiedByUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Amounttopays");

            migrationBuilder.DropTable(
                name: "Approvals");

            migrationBuilder.DropTable(
                name: "BankFacillities");

            migrationBuilder.DropTable(
                name: "BankPositions");

            migrationBuilder.DropTable(
                name: "CustomerAmounts");

            migrationBuilder.DropTable(
                name: "PaymentAttachments");

            migrationBuilder.DropTable(
                name: "Verifieds");

            migrationBuilder.DropTable(
                name: "Brands");

            migrationBuilder.DropTable(
                name: "Banks");

            migrationBuilder.DropTable(
                name: "CustomerLists");

            migrationBuilder.DropTable(
                name: "PaymentCompletions");

            migrationBuilder.DropTable(
                name: "Preparedbies");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "Vendorlists");

            migrationBuilder.DropTable(
                name: "Roles");
        }
    }
}
