namespace RequestTransferFormBackEnd.Models
{
    public class Preparedby
    {
        public int Id { get; set; }
        public decimal balanceAsPerAdmaShamran { get; set; }
        public decimal balanceAsPerSupplier { get; set; }
        public decimal difference { get; set; }
        public string? reasonOFDifference { get; set; }
        public decimal paymentDue { get; set; }
        public string? remarks { get; set; }
        public DateTime? preparedByCreatedDate { get; set; }
        public DateTime? userCreatedDate { get; set; }
        public string CurrentStatus { get; set; } = "Submitted";

        public int CompanyId { get; set; }

        public string PriorityName { get; set; } = string.Empty;

        public int UserId { get; set; }
        public User? User { get; set; }

        public int VendorId { get; set; }
        public Vendorlist? Vendor { get; set; }

        public ICollection<Verified> Verifications { get; set; } = new List<Verified>();
        public ICollection<Approval> Approvals { get; set; } = new List<Approval>();
        public ICollection<PaymentCompletion> PaymentCompletions { get; set; } = new List<PaymentCompletion>();
        public virtual ICollection<preparedbyAttachment> Attachments { get; set; } = new List<preparedbyAttachment>();
    }
}
