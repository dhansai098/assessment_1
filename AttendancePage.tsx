import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { attendanceApi, departmentApi, employeeApi } from '../services/api';
import { AttendanceRecord, AttendanceSummary, Department, Employee } from '../types';

const STATUS_COLORS: Record<string, string> = {
  Present: '#10b981', Absent: '#ef4444', Late: '#f59e0b',
  HalfDay: '#8b5cf6', Leave: '#6b7280',
};

export default function AttendancePage() {
  const [tab, setTab] = useState<'records' | 'summary' | 'mark'>('records');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);

  // Filters
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date(); d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Mark attendance state
  const [markDate, setMarkDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [markRows, setMarkRows] = useState<Record<number, string>>({});
  const [markLoading, setMarkLoading] = useState(false);

  useEffect(() => {
    departmentApi.getAll().then(r => setDepartments(r.data));
    employeeApi.getAll({ pageSize: 1000, status: 'Active' }).then(r => setEmployees(r.data.employees));
  }, []);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { fromDate, toDate, page, pageSize: 20 };
      if (deptFilter) params.departmentId = deptFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await attendanceApi.getAll(params);
      setRecords(res.data.records);
      setTotalCount(res.data.totalCount);
    } finally { setLoading(false); }
  }, [fromDate, toDate, page, deptFilter, statusFilter]);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { fromDate, toDate };
      if (deptFilter) params.departmentId = deptFilter;
      const res = await attendanceApi.getSummary(params);
      setSummary(res.data);
    } finally { setLoading(false); }
  }, [fromDate, toDate, deptFilter]);

  useEffect(() => {
    if (tab === 'records') fetchRecords();
    else if (tab === 'summary') fetchSummary();
  }, [tab, fetchRecords, fetchSummary]);

  const handleMarkSubmit = async () => {
    const dtos = employees
      .filter(e => markRows[e.id])
      .map(e => ({
        employeeId: e.id,
        date: markDate,
        status: markRows[e.id],
      }));
    if (!dtos.length) { toast.error('Mark at least one employee'); return; }
    setMarkLoading(true);
    try {
      const res = await attendanceApi.bulkCreate(dtos);
      toast.success(`${res.data.created} records saved, ${res.data.skipped} skipped`);
      setMarkRows({});
    } catch {
      toast.error('Failed to save attendance');
    } finally { setMarkLoading(false); }
  };

  const markAll = (status: string) => {
    const next: Record<number, string> = {};
    employees.forEach(e => { next[e.id] = status; });
    setMarkRows(next);
  };

  const totalPages = Math.ceil(totalCount / 20);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Attendance</h1>
          <p style={styles.subtitle}>Track and manage employee attendance</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {(['records', 'summary', 'mark'] as const).map(t => (
          <button key={t} style={{ ...styles.tab, ...(tab === t ? styles.tabActive : {}) }} onClick={() => setTab(t)}>
            {t === 'records' ? '📋 Records' : t === 'summary' ? '📊 Summary' : '✍️ Mark Attendance'}
          </button>
        ))}
      </div>

      {/* Shared filters */}
      {tab !== 'mark' && (
        <div style={styles.filterBar}>
          <input type="date" style={styles.input} value={fromDate} onChange={e => setFromDate(e.target.value)} />
          <span style={{ color: '#6b7280', alignSelf: 'center' }}>to</span>
          <input type="date" style={styles.input} value={toDate} onChange={e => setToDate(e.target.value)} />
          <select style={styles.input} value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          {tab === 'records' && (
            <select style={styles.input} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              {['Present', 'Absent', 'Late', 'HalfDay', 'Leave'].map(s => <option key={s}>{s}</option>)}
            </select>
          )}
        </div>
      )}

      {/* Records Tab */}
      {tab === 'records' && (
        <div style={styles.tableWrap}>
          {loading ? <div style={styles.empty}>Loading...</div> : records.length === 0 ? <div style={styles.empty}>No records found</div> : (
            <table style={styles.table}>
              <thead>
                <tr>
                  {['Date', 'Employee', 'Department', 'Status', 'Check In', 'Check Out', 'Notes'].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? '#fff' : '#f8faff' }}>
                    <td style={styles.td}>{r.date}</td>
                    <td style={styles.td}>{r.employeeName}</td>
                    <td style={styles.td}>{r.departmentName}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, background: STATUS_COLORS[r.status] + '20', color: STATUS_COLORS[r.status] }}>
                        {r.status}
                      </span>
                    </td>
                    <td style={styles.td}>{r.checkIn ?? '—'}</td>
                    <td style={styles.td}>{r.checkOut ?? '—'}</td>
                    <td style={styles.td}>{r.notes ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {totalPages > 1 && (
            <div style={styles.pagination}>
              <button style={styles.pageBtn} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span style={{ color: '#6b7280', fontSize: 13 }}>Page {page} of {totalPages}</span>
              <button style={styles.pageBtn} disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </div>
      )}

      {/* Summary Tab */}
      {tab === 'summary' && (
        <div style={styles.tableWrap}>
          {loading ? <div style={styles.empty}>Loading...</div> : summary.length === 0 ? <div style={styles.empty}>No data</div> : (
            <table style={styles.table}>
              <thead>
                <tr>
                  {['Employee', 'Present', 'Absent', 'Late', 'Half Day', 'Leave', 'Total', 'Attendance %'].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {summary.map((s, i) => (
                  <tr key={s.employeeId} style={{ background: i % 2 === 0 ? '#fff' : '#f8faff' }}>
                    <td style={styles.td}><strong>{s.employeeName}</strong></td>
                    <td style={{ ...styles.td, color: '#10b981', fontWeight: 600 }}>{s.presentDays}</td>
                    <td style={{ ...styles.td, color: '#ef4444', fontWeight: 600 }}>{s.absentDays}</td>
                    <td style={{ ...styles.td, color: '#f59e0b', fontWeight: 600 }}>{s.lateDays}</td>
                    <td style={{ ...styles.td, color: '#8b5cf6', fontWeight: 600 }}>{s.halfDays}</td>
                    <td style={{ ...styles.td, color: '#6b7280', fontWeight: 600 }}>{s.leaveDays}</td>
                    <td style={styles.td}>{s.totalDays}</td>
                    <td style={styles.td}>
                      <div style={styles.progressWrap}>
                        <div style={{ ...styles.progressBar, width: `${s.attendancePercentage}%`, background: s.attendancePercentage >= 80 ? '#10b981' : s.attendancePercentage >= 60 ? '#f59e0b' : '#ef4444' }} />
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{s.attendancePercentage}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Mark Attendance Tab */}
      {tab === 'mark' && (
        <div>
          <div style={styles.markControls}>
            <div style={styles.filterBar}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Date:</label>
              <input type="date" style={styles.input} value={markDate} onChange={e => setMarkDate(e.target.value)} />
              <button style={styles.quickBtn} onClick={() => markAll('Present')}>✅ Mark All Present</button>
              <button style={styles.quickBtn} onClick={() => markAll('Absent')}>❌ Mark All Absent</button>
              <button style={styles.quickBtn} onClick={() => setMarkRows({})}>🔄 Reset</button>
            </div>
          </div>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {['Employee', 'Department', 'Status'].map(h => <th key={h} style={styles.th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {employees.map((e, i) => (
                  <tr key={e.id} style={{ background: i % 2 === 0 ? '#fff' : '#f8faff' }}>
                    <td style={styles.td}>{e.fullName}</td>
                    <td style={styles.td}>{e.departmentName}</td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {['Present', 'Absent', 'Late', 'HalfDay', 'Leave'].map(s => (
                          <button key={s} onClick={() => setMarkRows(r => ({ ...r, [e.id]: s }))}
                            style={{
                              padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                              border: `1.5px solid ${STATUS_COLORS[s]}`,
                              background: markRows[e.id] === s ? STATUS_COLORS[s] : 'transparent',
                              color: markRows[e.id] === s ? '#fff' : STATUS_COLORS[s],
                              cursor: 'pointer',
                            }}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <button style={styles.saveMarkBtn} onClick={handleMarkSubmit} disabled={markLoading}>
              {markLoading ? 'Saving...' : `Save Attendance (${Object.keys(markRows).length} marked)`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 1200, margin: '0 auto' },
  header: { marginBottom: 24 },
  title: { fontSize: 26, fontWeight: 800, color: '#1a1f5e', margin: 0 },
  subtitle: { color: '#6b7280', margin: '2px 0 0', fontSize: 13 },
  tabs: { display: 'flex', gap: 4, marginBottom: 20 },
  tab: {
    padding: '9px 20px', borderRadius: 8, border: '1.5px solid #e5e7eb',
    background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#6b7280',
  },
  tabActive: {
    background: 'linear-gradient(135deg, #2d3a8c, #1e4db7)',
    borderColor: 'transparent', color: '#fff',
  },
  filterBar: { display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 },
  input: {
    padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb',
    fontSize: 13, outline: 'none',
  },
  tableWrap: { background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { background: '#1a1f5e', color: '#fff', padding: '11px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600 },
  td: { padding: '11px 14px', fontSize: 13, color: '#374151', borderBottom: '1px solid #f1f5f9' },
  badge: { padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 },
  empty: { textAlign: 'center', padding: '50px 20px', color: '#9ca3af' },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, padding: '14px 0' },
  pageBtn: {
    padding: '7px 16px', borderRadius: 8, border: '1.5px solid #e5e7eb',
    background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
  },
  progressWrap: { display: 'flex', alignItems: 'center', gap: 8 },
  progressBar: { height: 8, borderRadius: 4, background: '#10b981', transition: 'width 0.3s' },
  markControls: { marginBottom: 4 },
  quickBtn: {
    padding: '8px 14px', borderRadius: 8, border: '1.5px solid #e5e7eb',
    background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 12,
  },
  saveMarkBtn: {
    background: 'linear-gradient(135deg, #2d3a8c, #1e4db7)',
    color: '#fff', border: 'none', borderRadius: 8,
    padding: '11px 28px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
  },
};
