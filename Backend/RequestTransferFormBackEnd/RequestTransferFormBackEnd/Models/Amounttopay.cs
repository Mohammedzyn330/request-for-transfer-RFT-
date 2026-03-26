namespace RequestTransferFormBackEnd.Models
{
    public class Amounttopay
    {
        public int Id { get; set; }
        public decimal amountTOPay { get; set; }
        public DateTime? amountToPayCreated { get; set; }
        public DateTime? userCreatedDate { get; set; }

        public int CompanyId { get; set; }

        public string? textForMessage { get; set; }

        public decimal rentPaymentsAmount { get; set; }
        public int BrandId { get; set; }
        public Brands? Brand { get; set; }
        public int UserId { get; set; }
        public User? User { get; set; }
    }
}
