using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;
using RequestTransferFormBackEnd.Data;
using RequestTransferFormBackEnd.Models;

namespace RequestTransferFormBackEnd.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CustomerListController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CustomerListController(AppDbContext context)
        {
            _context = context;
        }
        // POST: api/Vendor/import-customer
        [HttpPost("import-customer")]
        public async Task<IActionResult> ImportFromExcel(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");

            if (file.Length > 100 * 1024 * 1024) // 100 MB limit
                return BadRequest("File size exceeds 100 MB.");

            var newCustomers = new List<CustomerList>();
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
                        string customerName = worksheet.Cells[row, 1].Text?.Trim();
                        string customerBranch = worksheet.Cells[row,2].Text?.Trim();
                       

                        if (string.IsNullOrWhiteSpace(customerName))
                            continue;

                        // Check if customer exists by customer name
                        var existingCustomer = await _context.CustomerLists
                            .FirstOrDefaultAsync(v => v.customerName == customerName);

                        if (existingCustomer != null)
                        {
                            // Update only if data changed
                            bool changed = false;

                            if (existingCustomer.customerName != customerName)
                            {
                                existingCustomer.customerName = customerName;
                                changed = true;
                            }

                            if (existingCustomer.customerBranch != customerBranch)
                            {
                                existingCustomer.customerBranch = customerBranch;
                                changed = true;
                            }

                            if (changed)
                                updatedCount++;
                        }
                        else
                        {
                            // Add new customer
                            newCustomers.Add(new CustomerList
                            {
                                customerName = customerName,
                                customerBranch = customerBranch,
                            });
                        }
                    }
                }
            }

            // Add new customers
            if (newCustomers.Count > 0)
                await _context.CustomerLists.AddRangeAsync(newCustomers);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                Added = newCustomers.Count,
                Updated = updatedCount,
                Message = $"Import completed. {newCustomers.Count} added, {updatedCount} updated."
            });
        }

        //POST: API/customer
        [HttpPost]
        public IActionResult AddUserCreatedCustomers([FromBody] CustomerList customer)
        {
            if (customer == null || string.IsNullOrWhiteSpace(customer.customerName))
            {
                return BadRequest("SERVER: Vendor name is required.");
            }
            var existingBrand = _context.CustomerLists.FirstOrDefault(v => v.customerName.ToLower() == customer.customerName.ToLower());
            if (existingBrand != null)
            {
                return Conflict("SERVER: Vendor already exists.");
            }
            _context.CustomerLists.Add(customer);
            _context.SaveChanges();
            return Ok(customer);

        }

        // GET: api/CustomerList
        [HttpGet("{userId}")]
        public async Task<IActionResult> GetAllBanks(int userId)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
                return BadRequest("User not found.");

            var userBranch = user.branch?.Trim().ToLower();
            var userCompanyId = user.companyId;

            var query = _context.CustomerLists.AsQueryable();

            var lowerBranch = userBranch ?? "";

            // Final combined filter
            query = query.Where(v =>
                (
                    // Branch-specific AND company-specific
                    (
                        ((lowerBranch == "riyadh" && (v.customerBranch.Contains("[R]") || v.customerBranch.ToLower().Contains("riyadh"))) ||
                         (lowerBranch == "madinah" && (v.customerBranch.Contains("[M]") || v.customerBranch.ToLower().Contains("madinah"))) ||
                         (lowerBranch == "dammam" && (v.customerBranch.Contains("[D]") || v.customerBranch.ToLower().Contains("dammam"))) ||
                         (lowerBranch == "abha" && (v.customerBranch.Contains("[A]") || v.customerBranch.ToLower().Contains("abha"))) ||
                         (lowerBranch == "jeddah" && (v.customerBranch.Contains("[J]") || v.customerBranch.ToLower().Contains("jeddah"))) ||
                         (lowerBranch == "tabuk" && (v.customerBranch.Contains("[T]") || v.customerBranch.ToLower().Contains("tabuk"))) ||
                         (lowerBranch == "qasim" && (v.customerBranch.Contains("[Q]") || v.customerBranch.ToLower().Contains("qasim"))) ||
                         (lowerBranch == "hail" && (v.customerBranch.Contains("[H]") || v.customerBranch.ToLower().Contains("hail"))) ||
                         (!new[] { "riyadh", "madinah", "dammam", "abha", "jeddah", "tabuk", "qasim", "hail" }.Contains(lowerBranch) && v.customerBranch.ToLower().Contains(lowerBranch)))
                        &&
                        (
                             (userCompanyId == 2 && v.customerBranch.ToLower().Contains("catering")) || // Catering
                            (userCompanyId == 1 && v.customerBranch.ToLower().Contains("trading"))   // Trading
                        )
                    )
                    ||
                     // OR include main company without branch code
                     (userCompanyId == 2 && v.customerBranch.ToLower() == "adma shamran catering company") ||
                    (userCompanyId == 1 && v.customerBranch.ToLower() == "adma shamran trading company")
                )
            );


            var customers = await query
                .Select(cl => new
                {
                    cl.Id,
                    cl.customerName,
                    cl.customerBranch,
          
                })
                 .Distinct() // just in case of overlap
                .ToListAsync();

            return Ok(customers);
        }
    }
}
