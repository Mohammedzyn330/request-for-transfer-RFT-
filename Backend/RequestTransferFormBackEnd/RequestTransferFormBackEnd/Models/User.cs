using System.Data;

namespace RequestTransferFormBackEnd.Models
{
    public class User
    {
        public int Id { get; set; }
        public string? userName { get; set; }
        public string workEmail { get; set; } = string.Empty;
        public string password { get; set; } = string.Empty;
        public string? department { get; set; }
        public string? phoneNumber { get; set; }
        public string? iqamaNo { get; set; }
        public string? branch { get; set; }

       
        public DateTime? usercreatedDate { get; set; }

        public int companyId { get; set; }
        public Company? Company { get; set; }

        public int RoleId { get; set; }
        public Roles? Role { get; set; }
    }
}
