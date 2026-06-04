using EmployeeManagementSystem.Data;
using EmployeeManagementSystem.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ClosedXML.Excel;
using iTextSharp.text;
using iTextSharp.text.pdf;

namespace EmployeeManagementSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ReportsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ReportsController(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>Dashboard statistics</summary>
        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard()
        {
            var today = DateOnly.FromDateTime(DateTime.Today);
            var monthStart = DateOnly.FromDateTime(new DateTime(DateTime.Today.Year, DateTime.Today.Month, 1));
            var yearAgo = DateOnly.FromDateTime(DateTime.Today.AddMonths(-11));

            var totalEmployees = await _context.Employees.CountAsync();
            var activeEmployees = await _context.Employees.CountAsync(e => e.Status == "Active");
            var totalDepartments = await _context.Departments.CountAsync();
            var totalSalary = await _context.Employees.Where(e => e.Status == "Active").SumAsync(e => e.Salary);
            var newHires = await _context.Employees.CountAsync(e => DateOnly.FromDateTime(e.DateOfJoining) >= monthStart);
            var presentToday = await _context.AttendanceRecords.CountAsync(a => a.Date == today && a.Status == "Present");

            var deptBreakdown = await _context.Departments
                .Select(d => new DepartmentStatsDto
                {
                    Department = d.Name,
                    Count = d.Employees.Count(e => e.Status == "Active"),
                    AverageSalary = d.Employees.Any(e => e.Status == "Active")
                        ? d.Employees.Where(e => e.Status == "Active").Average(e => e.Salary)
                        : 0
                })
                .OrderByDescending(d => d.Count)
                .ToListAsync();

            // Monthly hiring trend (last 12 months)
            var allEmployees = await _context.Employees.ToListAsync();
            var monthlyHiring = Enumerable.Range(0, 12)
                .Select(i =>
                {
                    var date = DateTime.Today.AddMonths(-11 + i);
                    return new MonthlyHiringDto
                    {
                        Month = date.ToString("MMM yyyy"),
                        Count = allEmployees.Count(e =>
                            e.DateOfJoining.Year == date.Year &&
                            e.DateOfJoining.Month == date.Month)
                    };
                })
                .ToList();

            return Ok(new DashboardStatsDto
            {
                TotalEmployees = totalEmployees,
                ActiveEmployees = activeEmployees,
                TotalDepartments = totalDepartments,
                TotalSalaryBudget = totalSalary,
                NewHiresThisMonth = newHires,
                PresentToday = presentToday,
                DepartmentBreakdown = deptBreakdown,
                MonthlyHiring = monthlyHiring
            });
        }

        /// <summary>Export Employee Directory as Excel</summary>
        [HttpGet("export/employees/excel")]
        public async Task<IActionResult> ExportEmployeesExcel([FromQuery] int? departmentId, [FromQuery] string? status)
        {
            var query = _context.Employees.Include(e => e.Department).AsQueryable();
            if (departmentId.HasValue) query = query.Where(e => e.DepartmentId == departmentId);
            if (!string.IsNullOrEmpty(status)) query = query.Where(e => e.Status == status);

            var employees = await query.OrderBy(e => e.LastName).ToListAsync();

            using var workbook = new XLWorkbook();
            var ws = workbook.Worksheets.Add("Employee Directory");

            // Header row styling
            var headers = new[] { "ID", "First Name", "Last Name", "Email", "Phone", "Department", "Position", "Salary", "Status", "Date of Joining", "Gender" };
            for (int i = 0; i < headers.Length; i++)
            {
                var cell = ws.Cell(1, i + 1);
                cell.Value = headers[i];
                cell.Style.Font.Bold = true;
                cell.Style.Fill.BackgroundColor = XLColor.FromArgb(0x2D, 0x3A, 0x8C);
                cell.Style.Font.FontColor = XLColor.White;
                cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            }

            // Data rows
            for (int r = 0; r < employees.Count; r++)
            {
                var e = employees[r];
                var row = r + 2;
                ws.Cell(row, 1).Value = e.Id;
                ws.Cell(row, 2).Value = e.FirstName;
                ws.Cell(row, 3).Value = e.LastName;
                ws.Cell(row, 4).Value = e.Email;
                ws.Cell(row, 5).Value = e.Phone ?? "";
                ws.Cell(row, 6).Value = e.Department?.Name ?? "";
                ws.Cell(row, 7).Value = e.Position;
                ws.Cell(row, 8).Value = e.Salary;
                ws.Cell(row, 8).Style.NumberFormat.Format = "#,##0.00";
                ws.Cell(row, 9).Value = e.Status;
                ws.Cell(row, 10).Value = e.DateOfJoining.ToString("yyyy-MM-dd");
                ws.Cell(row, 11).Value = e.Gender ?? "";

                if (r % 2 == 1)
                    ws.Row(row).Style.Fill.BackgroundColor = XLColor.FromArgb(0xF5, 0xF7, 0xFF);
            }

            ws.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            stream.Position = 0;
            return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"employees_{DateTime.Today:yyyy-MM-dd}.xlsx");
        }

        /// <summary>Export Employee Directory as PDF</summary>
        [HttpGet("export/employees/pdf")]
        public async Task<IActionResult> ExportEmployeesPdf([FromQuery] int? departmentId, [FromQuery] string? status)
        {
            var query = _context.Employees.Include(e => e.Department).AsQueryable();
            if (departmentId.HasValue) query = query.Where(e => e.DepartmentId == departmentId);
            if (!string.IsNullOrEmpty(status)) query = query.Where(e => e.Status == status);
            var employees = await query.OrderBy(e => e.LastName).ToListAsync();

            using var stream = new MemoryStream();
            var doc = new Document(PageSize.A4.Rotate(), 20, 20, 30, 30);
            var writer = PdfWriter.GetInstance(doc, stream);
            doc.Open();

            // Title
            var titleFont = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 16, new BaseColor(0x2D, 0x3A, 0x8C));
            var subFont = FontFactory.GetFont(FontFactory.HELVETICA, 10, BaseColor.GRAY);
            doc.Add(new Paragraph("Employee Directory Report", titleFont));
            doc.Add(new Paragraph($"Generated: {DateTime.Now:yyyy-MM-dd HH:mm}  |  Total: {employees.Count} employees", subFont));
            doc.Add(new Paragraph(" "));

            // Table
            var table = new PdfPTable(8) { WidthPercentage = 100 };
            table.SetWidths(new float[] { 3f, 4f, 5f, 3f, 5f, 3f, 3f, 3f });

            var headerBg = new BaseColor(0x2D, 0x3A, 0x8C);
            var headerFont = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 9, BaseColor.WHITE);
            var cellFont = FontFactory.GetFont(FontFactory.HELVETICA, 8, BaseColor.BLACK);

            void AddHeader(string text)
            {
                var cell = new PdfPCell(new Phrase(text, headerFont))
                {
                    BackgroundColor = headerBg,
                    Padding = 6,
                    HorizontalAlignment = Element.ALIGN_CENTER
                };
                table.AddCell(cell);
            }

            foreach (var h in new[] { "Name", "Email", "Department", "Position", "Salary", "Status", "Joined", "Gender" })
                AddHeader(h);

            var altBg = new BaseColor(0xF5, 0xF7, 0xFF);
            for (int i = 0; i < employees.Count; i++)
            {
                var e = employees[i];
                var bg = i % 2 == 1 ? altBg : BaseColor.WHITE;

                void AddCell(string text, int align = Element.ALIGN_LEFT)
                {
                    var cell = new PdfPCell(new Phrase(text, cellFont))
                    { BackgroundColor = bg, Padding = 5, HorizontalAlignment = align };
                    table.AddCell(cell);
                }

                AddCell($"{e.FirstName} {e.LastName}");
                AddCell(e.Email);
                AddCell(e.Department?.Name ?? "");
                AddCell(e.Position);
                AddCell(e.Salary.ToString("N2"), Element.ALIGN_RIGHT);
                AddCell(e.Status, Element.ALIGN_CENTER);
                AddCell(e.DateOfJoining.ToString("yyyy-MM-dd"), Element.ALIGN_CENTER);
                AddCell(e.Gender ?? "", Element.ALIGN_CENTER);
            }

            doc.Add(table);
            doc.Close();
            return File(stream.ToArray(), "application/pdf", $"employees_{DateTime.Today:yyyy-MM-dd}.pdf");
        }

        /// <summary>Export Attendance Report as Excel</summary>
        [HttpGet("export/attendance/excel")]
        public async Task<IActionResult> ExportAttendanceExcel(
            [FromQuery] int? employeeId, [FromQuery] int? departmentId,
            [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate)
        {
            var from = fromDate ?? DateOnly.FromDateTime(DateTime.Today.AddDays(-30));
            var to = toDate ?? DateOnly.FromDateTime(DateTime.Today);

            var query = _context.AttendanceRecords
                .Include(a => a.Employee).ThenInclude(e => e!.Department)
                .Where(a => a.Date >= from && a.Date <= to);

            if (employeeId.HasValue) query = query.Where(a => a.EmployeeId == employeeId);
            if (departmentId.HasValue) query = query.Where(a => a.Employee!.DepartmentId == departmentId);

            var records = await query.OrderByDescending(a => a.Date).ThenBy(a => a.Employee!.LastName).ToListAsync();

            using var workbook = new XLWorkbook();
            var ws = workbook.Worksheets.Add("Attendance");

            var headers = new[] { "Date", "Employee", "Department", "Status", "Check In", "Check Out", "Notes" };
            for (int i = 0; i < headers.Length; i++)
            {
                var cell = ws.Cell(1, i + 1);
                cell.Value = headers[i];
                cell.Style.Font.Bold = true;
                cell.Style.Fill.BackgroundColor = XLColor.FromArgb(0x2D, 0x3A, 0x8C);
                cell.Style.Font.FontColor = XLColor.White;
            }

            for (int r = 0; r < records.Count; r++)
            {
                var a = records[r];
                var row = r + 2;
                ws.Cell(row, 1).Value = a.Date.ToString("yyyy-MM-dd");
                ws.Cell(row, 2).Value = $"{a.Employee?.FirstName} {a.Employee?.LastName}";
                ws.Cell(row, 3).Value = a.Employee?.Department?.Name ?? "";
                ws.Cell(row, 4).Value = a.Status;
                ws.Cell(row, 5).Value = a.CheckIn?.ToString("HH:mm") ?? "";
                ws.Cell(row, 6).Value = a.CheckOut?.ToString("HH:mm") ?? "";
                ws.Cell(row, 7).Value = a.Notes ?? "";
                if (r % 2 == 1) ws.Row(row).Style.Fill.BackgroundColor = XLColor.FromArgb(0xF5, 0xF7, 0xFF);
            }

            ws.Columns().AdjustToContents();
            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"attendance_{from}_{to}.xlsx");
        }

        /// <summary>Export Salary Report as Excel</summary>
        [HttpGet("export/salary/excel")]
        public async Task<IActionResult> ExportSalaryExcel([FromQuery] int? departmentId)
        {
            var query = _context.Employees.Include(e => e.Department).Where(e => e.Status == "Active");
            if (departmentId.HasValue) query = query.Where(e => e.DepartmentId == departmentId);
            var employees = await query.OrderBy(e => e.Department!.Name).ThenBy(e => e.LastName).ToListAsync();

            using var workbook = new XLWorkbook();
            var ws = workbook.Worksheets.Add("Salary Report");

            var headers = new[] { "ID", "Name", "Department", "Position", "Salary", "Date of Joining", "Years of Service" };
            for (int i = 0; i < headers.Length; i++)
            {
                var cell = ws.Cell(1, i + 1);
                cell.Value = headers[i];
                cell.Style.Font.Bold = true;
                cell.Style.Fill.BackgroundColor = XLColor.FromArgb(0x2D, 0x3A, 0x8C);
                cell.Style.Font.FontColor = XLColor.White;
            }

            for (int r = 0; r < employees.Count; r++)
            {
                var e = employees[r];
                var row = r + 2;
                var years = Math.Round((DateTime.Today - e.DateOfJoining).TotalDays / 365, 1);
                ws.Cell(row, 1).Value = e.Id;
                ws.Cell(row, 2).Value = $"{e.FirstName} {e.LastName}";
                ws.Cell(row, 3).Value = e.Department?.Name ?? "";
                ws.Cell(row, 4).Value = e.Position;
                ws.Cell(row, 5).Value = e.Salary;
                ws.Cell(row, 5).Style.NumberFormat.Format = "#,##0.00";
                ws.Cell(row, 6).Value = e.DateOfJoining.ToString("yyyy-MM-dd");
                ws.Cell(row, 7).Value = years;
                if (r % 2 == 1) ws.Row(row).Style.Fill.BackgroundColor = XLColor.FromArgb(0xF5, 0xF7, 0xFF);
            }

            // Summary row
            var sumRow = employees.Count + 2;
            ws.Cell(sumRow, 4).Value = "Total Salary Budget:";
            ws.Cell(sumRow, 4).Style.Font.Bold = true;
            ws.Cell(sumRow, 5).FormulaA1 = $"=SUM(E2:E{sumRow - 1})";
            ws.Cell(sumRow, 5).Style.Font.Bold = true;
            ws.Cell(sumRow, 5).Style.NumberFormat.Format = "#,##0.00";

            ws.Columns().AdjustToContents();
            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"salary_report_{DateTime.Today:yyyy-MM-dd}.xlsx");
        }
    }
}
