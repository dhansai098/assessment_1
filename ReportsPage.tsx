import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { reportsApi, downloadBlob, departmentApi } from '../services/api';
import { Department } from '../types';

interface ExportCardProps {
  title: string;
  description: string;
  icon: string;
  onExportExcel?: () => void;
  onExportPdf?: () => void;
  loading: boolean;
}

function ExportCard({ title, description, icon, onExportExcel, onExportPdf, loading }: ExportCardProps) {
  return (
    <div style={styles.card}>
      <div style={styles.cardIcon}>{icon}</div>
      <div style={styles.cardTitle}>{title}</div>
      <div style={styles.cardDesc}>{description}</div>
      <div style={styles.cardButtons}>
        {onExportExcel && (
          <button style={styles.excelBtn} onClick={onExportExcel} disabled={loading}>
            📊 Excel
          </button>
        )}
        {onExportPdf && (
          <button style={styles.pdfBtn} onClick={onExportPdf} disabled={loading}>
            📄 PDF
          </button>
        )}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date(); d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    departmentApi.getAll().then(r => setDepartments(r.data));
  }, []);

  const doExport = async (fn: () => Promise<any>, filename: string) => {
    setLoading(true);
    try {
      const res = await fn();
      downloadBlob(res.data, filename);
      toast.success('Download started!');
    } catch {
      toast.error('Export failed');
    } finally {
      setLoading(false);
    }
  };

  const params = () => ({
    ...(deptFilter ? { departmentId: deptFilter } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  });

  const attendanceParams = () => ({
    fromDate,
    toDate,
    ...(deptFilter ? { departmentId: deptFilter } : {}),
  });

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Reports & Exports</h1>
        <p style={styles.subtitle}>Generate and download reports in Excel or PDF format</p>
      </div>

      {/* Filters */}
      <div style={styles.filterSection}>
        <h3 style={styles.filterTitle}>Filters (applied to all exports)</h3>
        <div style={styles.filterRow}>
          <div style={styles.filterField}>
            <label style={styles.filterLabel}>Department</label>
            <select style={styles.filterInput} value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
              <option value="">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div style={styles.filterField}>
            <label style={styles.filterLabel}>Employee Status</label>
            <select style={styles.filterInput} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="OnLeave">On Leave</option>
            </select>
          </div>
          <div style={styles.filterField}>
            <label style={styles.filterLabel}>Attendance From</label>
            <input type="date" style={styles.filterInput} value={fromDate} onChange={e => setFromDate(e.target.value)} />
          </div>
          <div style={styles.filterField}>
            <label style={styles.filterLabel}>Attendance To</label>
            <input type="date" style={styles.filterInput} value={toDate} onChange={e => setToDate(e.target.value)} />
          </div>
        </div>
      </div>

      {loading && (
        <div style={styles.loadingBanner}>⏳ Generating report, please wait...</div>
      )}

      <div style={styles.grid}>
        <ExportCard
          title="Employee Directory"
          description="Complete list of all employees with their details, department, position, and status."
          icon="👥"
          loading={loading}
          onExportExcel={() => doExport(() => reportsApi.exportEmployeesExcel(params()), `employees_${Date.now()}.xlsx`)}
          onExportPdf={() => doExport(() => reportsApi.exportEmployeesPdf(params()), `employees_${Date.now()}.pdf`)}
        />

        <ExportCard
          title="Salary Report"
          description="Salary breakdown by employee and department, including years of service and total budget."
          icon="💰"
          loading={loading}
          onExportExcel={() => doExport(() => reportsApi.exportSalaryExcel(params()), `salary_${Date.now()}.xlsx`)}
        />

        <ExportCard
          title="Attendance Report"
          description="Daily attendance records for the selected date range, filtered by department."
          icon="📅"
          loading={loading}
          onExportExcel={() => doExport(() => reportsApi.exportAttendanceExcel(attendanceParams()), `attendance_${fromDate}_${toDate}.xlsx`)}
        />
      </div>

      {/* Bonus analytics section */}
      <div style={styles.bonusSection}>
        <h2 style={styles.bonusTitle}>📈 Analytics Insights</h2>
        <p style={styles.bonusDesc}>Additional insights powered by your employee and attendance data. Navigate to the Dashboard to view the interactive charts including:</p>
        <ul style={styles.bonusList}>
          <li>📊 <strong>Hiring Trend Analysis</strong> — 12-month hiring bar chart</li>
          <li>🏢 <strong>Department Growth Tracking</strong> — Pie chart of headcount per department</li>
          <li>✅ <strong>Attendance Pattern Reports</strong> — Use the Attendance Summary tab to view per-employee stats with progress bars</li>
          <li>📄 <strong>Performance Metrics with PDF Export</strong> — Export any report above as PDF</li>
        </ul>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 1100, margin: '0 auto' },
  header: { marginBottom: 28 },
  title: { fontSize: 26, fontWeight: 800, color: '#1a1f5e', margin: 0 },
  subtitle: { color: '#6b7280', margin: '4px 0 0', fontSize: 14 },
  filterSection: {
    background: '#fff', borderRadius: 12, padding: 20,
    marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  filterTitle: { fontSize: 14, fontWeight: 700, color: '#374151', margin: '0 0 14px' },
  filterRow: { display: 'flex', gap: 16, flexWrap: 'wrap' },
  filterField: { display: 'flex', flexDirection: 'column', gap: 5 },
  filterLabel: { fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' },
  filterInput: {
    padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb',
    fontSize: 13, outline: 'none', background: '#fff',
  },
  loadingBanner: {
    background: '#eff6ff', color: '#2d3a8c', border: '1px solid #bfdbfe',
    borderRadius: 8, padding: '12px 20px', marginBottom: 20, fontWeight: 600, fontSize: 14,
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20, marginBottom: 32 },
  card: {
    background: '#fff', borderRadius: 14, padding: 24,
    boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  cardIcon: { fontSize: 40 },
  cardTitle: { fontSize: 17, fontWeight: 700, color: '#1a1f5e' },
  cardDesc: { fontSize: 13, color: '#6b7280', flex: 1, lineHeight: 1.5 },
  cardButtons: { display: 'flex', gap: 10 },
  excelBtn: {
    flex: 1, padding: '9px', borderRadius: 8,
    background: '#f0fdf4', color: '#16a34a', border: '1.5px solid #bbf7d0',
    cursor: 'pointer', fontWeight: 600, fontSize: 13,
  },
  pdfBtn: {
    flex: 1, padding: '9px', borderRadius: 8,
    background: '#fff7ed', color: '#c2410c', border: '1.5px solid #fed7aa',
    cursor: 'pointer', fontWeight: 600, fontSize: 13,
  },
  bonusSection: {
    background: 'linear-gradient(135deg, #eff6ff, #f5f3ff)',
    borderRadius: 14, padding: 24,
    border: '1px solid #bfdbfe',
  },
  bonusTitle: { fontSize: 18, fontWeight: 700, color: '#1a1f5e', margin: '0 0 8px' },
  bonusDesc: { color: '#374151', fontSize: 14, margin: '0 0 12px' },
  bonusList: { margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 },
};
