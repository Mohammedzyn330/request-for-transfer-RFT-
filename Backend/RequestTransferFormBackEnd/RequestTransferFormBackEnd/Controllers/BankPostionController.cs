using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RequestTransferFormBackEnd.Data;
using RequestTransferFormBackEnd.Models;

namespace RequestTransferFormBackEnd.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BankPositionController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BankPositionController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("entries")]
        public IActionResult Entry([FromBody] BankPosition bankPosition)
        {
            if (bankPosition == null)
                return BadRequest("Invalid data");

            var bank = _context.Banks.FirstOrDefault(b => b.Id == bankPosition.BankId);
            if (bank == null)
                return BadRequest("Invalid bank.");

            var user = _context.Users.FirstOrDefault(u => u.Id == bankPosition.UserId);
            if (user == null)
                return BadRequest("Invalid user.");

            bankPosition.CompanyId = user.companyId;

            bankPosition.BankPositionCreated = DateTime.Now;
            bankPosition.Bank = bank;
            bankPosition.User = user;
            bankPosition.Amount = bankPosition.Amount;

            _context.BankPositions.Add(bankPosition);
            _context.SaveChanges();

            return Ok(new
            {
                message = "Bank position added successfully!",
                bankPosition.Id,
                bankPosition.Amount,
                bankPosition.BankId,
                bankPosition.UserId
            });
        }

        [HttpGet]
        public IActionResult GetAll(int userId, string? filterType)
        {

            var user = _context.Users.FirstOrDefault(u => u.Id == userId);
            if (user == null)
                return BadRequest("User not found.");

            var now = DateTime.Now;
            var startOfDay = now.Date;
            var endOfDay = startOfDay.AddDays(1);

            IQueryable<BankPosition> query = _context.BankPositions
                .Include(b => b.Bank)
                .Include(u => u.User)
                .Where(p => p.CompanyId == user.companyId);

            //if (filterType == "today")
            //{
            //    // Only today's data
            //    query = query.Where(bf => bf.userCreatedDate >= startOfDay && bf.userCreatedDate < endOfDay);
            //}
            //else if (filterType == "future")
            //{
            //    // Future data
            //    query = query.Where(bf => bf.userCreatedDate >= endOfDay);
            //}
            //else if (filterType == "date" && selectedDate.HasValue)
            //{
            //    // Specific selected date
            //    var selectedStart = selectedDate.Value.Date;
            //    var selectedEnd = selectedStart.AddDays(1);
            //    query = query.Where(bf => bf.userCreatedDate >= selectedStart && bf.userCreatedDate < selectedEnd);
            //}

            if (filterType == "today")
            {
                // Only today's data
                query = query.Where(bf => bf.BankPositionCreated >= startOfDay && bf.BankPositionCreated < endOfDay);
            }
            //else if(filterType == "month")
            //{
            //    // Default: current month
            //    var startOfMonth = new DateTime(now.Year, now.Month, 1);
            //    var startOfNextMonth = startOfMonth.AddMonths(1);
            //    query = query.Where(bp => bp.BankPositionCreated >= startOfMonth && bp.BankPositionCreated < startOfNextMonth);
            //}
            else
            {
                query = query.Where(bp => false);
            }


            var bankPositions = query
                .Select(bf => new
                {
                    bf.Id,
                    bf.Amount,
                    bf.BankPositionCreated,
                    BankName = bf.Bank!.bankName,
                    BankAccount = bf.Bank!.bankAccount,
                    UserName = bf.User!.userName,
                    bf.BankId,
                    bf.UserId
                })
                .ToList();

            return Ok(bankPositions);
        }

        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var position = _context.BankPositions
                .Include(b => b.Bank)
                .Include(u => u.User)
                .Where(bp => bp.Id == id)
                .Select(bp => new
                {
                    bp.Id,
                    bp.Amount,
                    bp.BankPositionCreated,
                    BankName = bp.Bank!.bankName,
                    BankAccount = bp.Bank!.bankAccount,
                    UserName = bp.User!.userName,
                    bp.BankId,
                    bp.UserId
                })
                .FirstOrDefault();

            if (position == null)
                return NotFound(new { message = "Bank position not found." });

            return Ok(position);
        }

        //POST: API/bankpostion
        [HttpPost]
        public IActionResult AddUserCreatedBank([FromBody] Bank banks)
        {
            if (banks == null || string.IsNullOrWhiteSpace(banks.bankName))
            {
                return BadRequest("SERVER: bank name is required.");
            }
            var existingBrand = _context.Banks.FirstOrDefault(v => v.bankName.ToLower() == banks.bankName.ToLower());
            if (existingBrand != null)
            {
                return Conflict("SERVER: Bank already exists.");
            }
            _context.Banks.Add(banks);
            _context.SaveChanges();
            return Ok(banks);

        }
    }
}
