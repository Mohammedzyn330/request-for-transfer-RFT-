using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;
using RequestTransferFormBackEnd.Data;
using RequestTransferFormBackEnd.Models;

namespace RequestTransferFormBackEnd.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SupplierBfController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SupplierBfController(AppDbContext context)
        {
            _context = context;
        }

        // POST: api/supplierbf/import-supplierbf
        [HttpPost("import-supplierbf")]
        public async Task<IActionResult> ImportFromExcel(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");

            if (file.Length > 100 * 1024 * 1024) // 100 MB limit
                return BadRequest("File size exceeds 100 MB.");

            var newSuppliers = new List<SuppliersBF>();
            int updatedCount = 0;

            using (var stream = new MemoryStream())
            {
                await file.CopyToAsync(stream);
                ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

                using (var package = new ExcelPackage(stream))
                {
                    ExcelWorksheet worksheet = package.Workbook.Worksheets[0];
                    int rowCount = worksheet.Dimension.Rows;

                    for (int row = 2; row <= rowCount; row++) // Skip header row
                    {
                        string supplierBFName = worksheet.Cells[row, 1].Text?.Trim();

                        if (string.IsNullOrWhiteSpace(supplierBFName))
                            continue;

                        // Check existing
                        var existingSupplier = await _context.suppliersBFs
                            .FirstOrDefaultAsync(s => s.supplierBFName == supplierBFName);

                        if (existingSupplier != null)
                        {
                            // No extra fields in your model to update.
                            // If more fields are added later, update here.

                            continue;
                        }
                        else
                        {
                            // Add new
                            newSuppliers.Add(new SuppliersBF
                            {
                                supplierBFName = supplierBFName
                            });
                        }
                    }
                }
            }

            // Save new suppliers
            if (newSuppliers.Any())
            {
                await _context.suppliersBFs.AddRangeAsync(newSuppliers);
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                added = newSuppliers.Count,
                updated = updatedCount,
                total = newSuppliers.Count + updatedCount,
                message = "Supplier BF import completed."
            });
        }
    }
}
