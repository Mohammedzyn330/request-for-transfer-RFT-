using System.ComponentModel.DataAnnotations.Schema;

namespace RequestTransferFormBackEnd.Models
{
    public class Roles
    {
        public int Id { get; set; }
        public string roleName { get; set; } = string.Empty;

        //[Column("role_key")]
        //public string roleKey { get; set; }

        public ICollection<User> Users { get; set; } = new List<User>();
    }
}
