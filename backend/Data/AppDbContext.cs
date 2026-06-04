using EmployeeManagementSystem.Models;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagementSystem.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Employee> Employees { get; set; }
        public DbSet<Department> Departments { get; set; }
        public DbSet<AttendanceRecord> AttendanceRecords { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Unique constraints
            modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();
            modelBuilder.Entity<User>().HasIndex(u => u.Username).IsUnique();
            modelBuilder.Entity<Employee>().HasIndex(e => e.Email).IsUnique();
            modelBuilder.Entity<AttendanceRecord>()
                .HasIndex(a => new { a.EmployeeId, a.Date })
                .IsUnique();

            // Seed default admin user
            modelBuilder.Entity<User>().HasData(new User
            {
                Id = 1,
                Username = "admin",
                Email = "admin@ems.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                Role = "Admin",
                CreatedAt = new DateTime(2024, 1, 1),
                IsActive = true
            });

            // Seed departments
            modelBuilder.Entity<Department>().HasData(
                new Department { Id = 1, Name = "Engineering", Description = "Software development and technical operations", CreatedAt = new DateTime(2024, 1, 1) },
                new Department { Id = 2, Name = "Human Resources", Description = "People operations and talent management", CreatedAt = new DateTime(2024, 1, 1) },
                new Department { Id = 3, Name = "Finance", Description = "Financial planning and accounting", CreatedAt = new DateTime(2024, 1, 1) },
                new Department { Id = 4, Name = "Marketing", Description = "Brand and market development", CreatedAt = new DateTime(2024, 1, 1) },
                new Department { Id = 5, Name = "Operations", Description = "Business operations and logistics", CreatedAt = new DateTime(2024, 1, 1) }
            );
        }
    }
}
