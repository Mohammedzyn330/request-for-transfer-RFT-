using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RequestTransferFormBackEnd.Data;
using RequestTransferFormBackEnd.Models;

namespace RequestTransferFormBackEnd.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AmounttopayController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AmounttopayController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("entries")]
        public IActionResult Entry([FromBody] Amounttopay amounttopay)
        {
            if (amounttopay == null)
                return BadRequest("Invalid data");

            var brand = _context.Brands.FirstOrDefault(br => br.Id == amounttopay.BrandId);
            if (brand == null)
                return BadRequest("Invalid brand.");

            var user = _context.Users.FirstOrDefault(u => u.Id == amounttopay.UserId);
            if (user == null)
                return BadRequest("Invalid user.");

            amounttopay.CompanyId = user.companyId;

            amounttopay.amountToPayCreated = DateTime.Now;
            amounttopay.userCreatedDate = amounttopay.userCreatedDate;
            amounttopay.textForMessage = amounttopay.textForMessage; //text for the message of finance 
            amounttopay.Brand = brand;
            amounttopay.User = user;
            if (brand.brandName.Equals("RentPayments", StringComparison.OrdinalIgnoreCase))
            {
                // This will keep the rentPaymentsAmount value coming from frontend
                if(amounttopay.rentPaymentsAmount == null || amounttopay.rentPaymentsAmount <= 0)
                {
                    return BadRequest("Please provide the valid rent payment amount");
                }
            }
            else
            {
                amounttopay.rentPaymentsAmount = 0;
            }

            _context.Amounttopays.Add(amounttopay);
            _context.SaveChanges();

            return Ok(new
            {
                message = "Amount to pay added successfully!",
                amounttopay.Id,
                amounttopay.amountTOPay,
                amounttopay.rentPaymentsAmount,
                amounttopay.userCreatedDate,
                amounttopay.BrandId,
                amounttopay.UserId
            });
        }


        [HttpGet]
        public IActionResult GetAll(int userId, string? filterType, DateTime? selectedDate, int? months)
        {

            var user = _context.Users.FirstOrDefault(u => u.Id == userId);
            if (user == null)
                return BadRequest("User not found.");

            var now = DateTime.Now;
            var startOfCurrentMonth = new DateTime(now.Year, now.Month, 1);
            var startOfNextMonth = startOfCurrentMonth.AddMonths(1);

            IQueryable<Amounttopay> query = _context.Amounttopays
                .Include(br => br.Brand)
                .Include(u => u.User)
                 .Where(p => p.CompanyId == user.companyId);

            if (filterType == "today")
            {
                var startOfDay = now.Date;
                var endOfDay = startOfDay.AddDays(1);
                // Only today's data
                query = query.Where(br => br.userCreatedDate >= startOfDay && br.userCreatedDate < endOfDay);
            }
            else if (filterType == "future")
            {
                query = query.Where(br => br.userCreatedDate >= startOfNextMonth);
            }
            else if (filterType == "date" && selectedDate.HasValue)
            {
                // Specific selected date
                var selectedStart = selectedDate.Value.Date;
                var selectedEnd = selectedStart.AddDays(1);
                query = query.Where(bf => bf.userCreatedDate >= selectedStart && bf.userCreatedDate < selectedEnd);
            }
            else if (months.HasValue && months.Value > 0)
            {
                // From next month up to (next month + N months)
                var startOfRange = startOfNextMonth;
                var endOfRange = startOfRange.AddMonths(months.Value);

                query = query.Where(bf => bf.userCreatedDate >= startOfRange && bf.userCreatedDate < endOfRange);
            }
            else
            {
                //Default: show 12 months starting from next month
                var startOfRange = startOfNextMonth;
                var endOfRange = startOfRange.AddMonths(12);

                query = query.Where(bf => bf.userCreatedDate >= startOfRange && bf.userCreatedDate < endOfRange);
            }

            var amounttopays = query
                .Select(bf => new
                {
                    bf.Id,
                    bf.amountTOPay,
                    bf.rentPaymentsAmount,
                    bf.amountToPayCreated,
                    bf.userCreatedDate,
                    bf.textForMessage,
                    BrandName = bf.Brand!.brandName,
                    UserName = bf.User!.userName,
                    bf.BrandId,
                    bf.UserId
                })
                .OrderBy(b => b.userCreatedDate)
                .ToList();

            return Ok(amounttopays);
        }

        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var amounts = _context.Amounttopays
                .Include(br => br.Brand)
                .Include(u => u.User)
                .Where(br => br.Id == id)
                .Select(br => new
                {
                    br.Id,
                    br.amountTOPay,
                    br.amountToPayCreated,
                    br.rentPaymentsAmount,  
                    br.userCreatedDate, 
                    br.textForMessage,
                    BankName = br.Brand!.brandName,
                    UserName = br.User!.userName,
                    br.BrandId,
                    br.UserId
                })
                .FirstOrDefault();

            if (amounts == null)
                return NotFound(new { message = " Brand to pay amount not found." });

            return Ok(amounts);
        }
    }
}
