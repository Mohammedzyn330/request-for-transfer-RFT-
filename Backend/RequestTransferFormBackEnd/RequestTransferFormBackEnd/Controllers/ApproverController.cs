using Azure;
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
    public class ApproverController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IFileUploadService _fileUploadService;
        private readonly IWebHostEnvironment _environment;

        public ApproverController(AppDbContext context, IFileUploadService fileUploadService, IWebHostEnvironment environment)
        {
            _context = context;
            _fileUploadService = fileUploadService;
            _environment = environment ?? throw new ArgumentNullException(nameof(environment));
        }

        // Helper method to get user and validate
        private User? GetUserById(int userId)
        {
            return _context.Users.FirstOrDefault(u => u.Id == userId);
        }

        // GET: Get payment completion status for approver dashboard
        [HttpGet("payment-completion-status/{userId}")]
        public IActionResult GetPaymentCompletionStatus(int userId)
        {
            try
            {
                var user = GetUserById(userId);
                if (user == null) return BadRequest("User not found.");

                //get the current month and year data only
                var now = DateTime.Now;
                var startOfMonth = new DateTime(now.Year, now.Month, 1);
                var startOfNextMonth = startOfMonth.AddMonths(1);

                var completionStatus = _context.Preparedbies
                    .Include(u => u.User)
                    .Include(v => v.Vendor)
                    .Include(p => p.PaymentCompletions)
                        .ThenInclude(pc => pc.UpdatedByUser)
                    .Include(p => p.PaymentCompletions)
                        .ThenInclude(pc => pc.Attachments)
                            .ThenInclude(a => a.UploadedByUser)
                    .Where(p => p.CurrentStatus == "Approved"
                                && p.preparedByCreatedDate >= startOfMonth
                                && p.preparedByCreatedDate < startOfNextMonth
                                && p.CompanyId == user.companyId)
                    .Select(p => new
                    {
                        p.Id,
                        preparedBy = p.User!.userName,
                        preparedByBranch = p.User!.branch,
                        vendorName = p.Vendor!.supplierName,
                        vendorBank = p.Vendor!.bankName,
                        vendorBankAcc = p.Vendor!.bankAccount,
                        vendorBranch = p.Vendor!.branchName,
                        amount = p.difference,
                        admabalance = p.balanceAsPerAdmaShamran,
                        supplierbalance = p.balanceAsPerSupplier,
                        preparedDate = p.preparedByCreatedDate,

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

                                attachments = pc.Attachments.Select(a => new
                                {
                                    a.Id,
                                    a.FileName,
                                    a.FileType,
                                    a.FileSize,
                                    a.UploadDate,
                                    uploadedBy = a.UploadedByUser!.userName,
                                    canDownload = true
                                }).ToList()
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
                    .OrderByDescending(p => p.preparedDate)
                    .ToList();

                return Ok(completionStatus);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // GET: Download payment completion attachment (from finance team)
        [HttpGet("download-payment-attachment/{attachmentId}")]
        public IActionResult DownloadPaymentAttachment(int attachmentId)
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

        // GET: Download preparer's original attachment (from preparer)
        [HttpGet("download-preparer-attachment/{attachmentId}")]
        public IActionResult DownloadPreparerAttachment(int attachmentId)
        {
            try
            {
                var attachment = _context.PreparedbyAttachments
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

        // GET: Get detailed payment completion for a specific entry
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
                        p.PriorityName,
                        preparedBy = p.User!.userName,
                        preparedByBranch = p.User!.branch,
                        vendorName = p.Vendor!.supplierName,
                        vendorBank = p.Vendor!.bankName,
                        vendorBankAcc = p.Vendor!.bankAccount,
                        vendorBranch = p.Vendor!.branchName,

                        // Approval details
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
                                pc.PaymentDone,
                                pc.OdooEntryDone,
                                pc.AttachmentsDone,
                                isAllDone = pc.PaymentDone && pc.OdooEntryDone && pc.AttachmentsDone
                            })
                            .FirstOrDefault(),

                        isFullyCompleted = p.PaymentCompletions
                            .Any(pc => pc.PaymentDone && pc.OdooEntryDone && pc.AttachmentsDone)
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

        //only verified entries - UPDATED WITH PREPARER ATTACHMENTS AND COMPANY FILTERING
        [HttpGet("pending/{userId}")]
        public IActionResult GetPendingApprovals(int userId)
        {
            try
            {
                var user = GetUserById(userId);
                if (user == null) return BadRequest("User not found.");

                var pending = _context.Preparedbies
                    .Include(u => u.User)
                    .Include(v => v.Vendor)
                    .Include(p => p.Verifications)
                    .Include(p => p.Attachments)
                        .ThenInclude(a => a.UploadedByUser)
                    .Where(p => p.CurrentStatus == "Verified" && p.CompanyId == user.companyId)
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

                        // Preparer's attachments
                        preparerAttachments = p.Attachments.Select(a => new
                        {
                            a.Id,
                            a.FileName,
                            a.FileType,
                            a.FileSize,
                            a.UploadDate,
                            uploadedBy = a.UploadedByUser!.userName
                        }).ToList(),
                        preparerAttachmentCount = p.Attachments.Count,

                        // Get verification history
                        verificationHistory = p.Verifications
                            .Where(v => v.Status == "Verified")
                            .OrderByDescending(v => v.VerifiedDate)
                            .Select(v => new
                            {
                                v.Status,
                                v.Remarks,
                                v.VerifiedDate,
                                verifiedBy = v.VerifiedByUser!.userName
                            })
                            .FirstOrDefault(),

                        // Get latest verifier remarks
                        latestVerifierRemarks = p.Verifications
                            .Where(v => v.Status == "Verified")
                            .OrderByDescending(v => v.VerifiedDate)
                            .Select(v => v.Remarks)
                            .FirstOrDefault()
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
        // GET approved entries - SIMPLE FIX (just add AsNoTracking and optimize query)
        [HttpGet("approved/{userId}")]
        public IActionResult GetApprovedEntries(int userId)
        {
            try
            {
                var user = GetUserById(userId);
                if (user == null) return BadRequest("User not found.");

                // Get current month and year data
                var now = DateTime.Now;
                var startOfMonth = new DateTime(now.Year, now.Month, 1);
                var startOfNextMonth = startOfMonth.AddMonths(1);

                // KEY FIX: Add AsNoTracking() before the query and materialize early
                var approved = _context.Preparedbies
                    .AsNoTracking() // CRITICAL: Prevents DataReader error and improves performance
                    .Where(p => p.CurrentStatus == "Approved"
                                && p.preparedByCreatedDate >= startOfMonth
                                && p.preparedByCreatedDate < startOfNextMonth
                                && p.CompanyId == user.companyId)
                    .Include(u => u.User)
                    .Include(v => v.Vendor)
                    .Include(p => p.Approvals)
                        .ThenInclude(a => a.ApprovedByUser)
                    .Include(p => p.PaymentCompletions)
                        .ThenInclude(pc => pc.UpdatedByUser)
                    .Include(p => p.Attachments)
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
                        p.PriorityName,
                        preparedBy = p.User!.userName,
                        preparedByBranch = p.User!.branch,
                        vendorName = p.Vendor!.supplierName,
                        vendorBank = p.Vendor!.bankName,
                        vendorBankAcc = p.Vendor!.bankAccount,
                        vendorBranch = p.Vendor!.branchName,

                        preparerAttachments = p.Attachments.Select(a => new
                        {
                            a.Id,
                            a.FileName,
                            a.FileType,
                            a.FileSize,
                            a.UploadDate,
                            uploadedBy = a.UploadedByUser!.userName
                        }).ToList(),
                        preparerAttachmentCount = p.Attachments.Count,

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

                        paymentCompletion = p.PaymentCompletions
                            .OrderByDescending(pc => pc.LastUpdatedDate)
                            .Select(pc => new
                            {
                                pc.PaymentDone,
                                pc.OdooEntryDone,
                                pc.AttachmentsDone,
                                pc.PaymentDoneDate,
                                pc.OdooEntryDoneDate,
                                pc.AttachmentsDoneDate,
                                pc.LastUpdatedDate,
                                updatedBy = pc.UpdatedByUser!.userName,
                                isAllDone = pc.PaymentDone && pc.OdooEntryDone && pc.AttachmentsDone,
                                paymentAttachmentCount = pc.Attachments.Count
                            })
                            .FirstOrDefault(),

                        isFullyCompleted = p.PaymentCompletions
                            .Any(pc => pc.PaymentDone && pc.OdooEntryDone && pc.AttachmentsDone),

                        approvalCount = p.Approvals.Count(a => a.Status == "Approved"),
                        isResubmitted = p.Approvals.Count(a => a.Status == "Approved") > 1,
                        latestApprovalDate = p.Approvals
                            .Where(a => a.Status == "Approved")
                            .OrderByDescending(a => a.ApprovedDate)
                            .Select(a => (DateTime?)a.ApprovedDate)
                            .FirstOrDefault() ?? p.preparedByCreatedDate
                    })
                    .ToList() // Materialize the query
                    .OrderByDescending(p => p.latestApprovalDate)
                    .ToList();

                return Ok(approved);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // GET rejected entries by approver - UPDATED WITH PREPARER ATTACHMENTS AND COMPANY FILTERING
        [HttpGet("rejected/{userId}")]
        public IActionResult GetRejectedEntries(int userId)
        {
            //get current month and year data
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
                    .Include(p => p.Approvals)
                        .ThenInclude(a => a.ApprovedByUser)
                    .Include(p => p.Attachments)
                        .ThenInclude(a => a.UploadedByUser)
                    .Where(p => p.CurrentStatus == "Rejected-By-Approver" && p.CompanyId == user.companyId && p.preparedByCreatedDate >= startOfMonth
                                && p.preparedByCreatedDate < startOfNextMonth)
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

                        // Preparer's attachments
                        preparerAttachments = p.Attachments.Select(a => new
                        {
                            a.Id,
                            a.FileName,
                            a.FileType,
                            a.FileSize,
                            a.UploadDate,
                            uploadedBy = a.UploadedByUser!.userName
                        }).ToList(),
                        preparerAttachmentCount = p.Attachments.Count,

                        // Rejection details
                        rejectionHistory = p.Approvals
                            .Where(a => a.Status == "Rejected-By-Approver")
                            .OrderByDescending(a => a.ApprovedDate)
                            .Select(a => new
                            {
                                a.Status,
                                a.Remarks,
                                a.otherAmount,
                                a.ApprovedDate,
                                approvedBy = a.ApprovedByUser!.userName
                            })
                            .FirstOrDefault()
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

        // GET returned to verifier entries - UPDATED WITH PREPARER ATTACHMENTS AND COMPANY FILTERING
        [HttpGet("returned-to-verifier/{userId}")]
        public IActionResult GetReturnedToVerifierEntries(int userId)
        {
            try
            {
                var user = GetUserById(userId);
                if (user == null) return BadRequest("User not found.");

                var returned = _context.Preparedbies
                    .Include(u => u.User)
                    .Include(v => v.Vendor)
                    .Include(p => p.Approvals)
                        .ThenInclude(a => a.ApprovedByUser)
                    .Include(p => p.Attachments)
                        .ThenInclude(a => a.UploadedByUser)
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

                        // Preparer's attachments
                        preparerAttachments = p.Attachments.Select(a => new
                        {
                            a.Id,
                            a.FileName,
                            a.FileType,
                            a.FileSize,
                            a.UploadDate,
                            uploadedBy = a.UploadedByUser!.userName
                        }).ToList(),
                        preparerAttachmentCount = p.Attachments.Count,

                        // Return details
                        returnHistory = p.Approvals
                            .Where(a => a.Status == "Returned-To-Verifier")
                            .OrderByDescending(a => a.ApprovedDate)
                            .Select(a => new
                            {
                                a.Status,
                                a.Remarks,
                                a.otherAmount,
                                a.ApprovedDate,
                                approvedBy = a.ApprovedByUser!.userName
                            })
                            .FirstOrDefault()
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

        // GET: Get detailed entry information with all attachments
        [HttpGet("entry-details/{id}/{userId}")]
        public IActionResult GetEntryDetails(int id, int userId)
        {
            try
            {
                var user = GetUserById(userId);
                if (user == null) return BadRequest("User not found.");

                var entry = _context.Preparedbies
                    .Include(u => u.User)
                    .Include(v => v.Vendor)
                    .Include(p => p.Verifications)
                        .ThenInclude(v => v.VerifiedByUser)
                    .Include(p => p.Approvals)
                        .ThenInclude(a => a.ApprovedByUser)
                    .Include(p => p.Attachments)
                        .ThenInclude(a => a.UploadedByUser)
                    .Include(p => p.PaymentCompletions)
                        .ThenInclude(pc => pc.Attachments)
                            .ThenInclude(a => a.UploadedByUser)
                    .Where(p => p.Id == id && p.CompanyId == user.companyId)
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

                        // Preparer's original attachments
                        preparerAttachments = p.Attachments.Select(a => new
                        {
                            a.Id,
                            a.FileName,
                            a.FileType,
                            a.FileSize,
                            a.UploadDate,
                            uploadedBy = a.UploadedByUser!.userName
                        }).ToList(),

                        // Payment completion attachments (from finance)
                        paymentAttachments = p.PaymentCompletions
                            .SelectMany(pc => pc.Attachments)
                            .Select(a => new
                            {
                                a.Id,
                                a.FileName,
                                a.FileType,
                                a.FileSize,
                                a.UploadDate,
                                uploadedBy = a.UploadedByUser!.userName
                            })
                            .ToList(),

                        // Verification history
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

                        // Approval history
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

                        // Payment completion status
                        paymentCompletion = p.PaymentCompletions
                            .OrderByDescending(pc => pc.LastUpdatedDate)
                            .Select(pc => new
                            {
                                pc.PaymentDone,
                                pc.OdooEntryDone,
                                pc.AttachmentsDone,
                                isAllDone = pc.PaymentDone && pc.OdooEntryDone && pc.AttachmentsDone
                            })
                            .FirstOrDefault()
                    })
                    .FirstOrDefault();

                if (entry == null)
                    return NotFound("Entry not found.");

                return Ok(entry);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // Approve an entry - UPDATED with otherAmount
        [HttpPost("approve/{id}")]
        public IActionResult ApproveEntry(int id, [FromBody] ApprovalRequest request)
        {
            try
            {
                var entry = _context.Preparedbies
                    .Include(p => p.PaymentCompletions)
                    .FirstOrDefault(p => p.Id == id);

                if (entry == null) return NotFound("Entry not found.");

                bool isResubmission = entry.CurrentStatus == "Re-Submitted"; // check resubmission

                if (entry.CurrentStatus != "Verified" && entry.CurrentStatus != "Re-Submitted")
                    return BadRequest("Only verified or re-submitted entries can be approved.");

                // If this is a resubmission, reset payment completion
                if (isResubmission)
                {
                    // Get the latest payment completion record
                    var latestCompletion = _context.PaymentCompletions
                        .Where(pc => pc.PreparedbyId == id)
                        .OrderByDescending(pc => pc.LastUpdatedDate)
                        .FirstOrDefault();

                    if (latestCompletion != null)
                    {
                        // Reset payment completion status
                        latestCompletion.PaymentDone = false;
                        latestCompletion.OdooEntryDone = false;
                        latestCompletion.AttachmentsDone = false;
                        latestCompletion.PaymentDoneDate = null;
                        latestCompletion.OdooEntryDoneDate = null;
                        latestCompletion.AttachmentsDoneDate = null;
                        latestCompletion.LastUpdatedDate = DateTime.Now;
                        latestCompletion.UpdatedByUserId = request.ApprovedByUserId;
                    }
                    else
                    {
                        // Create new payment completion record for resubmission
                        var newCompletion = new PaymentCompletion
                        {
                            PreparedbyId = id,
                            UpdatedByUserId = request.ApprovedByUserId,
                            PaymentDone = false,
                            OdooEntryDone = false,
                            AttachmentsDone = false,
                            LastUpdatedDate = DateTime.Now
                        };
                        _context.PaymentCompletions.Add(newCompletion);
                    }
                }
                entry.CurrentStatus = "Approved";

                // Create new approval record with otherAmount
                var approval = new Approval
                {
                    PreparedbyId = id,
                    ApprovedByUserId = request.ApprovedByUserId,
                    Status = "Approved",
                    Remarks = request.Remarks,
                    otherAmount = request.OtherAmount,
                    ApprovedDate = DateTime.Now
                };

                _context.Approvals.Add(approval);
                _context.SaveChanges();

                string message = isResubmission ?
                    "Resubmitted entry approved successfully! Payment completion reset." :
                    "Approved successfully!";

                return Ok(new { message = message, entry.Id, isResubmission });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // Reject an entry (final rejection) - UPDATED with otherAmount
        [HttpPost("reject/{id}")]
        public IActionResult RejectEntry(int id, [FromBody] ApprovalRequest request)
        {
            try
            {
                var entry = _context.Preparedbies.FirstOrDefault(p => p.Id == id);
                if (entry == null) return NotFound("Entry not found.");

                // Only allow rejection if status is "Verified"
                if (entry.CurrentStatus != "Verified")
                    return BadRequest("Only verified entries can be rejected.");

                entry.CurrentStatus = "Rejected-By-Approver";

                var approval = new Approval
                {
                    PreparedbyId = id,
                    ApprovedByUserId = request.ApprovedByUserId,
                    Status = "Rejected-By-Approver",
                    Remarks = request.Remarks,
                    otherAmount = request.OtherAmount,
                    ApprovedDate = DateTime.Now
                };

                _context.Approvals.Add(approval);
                _context.SaveChanges();

                return Ok(new { message = "Rejected successfully!", entry.Id });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // Return to verifier for correction - UPDATED with otherAmount
        [HttpPost("return-to-verifier/{id}")]
        public IActionResult ReturnToVerifier(int id, [FromBody] ApprovalRequest request)
        {
            try
            {
                var entry = _context.Preparedbies.FirstOrDefault(p => p.Id == id);
                if (entry == null) return NotFound("Entry not found.");

                // Only allow return if status is "Verified"
                if (entry.CurrentStatus != "Verified")
                    return BadRequest("Only verified entries can be returned to verifier.");

                entry.CurrentStatus = "Returned-To-Verifier";

                var approval = new Approval
                {
                    PreparedbyId = id,
                    ApprovedByUserId = request.ApprovedByUserId,
                    Status = "Returned-To-Verifier",
                    Remarks = request.Remarks,
                    otherAmount = request.OtherAmount,
                    ApprovedDate = DateTime.Now
                };

                _context.Approvals.Add(approval);
                _context.SaveChanges();

                return Ok(new { message = "Returned to verifier successfully!", entry.Id });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }

    public class ApprovalRequest
    {
        public int ApprovedByUserId { get; set; }
        public string Remarks { get; set; } = string.Empty;
        public decimal OtherAmount { get; set; }
    }
}