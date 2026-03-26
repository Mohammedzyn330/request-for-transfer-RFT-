using Microsoft.AspNetCore.StaticFiles;

namespace RequestTransferFormBackEnd.Services
{
    public class FileUploadService : IFileUploadService
    {
        private readonly string[] _allowedExtensions = { ".jpg", ".jpeg", ".png", ".pdf" };
        private readonly long _maxFileSize = 10 * 1024 * 1024; // 10MB

        public async Task<(bool success, string filePath, string error)> UploadFileAsync(IFormFile file, string uploadsFolderPath)
        {
            try
            {
                if (!IsValidFileType(file.FileName))
                    return (false, "", "Invalid file type. Only JPG, PNG, and PDF files are allowed.");

                if (!IsValidFileSize(file.Length))
                    return (false, "", "File size too large. Maximum size is 10MB.");

                if (!Directory.Exists(uploadsFolderPath))
                    Directory.CreateDirectory(uploadsFolderPath);

                var fileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
                var fullFilePath = Path.Combine(uploadsFolderPath, fileName);

                using (var stream = new FileStream(fullFilePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // ✅ Return relative path only
                var relativePath = Path.Combine("uploads", "payment-attachments", fileName);
                return (true, relativePath.Replace("\\", "/"), "");
            }
            catch (Exception ex)
            {
                return (false, "", $"Error uploading file: {ex.Message}");
            }
        }


        public string GetContentType(string fileName)
        {
            var provider = new FileExtensionContentTypeProvider();
            if (!provider.TryGetContentType(fileName, out string contentType))
            {
                contentType = "application/octet-stream";
            }
            return contentType;
        }

        public bool IsValidFileType(string fileName)
        {
            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            return _allowedExtensions.Contains(extension);
        }

        public bool IsValidFileSize(long fileSize)
        {
            return fileSize <= _maxFileSize;
        }
    }
}