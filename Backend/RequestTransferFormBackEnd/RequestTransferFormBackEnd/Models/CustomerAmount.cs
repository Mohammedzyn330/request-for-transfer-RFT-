namespace RequestTransferFormBackEnd.Models
{
    public class CustomerAmount
    {
        public int Id { get; set; }
        public decimal AmountOFCusotmers { get; set; }
        public DateTime? AmountCustomerCreated { get; set; }

        public int CompanyId { get; set; }

        public DateTime? userCreatedDate { get; set; }
        public int CustomerListId { get; set; }
        public CustomerList? CustomerList { get; set; }
        public int UserId { get; set; }
        public User? User { get; set; }
    }
}
