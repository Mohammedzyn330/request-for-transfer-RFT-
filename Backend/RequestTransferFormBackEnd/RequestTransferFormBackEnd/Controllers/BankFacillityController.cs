using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RequestTransferFormBackEnd.Data;
using RequestTransferFormBackEnd.Models;

namespace RequestTransferFormBackEnd.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BankFacillityController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BankFacillityController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("entries")]
        public IActionResult Entry([FromBody] BankFacillities bankFacillity)
        {
            if (bankFacillity == null)
                return BadRequest("Invalid data");

            var bank = _context.bank1s.FirstOrDefault(b => b.Id == bankFacillity.BanksId);
            if (bank == null)
                return BadRequest("Invalid bank.");

            var supplier = _context.suppliersBFs.FirstOrDefault(sbf => sbf.Id == bankFacillity.supplierBfId);
            if (supplier == null)
                return BadRequest("Invalid supplier.");

            var user = _context.Users.FirstOrDefault(u => u.Id == bankFacillity.UserId);
            if (user == null)
                return BadRequest("Invalid user.");

            bankFacillity.CompanyId = user.companyId;
            bankFacillity.AmountFacillitiesCreated = DateTime.Now;

            bankFacillity.suppliersBF = supplier;

            // Attach bank + user
            bankFacillity.Banks = bank;
            bankFacillity.User = user;

            _context.Add(bankFacillity);
            _context.SaveChanges();

            return Ok(new
            {
                message = "Bank facillity added successfully!",
                bankFacillity.Id,
                bankFacillity.AmountOFFacillities,
                bankFacillity.userCreatedDate,
                bankFacillity.BanksId,
                bankFacillity.UserId,
                SupplierName = supplier.supplierBFName
            });
        }

        [HttpGet("suppliersbf")]
        public IActionResult GetSuppliersBf()
        {
            try
            {
                var suppliersbf = _context.suppliersBFs
                    .Select(sbf => new { sbf.Id, sbf.supplierBFName })
                    .ToList();
                return Ok(suppliersbf);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("banksbf")]
        public IActionResult GetBanks()
        {
            var banks1 = _context.bank1s
                .Select(b => new
                {
                    b.Id,
                    b.banksName,
                    b.banksaccount
                })
                .ToList();

            return Ok(banks1);
        }

        [HttpGet]
        public IActionResult GetAll(int userId, string? filterType, DateTime? selectedDate, int? months, bool includeCurrentMonth = false)
        {
            var user = _context.Users.FirstOrDefault(u => u.Id == userId);
            if (user == null)
                return BadRequest("User not found.");

            var now = DateTime.Now;
            var startOfCurrentMonth = new DateTime(now.Year, now.Month, 1);
            var startOfNextMonth = startOfCurrentMonth.AddMonths(1);

            IQueryable<BankFacillities> query = _context.BankFacillities
                .Include(b => b.Banks)          // FIX
                .Include(s => s.suppliersBF)    // FIX
                .Include(u => u.User)           // FIX
                .Where(p => p.CompanyId == user.companyId);

            // SAFE date filters
            if (filterType == "today")
            {
                var startOfDay = now.Date;
                var endOfDay = startOfDay.AddDays(1);

                query = query.Where(bf =>
                    bf.userCreatedDate != null &&
                    bf.userCreatedDate >= startOfDay &&
                    bf.userCreatedDate < endOfDay
                );
            }
            else if (filterType == "future")
            {
                query = query.Where(bf =>
                    bf.userCreatedDate != null &&
                    bf.userCreatedDate >= startOfNextMonth
                );
            }
            else if (filterType == "date" && selectedDate.HasValue)
            {
                var selectedStart = selectedDate.Value.Date;
                var selectedEnd = selectedStart.AddDays(1);

                query = query.Where(bf =>
                    bf.userCreatedDate != null &&
                    bf.userCreatedDate >= selectedStart &&
                    bf.userCreatedDate < selectedEnd
                );
            }
            else if (months.HasValue && months.Value > 0)
            {
                var startOfRange = startOfNextMonth;
                var endOfRange = startOfRange.AddMonths(months.Value);

                query = query.Where(bf =>
                    bf.userCreatedDate != null &&
                    bf.userCreatedDate >= startOfRange &&
                    bf.userCreatedDate < endOfRange
                );
            }
            else
            {
                // default: next 12 months
                var startOfRange = startOfNextMonth;
                var endOfRange = startOfRange.AddMonths(12);

                query = query.Where(bf =>
                    bf.userCreatedDate != null &&
                    bf.userCreatedDate >= startOfRange &&
                    bf.userCreatedDate < endOfRange
                );
            }

            var bankFacillities = query
                .Select(bf => new
                {
                    bf.Id,
                    bf.AmountOFFacillities,
                    bf.AmountFacillitiesCreated,
                    bf.userCreatedDate,
                    BankName = bf.Banks.banksName,
                    BankAccount = bf.Banks.banksaccount,
                    UserName = bf.User.userName,
                    SupplierName = bf.suppliersBF.supplierBFName,
                    bf.BanksId,
                    bf.UserId,
                    bf.supplierBfId
                })
                .OrderBy(b => b.userCreatedDate)
                .ToList();

            return Ok(bankFacillities);
        }




        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var facillities = _context.BankFacillities
                .Include(b => b.Banks)
                .Include(u => u.User)
                 .Where(bf => bf.Id == id)
                .Select(bf => new
                {
                    bf.Id,
                    bf.AmountOFFacillities,
                    bf.AmountFacillitiesCreated,
                    bf.userCreatedDate,
                    BankName = bf.Banks!.banksName,
                    BankAccount = bf.Banks!.banksaccount,
                    supplierBfName = bf.suppliersBF!.supplierBFName,
                    UserName = bf.User!.userName,
                    bf.Banks,
                    bf.UserId,
                     bf.supplierBfId,
                })
                .FirstOrDefault();

            if (facillities == null)
                return NotFound(new { message = "Bank facillity not found." });

            return Ok(facillities);
        }
        //POST: API/bankpostion
        //[HttpPost]
        //public IActionResult AddUserCreatedBank([FromBody] Bank banks)
        //{
        //    if (banks == null || string.IsNullOrWhiteSpace(banks.bankName))
        //    {
        //        return BadRequest("SERVER: bank name is required.");
        //    }
        //    var existingBrand = _context.Banks.FirstOrDefault(v => v.bankName.ToLower() == banks.bankName.ToLower());
        //    if (existingBrand != null)
        //    {
        //        return Conflict("SERVER: Bank already exists.");
        //    }
        //    _context.Banks.Add(banks);
        //    _context.SaveChanges();
        //    return Ok(banks);

        //}
    }
}
