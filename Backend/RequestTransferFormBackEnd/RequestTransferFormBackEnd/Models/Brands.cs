namespace RequestTransferFormBackEnd.Models
{
    public class Brands
    {
        public int Id { get; set; }
        public string brandName { get; set; } = string.Empty;
        public ICollection<Amounttopay> Amounttopays { get; set; } = new List<Amounttopay>();
    }
}
