    using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RequestTransferFormBackEnd.Data;
using RequestTransferFormBackEnd.Models;

namespace RequestTransferFormBackEnd.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class WeeklyPaymentController : ControllerBase
    {
        private readonly AppDbContext _context;

        public WeeklyPaymentController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("dashboard/{userId}")]
        public IActionResult GetWeeklyPaymentData(int userId)
        {
            try
            {
                var user = _context.Users.FirstOrDefault(u => u.Id == userId);
                if (user == null)
                    return BadRequest("User not found.");

                var now = DateTime.Now;
                var today = now.Date;
                var tomorrow = today.AddDays(1);

                // Calculate Saturday to Thursday week
                int daysSinceSaturday = ((int)today.DayOfWeek - (int)DayOfWeek.Saturday + 7) % 7;
                var startOfWeek = today.AddDays(-daysSinceSaturday); // Saturday
                var endOfWeek = startOfWeek.AddDays(6); // Friday (but we'll use Thursday as end)
                var effectiveEndOfWeek = startOfWeek.AddDays(5); // Thursday

                // 1. Get Bank Positions - ONLY TODAY'S DATA
                var bankPositions = _context.BankPositions
                    .Include(b => b.Bank)
                    .Where(bp => bp.CompanyId == user.companyId &&
                                 bp.BankPositionCreated >= today &&
                                 bp.BankPositionCreated < tomorrow)
                    .Select(bp => new
                    {
                        BankName = bp.Bank.bankName,
                        bp.Amount,
                        bp.BankPositionCreated
                    })
                    .ToList();

                // 2. Get PreparedBy Data with Branch, Supplier, PaymentDue - Saturday to Thursday
                var preparedByData = _context.Preparedbies
                    .Include(p => p.User)
                    .Include(p => p.Vendor)
                    .Include(p => p.Approvals)
                    .Where(p => p.CompanyId == user.companyId &&
                                p.userCreatedDate >= startOfWeek &&
                                p.userCreatedDate < effectiveEndOfWeek.AddDays(1))
                    .Select(p => new
                    {
                        p.Id,
                        PreparedByBranch = p.User.branch,
                        SupplierName = p.Vendor.supplierName,
                        p.paymentDue,
                        OtherAmount = p.Approvals
                            .Where(a => a.Status == "Approved")
                            .OrderByDescending(a => a.ApprovedDate)
                            .Select(a => a.otherAmount)
                            .FirstOrDefault(),
                        p.CurrentStatus,
                        p.userCreatedDate
                    })
                    .ToList();

                // 3. Get AmountToPay Data - With date filtering (Saturday to Thursday)
                var amountToPayData = _context.Amounttopays
                    .Include(a => a.Brand)
                    .Include(a => a.User)
                    .Where(a => a.CompanyId == user.companyId &&
                                a.userCreatedDate.HasValue &&
                                a.userCreatedDate.Value >= startOfWeek &&
                                a.userCreatedDate.Value < effectiveEndOfWeek.AddDays(1))
                    .Select(a => new
                    {
                        a.Id,
                        BrandName = a.Brand.brandName,
                        RentAmount = a.rentPaymentsAmount,
                        RegularAmount = a.amountTOPay,
                        a.textForMessage,
                        a.userCreatedDate,
                        UserName = a.User.userName,
                        Branch = a.User.branch
                    })
                    .ToList();

                // 4. Get Bank Facility Data - Saturday to Thursday
                var bankFacilityData = _context.BankFacillities
                    .Include(bf => bf.suppliersBF)
                    .Include(bf => bf.Banks)
                    .Include(bf => bf.User)
                    .Where(bf => bf.CompanyId == user.companyId &&
                                 bf.userCreatedDate.HasValue &&
                                 bf.userCreatedDate.Value >= startOfWeek &&
                                 bf.userCreatedDate.Value < effectiveEndOfWeek.AddDays(1))
                    .Select(bf => new
                    {
                        bf.Id,
                        bf.AmountOFFacillities,
                        SupplierName = bf.suppliersBF.supplierBFName,
                        BankName = bf.Banks.banksName,
                        UserName = bf.User.userName,
                        Branch = bf.User.branch,
                        bf.userCreatedDate
                    })
                    .ToList();

                // 5. Calculate totals
                var totalBankBalance = bankPositions.Sum(bp => bp.Amount);
                var totalPaymentDue = preparedByData.Where(p => p.CurrentStatus == "Approved").Sum(p => p.paymentDue);
                var totalOtherAmount = preparedByData.Where(p => p.CurrentStatus == "Approved").Sum(p => p.OtherAmount);

                // Calculate AmountToPay totals
                var totalRentAmount = amountToPayData.Sum(a => a.RentAmount);
                var totalRegularAmount = amountToPayData.Sum(a => a.RegularAmount);
                var totalAmountToPay = totalRentAmount + totalRegularAmount;

                // Calculate Bank Facility totals - CORRECTED LOGIC
                // Only suppliers with "trading" in name are Trading, everything else is Catering
                var tradingFacilities = bankFacilityData
                    .Where(bf => bf.SupplierName.ToLower().Contains("trading"))
                    .ToList();

                var cateringFacilities = bankFacilityData
                    .Where(bf => !bf.SupplierName.ToLower().Contains("trading"))
                    .ToList();

                var totalTradingAmount = tradingFacilities.Sum(bf => bf.AmountOFFacillities);
                var totalCateringAmount = cateringFacilities.Sum(bf => bf.AmountOFFacillities);
                var totalBankFacilityAmount = totalTradingAmount + totalCateringAmount;

                // 6. Group preparedBy data by branch
                var branchData = preparedByData
                    .GroupBy(p => p.PreparedByBranch)
                    .Select(g => new
                    {
                        Branch = g.Key,
                        Suppliers = g.Select(p => new
                        {
                            p.SupplierName,
                            p.paymentDue,
                            p.OtherAmount,
                            p.CurrentStatus
                        }).ToList(),
                        TotalAmount = g.Sum(p => p.paymentDue),
                        TotalOtherAmount = g.Sum(p => p.OtherAmount)
                    })
                    .ToList();

                // 7. Group amountToPay data by branch
                var amountToPayByBranch = amountToPayData
                    .GroupBy(a => a.Branch)
                    .Select(g => new
                    {
                        Branch = g.Key,
                        Amounts = g.Select(a => new
                        {
                            a.BrandName,
                            a.RentAmount,
                            a.RegularAmount,
                            a.textForMessage,
                            a.UserName
                        }).ToList(),
                        TotalRentAmount = g.Sum(a => a.RentAmount),
                        TotalRegularAmount = g.Sum(a => a.RegularAmount),
                        TotalAmount = g.Sum(a => (a.RentAmount) + a.RegularAmount)
                    })
                    .ToList();

                // 8. Group bank facility data by type (Trading vs Catering)
                var bankFacilityByType = new
                {
                    Trading = new
                    {
                        Facilities = tradingFacilities.Select(bf => new
                        {
                            bf.SupplierName,
                            bf.BankName,
                            bf.AmountOFFacillities,
                            bf.UserName,
                            bf.Branch,
                            Type = "Trading"
                        }).ToList(),
                        TotalAmount = totalTradingAmount,
                        Count = tradingFacilities.Count
                    },
                    Catering = new
                    {
                        Facilities = cateringFacilities.Select(bf => new
                        {
                            bf.SupplierName,
                            bf.BankName,
                            bf.AmountOFFacillities,
                            bf.UserName,
                            bf.Branch,
                            Type = "Catering"
                        }).ToList(),
                        TotalAmount = totalCateringAmount,
                        Count = cateringFacilities.Count
                    }
                };

                return Ok(new
                {
                    BankPositions = bankPositions,
                    PreparedByData = preparedByData,
                    AmountToPayData = amountToPayData,
                    BankFacilityData = bankFacilityData,
                    BranchData = branchData,
                    AmountToPayByBranch = amountToPayByBranch,
                    BankFacilityByType = bankFacilityByType,
                    Totals = new
                    {
                        TotalBankBalance = totalBankBalance,
                        TotalPaymentDue = totalPaymentDue,
                        TotalOtherAmount = totalOtherAmount,
                        TotalRentAmount = totalRentAmount,
                        TotalRegularAmount = totalRegularAmount,
                        TotalAmountToPay = totalAmountToPay,
                        TotalTradingAmount = totalTradingAmount,
                        TotalCateringAmount = totalCateringAmount,
                        TotalBankFacilityAmount = totalBankFacilityAmount,
                        GrandTotal = totalPaymentDue + totalOtherAmount + totalAmountToPay + totalBankFacilityAmount
                    },
                    WeekRange = new
                    {
                        Start = startOfWeek,
                        End = effectiveEndOfWeek,
                        Today = today
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("branch-detail/{userId}/{branchName}")]
        public IActionResult GetBranchDetail(int userId, string branchName)
        {
            try
            {
                var user = _context.Users.FirstOrDefault(u => u.Id == userId);
                if (user == null)
                    return BadRequest("User not found.");

                var now = DateTime.Now;
                var today = now.Date;

                // Calculate Saturday to Thursday week
                int daysSinceSaturday = ((int)today.DayOfWeek - (int)DayOfWeek.Saturday + 7) % 7;
                var startOfWeek = today.AddDays(-daysSinceSaturday);
                var effectiveEndOfWeek = startOfWeek.AddDays(5);

                // Get PreparedBy branch detail
                var branchDetail = _context.Preparedbies
                    .Include(p => p.User)
                    .Include(p => p.Vendor)
                    .Include(p => p.Approvals)
                    .Where(p => p.CompanyId == user.companyId &&
                                p.User.branch == branchName &&
                                p.userCreatedDate >= startOfWeek &&
                                p.userCreatedDate < effectiveEndOfWeek.AddDays(1))
                    .Select(p => new
                    {
                        p.Id,
                        SupplierName = p.Vendor.supplierName,
                        p.paymentDue,
                        OtherAmount = p.Approvals
                            .Where(a => a.Status == "Approved")
                            .OrderByDescending(a => a.ApprovedDate)
                            .Select(a => a.otherAmount)
                            .FirstOrDefault(),
                        p.CurrentStatus,
                        PreparedBy = p.User.userName,
                        p.userCreatedDate,
                        Type = "PaymentDue"
                    })
                    .ToList();

                // Get AmountToPay branch detail
                var amountToPayBranchDetail = _context.Amounttopays
                    .Include(a => a.Brand)
                    .Include(a => a.User)
                    .Where(a => a.CompanyId == user.companyId &&
                                a.User.branch == branchName &&
                                a.userCreatedDate.HasValue &&
                                a.userCreatedDate.Value >= startOfWeek &&
                                a.userCreatedDate.Value < effectiveEndOfWeek.AddDays(1))
                    .Select(a => new
                    {
                        a.Id,
                        BrandName = a.Brand.brandName,
                        RentAmount = a.rentPaymentsAmount,
                        RegularAmount = a.amountTOPay,
                        TotalAmount = (a.rentPaymentsAmount) + a.amountTOPay,
                        a.textForMessage,
                        PreparedBy = a.User.userName,
                        a.userCreatedDate,
                        Type = "AmountToPay"
                    })
                    .ToList();

                // Get Bank Facility branch detail with CORRECTED TYPE LOGIC
                var bankFacilityBranchDetail = _context.BankFacillities
                    .Include(bf => bf.suppliersBF)
                    .Include(bf => bf.Banks)
                    .Include(bf => bf.User)
                    .Where(bf => bf.CompanyId == user.companyId &&
                                 bf.User.branch == branchName &&
                                 bf.userCreatedDate.HasValue &&
                                 bf.userCreatedDate.Value >= startOfWeek &&
                                 bf.userCreatedDate.Value < effectiveEndOfWeek.AddDays(1))
                    .Select(bf => new
                    {
                        bf.Id,
                        SupplierName = bf.suppliersBF.supplierBFName,
                        BankName = bf.Banks.banksName,
                        Amount = bf.AmountOFFacillities,
                        PreparedBy = bf.User.userName,
                        bf.userCreatedDate,
                        // CORRECTED: Only "trading" in supplier name is Trading, everything else is Catering
                        Type = bf.suppliersBF.supplierBFName.ToLower().Contains("trading") ? "BankFacilityTrading" : "BankFacilityCatering"
                    })
                    .ToList();

                return Ok(new
                {
                    PreparedByData = branchDetail,
                    AmountToPayData = amountToPayBranchDetail,
                    BankFacilityData = bankFacilityBranchDetail,
                    CombinedData = branchDetail
                        .Cast<object>()
                        .Concat(amountToPayBranchDetail.Cast<object>())
                        .Concat(bankFacilityBranchDetail.Cast<object>())
                        .ToList()
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("bank-facility-branch/{userId}/{branchName}")]
        public IActionResult GetBankFacilityBranchDetail(int userId, string branchName)
        {
            try
            {
                var user = _context.Users.FirstOrDefault(u => u.Id == userId);
                if (user == null)
                    return BadRequest("User not found.");

                var now = DateTime.Now;
                var today = now.Date;

                int daysSinceSaturday = ((int)today.DayOfWeek - (int)DayOfWeek.Saturday + 7) % 7;
                var startOfWeek = today.AddDays(-daysSinceSaturday);
                var effectiveEndOfWeek = startOfWeek.AddDays(5);

                var bankFacilityDetail = _context.BankFacillities
                    .Include(bf => bf.suppliersBF)
                    .Include(bf => bf.Banks)
                    .Include(bf => bf.User)
                    .Where(bf => bf.CompanyId == user.companyId &&
                                 bf.User.branch == branchName &&
                                 bf.userCreatedDate.HasValue &&
                                 bf.userCreatedDate.Value >= startOfWeek &&
                                 bf.userCreatedDate.Value < effectiveEndOfWeek.AddDays(1))
                    .Select(bf => new
                    {
                        bf.Id,
                        SupplierName = bf.suppliersBF.supplierBFName,
                        BankName = bf.Banks.banksName,
                        Amount = bf.AmountOFFacillities,
                        // CORRECTED: Only "trading" in supplier name is Trading, everything else is Catering
                        FacilityType = bf.suppliersBF.supplierBFName.ToLower().Contains("trading") ? "Trading" : "Catering",
                        PreparedBy = bf.User.userName,
                        bf.userCreatedDate
                    })
                    .ToList();

                return Ok(bankFacilityDetail);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // Other methods remain the same...
        [HttpGet("amount-topay-branch/{userId}/{branchName}")]
        public IActionResult GetAmountToPayBranchDetail(int userId, string branchName)
        {
            try
            {
                var user = _context.Users.FirstOrDefault(u => u.Id == userId);
                if (user == null)
                    return BadRequest("User not found.");

                var now = DateTime.Now;
                var today = now.Date;

                int daysSinceSaturday = ((int)today.DayOfWeek - (int)DayOfWeek.Saturday + 7) % 7;
                var startOfWeek = today.AddDays(-daysSinceSaturday);
                var effectiveEndOfWeek = startOfWeek.AddDays(5);

                var amountToPayDetail = _context.Amounttopays
                    .Include(a => a.Brand)
                    .Include(a => a.User)
                    .Where(a => a.CompanyId == user.companyId &&
                                a.User.branch == branchName &&
                                a.userCreatedDate.HasValue &&
                                a.userCreatedDate.Value >= startOfWeek &&
                                a.userCreatedDate.Value < effectiveEndOfWeek.AddDays(1))
                    .Select(a => new
                    {
                        a.Id,
                        BrandName = a.Brand.brandName,
                        RentAmount = a.rentPaymentsAmount,
                        RegularAmount = a.amountTOPay,
                        TotalAmount = (a.rentPaymentsAmount) + a.amountTOPay,
                        a.textForMessage,
                        PreparedBy = a.User.userName,
                        a.userCreatedDate
                    })
                    .ToList();

                return Ok(amountToPayDetail);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("amount-topay-summary/{userId}")]
        public IActionResult GetAmountToPaySummary(int userId)
        {
            try
            {
                var user = _context.Users.FirstOrDefault(u => u.Id == userId);
                if (user == null)
                    return BadRequest("User not found.");

                var now = DateTime.Now;
                var today = now.Date;

                int daysSinceSaturday = ((int)today.DayOfWeek - (int)DayOfWeek.Saturday + 7) % 7;
                var startOfWeek = today.AddDays(-daysSinceSaturday);
                var effectiveEndOfWeek = startOfWeek.AddDays(5);

                var amountToPaySummary = _context.Amounttopays
                    .Include(a => a.Brand)
                    .Include(a => a.User)
                    .Where(a => a.CompanyId == user.companyId &&
                                a.userCreatedDate.HasValue &&
                                a.userCreatedDate.Value >= startOfWeek &&
                                a.userCreatedDate.Value < effectiveEndOfWeek.AddDays(1))
                    .Select(a => new
                    {
                        a.Id,
                        BrandName = a.Brand.brandName,
                        RentAmount = a.rentPaymentsAmount,
                        RegularAmount = a.amountTOPay,
                        TotalAmount = (a.rentPaymentsAmount) + a.amountTOPay,
                        a.textForMessage,
                        UserName = a.User.userName,
                        Branch = a.User.branch,
                        a.userCreatedDate
                    })
                    .OrderBy(a => a.Branch)
                    .ThenBy(a => a.BrandName)
                    .ToList();

                return Ok(amountToPaySummary);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }
}