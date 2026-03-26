namespace RequestTransferFormBackEnd.Models
{
    public class BankPosition
    {
        public int Id { get; set; }
        public decimal Amount { get; set; }
        public DateTime? BankPositionCreated { get; set; }

        public int CompanyId { get; set; }
        //public DateTime? userCreatedDate { get; set; }
        public int BankId { get; set; }
        public Bank? Bank { get; set; }
        public int UserId { get; set; }
        public User? User { get; set; }
    }
}
