using Microsoft.AspNetCore.Mvc;
using RequestTransferFormBackEnd.Data;
using RequestTransferFormBackEnd.Models;
using System.Linq;

namespace RequestTransferFormBackEnd.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BankController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BankController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Bank
        [HttpGet]
        public IActionResult GetAllBanks()
        {
            var banks = _context.Banks
                .Select(b => new
                {
                    b.Id,
                    b.bankName,
                    b.bankAccount
                })
                .ToList();

            return Ok(banks);
        }
    }
}
