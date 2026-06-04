using EmployeeManagementSystem.Data;
using EmployeeManagementSystem.DTOs;
using EmployeeManagementSystem.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagementSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class EmployeesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public EmployeesController(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>Get all employees with filtering, sorting, and pagination</summary>
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] EmployeeFilterDto filter)
        {
            var query = _context.Employees
                .Include(e => e.Department)
                .AsQueryable();

            // Filtering
            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                var search = filter.Search.ToLower();
                query = query.Where(e =>
                    e.FirstName.ToLower().Contains(search) ||
                    e.LastName.ToLower().Contains(search) ||
                    e.Email.ToLower().Contains(search) ||
                    e.Position.ToLower().Contains(search));
            }

            if (filter.DepartmentId.HasValue)
                query = query.Where(e => e.DepartmentId == filter.DepartmentId);

            if (!string.IsNullOrEmpty(filter.Status))
                query = query.Where(e => e.Status == filter.Status);

            if (!string.IsNullOrEmpty(filter.Gender))
                query = query.Where(e => e.Gender == filter.Gender);

            // Sorting
            query = (filter.SortBy?.ToLower(), filter.SortOrder?.ToLower()) switch
            {
                ("lastname", "desc") => query.OrderByDescending(e => e.LastName),
                ("lastname", _) => query.OrderBy(e => e.LastName),
                ("email", "desc") => query.OrderByDescending(e => e.Email),
                ("email", _) => query.OrderBy(e => e.Email),
                ("salary", "desc") => query.OrderByDescending(e => e.Salary),
                ("salary", _) => query.OrderBy(e => e.Salary),
                ("dateofjoining", "desc") => query.OrderByDescending(e => e.DateOfJoining),
                ("dateofjoining", _) => query.OrderBy(e => e.DateOfJoining),
                (_, "desc") => query.OrderByDescending(e => e.FirstName),
                _ => query.OrderBy(e => e.FirstName),
            };

            var totalCount = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize);

            var employees = await query
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .Select(e => MapToDto(e))
                .ToListAsync();

            return Ok(new EmployeeListResponseDto
            {
                Employees = employees,
                TotalCount = totalCount,
                Page = filter.Page,
                PageSize = filter.PageSize,
                TotalPages = totalPages
            });
        }

        /// <summary>Get a single employee by ID</summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var employee = await _context.Employees
                .Include(e => e.Department)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (employee == null) return NotFound(new { message = "Employee not found." });
            return Ok(MapToDto(employee));
        }

        /// <summary>Create a new employee</summary>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] EmployeeCreateDto dto)
        {
            if (await _context.Employees.AnyAsync(e => e.Email == dto.Email))
                return Conflict(new { message = "Email already registered." });

            if (!await _context.Departments.AnyAsync(d => d.Id == dto.DepartmentId))
                return BadRequest(new { message = "Department not found." });

            var employee = new Employee
            {
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Email = dto.Email,
                Phone = dto.Phone,
                Position = dto.Position,
                Salary = dto.Salary,
                DateOfJoining = dto.DateOfJoining,
                DepartmentId = dto.DepartmentId,
                Status = dto.Status,
                Address = dto.Address,
                DateOfBirth = dto.DateOfBirth,
                Gender = dto.Gender
            };

            _context.Employees.Add(employee);
            await _context.SaveChangesAsync();

            await _context.Entry(employee).Reference(e => e.Department).LoadAsync();
            return CreatedAtAction(nameof(GetById), new { id = employee.Id }, MapToDto(employee));
        }

        /// <summary>Update an employee</summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] EmployeeUpdateDto dto)
        {
            var employee = await _context.Employees.FindAsync(id);
            if (employee == null) return NotFound(new { message = "Employee not found." });

            if (await _context.Employees.AnyAsync(e => e.Email == dto.Email && e.Id != id))
                return Conflict(new { message = "Email already in use by another employee." });

            if (!await _context.Departments.AnyAsync(d => d.Id == dto.DepartmentId))
                return BadRequest(new { message = "Department not found." });

            employee.FirstName = dto.FirstName;
            employee.LastName = dto.LastName;
            employee.Email = dto.Email;
            employee.Phone = dto.Phone;
            employee.Position = dto.Position;
            employee.Salary = dto.Salary;
            employee.DateOfJoining = dto.DateOfJoining;
            employee.DepartmentId = dto.DepartmentId;
            employee.Status = dto.Status;
            employee.Address = dto.Address;
            employee.DateOfBirth = dto.DateOfBirth;
            employee.Gender = dto.Gender;
            employee.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            await _context.Entry(employee).Reference(e => e.Department).LoadAsync();
            return Ok(MapToDto(employee));
        }

        /// <summary>Delete a single employee</summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var employee = await _context.Employees.FindAsync(id);
            if (employee == null) return NotFound(new { message = "Employee not found." });

            _context.Employees.Remove(employee);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        /// <summary>Bulk delete multiple employees</summary>
        [HttpPost("bulk-delete")]
        public async Task<IActionResult> BulkDelete([FromBody] List<int> ids)
        {
            var employees = await _context.Employees
                .Where(e => ids.Contains(e.Id))
                .ToListAsync();

            if (!employees.Any()) return NotFound(new { message = "No employees found." });

            _context.Employees.RemoveRange(employees);
            await _context.SaveChangesAsync();
            return Ok(new { message = $"{employees.Count} employee(s) deleted successfully." });
        }

        private static EmployeeResponseDto MapToDto(Employee e) => new()
        {
            Id = e.Id,
            FirstName = e.FirstName,
            LastName = e.LastName,
            Email = e.Email,
            Phone = e.Phone,
            Position = e.Position,
            Salary = e.Salary,
            DateOfJoining = e.DateOfJoining,
            Status = e.Status,
            DepartmentId = e.DepartmentId,
            DepartmentName = e.Department?.Name ?? "",
            Address = e.Address,
            DateOfBirth = e.DateOfBirth,
            Gender = e.Gender,
            CreatedAt = e.CreatedAt,
            UpdatedAt = e.UpdatedAt
        };
    }
}
