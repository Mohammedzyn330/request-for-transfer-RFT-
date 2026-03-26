namespace RequestTransferFormBackEnd.Models
{
    public class Bank
    {
        public int Id { get; set; }
        public string bankName { get; set; } = string.Empty;
        public string bankAccount { get; set; } = string.Empty;

        public ICollection<BankPosition> BankPositions { get; set; } = new List<BankPosition>();
        public ICollection<BankFacillities> BankFacillity { get; set; } = new List<BankFacillities>();
    }
}
