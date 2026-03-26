namespace RequestTransferFormBackEnd.Models
{
    public class CustomerList
    {
        public int Id { get; set; }
        public string customerName { get; set; } = string.Empty;
        public string customerBranch { get; set; }
        public ICollection<CustomerAmount> CustomerAmounts { get; set; } = new List<CustomerAmount>();
    }
}
