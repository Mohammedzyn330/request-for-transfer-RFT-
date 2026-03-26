namespace RequestTransferFormBackEnd.Services
{
    public interface IFileUploadService
    {
        Task<(bool success, string filePath, string error)> UploadFileAsync(IFormFile file, string uploadsFolderPath);
        string GetContentType(string fileName);
        bool IsValidFileType(string fileName);
        bool IsValidFileSize(long fileSize);
    }
}