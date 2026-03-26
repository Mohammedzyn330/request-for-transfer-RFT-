using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml.Filter;
using RequestTransferFormBackEnd.Data;
using RequestTransferFormBackEnd.Models;

namespace RequestTransferFormBackEnd.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CustomerAmountController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CustomerAmountController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("entries")]
        public IActionResult Entry([FromBody] CustomerAmount customeramount)
        {
            if (customeramount == null)
                return BadRequest("Invalid data");

            var customers = _context.CustomerLists.FirstOrDefault(cl => cl.Id == customeramount.CustomerListId);
            if (customers == null)
                return BadRequest("Invalid customers.");

            var user = _context.Users.FirstOrDefault(u => u.Id == customeramount.UserId);
            if (user == null)
                return BadRequest("Invalid user.");

            customeramount.CompanyId = user.companyId;

            customeramount.AmountCustomerCreated = DateTime.Now;
            customeramount.userCreatedDate = customeramount.userCreatedDate;
            customeramount.CustomerList = customers;
            customeramount.User = user;
            customeramount.AmountOFCusotmers = customeramount.AmountOFCusotmers;

            _context.CustomerAmounts.Add(customeramount);
            _context.SaveChanges();

            return Ok(new
            {
                message = "Customer amount added successfully!",
                customeramount.Id,
                customeramount.AmountOFCusotmers,
                customeramount.userCreatedDate,
                customeramount.CustomerListId,
                customeramount.UserId
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

            IQueryable<CustomerAmount> query = _context.CustomerAmounts
                .Include(ca => ca.CustomerList)
                .Include(ca => ca.User)
                .Where(p => p.CompanyId == user.companyId);

            if (filterType == "today")
            {
                var startOfDay = now.Date;
                var endOfDay = startOfDay.AddDays(1);
                // Only today's data
                query = query.Where(ca => ca.userCreatedDate >= startOfDay && ca.userCreatedDate < endOfDay);
            }
            else if (filterType == "future")
            {
                query = query.Where(c => c.userCreatedDate >= startOfNextMonth);
            }
            else if (filterType == "date" && selectedDate.HasValue)
            {
                // Specific selected date
                var selectedStart = selectedDate.Value.Date;
                var selectedEnd = selectedStart.AddDays(1);
                query = query.Where(ca => ca.userCreatedDate >= selectedStart && ca.userCreatedDate < selectedEnd);
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


            var customerAmounts = query
                .Select(ca => new
                {
                    ca.Id,
                    ca.AmountOFCusotmers,
                    ca.AmountCustomerCreated,
                    ca.userCreatedDate,
                    CustomerName = ca.CustomerList!.customerName,
                    CustomerBranch = ca.CustomerList!.customerBranch,
                    UserName = ca.User!.userName,
                    ca.CustomerListId,
                    ca.UserId
                })
                .OrderBy(b => b.userCreatedDate)
                .ToList();

            return Ok(customerAmounts);
        }


        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var customeramounts = _context.CustomerAmounts
                .Include(cl => cl.CustomerList)
                .Include(u => u.User)
                .Where(cl => cl.Id == id)
                .Select(ca => new
                {
                    ca.Id,
                    ca.AmountOFCusotmers,
                    ca.AmountCustomerCreated,
                    ca.userCreatedDate,
                    CustomerName = ca.CustomerList!.customerName,
                    UserName = ca.User!.userName,
                    ca.CustomerListId,
                    ca.UserId
                })
                .FirstOrDefault();

            if (customeramounts == null)
                return NotFound(new { message = "Customer amount not found." });

            return Ok(customeramounts);
        }
    }
}
