using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RequestTransferFormBackEnd.Data;
using RequestTransferFormBackEnd.Models;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.AspNetCore.Hosting;

namespace RequestTransferFormBackEnd.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class VerifierController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _environment;

        public VerifierController(AppDbContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        // GET: List of remarks
        [HttpGet]
        public async Task<IActionResult> GetRemarks()
        {
            try
            {
                var remarks = await _context.Verifieds
                    .Select(r => new
                    {
                        r.Id,
                        r.Remarks,
                        r.VerifiedDate
                    })
                    .ToListAsync();

                return Ok(remarks);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        // Helper method to get user and validate
        private User? GetUserById(int userId)
        {
            return _context.Users.FirstOrDefault(u => u.Id == userId);
        }

        // GET pending entries for verification
        [HttpGet("pending/{userId}")]
        public IActionResult GetPendingVerifications(int userId)
        {
            try
            {
                var user = GetUserById(userId);
                if (user == null) return BadRequest("User not found.");

                var pending = _context.Preparedbies
                    .Include(u => u.User)
                    .Include(v => v.Vendor)
                    .Include(p => p.Attachments)
                        .ThenInclude(a => a.UploadedByUser)
                    .Include(p => p.Verifications)
                        .ThenInclude(v => v.VerifiedByUser)
                    .Include(p => p.Approvals)
                        .ThenInclude(a => a.ApprovedByUser)
                    .Where(p => (p.CurrentStatus == "Submitted" || p.CurrentStatus == "Re-Submitted")
                                && p.CompanyId == user.companyId)
                    .Select(p => new
                    {
                        p.Id,
                        p.balanceAsPerAdmaShamran,
                        p.balanceAsPerSupplier,
                        p.difference,
                        p.reasonOFDifference,
                        p.paymentDue,
                        p.remarks,
                        p.preparedByCreatedDate,
                        p.CurrentStatus,
                        p.PriorityName,
                        preparedBy = p.User!.userName,
                        preparedByBranch = p.User!.branch,
                        vendorName = p.Vendor!.supplierName,
                        vendorBank = p.Vendor!.bankName,
                        vendorBankAcc = p.Vendor!.bankAccount,
                        vendorBranch = p.Vendor!.branchName,
                        attachments = p.Attachments.Select(a => new
                        {
                            a.Id,
                            a.FileName,
                            a.FileType,
                            a.FileSize,
                            a.UploadDate,
                            uploadedBy = a.UploadedByUser!.userName
                        }).ToList(),
                        attachmentCount = p.Attachments.Count,
                        // History
                        verificationHistory = p.Verifications
                            .OrderByDescending(v => v.VerifiedDate)
                            .Select(v => new
                            {
                                v.Status,
                                v.Remarks,
                                v.VerifiedDate,
                                verifiedBy = v.VerifiedByUser!.userName
                            })
                            .ToList(),
                        approvalHistory = p.Approvals
                            .OrderByDescending(a => a.ApprovedDate)
                            .Select(a => new
                            {
                                a.Status,
                                a.Remarks,
                                a.ApprovedDate,
                                approvedBy = a.ApprovedByUser!.userName
                            })
                            .ToList()
                    })
                    .OrderBy(p => p.preparedByCreatedDate)
                    .ToList();

                return Ok(pending);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // GET returned entries
        [HttpGet("returned/{userId}")]
        public IActionResult GetReturnedEntries(int userId)
        {
            try
            {
                var user = GetUserById(userId);
                if (user == null) return BadRequest("User not found.");

                var returned = _context.Preparedbies
                    .Include(u => u.User)
                    .Include(v => v.Vendor)
                    .Include(p => p.Attachments)
                        .ThenInclude(a => a.UploadedByUser)
                    .Include(p => p.Verifications)
                        .ThenInclude(v => v.VerifiedByUser)
                    .Include(p => p.Approvals)
                        .ThenInclude(a => a.ApprovedByUser)
                    .Where(p => p.CurrentStatus == "Returned"
                                && p.CompanyId == user.companyId)
                    .Select(p => new
                    {
                        p.Id,
                        p.balanceAsPerAdmaShamran,
                        p.balanceAsPerSupplier,
                        p.difference,
                        p.reasonOFDifference,
                        p.paymentDue,
                        p.remarks,
                        p.preparedByCreatedDate,
                        p.CurrentStatus,
                        p.PriorityName,
                        preparedBy = p.User!.userName,
                        preparedByBranch = p.User!.branch,
                        vendorName = p.Vendor!.supplierName,
                        vendorBank = p.Vendor!.bankName,
                        vendorBankAcc = p.Vendor!.bankAccount,
                        vendorBranch = p.Vendor!.branchName,
                        verifierRemarks = _context.Verifieds
                            .Where(v => v.PreparedbyId == p.Id)
                            .OrderByDescending(v => v.VerifiedDate)
                            .Select(v => v.Remarks)
                            .FirstOrDefault(),
                        attachments = p.Attachments.Select(a => new
                        {
                            a.Id,
                            a.FileName,
                            a.FileType,
                            a.FileSize,
                            a.UploadDate,
                            uploadedBy = a.UploadedByUser!.userName
                        }).ToList(),
                        attachmentCount = p.Attachments.Count,
                        // History
                        verificationHistory = p.Verifications
                            .OrderByDescending(v => v.VerifiedDate)
                            .Select(v => new
                            {
                                v.Status,
                                v.Remarks,
                                v.VerifiedDate,
                                verifiedBy = v.VerifiedByUser!.userName
                            })
                            .ToList(),
                        approvalHistory = p.Approvals
                            .OrderByDescending(a => a.ApprovedDate)
                            .Select(a => new
                            {
                                a.Status,
                                a.Remarks,
                                a.ApprovedDate,
                                approvedBy = a.ApprovedByUser!.userName
                            })
                            .ToList()
                    })
                    .OrderByDescending(p => p.preparedByCreatedDate)
                    .ToList();

                return Ok(returned);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // GET verified entries
        [HttpGet("verified/{userId}")]
        public IActionResult GetVerifiedEntries(int userId)
        {
            try
            {
                var user = GetUserById(userId);
                if (user == null) return BadRequest("User not found.");

                var verified = _context.Preparedbies
                    .Include(u => u.User)
                    .Include(v => v.Vendor)
                    .Include(p => p.Attachments)
                        .ThenInclude(a => a.UploadedByUser)
                    .Include(p => p.Verifications)
                        .ThenInclude(v => v.VerifiedByUser)
                    .Include(p => p.Approvals)
                        .ThenInclude(a => a.ApprovedByUser)
                    .Where(p => p.CurrentStatus == "Verified"
                                && p.CompanyId == user.companyId)
                    .Select(p => new
                    {
                        p.Id,
                        p.balanceAsPerAdmaShamran,
                        p.balanceAsPerSupplier,
                        p.difference,
                        p.reasonOFDifference,
                        p.paymentDue,
                        p.remarks,
                        p.preparedByCreatedDate,
                        p.CurrentStatus,
                        p.PriorityName,
                        preparedBy = p.User!.userName,
                        preparedByBranch = p.User!.branch,
                        vendorName = p.Vendor!.supplierName,
                        vendorBank = p.Vendor!.bankName,
                        vendorBankAcc = p.Vendor!.bankAccount,
                        vendorBranch = p.Vendor!.branchName,
                        attachments = p.Attachments.Select(a => new
                        {
                            a.Id,
                            a.FileName,
                            a.FileType,
                            a.FileSize,
                            a.UploadDate,
                            uploadedBy = a.UploadedByUser!.userName
                        }).ToList(),
                        attachmentCount = p.Attachments.Count,
                        // History
                        verificationHistory = p.Verifications
                            .OrderByDescending(v => v.VerifiedDate)
                            .Select(v => new
                            {
                                v.Status,
                                v.Remarks,
                                v.VerifiedDate,
                                verifiedBy = v.VerifiedByUser!.userName
                            })
                            .ToList(),
                        approvalHistory = p.Approvals
                            .OrderByDescending(a => a.ApprovedDate)
                            .Select(a => new
                            {
                                a.Status,
                                a.Remarks,
                                a.ApprovedDate,
                                approvedBy = a.ApprovedByUser!.userName
                            })
                            .ToList()
                    })
                    .OrderByDescending(p => p.preparedByCreatedDate)
                    .ToList();

                return Ok(verified);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // GET rejected entries
        [HttpGet("rejected/{userId}")]
        public IActionResult GetRejectedEntries(int userId)
        {
            var now = DateTime.Now;
            var startOfMonth = new DateTime(now.Year, now.Month, 1);
            var startOfNextMonth = startOfMonth.AddMonths(1);
            try
            {
                var user = GetUserById(userId);
                if (user == null) return BadRequest("User not found.");

                var rejected = _context.Preparedbies
                    .Include(u => u.User)
                    .Include(v => v.Vendor)
                    .Include(p => p.Attachments)
                        .ThenInclude(a => a.UploadedByUser)
                    .Include(p => p.Verifications)
                        .ThenInclude(v => v.VerifiedByUser)
                    .Include(p => p.Approvals)
                        .ThenInclude(a => a.ApprovedByUser)
                    .Where(p => p.CurrentStatus == "Rejected" && p.preparedByCreatedDate >= startOfMonth
                                && p.preparedByCreatedDate < startOfNextMonth
                                && p.CompanyId == user.companyId)
                    .Select(p => new
                    {
                        p.Id,
                        p.balanceAsPerAdmaShamran,
                        p.balanceAsPerSupplier,
                        p.difference,
                        p.reasonOFDifference,
                        p.paymentDue,
                        p.remarks,
                        p.preparedByCreatedDate,
                        p.CurrentStatus,
                        p.PriorityName,
                        preparedBy = p.User!.userName,
                        preparedByBranch = p.User!.branch,
                        vendorName = p.Vendor!.supplierName,
                        vendorBank = p.Vendor!.bankName,
                        vendorBankAcc = p.Vendor!.bankAccount,
                        vendorBranch = p.Vendor!.branchName,
                        attachments = p.Attachments.Select(a => new
                        {
                            a.Id,
                            a.FileName,
                            a.FileType,
                            a.FileSize,
                            a.UploadDate,
                            uploadedBy = a.UploadedByUser!.userName
                        }).ToList(),
                        attachmentCount = p.Attachments.Count,
                        // History
                        verificationHistory = p.Verifications
                            .OrderByDescending(v => v.VerifiedDate)
                            .Select(v => new
                            {
                                v.Status,
                                v.Remarks,
                                v.VerifiedDate,
                                verifiedBy = v.VerifiedByUser!.userName
                            })
                            .ToList(),
                        approvalHistory = p.Approvals
                            .OrderByDescending(a => a.ApprovedDate)
                            .Select(a => new
                            {
                                a.Status,
                                a.Remarks,
                                a.ApprovedDate,
                                approvedBy = a.ApprovedByUser!.userName
                            })
                            .ToList()
                    })
                    .OrderByDescending(p => p.preparedByCreatedDate)
                    .ToList();

                return Ok(rejected);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // Remaining endpoints (verify, return, download, entry details) don't require filtering by company
        // because they work on a single entry by ID

        [HttpPost("verify/{id}")]
        public IActionResult VerifyEntry(int id, [FromBody] VerifyRequest request)
        {
            try
            {
                var entry = _context.Preparedbies.FirstOrDefault(p => p.Id == id);
                if (entry == null) return NotFound("Entry not found.");

                entry.CurrentStatus = "Verified";

                var verification = new Verified
                {
                    PreparedbyId = id,
                    VerifiedByUserId = request.VerifiedByUserId,
                    Status = "Verified",
                    Remarks = request.Remarks,
                    VerifiedDate = DateTime.Now
                };

                _context.Verifieds.Add(verification);
                _context.SaveChanges();

                return Ok(new { message = "Verified successfully! Entry sent to approver.", entry.Id });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPost("return/{id}")]
        public IActionResult ReturnEntry(int id, [FromBody] VerifyRequest request)
        {
            try
            {
                var entry = _context.Preparedbies.FirstOrDefault(p => p.Id == id);
                if (entry == null) return NotFound("Entry not found.");

                entry.CurrentStatus = "Returned";

                var verification = new Verified
                {
                    PreparedbyId = id,
                    VerifiedByUserId = request.VerifiedByUserId,
                    Status = "Returned",
                    Remarks = request.Remarks,
                    VerifiedDate = DateTime.Now
                };

                _context.Verifieds.Add(verification);
                _context.SaveChanges();

                return Ok(new { message = "Returned for correction!", entry.Id });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPost("return-to-preparer/{id}")]
        public IActionResult ReturnToPreparer(int id, [FromBody] VerifyRequest request)
        {
            try
            {
                var entry = _context.Preparedbies.FirstOrDefault(p => p.Id == id);
                if (entry == null) return NotFound("Entry not found.");

                if (entry.CurrentStatus != "Returned-To-Verifier")
                    return BadRequest("Only entries returned by approver can be sent back to preparer.");

                entry.CurrentStatus = "Returned";

                var verification = new Verified
                {
                    PreparedbyId = id,
                    VerifiedByUserId = request.VerifiedByUserId,
                    Status = "Returned-From-Approver",
                    Remarks = request.Remarks,
                    VerifiedDate = DateTime.Now
                };

                _context.Verifieds.Add(verification);
                _context.SaveChanges();

                return Ok(new { message = "Returned to preparer for correction!", entry.Id });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // GET entry details with attachments
        [HttpGet("entry-details/{id}")]
        public IActionResult GetEntryDetails(int id)
        {
            try
            {
                var entry = _context.Preparedbies
                    .Include(u => u.User)
                    .Include(v => v.Vendor)
                    .Include(p => p.Verifications)
                        .ThenInclude(v => v.VerifiedByUser)
                    .Include(p => p.Approvals)
                        .ThenInclude(a => a.ApprovedByUser)
                    .Include(p => p.Attachments)
                        .ThenInclude(a => a.UploadedByUser)
                    .Where(p => p.Id == id)
                    .Select(p => new
                    {
                        p.Id,
                        p.balanceAsPerAdmaShamran,
                        p.balanceAsPerSupplier,
                        p.difference,
                        p.reasonOFDifference,
                        p.paymentDue,
                        p.remarks,
                        p.preparedByCreatedDate,
                        p.CurrentStatus,
                        p.PriorityName,
                        preparedBy = p.User!.userName,
                        preparedByBranch = p.User!.branch,
                        vendorName = p.Vendor!.supplierName,
                        vendorBank = p.Vendor!.bankName,
                        vendorBankAcc = p.Vendor!.bankAccount,
                        vendorBranch = p.Vendor!.branchName,
                        attachments = p.Attachments.Select(a => new
                        {
                            a.Id,
                            a.FileName,
                            a.FileType,
                            a.FileSize,
                            a.UploadDate,
                            uploadedBy = a.UploadedByUser!.userName
                        }).ToList(),
                        verificationHistory = p.Verifications
                            .OrderByDescending(v => v.VerifiedDate)
                            .Select(v => new
                            {
                                v.Status,
                                v.Remarks,
                                v.VerifiedDate,
                                verifiedBy = v.VerifiedByUser!.userName
                            })
                            .ToList(),
                        approvalHistory = p.Approvals
                            .OrderByDescending(a => a.ApprovedDate)
                            .Select(a => new
                            {
                                a.Status,
                                a.Remarks,
                                a.ApprovedDate,
                                approvedBy = a.ApprovedByUser!.userName
                            })
                            .ToList()
                    })
                    .FirstOrDefault();

                if (entry == null) return NotFound("Entry not found.");

                return Ok(entry);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("download-attachment/{attachmentId}")]
        public IActionResult DownloadAttachment(int attachmentId)
        {
            try
            {
                var attachment = _context.PreparedbyAttachments
                    .Include(a => a.UploadedByUser)
                    .FirstOrDefault(a => a.Id == attachmentId);

                if (attachment == null) return NotFound("Attachment not found.");

                string actualFilePath = attachment.FilePath;
                if (string.IsNullOrWhiteSpace(actualFilePath))
                    throw new InvalidOperationException("File path is missing or invalid.");

                if (!Path.IsPathRooted(actualFilePath))
                    actualFilePath = Path.Combine(_environment.WebRootPath, actualFilePath.TrimStart('~', '/'));

                actualFilePath = actualFilePath.Replace("/", Path.DirectorySeparatorChar.ToString())
                                               .Replace("\\", Path.DirectorySeparatorChar.ToString());

                if (!System.IO.File.Exists(actualFilePath))
                    return NotFound("File not found.");

                var fileBytes = System.IO.File.ReadAllBytes(actualFilePath);
                var contentType = GetContentType(attachment.FileName);

                Response.Headers.Add("Content-Disposition", $"attachment; filename=\"{attachment.FileName}\"");
                return File(fileBytes, contentType);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("returned-by-approver/{userId}")]
        public IActionResult GetReturnedByApprover(int userId)
        {
            var user = GetUserById(userId);
            if (user == null) return BadRequest("User not found.");

            var entries = _context.Preparedbies
                .Include(p => p.User)
                .Include(p => p.Vendor)
                .Include(p => p.Attachments)
                    .ThenInclude(a => a.UploadedByUser)
                .Include(p => p.Verifications)
                    .ThenInclude(v => v.VerifiedByUser)
                .Include(p => p.Approvals)
                    .ThenInclude(a => a.ApprovedByUser)
                .Where(p => p.CurrentStatus == "Returned-To-Verifier" && p.CompanyId == user.companyId)
                .Select(p => new
                {
                    p.Id,
                    p.balanceAsPerAdmaShamran,
                    p.balanceAsPerSupplier,
                    p.difference,
                    p.reasonOFDifference,
                    p.paymentDue,
                    p.remarks,
                    p.preparedByCreatedDate,
                    p.CurrentStatus,
                    p.PriorityName,
                    preparedBy = p.User!.userName,
                    preparedByBranch = p.User!.branch,
                    vendorName = p.Vendor!.supplierName,
                    vendorBank = p.Vendor!.bankName,
                    vendorBankAcc = p.Vendor!.bankAccount,
                    vendorBranch = p.Vendor!.branchName,
                    attachments = p.Attachments.Select(a => new
                    {
                        a.Id,
                        a.FileName,
                        a.FileType,
                        a.FileSize,
                        a.UploadDate,
                        uploadedBy = a.UploadedByUser!.userName
                    }).ToList(),
                    attachmentCount = p.Attachments.Count,
                    // History
                    verificationHistory = p.Verifications
                        .OrderByDescending(v => v.VerifiedDate)
                        .Select(v => new
                        {
                            v.Status,
                            v.Remarks,
                            v.VerifiedDate,
                            verifiedBy = v.VerifiedByUser!.userName
                        })
                        .ToList(),
                    approvalHistory = p.Approvals
                        .OrderByDescending(a => a.ApprovedDate)
                        .Select(a => new
                        {
                            a.Status,
                            a.Remarks,
                            a.ApprovedDate,
                            approvedBy = a.ApprovedByUser!.userName
                        })
                        .ToList()
                })
                .OrderByDescending(p => p.preparedByCreatedDate)
                .ToList();

            return Ok(entries);
        }
        // GET approved entries
        [HttpGet("approved/{userId}")]
        public IActionResult GetApprovedEntries(
                int userId,
                 DateTime? fromDate,
                 DateTime? toDate)
        {
            var user = GetUserById(userId);
            if (user == null)
                return BadRequest("User not found.");

            // Default: current month
            var now = DateTime.Now;
            var startDate = fromDate ?? new DateTime(now.Year, now.Month, 1);
            var endDate = toDate ?? startDate.AddMonths(1);

            var approved = _context.Preparedbies
                .Include(p => p.User)
                .Include(p => p.Vendor)
                .Include(p => p.Attachments)
                    .ThenInclude(a => a.UploadedByUser)
                .Include(p => p.Verifications)
                    .ThenInclude(v => v.VerifiedByUser)
                .Include(p => p.Approvals)
                    .ThenInclude(a => a.ApprovedByUser)
                .Where(p =>
                    p.CurrentStatus == "Approved" &&
                    p.CompanyId == user.companyId &&
                    p.preparedByCreatedDate >= startDate &&
                    p.preparedByCreatedDate <= endDate
                )
                .Select(p => new
                {
                    p.Id,
                    p.balanceAsPerAdmaShamran,
                    p.balanceAsPerSupplier,
                    p.difference,
                    p.reasonOFDifference,
                    p.paymentDue,
                    p.remarks,
                    p.preparedByCreatedDate,
                    p.CurrentStatus,
                    p.PriorityName,

                    preparedBy = p.User!.userName,
                    preparedByBranch = p.User!.branch,

                    vendorName = p.Vendor!.supplierName,
                    vendorBank = p.Vendor!.bankName,
                    vendorBankAcc = p.Vendor!.bankAccount,
                    vendorBranch = p.Vendor!.branchName,

                    attachments = p.Attachments.Select(a => new
                    {
                        a.Id,
                        a.FileName,
                        a.FileType,
                        a.FileSize,
                        a.UploadDate,
                        uploadedBy = a.UploadedByUser!.userName
                    }).ToList(),

                    attachmentCount = p.Attachments.Count,

                    verificationHistory = p.Verifications
                        .OrderByDescending(v => v.VerifiedDate)
                        .Select(v => new
                        {
                            v.Status,
                            v.Remarks,
                            v.VerifiedDate,
                            verifiedBy = v.VerifiedByUser!.userName
                        }).ToList(),

                    approvalHistory = p.Approvals
                        .OrderByDescending(a => a.ApprovedDate)
                        .Select(a => new
                        {
                            a.Status,
                            a.Remarks,
                            a.ApprovedDate,
                            approvedBy = a.ApprovedByUser!.userName
                        }).ToList()
                })
                .OrderByDescending(p => p.preparedByCreatedDate)
                .ToList();

            return Ok(approved);
        }


        private string GetContentType(string fileName)
        {
            var provider = new FileExtensionContentTypeProvider();
            if (!provider.TryGetContentType(fileName, out string contentType))
            {
                contentType = "application/octet-stream";
            }
            return contentType;
        }

        public class VerifyRequest
        {
            public int VerifiedByUserId { get; set; }
            public string Remarks { get; set; } = string.Empty;
        }
    }
}