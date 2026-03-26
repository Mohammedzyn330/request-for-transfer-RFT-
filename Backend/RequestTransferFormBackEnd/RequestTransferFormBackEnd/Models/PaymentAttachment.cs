using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RequestTransferFormBackEnd.Models
{
    public class PaymentAttachment
    {
        public int Id { get; set; }
        public int PaymentCompletionId { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public string FileType { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public DateTime UploadDate { get; set; }
        public int UploadedByUserId { get; set; }

        public PaymentCompletion? PaymentCompletion { get; set; }
        public User? UploadedByUser { get; set; }
    }
}

