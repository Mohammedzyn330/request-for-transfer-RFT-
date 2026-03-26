namespace RequestTransferFormBackEnd.Models
{
    public class Verified
    {
        public int Id { get; set; }
        public int PreparedbyId { get; set; }
        public Preparedby? Preparedby { get; set; }
        public int VerifiedByUserId { get; set; }
        public User? VerifiedByUser { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? Remarks { get; set; }
        public DateTime VerifiedDate { get; set; }
    }
}
