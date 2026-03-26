namespace RequestTransferFormBackEnd.Models
{
    public class BankFacillities
    {
        public int Id { get; set; }
        public decimal AmountOFFacillities { get; set; }
        public DateTime? AmountFacillitiesCreated { get; set; }

        public int CompanyId { get; set; }

        public DateTime? userCreatedDate { get; set; }

        // Foreign key for Bank
        public int BanksId { get; set; }
        public Bank1? Banks { get; set; }

        // Foreign key for Supllierbf
        public int supplierBfId { get; set; }
        public SuppliersBF? suppliersBF { get; set; }

        // Foreign key for User
        public int UserId { get; set; }
        public User? User { get; set; }
    }
}
