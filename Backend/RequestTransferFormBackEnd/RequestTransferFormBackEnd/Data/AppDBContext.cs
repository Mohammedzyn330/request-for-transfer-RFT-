using Microsoft.EntityFrameworkCore;
using RequestTransferFormBackEnd.Models;

namespace RequestTransferFormBackEnd.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Roles> Roles { get; set; }
        public DbSet<Bank> Banks { get; set; }
        public DbSet<BankPosition> BankPositions { get; set; }
        public DbSet<Brands> Brands { get; set; }
        public DbSet<BankFacillities> BankFacillities { get; set; }
        public DbSet<Amounttopay> Amounttopays { get; set; }
        public DbSet<Vendorlist> Vendorlists { get; set; }
        public DbSet<Preparedby> Preparedbies { get; set; }
        public DbSet<Verified> Verifieds { get; set; }
        public DbSet<Approval> Approvals { get; set; }
        public DbSet<CustomerList> CustomerLists { get; set; }
        public DbSet<CustomerAmount> CustomerAmounts { get; set; }
        public DbSet<PaymentCompletion> PaymentCompletions { get; set; }
        public DbSet<PaymentAttachment> PaymentAttachments { get; set; }
        public DbSet<preparedbyAttachment> PreparedbyAttachments { get; set; }
        public DbSet<Department> Departments { get; set; }
        public DbSet<Branch> Branches { get; set; }
        public DbSet<Company> Companies { get; set; }

        public DbSet<Priority> priorities { get; set; }

        public DbSet<Bank1> bank1s { get; set; }

        public DbSet<SuppliersBF> suppliersBFs { get; set; }



        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            //// Seed Roles
            modelBuilder.Entity<Roles>().HasData(
                new Roles { Id = 1, roleName = "FORM PREPARE" },
                new Roles { Id = 2,  roleName = "VERIFIER" },
                new Roles { Id = 3,  roleName = "APPROVER" },
                new Roles { Id = 4, roleName = "FINANCE" },
                new Roles { Id = 5,  roleName = "ADMIN" }
 );
            modelBuilder.Entity<Company>().HasData(
                new Company { Id = 1, companyName = "Adma Shamran Trading Co.", companyValue = "Trading" },
                new Company { Id = 2, companyName = "Adma Shamran Catering Co.", companyValue = "Catering" }
                );

            modelBuilder.Entity<Priority>().HasData(
                new Priority { Id = 1, priorityName = "First Priority"},
                new Priority { Id = 2, priorityName = "Second Priority"}
                );

            // Seed Banks
            modelBuilder.Entity<Bank>().HasData(
                new Bank { Id = 1, bankName = "Bank Al-Jazira 1", bankAccount = "SA25 6000 0000 0271 2639 0001" },
                new Bank { Id = 2, bankName = "Bank Al-Jazira 2", bankAccount = "SA95 6000 0000 0271 2639 0002" },
                new Bank { Id = 3, bankName = "Bank Al-Rajhi", bankAccount = "SA08 8000 0126 6080 1053 2348" }
            );
            // Seed Banks
            modelBuilder.Entity<Bank1>().HasData(
                new Bank1 { Id = 1, banksName = "Bank Al-Jazira 1", banksaccount = "SA25 6000 0000 0271 2639 0001" },
                new Bank1 { Id = 2, banksName = "Bank Al-Jazira 2", banksaccount = "SA95 6000 0000 0271 2639 0002" }
            );
            // Seed Brands
            modelBuilder.Entity<Brands>().HasData(
                new Brands { Id = 1, brandName = "Golden Star" },
                new Brands { Id = 2, brandName = "Premier" },
                new Brands { Id = 3, brandName = "Salary" },
                new Brands { Id = 4, brandName = "VAT" },
                new Brands { Id = 5, brandName = "RentPayments"},
                new Brands { Id = 6, brandName = "Others"}
            );

            // Seed CustomerList
            modelBuilder.Entity<CustomerList>().HasData(
                new CustomerList { Id = 1, customerName = "Abdul", customerBranch = "Riyadh"}
            );

            // Relationships
            modelBuilder.Entity<Preparedby>()
                .HasOne(p => p.Vendor)
                .WithMany(v => v.PreparedBies)
                .HasForeignKey(p => p.VendorId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Preparedby>()
                .HasOne(p => p.User)
                .WithMany()
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Verified>()
                .HasOne(v => v.Preparedby)
                .WithMany(p => p.Verifications)
                .HasForeignKey(v => v.PreparedbyId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Verified>()
                .HasOne(v => v.VerifiedByUser)
                .WithMany()
                .HasForeignKey(v => v.VerifiedByUserId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Approval>()
                .HasOne(a => a.Preparedby)
                .WithMany(p => p.Approvals)
                .HasForeignKey(a => a.PreparedbyId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Approval>()
                .HasOne(a => a.ApprovedByUser)
                .WithMany()
                .HasForeignKey(a => a.ApprovedByUserId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Preparedby>()
                .HasMany(p => p.PaymentCompletions)
                .WithOne(pc => pc.Preparedby)
                .HasForeignKey(pc => pc.PreparedbyId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<PaymentCompletion>()
                .HasMany(pc => pc.Attachments)
                .WithOne(pa => pa.PaymentCompletion)
                .HasForeignKey(pa => pa.PaymentCompletionId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<PaymentAttachment>()
                .HasOne(pa => pa.UploadedByUser)
                .WithMany()
                .HasForeignKey(pa => pa.UploadedByUserId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<BankFacillities>()
    .HasOne(bf => bf.Banks)
    .WithMany()
    .HasForeignKey(bf => bf.BanksId)
    .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<BankFacillities>()
    .HasOne(bf => bf.suppliersBF)
    .WithMany()
    .HasForeignKey(bf => bf.supplierBfId)
    .OnDelete(DeleteBehavior.NoAction);


            modelBuilder.Entity<BankFacillities>()
                .HasOne(bf => bf.User)
                .WithMany()
                .HasForeignKey(bf => bf.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            // PreparedbyAttachment relationships
            modelBuilder.Entity<preparedbyAttachment>()
                .HasOne(pa => pa.Preparedby)
                .WithMany(p => p.Attachments)
                .HasForeignKey(pa => pa.PreparedbyId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<preparedbyAttachment>()
                .HasOne(pa => pa.UploadedByUser)
                .WithMany()
                .HasForeignKey(pa => pa.UploadedByUserId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<User>()
       .HasOne(u => u.Company)
       .WithMany() 
       .HasForeignKey(u => u.companyId)
       .OnDelete(DeleteBehavior.Cascade); 
        }
    }
}
