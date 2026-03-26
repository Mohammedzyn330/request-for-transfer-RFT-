using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;
using RequestTransferFormBackEnd.Data;
using RequestTransferFormBackEnd.Models;
namespace RequestTransferFormBackEnd.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class VendorController : ControllerBase
    {
        private readonly AppDbContext _context;

        public VendorController(AppDbContext context)
        {
            _context = context;
        }

        // POST: api/Vendor/import-vendor
        [HttpPost("import-vendor")]
        public async Task<IActionResult> ImportFromExcel(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");

            if (file.Length > 100 * 1024 * 1024) // 100 MB limit
                return BadRequest("File size exceeds 100 MB.");

            var newVendors = new List<Vendorlist>();
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
                        string supplierName = worksheet.Cells[row, 1].Text?.Trim();
                        string bankName = worksheet.Cells[row, 2].Text?.Trim();
                        string bankAccount = worksheet.Cells[row, 3].Text?.Trim();
                        string branchName = worksheet.Cells[row, 4].Text?.Trim();

                        if (string.IsNullOrWhiteSpace(supplierName))
                            continue;

                        // Check if vendor exists by supplier name
                        var existingVendor = await _context.Vendorlists
                            .FirstOrDefaultAsync(v => v.supplierName == supplierName);

                        if (existingVendor != null)
                        {
                            // Update only if data changed
                            bool changed = false;

                            if (existingVendor.bankName != bankName)
                            {
                                existingVendor.bankName = bankName;
                                changed = true;
                            }

                            if (existingVendor.bankAccount != bankAccount)
                            {
                                existingVendor.bankAccount = bankAccount;
                                changed = true;
                            }

                            if (existingVendor.branchName != branchName)
                            {
                                existingVendor.branchName = branchName;
                                changed = true;
                            }

                            if (changed)
                                updatedCount++;
                        }
                        else
                        {
                            // Add new vendor
                            newVendors.Add(new Vendorlist
                            {
                                supplierName = supplierName,
                                bankName = bankName,
                                bankAccount = bankAccount,
                                branchName = branchName
                            });
                        }
                    }
                }
            }

            // Add new vendors
            if (newVendors.Count > 0)
                await _context.Vendorlists.AddRangeAsync(newVendors);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                Added = newVendors.Count,
                Updated = updatedCount,
                Message = $"Import completed. {newVendors.Count} added, {updatedCount} updated."
            });
        }


        [HttpGet("{userId}")]
        public async Task<IActionResult> GetAllVendors(int userId)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
                return BadRequest("User not found.");

            var userBranch = user.branch?.Trim().ToLower();
            var userCompanyId = user.companyId;

            var query = _context.Vendorlists.AsQueryable();

            var lowerBranch = userBranch ?? "";

            // Final combined filter
            query = query.Where(v =>
                (
                    // Branch-specific AND company-specific
                    (
                        ((lowerBranch == "riyadh" && (v.branchName.Contains("[R]") || v.branchName.ToLower().Contains("riyadh"))) ||
                         (lowerBranch == "madinah" && (v.branchName.Contains("[M]") || v.branchName.ToLower().Contains("madinah"))) ||
                         (lowerBranch == "dammam" && (v.branchName.Contains("[D]") || v.branchName.ToLower().Contains("dammam"))) ||
                         (lowerBranch == "abha" && (v.branchName.Contains("[A]") || v.branchName.ToLower().Contains("abha"))) ||
                         (lowerBranch == "jeddah" && (v.branchName.Contains("[J]") || v.branchName.ToLower().Contains("jeddah"))) ||
                         (lowerBranch == "tabuk" && (v.branchName.Contains("[T]") || v.branchName.ToLower().Contains("tabuk"))) ||
                         (lowerBranch == "qasim" && (v.branchName.Contains("[Q]") || v.branchName.ToLower().Contains("qasim"))) ||
                         (lowerBranch == "hail" && (v.branchName.Contains("[H]") || v.branchName.ToLower().Contains("hail"))) ||
                         (!new[] { "riyadh", "madinah", "dammam", "abha", "jeddah", "tabuk", "qasim", "hail" }.Contains(lowerBranch) && v.branchName.ToLower().Contains(lowerBranch)))
                        &&
                        (
                            (userCompanyId == 2 && v.branchName.ToLower().Contains("catering")) || // Catering
                            (userCompanyId == 1 && v.branchName.ToLower().Contains("trading"))   // Trading
                        )
                    )
                    ||
                    // OR include main company without branch code
                    (userCompanyId == 2 && v.branchName.ToLower() == "adma shamran catering company") ||
                    (userCompanyId == 1 && v.branchName.ToLower() == "adma shamran trading company")
                )
            );

            var vendors = await query
               .Select(v => new
               {
                   id = v.Id,
                   v.supplierName,
                   v.branchName,
                   v.bankName,
                   v.bankAccount,
               })
               .Distinct() // just in case of overlap
               .ToListAsync();

            return Ok(vendors);
        }




        //POST: API/vendor
        //[HttpPost]
        //public IActionResult AddUserCreatedVendors([FromBody] Vendorlist vendors)
        //{
        //    if (vendors == null || string.IsNullOrWhiteSpace(vendors.supplierName))
        //    {
        //        return BadRequest("SERVER: Vendor name is required.");
        //    }
        //    var existingBrand = _context.Vendorlists.FirstOrDefault(v => v.supplierName.ToLower() == vendors.supplierName.ToLower());
        //    if (existingBrand != null)
        //    {
        //        return Conflict("SERVER: Vendor already exists.");
        //    }
        //    _context.Vendorlists.Add(vendors);
        //    _context.SaveChanges();
        //    return Ok(vendors);

        //}
    }
}
