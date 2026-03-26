namespace RequestTransferFormBackEnd.Models
{
    public class Approval
    {
        public int Id { get; set; }
        public int PreparedbyId { get; set; }
        public int ApprovedByUserId { get; set; }
        public string Status { get; set; } = string.Empty;
        public string Remarks { get; set; } = string.Empty;
        public decimal otherAmount { get; set; }
        public DateTime ApprovedDate { get; set; }

        public Preparedby? Preparedby { get; set; }
        public User? ApprovedByUser { get; set; }
    }
}
