using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RequestTransferFormBackEnd.Data;
using RequestTransferFormBackEnd.Models;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory.Database;

namespace RequestTransferFormBackEnd.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly AppDbContext _context;
        public UserController(AppDbContext context)
        {
            _context = context;
        }

        // 🔹 Helper to hash passwords
        private string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                return Convert.ToBase64String(bytes);
            }
        }

        [HttpPost("register")]
        public IActionResult Register([FromBody] User user)
        {
            if (_context.Users.Any(u => u.workEmail == user.workEmail))
                return BadRequest("Email already exists!");

            var hashedPassword = HashPassword(user.password);

            if (_context.Users.Any(u => u.password == hashedPassword))
                return BadRequest(new { message = "Password already used! Kindly set another." });

            var Role = _context.Roles.FirstOrDefault(r => r.Id == user.RoleId);
            var Company = _context.Companies.FirstOrDefault(c => c.Id == user.companyId);

            if (Role == null)
            {
                return BadRequest("Role is invalid");
            }

            if (Company == null)
            {
                return BadRequest("Company is invalid");
            }

            user.password = HashPassword(user.password);
            user.phoneNumber = user.phoneNumber.ToString();
            user.branch = user.branch.ToString();
            user.userName = user.userName.ToString();
            user.department = user.department.ToString();
            user.iqamaNo = user.iqamaNo.ToString();
            user.companyId = user.companyId;
            user.Role = Role;
            user.usercreatedDate = DateTime.Now;

            _context.Users.Add(user);
            _context.SaveChanges();

            return Ok("User registered successfully!");
        }

        [HttpPost("Login")]
        public IActionResult Login([FromBody] User login)
        {
            if (login == null || string.IsNullOrEmpty(login.workEmail) || string.IsNullOrEmpty(login.password))
                return BadRequest(new { message = "Email and password are required" });

            var hashPassword = HashPassword(login.password);

            var user = _context.Users
                .Include(u => u.Role)  // Include Role
                .Include(u => u.Company) // Include Company
                .FirstOrDefault(u => u.workEmail == login.workEmail && u.password == hashPassword);

            if (user == null)
            {
                return Unauthorized(new { message = "Invalid email or password" });
            }

            return Ok(new
            {
                message = "Login Successful",
                Id = user.Id,
                username = user.userName,
                userIqama = user.iqamaNo,
                userEmail = user.workEmail,
                userPhone = user.phoneNumber,
                userDepartment = user.department,
                userBranch = user.branch,
                userCompanyId = user.companyId,
                userCompanyName = user.Company?.companyName,
                roleId = user.RoleId,
                roleName = user.Role?.roleName,
            });
        }

        [HttpGet("{id}")]
        public IActionResult GetUserById(int id)
        {
            try
            {
                var user = _context.Users
                    .Include(u => u.Role)
                    .Include(u => u.Company) // Include Company
                    .Where(u => u.Id == id)
                    .Select(u => new
                    {
                        u.Id,
                        u.userName,
                        u.branch,
                        u.department,
                        u.iqamaNo,
                        u.workEmail,
                        u.phoneNumber,
                        u.companyId,
                        companyName = u.Company.companyName, // Add company name
                        u.RoleId,
                        roleName = u.Role.roleName
                    })
                    .FirstOrDefault();

                if (user == null)
                    return NotFound(new { message = "User not found" });

                return Ok(user);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        //for the admin use only||
        [HttpGet("all-users")]
        public IActionResult GetAllUsers()
        {
            try
            {
                var users = _context.Users
                    .Include(u => u.Role)
                    .Include(u => u.Company) // Include Company
                    .Select(u => new
                    {
                        u.Id,
                        u.userName,
                        u.branch,
                        u.department,
                        u.iqamaNo,
                        u.workEmail,
                        u.phoneNumber,
                        u.companyId,
                        companyName = u.Company.companyName, // Add company name
                        u.RoleId,
                        roleName = u.Role.roleName,
                        u.usercreatedDate
                    })
                    .ToList();

                return Ok(users);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("roles")]
        public IActionResult GetRoles()
        {
            try
            {
                var roles = _context.Roles
                    .Select(r => new { r.Id, r.roleName })
                    .ToList();
                return Ok(roles);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("departments")]
        public IActionResult GetDepartments()
        {
            try
            {
                var departments = _context.Departments
                    .Select(d => new { d.Id, d.DepartmentName })
                    .ToList();
                return Ok(departments);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("branches")]
        public IActionResult GetBranches()
        {
            try
            {
                var branches = _context.Branches
                     .Select(b => new { b.Id, b.BranchName })
                    .ToList();
                return Ok(branches);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("company")]
        public IActionResult GetCompany()
        {
            try
            {
                var companies = _context.Companies
                     .Select(c => new { c.Id, c.companyName })
                    .ToList();
                return Ok(companies);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPut("update-role/{id}")]
        public IActionResult UpdateUserRole(int id, [FromBody] UpdateRoleRequest request)
        {
            try
            {
                var user = _context.Users.FirstOrDefault(u => u.Id == id);
                if (user == null)
                    return NotFound(new { message = "User not found" });

                var role = _context.Roles.FirstOrDefault(r => r.Id == request.RoleId);
                if (role == null)
                    return BadRequest(new { message = "Invalid role" });

                user.RoleId = request.RoleId;
                user.Role = role;

                _context.SaveChanges();

                return Ok(new { message = "User role updated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPut("update-user/{id}")]
        public IActionResult UpdateUser(int id, [FromBody] UpdateUserRequest request)
        {
            try
            {
                var user = _context.Users.FirstOrDefault(u => u.Id == id);
                if (user == null)
                    return NotFound(new { message = "User not found" });

                // Check if email already exists for other users
                if (!string.IsNullOrEmpty(request.workEmail) && _context.Users.Any(u => u.workEmail == request.workEmail && u.Id != id))
                    return BadRequest(new { message = "Email already exists for another user" });

                // Update user details if provided
                if (!string.IsNullOrEmpty(request.userName))
                    user.userName = request.userName;

                if (!string.IsNullOrEmpty(request.workEmail))
                    user.workEmail = request.workEmail;

                if (!string.IsNullOrEmpty(request.phoneNumber))
                    user.phoneNumber = request.phoneNumber;

                if (!string.IsNullOrEmpty(request.department))
                    user.department = request.department;

                if (!string.IsNullOrEmpty(request.branch))
                    user.branch = request.branch;

                if (request.companyId.HasValue)
                    user.companyId = request.companyId.Value;

                // Update password if provided
                if (!string.IsNullOrEmpty(request.newPassword))
                {
                    var hashedNewPassword = HashPassword(request.newPassword);

                    // Check if the new password is different from current
                    if (user.password != hashedNewPassword)
                    {
                        user.password = hashedNewPassword;
                    }
                }

                _context.SaveChanges();

                return Ok(new { message = "User updated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        public class UpdateRoleRequest
        {
            public int RoleId { get; set; }
        }

        public class UpdateUserRequest
        {
            public string? userName { get; set; }
            public string? workEmail { get; set; }
            public string? phoneNumber { get; set; }
            public string? department { get; set; }
            public string? branch { get; set; }
            public string? newPassword { get; set; }
            public int? companyId { get; set; }
        }
    }
}