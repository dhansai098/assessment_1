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
    public class DepartmentsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DepartmentsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var departments = await _context.Departments
                .Include(d => d.Employees)
                .Select(d => new DepartmentResponseDto
                {
                    Id = d.Id,
                    Name = d.Name,
                    Description = d.Description,
                    EmployeeCount = d.Employees.Count(e => e.Status == "Active"),
                    CreatedAt = d.CreatedAt
                })
                .OrderBy(d => d.Name)
                .ToListAsync();

            return Ok(departments);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var dept = await _context.Departments
                .Include(d => d.Employees)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (dept == null) return NotFound();

            return Ok(new DepartmentResponseDto
            {
                Id = dept.Id,
                Name = dept.Name,
                Description = dept.Description,
                EmployeeCount = dept.Employees.Count(e => e.Status == "Active"),
                CreatedAt = dept.CreatedAt
            });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] DepartmentCreateDto dto)
        {
            if (await _context.Departments.AnyAsync(d => d.Name == dto.Name))
                return Conflict(new { message = "Department name already exists." });

            var dept = new Department { Name = dto.Name, Description = dto.Description };
            _context.Departments.Add(dept);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = dept.Id }, new DepartmentResponseDto
            {
                Id = dept.Id, Name = dept.Name, Description = dept.Description, CreatedAt = dept.CreatedAt
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] DepartmentCreateDto dto)
        {
            var dept = await _context.Departments.FindAsync(id);
            if (dept == null) return NotFound();

            if (await _context.Departments.AnyAsync(d => d.Name == dto.Name && d.Id != id))
                return Conflict(new { message = "Department name already exists." });

            dept.Name = dto.Name;
            dept.Description = dto.Description;
            await _context.SaveChangesAsync();
            return Ok(new { id = dept.Id, name = dept.Name, description = dept.Description });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var dept = await _context.Departments.Include(d => d.Employees).FirstOrDefaultAsync(d => d.Id == id);
            if (dept == null) return NotFound();

            if (dept.Employees.Any())
                return BadRequest(new { message = "Cannot delete a department that has employees." });

            _context.Departments.Remove(dept);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
