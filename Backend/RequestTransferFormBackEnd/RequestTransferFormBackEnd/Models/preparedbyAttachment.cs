using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RequestTransferFormBackEnd.Models
{
    public class preparedbyAttachment
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int PreparedbyId { get; set; }

        [Required]
        public string FileName { get; set; } = string.Empty;

        [Required]
        public string FilePath { get; set; } = string.Empty;

        public string FileType { get; set; } = string.Empty;

        public long FileSize { get; set; }

        public DateTime UploadDate { get; set; }

        [Required]
        public int UploadedByUserId { get; set; }

        // Navigation properties
        [ForeignKey("PreparedbyId")]
        public virtual Preparedby? Preparedby { get; set; }

        [ForeignKey("UploadedByUserId")]
        public virtual User? UploadedByUser { get; set; }
    }
}
