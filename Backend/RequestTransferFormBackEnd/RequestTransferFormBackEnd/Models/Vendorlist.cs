namespace RequestTransferFormBackEnd.Models
{
    public class Vendorlist
    {
        public int Id { get; set; }
        public string supplierName { get; set; } = string.Empty;
        public string bankName { get; set; } = string.Empty;
        public string bankAccount { get; set; } = string.Empty;
        public string branchName { get; set; } = string.Empty;

        public ICollection<Preparedby> PreparedBies { get; set; } = new List<Preparedby>();
    }
}
