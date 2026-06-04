using System.ComponentModel.DataAnnotations;

namespace EmployeeManagementSystem.DTOs
{
    // Auth DTOs
    public class LoginDto
    {
        [Required] public string Email { get; set; } = string.Empty;
        [Required] public string Password { get; set; } = string.Empty;
    }

    public class RegisterDto
    {
        [Required, MaxLength(100)] public string Username { get; set; } = string.Empty;
        [Required, EmailAddress] public string Email { get; set; } = string.Empty;
        [Required, MinLength(8)] public string Password { get; set; } = string.Empty;
        public string Role { get; set; } = "Admin";
    }

    public class AuthResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
    }

    // Employee DTOs
    public class EmployeeCreateDto
    {
        [Required, MaxLength(100)] public string FirstName { get; set; } = string.Empty;
        [Required, MaxLength(100)] public string LastName { get; set; } = string.Empty;
        [Required, EmailAddress] public string Email { get; set; } = string.Empty;
        [MaxLength(20)] public string? Phone { get; set; }
        [Required, MaxLength(100)] public string Position { get; set; } = string.Empty;
        [Range(0, double.MaxValue)] public decimal Salary { get; set; }
        [Required] public DateTime DateOfJoining { get; set; }
        [Required] public int DepartmentId { get; set; }
        public string Status { get; set; } = "Active";
        public string? Address { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? Gender { get; set; }
    }

    public class EmployeeUpdateDto : EmployeeCreateDto { }

    public class EmployeeResponseDto
    {
        public int Id { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string FullName => $"{FirstName} {LastName}";
        public string Email { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string Position { get; set; } = string.Empty;
        public decimal Salary { get; set; }
        public DateTime DateOfJoining { get; set; }
        public string Status { get; set; } = string.Empty;
        public int DepartmentId { get; set; }
        public string DepartmentName { get; set; } = string.Empty;
        public string? Address { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? Gender { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class EmployeeListResponseDto
    {
        public List<EmployeeResponseDto> Employees { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }

    // Department DTOs
    public class DepartmentCreateDto
    {
        [Required, MaxLength(100)] public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    public class DepartmentResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int EmployeeCount { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    // Attendance DTOs
    public class AttendanceCreateDto
    {
        [Required] public int EmployeeId { get; set; }
        [Required] public DateOnly Date { get; set; }
        [Required] public string Status { get; set; } = "Present";
        public TimeOnly? CheckIn { get; set; }
        public TimeOnly? CheckOut { get; set; }
        public string? Notes { get; set; }
    }

    public class AttendanceResponseDto
    {
        public int Id { get; set; }
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public string DepartmentName { get; set; } = string.Empty;
        public DateOnly Date { get; set; }
        public string Status { get; set; } = string.Empty;
        public TimeOnly? CheckIn { get; set; }
        public TimeOnly? CheckOut { get; set; }
        public string? Notes { get; set; }
    }

    public class AttendanceSummaryDto
    {
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public int TotalDays { get; set; }
        public int PresentDays { get; set; }
        public int AbsentDays { get; set; }
        public int LateDays { get; set; }
        public int HalfDays { get; set; }
        public int LeaveDays { get; set; }
        public double AttendancePercentage { get; set; }
    }

    // Dashboard / Report DTOs
    public class DashboardStatsDto
    {
        public int TotalEmployees { get; set; }
        public int ActiveEmployees { get; set; }
        public int TotalDepartments { get; set; }
        public decimal TotalSalaryBudget { get; set; }
        public int NewHiresThisMonth { get; set; }
        public int PresentToday { get; set; }
        public List<DepartmentStatsDto> DepartmentBreakdown { get; set; } = new();
        public List<MonthlyHiringDto> MonthlyHiring { get; set; } = new();
    }

    public class DepartmentStatsDto
    {
        public string Department { get; set; } = string.Empty;
        public int Count { get; set; }
        public decimal AverageSalary { get; set; }
    }

    public class MonthlyHiringDto
    {
        public string Month { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    // Filter/Query DTOs
    public class EmployeeFilterDto
    {
        public string? Search { get; set; }
        public int? DepartmentId { get; set; }
        public string? Status { get; set; }
        public string? Gender { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string SortBy { get; set; } = "FirstName";
        public string SortOrder { get; set; } = "asc";
    }

    public class AttendanceFilterDto
    {
        public int? EmployeeId { get; set; }
        public int? DepartmentId { get; set; }
        public DateOnly? FromDate { get; set; }
        public DateOnly? ToDate { get; set; }
        public string? Status { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }
}
