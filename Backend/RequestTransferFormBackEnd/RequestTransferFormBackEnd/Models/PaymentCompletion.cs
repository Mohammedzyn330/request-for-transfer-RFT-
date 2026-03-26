using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RequestTransferFormBackEnd.Models
{
    public class PaymentCompletion
    {
        public int Id { get; set; }
        public int PreparedbyId { get; set; }
        public int UpdatedByUserId { get; set; }
        public bool PaymentDone { get; set; } = false;
        public bool OdooEntryDone { get; set; } = false;
        public bool AttachmentsDone { get; set; } = false;
        public DateTime? PaymentDoneDate { get; set; }
        public DateTime? OdooEntryDoneDate { get; set; }
        public DateTime? AttachmentsDoneDate { get; set; }
        public DateTime LastUpdatedDate { get; set; }
        public string? odooReferenceNumber { get; set; }

        public Preparedby? Preparedby { get; set; }
        public User? UpdatedByUser { get; set; }
        public ICollection<PaymentAttachment> Attachments { get; set; } = new List<PaymentAttachment>();
    }
}

