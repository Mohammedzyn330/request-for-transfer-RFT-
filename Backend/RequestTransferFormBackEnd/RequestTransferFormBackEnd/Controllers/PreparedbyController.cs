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
    public class PreparedbyController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _environment;

        public PreparedbyController(AppDbContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        [HttpPost("entry")]
        public IActionResult Preparedby([FromBody] Preparedby preparedby)
        {
            try
            {
                // Validate required fields
                if (preparedby.VendorId <= 0)
                    return BadRequest("Invalid vendor ID.");

                if (preparedby.UserId <= 0)
                    return BadRequest("Invalid user ID.");

                // Validate priority name is provided and exists
                if (string.IsNullOrEmpty(preparedby.PriorityName))
                    return BadRequest("Priority name is required.");

                var validPriority = _context.priorities
                    .Any(p => p.priorityName == preparedby.PriorityName);

                if (!validPriority)
                {
                    var availablePriorities = _context.priorities
                        .Select(p => p.priorityName)
                        .ToList();
                    return BadRequest($"Invalid priority name. Available priorities: {string.Join(", ", availablePriorities)}");
                }

                // Check if vendor exists
                var vendor = _context.Vendorlists.FirstOrDefault(v => v.Id == preparedby.VendorId);
                if (vendor == null)
                {
                    return BadRequest("Invalid vendor.");
                }

                // Check if user exists
                var user = _context.Users.FirstOrDefault(u => u.Id == preparedby.UserId);
                if (user == null)
                    return BadRequest("Invalid user.");

                preparedby.CompanyId = user.companyId;

                // Calculate difference
                preparedby.difference = Math.Abs(preparedby.balanceAsPerSupplier - preparedby.balanceAsPerAdmaShamran);
                preparedby.preparedByCreatedDate = DateTime.Now;
                preparedby.userCreatedDate = preparedby.userCreatedDate;

                //by default fix status
                preparedby.CurrentStatus = "Submitted";

                // Set navigation properties
                preparedby.Vendor = vendor;
                preparedby.User = user;

                _context.Preparedbies.Add(preparedby);
                _context.SaveChanges();

                return Ok(new
                {
                    message = "Added successfully!",
                    preparedby.Id,
                    preparedby.UserId,
                    preparedby.VendorId,
                    preparedby.PriorityName,
                    preparedby.balanceAsPerAdmaShamran,
                    preparedby.balanceAsPerSupplier,
                    preparedby.difference,
                    preparedby.reasonOFDifference,
                    preparedby.paymentDue,
                    preparedby.remarks,
                    preparedby.CurrentStatus,
                    preparedby.preparedByCreatedDate,
                    preparedby.userCreatedDate,
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // POST: Upload attachment for preparedby entry
        [HttpPost("upload-attachment/{preparedById}")]
        public async Task<IActionResult> UploadAttachment(int preparedById, [FromForm] PreparedbyFileUploadRequest request)
        {
            try
            {
                if (request.File == null || request.File.Length == 0)
                    return BadRequest("No file uploaded.");

                var preparedby = await _context.Preparedbies
                    .FirstOrDefaultAsync(p => p.Id == preparedById);

                if (preparedby == null)
                    return NotFound("Preparedby record not found.");

                // Create uploads directory if it doesn't exist
                var uploadsFolder = Path.Combine(_environment.WebRootPath, "uploads", "preparedby-attachments", preparedById.ToString());
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

                var attachment = new preparedbyAttachment
                {
                    PreparedbyId = preparedById,
                    FileName = request.File.FileName,
                    FilePath = filePath,
                    FileType = Path.GetExtension(request.File.FileName).ToLowerInvariant(),
                    FileSize = request.File.Length,
                    UploadDate = DateTime.Now,
                    UploadedByUserId = request.UploadedByUserId,
                };

                _context.PreparedbyAttachments.Add(attachment);
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

        // GET: Download attachment for preparedby entry
        [HttpGet("download-attachment/{attachmentId}")]
        public IActionResult DownloadAttachment(int attachmentId)
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

        // DELETE: Remove attachment
        [HttpDelete("remove-attachment/{attachmentId}")]
        public IActionResult RemoveAttachment(int attachmentId)
        {
            try
            {
                var attachment = _context.PreparedbyAttachments
                    .FirstOrDefault(a => a.Id == attachmentId);

                if (attachment == null)
                    return NotFound("Attachment not found.");

                // Delete physical file
                if (System.IO.File.Exists(attachment.FilePath))
                {
                    System.IO.File.Delete(attachment.FilePath);
                }

                // Delete database record
                _context.PreparedbyAttachments.Remove(attachment);
                _context.SaveChanges();

                return Ok(new { message = "Attachment removed successfully!" });
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

        // GET: Available priorities for dropdown
        [HttpGet("available-priorities")]
        public IActionResult GetAvailablePriorities()
        {
            try
            {
                var priorities = _context.priorities
                    .Select(p => new { p.Id, p.priorityName })
                    .ToList();

                return Ok(priorities);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // For preparer to see their entries with status - UPDATED WITH PRIORITYNAME
        [HttpGet("my-entries/{userId}")]
        public IActionResult GetMyEntries(int userId)
        {
            var user = _context.Users.FirstOrDefault(u => u.Id == userId);
            if (user == null)
                return BadRequest("User not found.");

            var currentMonth = DateTime.Now.Month;
            var currentYear = DateTime.Now.Year;
            try
            {
                var myEntries = _context.Preparedbies
                    .Include(u => u.User)
                    .Include(v => v.Vendor)
                    .Include(p => p.Verifications)
                        .ThenInclude(v => v.VerifiedByUser)
                    .Include(p => p.Approvals)
                        .ThenInclude(a => a.ApprovedByUser)
                    .Include(p => p.Attachments)
                        .ThenInclude(a => a.UploadedByUser)
                     .Where(p => p.UserId == userId &&
            p.CompanyId == user.companyId &&
            p.preparedByCreatedDate.Value.Month == currentMonth &&
            p.preparedByCreatedDate.Value.Year == currentYear)

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
                        p.userCreatedDate,
                        p.CurrentStatus,
                        p.PriorityName,
                        username = p.User!.userName,
                        vendorName = p.Vendor!.supplierName,
                        vendorBank = p.Vendor!.bankName,
                        vendorBankAcc = p.Vendor!.bankAccount,
                        vendorBranch = p.Vendor!.branchName,

                        // Attachments
                        attachments = p.Attachments.Select(a => new
                        {
                            a.Id,
                            a.FileName,
                            a.FileType,
                            a.FileSize,
                            a.UploadDate,
                            uploadedBy = a.UploadedByUser!.userName
                        }).ToList(),

                        // verification history
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

                        // approval history
                        approvalHistory = p.Approvals
                            .OrderByDescending(a => a.ApprovedDate)
                            .Select(a => new
                            {
                                a.Status,
                                a.Remarks,
                                a.ApprovedDate,
                                approvedBy = a.ApprovedByUser!.userName
                            })
                            .ToList(),

                        // Get the latest verifier remarks for returned entries
                        latestVerifierRemarks = p.Verifications
                            .Where(v => v.Status == "Returned")
                            .OrderByDescending(v => v.VerifiedDate)
                            .Select(v => v.Remarks)
                            .FirstOrDefault(),

                        // Get the latest approver remarks
                        latestApproverRemarks = p.Approvals
                            .Where(a => a.Status == "Returned-To-Verifier" || a.Status == "Rejected-By-Approver")
                            .OrderByDescending(a => a.ApprovedDate)
                            .Select(a => a.Remarks)
                            .FirstOrDefault(),

                        // Actions allowed - only can edit if returned by verifier
                        canEdit = p.CurrentStatus == "Returned",
                        canResubmit = p.CurrentStatus == "Returned"
                    })
                    .OrderByDescending(p => p.preparedByCreatedDate)
                    .ToList();

                return Ok(myEntries);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPut("update/{id}")]
        public IActionResult UpdateEntry(int id, [FromBody] Preparedby updatedEntry)
        {
            try
            {
                var existingEntry = _context.Preparedbies.FirstOrDefault(p => p.Id == id);

                if (existingEntry == null)
                    return NotFound("Entry not found.");

                var allowedStatuses = new List<string> { "Returned", "Verified", "Approved", "Rejected-By-Approver" };

                if (!allowedStatuses.Contains(existingEntry.CurrentStatus))
                    return BadRequest("Only entries with status: Returned, Verified Successfully, Approved, or Rejected-by-Approver can be updated.");

                // Validate priority name if changed
                if (!string.IsNullOrEmpty(updatedEntry.PriorityName) && updatedEntry.PriorityName != existingEntry.PriorityName)
                {
                    var validPriority = _context.priorities
                        .Any(p => p.priorityName == updatedEntry.PriorityName);

                    if (!validPriority)
                    {
                        var availablePriorities = _context.priorities
                            .Select(p => p.priorityName)
                            .ToList();
                        return BadRequest($"Invalid priority name. Available priorities: {string.Join(", ", availablePriorities)}");
                    }

                    existingEntry.PriorityName = updatedEntry.PriorityName;
                }

                // Update fields - PRESERVE original userCreatedDate if updatedEntry has null
                existingEntry.balanceAsPerAdmaShamran = updatedEntry.balanceAsPerAdmaShamran;
                existingEntry.balanceAsPerSupplier = updatedEntry.balanceAsPerSupplier;
                existingEntry.reasonOFDifference = updatedEntry.reasonOFDifference;
                existingEntry.paymentDue = updatedEntry.paymentDue;
                existingEntry.remarks = updatedEntry.remarks;

                // FIX: Only update userCreatedDate if the new value is not null/empty
                if (updatedEntry.userCreatedDate.HasValue)
                {
                    existingEntry.userCreatedDate = updatedEntry.userCreatedDate;
                }
                // If you're using string instead of DateTime?, use this:
                // if (!string.IsNullOrEmpty(updatedEntry.userCreatedDate))
                // {
                //     existingEntry.userCreatedDate = updatedEntry.userCreatedDate;
                // }

                // Recalculate difference
                existingEntry.difference = Math.Abs(existingEntry.balanceAsPerSupplier - existingEntry.balanceAsPerAdmaShamran);

                // Change status based on current status
                if (existingEntry.CurrentStatus == "Returned" || existingEntry.CurrentStatus == "Approved" || existingEntry.CurrentStatus == "Rejected-By-Approver")
                {
                    existingEntry.CurrentStatus = "Re-Submitted";
                }
                else if (existingEntry.CurrentStatus == "Verified")
                {
                    existingEntry.CurrentStatus = "Pending Approval";
                }
                else if (existingEntry.CurrentStatus == "Approver")
                {
                    existingEntry.CurrentStatus = "Approval In Progress";
                }
                else if (existingEntry.CurrentStatus == "Rejected-by-Approver")
                {
                    existingEntry.CurrentStatus = "Resubmitted for Approval";
                }

                _context.SaveChanges();

                return Ok(new
                {
                    message = "Entry updated successfully!",
                    existingEntry.Id,
                    existingEntry.CurrentStatus,
                    existingEntry.PriorityName,
                    existingEntry.userCreatedDate // Return the preserved date
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet]
        public IActionResult GetAllPreparedby(int userId, string? filterType, DateTime? selectedDate, int? months)
        {
            try
            {
                var user = _context.Users.FirstOrDefault(u => u.Id == userId);
                if (user == null)
                    return BadRequest("User not found.");

                var now = DateTime.Now;
                var startOfCurrentMonth = new DateTime(now.Year, now.Month, 1);
                var startOfNextMonth = startOfCurrentMonth.AddMonths(1);

                IQueryable<Preparedby> query = _context.Preparedbies
                    .Include(b => b.Vendor)
                    .Include(a => a.Attachments)
                    .Include(u => u.User)
                    .Where(p => p.CompanyId == user.companyId);

                // Apply date filters
                if (filterType == "today")
                {
                    var startOfDay = now.Date;
                    var endOfDay = startOfDay.AddDays(1);
                    query = query.Where(bf => bf.userCreatedDate >= startOfDay && bf.userCreatedDate < endOfDay);
                }
                else if (filterType == "future")
                {
                    query = query.Where(bf => bf.userCreatedDate >= startOfNextMonth);
                }
                else if (filterType == "date" && selectedDate.HasValue)
                {
                    var selectedStart = selectedDate.Value.Date;
                    var selectedEnd = selectedStart.AddDays(1);
                    query = query.Where(bf => bf.userCreatedDate >= selectedStart && bf.userCreatedDate < selectedEnd);
                }
                else if (months.HasValue && months.Value > 0)
                {
                    var startOfRange = startOfNextMonth;
                    var endOfRange = startOfRange.AddMonths(months.Value);
                    query = query.Where(bf => bf.userCreatedDate >= startOfRange && bf.userCreatedDate < endOfRange);
                }
                else
                {
                    var startOfRange = startOfNextMonth;
                    var endOfRange = startOfRange.AddMonths(12);
                    query = query.Where(bf => bf.userCreatedDate >= startOfRange && bf.userCreatedDate < endOfRange);
                }

                var data = query
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
                        p.userCreatedDate,
                        p.CurrentStatus,
                        p.PriorityName,
                        username = p.User!.userName,
                        vendorName = p.Vendor!.supplierName,
                        vendorBank = p.Vendor!.bankName,
                        vendorBankAcc = p.Vendor!.bankAccount,
                        vendorBranch = p.Vendor!.branchName,
                        attachmentCount = p.Attachments.Count
                    })
                    .OrderByDescending(p => p.preparedByCreatedDate)
                    .ToList();

                return Ok(data);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("{id}")]
        public IActionResult GetPreparedbyById(int id)
        {
            try
            {
                var p = _context.Preparedbies
                    .Include(u => u.User)
                    .Include(v => v.Vendor)
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
                        p.userCreatedDate,
                        p.PriorityName,
                        username = p.User!.userName,
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
                        }).ToList()
                    })
                    .FirstOrDefault();

                if (p == null)
                    return NotFound("Record not found.");

                return Ok(p);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }

    public class PreparedbyFileUploadRequest
    {
        public IFormFile File { get; set; } = null!;
        public int UploadedByUserId { get; set; }
    }
}