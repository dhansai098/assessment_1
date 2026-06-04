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
    public class AttendanceController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AttendanceController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] AttendanceFilterDto filter)
        {
            var query = _context.AttendanceRecords
                .Include(a => a.Employee).ThenInclude(e => e!.Department)
                .AsQueryable();

            if (filter.EmployeeId.HasValue) query = query.Where(a => a.EmployeeId == filter.EmployeeId);
            if (filter.DepartmentId.HasValue) query = query.Where(a => a.Employee!.DepartmentId == filter.DepartmentId);
            if (filter.FromDate.HasValue) query = query.Where(a => a.Date >= filter.FromDate);
            if (filter.ToDate.HasValue) query = query.Where(a => a.Date <= filter.ToDate);
            if (!string.IsNullOrEmpty(filter.Status)) query = query.Where(a => a.Status == filter.Status);

            var total = await query.CountAsync();
            var records = await query
                .OrderByDescending(a => a.Date)
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .Select(a => new AttendanceResponseDto
                {
                    Id = a.Id,
                    EmployeeId = a.EmployeeId,
                    EmployeeName = $"{a.Employee!.FirstName} {a.Employee.LastName}",
                    DepartmentName = a.Employee.Department!.Name,
                    Date = a.Date,
                    Status = a.Status,
                    CheckIn = a.CheckIn,
                    CheckOut = a.CheckOut,
                    Notes = a.Notes
                })
                .ToListAsync();

            return Ok(new { records, totalCount = total, page = filter.Page, pageSize = filter.PageSize });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] AttendanceCreateDto dto)
        {
            if (!await _context.Employees.AnyAsync(e => e.Id == dto.EmployeeId))
                return BadRequest(new { message = "Employee not found." });

            if (await _context.AttendanceRecords.AnyAsync(a => a.EmployeeId == dto.EmployeeId && a.Date == dto.Date))
                return Conflict(new { message = "Attendance record already exists for this employee on this date." });

            var record = new AttendanceRecord
            {
                EmployeeId = dto.EmployeeId,
                Date = dto.Date,
                Status = dto.Status,
                CheckIn = dto.CheckIn,
                CheckOut = dto.CheckOut,
                Notes = dto.Notes
            };

            _context.AttendanceRecords.Add(record);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetAll), new { id = record.Id }, record);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] AttendanceCreateDto dto)
        {
            var record = await _context.AttendanceRecords.FindAsync(id);
            if (record == null) return NotFound();

            record.Status = dto.Status;
            record.CheckIn = dto.CheckIn;
            record.CheckOut = dto.CheckOut;
            record.Notes = dto.Notes;

            await _context.SaveChangesAsync();
            return Ok(record);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var record = await _context.AttendanceRecords.FindAsync(id);
            if (record == null) return NotFound();
            _context.AttendanceRecords.Remove(record);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        /// <summary>Get attendance summary per employee for a date range</summary>
        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary([FromQuery] int? departmentId, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate)
        {
            var from = fromDate ?? DateOnly.FromDateTime(DateTime.Today.AddMonths(-1));
            var to = toDate ?? DateOnly.FromDateTime(DateTime.Today);

            var query = _context.AttendanceRecords
                .Include(a => a.Employee)
                .Where(a => a.Date >= from && a.Date <= to);

            if (departmentId.HasValue)
                query = query.Where(a => a.Employee!.DepartmentId == departmentId);

            var records = await query.ToListAsync();

            var summary = records
                .GroupBy(a => new { a.EmployeeId, EmployeeName = $"{a.Employee!.FirstName} {a.Employee.LastName}" })
                .Select(g =>
                {
                    var total = g.Count();
                    var present = g.Count(r => r.Status == "Present");
                    return new AttendanceSummaryDto
                    {
                        EmployeeId = g.Key.EmployeeId,
                        EmployeeName = g.Key.EmployeeName,
                        TotalDays = total,
                        PresentDays = present,
                        AbsentDays = g.Count(r => r.Status == "Absent"),
                        LateDays = g.Count(r => r.Status == "Late"),
                        HalfDays = g.Count(r => r.Status == "HalfDay"),
                        LeaveDays = g.Count(r => r.Status == "Leave"),
                        AttendancePercentage = total > 0 ? Math.Round(present * 100.0 / total, 1) : 0
                    };
                })
                .OrderByDescending(s => s.AttendancePercentage)
                .ToList();

            return Ok(summary);
        }

        /// <summary>Bulk mark attendance for multiple employees</summary>
        [HttpPost("bulk")]
        public async Task<IActionResult> BulkCreate([FromBody] List<AttendanceCreateDto> dtos)
        {
            var records = new List<AttendanceRecord>();
            var skipped = 0;

            foreach (var dto in dtos)
            {
                if (await _context.AttendanceRecords.AnyAsync(a => a.EmployeeId == dto.EmployeeId && a.Date == dto.Date))
                {
                    skipped++;
                    continue;
                }

                records.Add(new AttendanceRecord
                {
                    EmployeeId = dto.EmployeeId,
                    Date = dto.Date,
                    Status = dto.Status,
                    CheckIn = dto.CheckIn,
                    CheckOut = dto.CheckOut,
                    Notes = dto.Notes
                });
            }

            _context.AttendanceRecords.AddRange(records);
            await _context.SaveChangesAsync();
            return Ok(new { created = records.Count, skipped });
        }
    }
}
