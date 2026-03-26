using System.Drawing.Drawing2D;
using Microsoft.AspNetCore.Mvc;
using RequestTransferFormBackEnd.Data;
using RequestTransferFormBackEnd.Models;

namespace RequestTransferFormBackEnd.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BrandController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BrandController(AppDbContext context)
        {
            _context = context;
        }
        //POST: API/BRAND
        [HttpPost]
        public IActionResult AddUserCreatedBrands([FromBody] Brands brands)
        {
            if (brands == null || string.IsNullOrWhiteSpace(brands.brandName))
            {
                return BadRequest("SERVER: Brand name is required.");
            }
            var existingBrand = _context.Brands.FirstOrDefault(b => b.brandName.ToLower() == brands.brandName.ToLower());
            if (existingBrand != null)
            {
                return Conflict("SERVER: Brand already exists.");
            }
            _context.Brands.Add(brands);
            _context.SaveChanges();
            return Ok(brands);

            }

        // GET: api/Brand
        [HttpGet]
        public IActionResult GetAllBanks()
        {
            var brands = _context.Brands
                .Select(br => new
                {
                    br.Id,
                    br.brandName,
                })
                .ToList();

            return Ok(brands);
        }
    }
}
