using System.Net.Security;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.EntityFrameworkCore;
using RequestTransferFormBackEnd.Data;
using RequestTransferFormBackEnd.Models;
using RequestTransferFormBackEnd.Services;

namespace RequestTransferFormBackEnd.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentCompletionController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IFileUploadService _fileUploadService;
        private readonly IWebHostEnvironment _environment;

        public PaymentCompletionController(AppDbContext context, IFileUploadService fileUploadService, IWebHostEnvironment environment)
        {
            _context = context;
            _fileUploadService = fileUploadService;
            _environment = environment;
        }

        // Helper method to get user and validate
        private User? GetUserById(int userId)
        {
            return _context.Users.FirstOrDefault(u => u.Id == userId);
        }

        // GET: Get all approved entries for payment processing - OPTIMIZED VERSION
        [HttpGet("approved-payments/{userId}")]
        public IActionResult GetApprovedPayments(int userId)
        {
            try
            {
                var user = GetUserById(userId);
                if (user == null) return BadRequest("User not found.");

                // KEY FIX: Add AsNoTracking() and optimize query
                var approvedPayments = _context.Preparedbies
                    .AsNoTracking() // CRITICAL: Prevents DataReader error and improves performance
                    .Where(p => p.CurrentStatus == "Approved" && p.CompanyId == user.companyId)
                    .Include(u => u.User)
                    .Include(v => v.Vendor)
                    .Include(p => p.Approvals)
                        .ThenInclude(a => a.ApprovedByUser)
                    .Include(p => p.Verifications)
                        .ThenInclude(v => v.VerifiedByUser)
                    .Include(p => p.PaymentCompletions)
                        .ThenInclude(pc => pc.UpdatedByUser)
                    .Include(p => p.PaymentCompletions)
                        .ThenInclude(pc => pc.Attachments)
                            .ThenInclude(a => a.UploadedByUser)
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
                        preparedBy = p.User!.userName,
                        preparedByBranch = p.User!.branch,
                        vendorName = p.Vendor!.supplierName,
                        vendorBank = p.Vendor!.bankName,
                        vendorBankAcc = p.Vendor!.bankAccount,
                        vendorBranch = p.Vendor!.branchName,

                        latestApprovalDate = p.Approvals
                            .Where(a => a.Status == "Approved")
                            .OrderByDescending(a => a.ApprovedDate)
                            .Select(a => (DateTime?)a.ApprovedDate)
                            .FirstOrDefault() ?? p.preparedByCreatedDate,

                        approvalHistory = p.Approvals
                            .Where(a => a.Status == "Approved")
                            .OrderByDescending(a => a.ApprovedDate)
                            .Select(a => new
                            {
                                a.Status,
                                a.Remarks,
                                a.otherAmount,
                                a.ApprovedDate,
                                approvedBy = a.ApprovedByUser!.userName
                            })
                            .FirstOrDefault(),

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

                        paymentCompletion = p.PaymentCompletions
                            .OrderByDescending(pc => pc.LastUpdatedDate)
                            .Select(pc => new
                            {
                                pc.Id,
                                pc.PaymentDone,
                                pc.OdooEntryDone,
                                pc.AttachmentsDone,
                                pc.PaymentDoneDate,
                                pc.OdooEntryDoneDate,
                                pc.AttachmentsDoneDate,
                                pc.LastUpdatedDate,
                                pc.odooReferenceNumber,
                                updatedBy = pc.UpdatedByUser!.userName,
                                isAllDone = pc.PaymentDone && pc.OdooEntryDone && pc.AttachmentsDone,
                                attachments = pc.Attachments.Select(a => new
                                {
                                    a.Id,
                                    a.FileName,
                                    a.FileType,
                                    a.FileSize,
                                    a.UploadDate,
                                    uploadedBy = a.UploadedByUser!.userName
                                }).ToList()
                            })
                            .FirstOrDefault(),

                        isFullyCompleted = p.PaymentCompletions
                            .Any(pc => pc.PaymentDone && pc.OdooEntryDone && pc.AttachmentsDone),

                        approvalCount = p.Approvals.Count(a => a.Status == "Approved"),
                        isResubmitted = p.Approvals.Count(a => a.Status == "Approved") > 1
                    })
                    .ToList() // Materialize query
                    .OrderByDescending(p => p.latestApprovalDate) // Order in memory
                    .ToList();

                return Ok(approvedPayments);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPost("update-status/{preparedById}")]
        public IActionResult UpdatePaymentStatus(int preparedById, [FromBody] PaymentStatusUpdateRequest request)
        {
            try
            {
                var existingCompletion = _context.PaymentCompletions
                    .FirstOrDefault(pc => pc.PreparedbyId == preparedById);

                if (existingCompletion == null)
                {
                    // Create new payment completion record
                    var paymentCompletion = new PaymentCompletion
                    {
                        PreparedbyId = preparedById,
                        UpdatedByUserId = request.UpdatedByUserId,
                        PaymentDone = request.PaymentDone,
                        OdooEntryDone = request.OdooEntryDone,
                        AttachmentsDone = request.AttachmentsDone,
                        LastUpdatedDate = DateTime.Now,

                        odooReferenceNumber = request.OdooReferenceNumber,

                    };

                    // Set completion dates
                    if (request.PaymentDone)
                        paymentCompletion.PaymentDoneDate = DateTime.Now;
                    if (request.OdooEntryDone)
                        paymentCompletion.OdooEntryDoneDate = DateTime.Now;
                    if (request.AttachmentsDone)
                        paymentCompletion.AttachmentsDoneDate = DateTime.Now;

                    _context.PaymentCompletions.Add(paymentCompletion);
                }
                else
                {
                    // Update existing record
                    existingCompletion.UpdatedByUserId = request.UpdatedByUserId;

                    // Only update dates when status changes from false to true
                    if (!existingCompletion.PaymentDone && request.PaymentDone)
                        existingCompletion.PaymentDoneDate = DateTime.Now;
                    if (!existingCompletion.OdooEntryDone && request.OdooEntryDone)
                        existingCompletion.OdooEntryDoneDate = DateTime.Now;
                    if (!existingCompletion.AttachmentsDone && request.AttachmentsDone)
                        existingCompletion.AttachmentsDoneDate = DateTime.Now;

                    existingCompletion.PaymentDone = request.PaymentDone;
                    existingCompletion.OdooEntryDone = request.OdooEntryDone;
                    existingCompletion.AttachmentsDone = request.AttachmentsDone;
                    existingCompletion.LastUpdatedDate = DateTime.Now;

                    existingCompletion.odooReferenceNumber = request.OdooReferenceNumber;
                }

                _context.SaveChanges();

                // RETURN THE UPDATED PAYMENT COMPLETION DATA
                var updatedPayment = _context.Preparedbies
                    .Include(u => u.User)
                    .Include(v => v.Vendor)
                    .Include(p => p.PaymentCompletions)
                        .ThenInclude(pc => pc.UpdatedByUser)
                    .Include(p => p.PaymentCompletions)
                        .ThenInclude(pc => pc.Attachments)
                    .Include(p => p.Verifications)
                        .ThenInclude(v => v.VerifiedByUser)
                    .Include(p => p.Approvals)
                        .ThenInclude(a => a.ApprovedByUser)
                    .Where(p => p.Id == preparedById)
                    .Select(p => new
                    {
                        p.Id,
                        preparedBy = p.User!.userName,
                        vendorName = p.Vendor!.supplierName,
                        vendorBank = p.Vendor!.bankName,
                        amount = p.difference,
                        preparedDate = p.preparedByCreatedDate,

                        // Verification History
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

                        // Approval History
                        approvalHistory = p.Approvals
                            .OrderByDescending(a => a.ApprovedDate)
                            .Select(a => new
                            {
                                a.Status,
                                a.Remarks,
                                a.otherAmount,
                                a.ApprovedDate,
                                approvedBy = a.ApprovedByUser!.userName
                            })
                            .ToList(),

                        paymentCompletion = p.PaymentCompletions
                            .OrderByDescending(pc => pc.LastUpdatedDate)
                            .Select(pc => new
                            {
                                pc.Id,
                                pc.PaymentDone,
                                pc.OdooEntryDone,
                                pc.AttachmentsDone,
                                pc.PaymentDoneDate,
                                pc.OdooEntryDoneDate,
                                pc.AttachmentsDoneDate,
                                pc.LastUpdatedDate,
                                updatedBy = pc.UpdatedByUser!.userName,
                                isAllDone = pc.PaymentDone && pc.OdooEntryDone && pc.AttachmentsDone,
                                attachmentCount = pc.Attachments.Count
                            })
                            .FirstOrDefault(),
                        isFullyCompleted = p.PaymentCompletions
                            .Any(pc => pc.PaymentDone && pc.OdooEntryDone && pc.AttachmentsDone),
                        completionPercentage = p.PaymentCompletions.Any() ?
                            ((p.PaymentCompletions.Max(pc =>
                                (pc.PaymentDone ? 1 : 0) +
                                (pc.OdooEntryDone ? 1 : 0) +
                                (pc.AttachmentsDone ? 1 : 0)) * 100) / 3) : 0
                    })
                    .FirstOrDefault();

                return Ok(new
                {
                    message = "Payment status updated successfully!",
                    updatedpayment = updatedPayment
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // POST: Upload attachment for payment completion
        [HttpPost("upload-attachment/{paymentCompletionId}")]
        public async Task<IActionResult> UploadAttachment(int paymentCompletionId, [FromForm] FileUploadRequest request)
        {
            try
            {
                if (request.File == null || request.File.Length == 0)
                    return BadRequest("No file uploaded.");

                var paymentCompletion = await _context.PaymentCompletions
                    .FirstOrDefaultAsync(pc => pc.Id == paymentCompletionId);

                if (paymentCompletion == null)
                    return NotFound("Payment completion record not found.");

                // Create uploads directory if it doesn't exist
                var uploadsFolder = Path.Combine(_environment.WebRootPath, "uploads", "payment-attachments", paymentCompletionId.ToString());
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                // Generate unique filename
                var uniqueFileName = $"{Guid.NewGuid()}_{Path.GetFileName(request.File.FileName)}";
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                // Save file
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await request.File.CopyToAsync(stream);
                }

                var attachment = new PaymentAttachment
                {
                    PaymentCompletionId = paymentCompletionId,
                    FileName = request.File.FileName,
                    FilePath = filePath, // Store full physical path
                    FileType = Path.GetExtension(request.File.FileName).ToLowerInvariant(),
                    FileSize = request.File.Length,
                    UploadDate = DateTime.Now,
                    UploadedByUserId = request.UploadedByUserId,
                };

                _context.PaymentAttachments.Add(attachment);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "File uploaded successfully!",
                    attachmentId = attachment.Id,
                    fileName = attachment.FileName
                });
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
                var attachment = _context.PaymentAttachments
                    .Include(a => a.UploadedByUser)
                    .FirstOrDefault(a => a.Id == attachmentId);

                if (attachment == null)
                    return NotFound("Attachment not found.");

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

                // Explicitly set Content-Disposition header
                Response.Headers.Add("Content-Disposition", $"attachment; filename=\"{attachment.FileName}\"");
                return File(fileBytes, contentType);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }


        // Helper method for content type
        private string GetContentType(string fileName)
        {
            var provider = new FileExtensionContentTypeProvider();
            if (!provider.TryGetContentType(fileName, out string contentType))
            {
                contentType = "application/octet-stream";
            }
            return contentType;
        }

        // DELETE: Remove attachment
        [HttpDelete("remove-attachment/{attachmentId}")]
        public IActionResult RemoveAttachment(int attachmentId)
        {
            try
            {
                var attachment = _context.PaymentAttachments
                    .FirstOrDefault(a => a.Id == attachmentId);

                if (attachment == null)
                    return NotFound("Attachment not found.");

                // Delete physical file
                if (System.IO.File.Exists(attachment.FilePath))
                {
                    System.IO.File.Delete(attachment.FilePath);
                }

                // Delete database record
                _context.PaymentAttachments.Remove(attachment);
                _context.SaveChanges();

                return Ok(new { message = "Attachment removed successfully!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // GET: Get payment completion status - OPTIMIZED VERSION
        [HttpGet("completion-status/{userId}")]
        public IActionResult GetPaymentCompletionStatus(int userId)
        {
            try
            {
                var user = GetUserById(userId);
                if (user == null) return BadRequest("User not found.");

                var now = DateTime.Now;
                var startOfMonth = new DateTime(now.Year, now.Month, 1);
                var startOfNextMonth = startOfMonth.AddMonths(1);

                // KEY FIX: Add AsNoTracking()
                var completionStatus = _context.Preparedbies
                    .AsNoTracking() // CRITICAL: Prevents DataReader error
                    .Where(p => p.CurrentStatus == "Approved"
                                && p.preparedByCreatedDate >= startOfMonth
                                && p.preparedByCreatedDate < startOfNextMonth
                                && p.CompanyId == user.companyId)
                    .Include(u => u.User)
                    .Include(v => v.Vendor)
                    .Include(p => p.PaymentCompletions)
                        .ThenInclude(pc => pc.UpdatedByUser)
                    .Include(p => p.PaymentCompletions)
                        .ThenInclude(pc => pc.Attachments)
                    .Include(p => p.Approvals)
                    .Include(p => p.Verifications)
                        .ThenInclude(v => v.VerifiedByUser)
                    .Select(p => new
                    {
                        p.Id,
                        preparedBy = p.User!.userName,
                        preparedByBranch = p.User!.branch,
                        vendorName = p.Vendor!.supplierName,
                        vendorBank = p.Vendor!.bankName,
                        amount = p.difference,
                        preparedDate = p.preparedByCreatedDate,

                        latestApprovalDate = p.Approvals
                            .Where(a => a.Status == "Approved")
                            .OrderByDescending(a => a.ApprovedDate)
                            .Select(a => (DateTime?)a.ApprovedDate)
                            .FirstOrDefault() ?? p.preparedByCreatedDate,

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
                                a.otherAmount,
                                a.ApprovedDate,
                                approvedBy = a.ApprovedByUser!.userName
                            })
                            .ToList(),

                        paymentCompletion = p.PaymentCompletions
                            .OrderByDescending(pc => pc.LastUpdatedDate)
                            .Select(pc => new
                            {
                                pc.Id,
                                pc.PaymentDone,
                                pc.OdooEntryDone,
                                pc.AttachmentsDone,
                                pc.PaymentDoneDate,
                                pc.OdooEntryDoneDate,
                                pc.AttachmentsDoneDate,
                                pc.odooReferenceNumber,
                                pc.LastUpdatedDate,
                                updatedBy = pc.UpdatedByUser!.userName,
                                isAllDone = pc.PaymentDone && pc.OdooEntryDone && pc.AttachmentsDone,
                                attachmentCount = pc.Attachments.Count
                            })
                            .FirstOrDefault(),

                        isFullyCompleted = p.PaymentCompletions
                            .Any(pc => pc.PaymentDone && pc.OdooEntryDone && pc.AttachmentsDone),

                        completionPercentage = p.PaymentCompletions.Any() ?
                            ((p.PaymentCompletions.Max(pc =>
                                (pc.PaymentDone ? 1 : 0) +
                                (pc.OdooEntryDone ? 1 : 0) +
                                (pc.AttachmentsDone ? 1 : 0)) * 100) / 3) : 0,

                        approvalCount = p.Approvals.Count(a => a.Status == "Approved"),
                        isResubmitted = p.Approvals.Count(a => a.Status == "Approved") > 1
                    })
                    .ToList() // Materialize query
                    .OrderByDescending(p => p.latestApprovalDate) // Order in memory
                    .ToList();

                return Ok(completionStatus);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }


        [HttpGet("payment-details/{preparedById}/{userId}")]
        public IActionResult GetPaymentDetails(int preparedById, int userId)
        {
            try
            {
                var user = GetUserById(userId);
                if (user == null) return BadRequest("User not found.");

                var paymentDetails = _context.Preparedbies
                    .Include(u => u.User)
                    .Include(v => v.Vendor)
                    .Include(p => p.Approvals)
                        .ThenInclude(a => a.ApprovedByUser)
                    .Include(p => p.Verifications)
                        .ThenInclude(v => v.VerifiedByUser)
                    .Include(p => p.PaymentCompletions)
                        .ThenInclude(pc => pc.UpdatedByUser)
                    .Include(p => p.PaymentCompletions)
                        .ThenInclude(pc => pc.Attachments)
                            .ThenInclude(a => a.UploadedByUser)
                    .Where(p => p.Id == preparedById && p.CurrentStatus == "Approved" && p.CompanyId == user.companyId)
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
                        preparedBy = p.User!.userName,
                        preparedByBranch = p.User!.branch,
                        vendorName = p.Vendor!.supplierName,
                        vendorBank = p.Vendor!.bankName,
                        vendorBankAcc = p.Vendor!.bankAccount,
                        vendorBranch = p.Vendor!.branchName,

                        // All approval history (not just latest)
                        allApprovals = p.Approvals
                            .Where(a => a.Status == "Approved")
                            .OrderByDescending(a => a.ApprovedDate)
                            .Select(a => new
                            {
                                a.Status,
                                a.Remarks,
                                a.otherAmount,
                                a.ApprovedDate,
                                approvedBy = a.ApprovedByUser!.userName
                            })
                            .ToList(),

                        // Latest approval
                        latestApproval = p.Approvals
                            .Where(a => a.Status == "Approved")
                            .OrderByDescending(a => a.ApprovedDate)
                            .Select(a => new
                            {
                                a.Status,
                                a.Remarks,
                                a.otherAmount,
                                a.ApprovedDate,
                                approvedBy = a.ApprovedByUser!.userName
                            })
                            .FirstOrDefault(),
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

                        // Payment completion status with full history
                        paymentCompletions = p.PaymentCompletions
                            .OrderByDescending(pc => pc.LastUpdatedDate)
                            .Select(pc => new
                            {
                                pc.Id,
                                pc.PaymentDone,
                                pc.OdooEntryDone,
                                pc.AttachmentsDone,
                                pc.PaymentDoneDate,
                                pc.OdooEntryDoneDate,
                                pc.AttachmentsDoneDate,
                                pc.LastUpdatedDate,

                                pc.odooReferenceNumber,
                                updatedBy = pc.UpdatedByUser!.userName,
                                isAllDone = pc.PaymentDone && pc.OdooEntryDone && pc.AttachmentsDone,

                                // All attachments with download capability
                                attachments = pc.Attachments.Select(a => new
                                {
                                    a.Id,
                                    a.FileName,
                                    a.FileType,
                                    a.FileSize,
                                    a.UploadDate,
                                    uploadedBy = a.UploadedByUser!.userName
                                }).ToList()
                            })
                            .ToList(),

                        // Current completion status
                        currentCompletion = p.PaymentCompletions
                            .OrderByDescending(pc => pc.LastUpdatedDate)
                            .Select(pc => new
                            {
                                pc.Id,
                                pc.PaymentDone,
                                pc.OdooEntryDone,
                                pc.AttachmentsDone,
                                pc.PaymentDoneDate,
                                pc.OdooEntryDoneDate,
                                pc.AttachmentsDoneDate,
                                pc.LastUpdatedDate,

                                pc.odooReferenceNumber,
                                updatedBy = pc.UpdatedByUser!.userName,
                                isAllDone = pc.PaymentDone && pc.OdooEntryDone && pc.AttachmentsDone
                            })
                            .FirstOrDefault(),

                        isFullyCompleted = p.PaymentCompletions
                            .Any(pc => pc.PaymentDone && pc.OdooEntryDone && pc.AttachmentsDone),

                        // Resubmission tracking
                        approvalCount = p.Approvals.Count(a => a.Status == "Approved"),
                        isResubmitted = p.Approvals.Count(a => a.Status == "Approved") > 1,
                        firstApprovalDate = p.Approvals
                            .Where(a => a.Status == "Approved")
                            .OrderBy(a => a.ApprovedDate)
                            .Select(a => a.ApprovedDate)
                            .FirstOrDefault(),
                        latestApprovalDate = p.Approvals
                            .Where(a => a.Status == "Approved")
                            .OrderByDescending(a => a.ApprovedDate)
                            .Select(a => a.ApprovedDate)
                            .FirstOrDefault()
                    })
                    .FirstOrDefault();

                if (paymentDetails == null)
                    return NotFound("Payment details not found.");

                return Ok(paymentDetails);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }

    public class PaymentStatusUpdateRequest
    {
        public int UpdatedByUserId { get; set; }
        public bool PaymentDone { get; set; }
        public bool OdooEntryDone { get; set; }
        public bool AttachmentsDone { get; set; }
        public string? OdooReferenceNumber { get; set; }
    }

    public class FileUploadRequest
    {
        public IFormFile File { get; set; } = null!;
        public int UploadedByUserId { get; set; }
    }
}