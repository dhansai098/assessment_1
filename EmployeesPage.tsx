import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { employeeApi, departmentApi } from '../services/api';
import { Employee, Department, EmployeeFilter, EmployeeFormData } from '../types';
import EmployeeModal from '../components/employees/EmployeeModal';

const STATUS_COLORS: Record<string, string> = {
  Active: '#10b981', Inactive: '#ef4444', OnLeave: '#f59e0b',
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<EmployeeFilter>({
    page: 1, pageSize: 10, sortBy: 'firstName', sortOrder: 'asc',
  });

  const totalPages = Math.ceil(total / filter.pageSize);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await employeeApi.getAll(filter);
      setEmployees(res.data.employees);
      setTotal(res.data.totalCount);
    } catch {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);
  useEffect(() => {
    departmentApi.getAll().then(r => setDepartments(r.data));
  }, []);

  const handleSave = async (data: EmployeeFormData) => {
    setSaving(true);
    try {
      if (editEmployee) {
        await employeeApi.update(editEmployee.id, data);
        toast.success('Employee updated');
      } else {
        await employeeApi.create(data);
        toast.success('Employee added');
      }
      setShowModal(false);
      setEditEmployee(null);
      fetchEmployees();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this employee?')) return;
    try {
      await employeeApi.delete(id);
      toast.success('Employee deleted');
      fetchEmployees();
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selected.size} selected employee(s)?`)) return;
    try {
      await employeeApi.bulkDelete([...selected]);
      toast.success(`${selected.size} employee(s) deleted`);
      setSelected(new Set());
      fetchEmployees();
    } catch {
      toast.error('Bulk delete failed');
    }
  };

  const toggleSelect = (id: number) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const toggleSelectAll = () => {
    if (selected.size === employees.length) setSelected(new Set());
    else setSelected(new Set(employees.map(e => e.id)));
  };

  const updateFilter = (patch: Partial<EmployeeFilter>) =>
    setFilter(f => ({ ...f, ...patch, page: patch.page ?? 1 }));

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Employees</h1>
          <p style={styles.subtitle}>{total} total records</p>
        </div>
        <button style={styles.addBtn} onClick={() => { setEditEmployee(null); setShowModal(true); }}>
          + Add Employee
        </button>
      </div>

      {/* Filters */}
      <div style={styles.filterBar}>
        <input
          style={styles.searchInput}
          placeholder="Search name, email, position..."
          value={filter.search ?? ''}
          onChange={e => updateFilter({ search: e.target.value })}
        />
        <select style={styles.select} value={filter.departmentId ?? ''} onChange={e => updateFilter({ departmentId: e.target.value ? +e.target.value : undefined })}>
          <option value="">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select style={styles.select} value={filter.status ?? ''} onChange={e => updateFilter({ status: e.target.value || undefined })}>
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="OnLeave">On Leave</option>
        </select>
        <select style={styles.select} value={`${filter.sortBy}-${filter.sortOrder}`} onChange={e => {
          const [sortBy, sortOrder] = e.target.value.split('-');
          updateFilter({ sortBy, sortOrder: sortOrder as 'asc' | 'desc' });
        }}>
          <option value="firstName-asc">Name A→Z</option>
          <option value="firstName-desc">Name Z→A</option>
          <option value="salary-desc">Salary High→Low</option>
          <option value="salary-asc">Salary Low→High</option>
          <option value="dateOfJoining-desc">Newest First</option>
          <option value="dateOfJoining-asc">Oldest First</option>
        </select>
        {selected.size > 0 && (
          <button style={styles.deleteBtn} onClick={handleBulkDelete}>
            🗑 Delete ({selected.size})
          </button>
        )}
      </div>

      {/* Table */}
      <div style={styles.tableWrap}>
        {loading ? (
          <div style={styles.emptyState}>Loading...</div>
        ) : employees.length === 0 ? (
          <div style={styles.emptyState}>No employees found</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>
                  <input type="checkbox" checked={selected.size === employees.length && employees.length > 0} onChange={toggleSelectAll} />
                </th>
                {['Name', 'Email', 'Department', 'Position', 'Salary', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map((e, i) => (
                <tr key={e.id} style={{ background: i % 2 === 0 ? '#fff' : '#f8faff' }}>
                  <td style={styles.td}>
                    <input type="checkbox" checked={selected.has(e.id)} onChange={() => toggleSelect(e.id)} />
                  </td>
                  <td style={styles.td}>
                    <div style={styles.nameCell}>
                      <div style={styles.avatar}>{e.firstName[0]}{e.lastName[0]}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{e.fullName}</div>
                        <div style={{ color: '#9ca3af', fontSize: 11 }}>{e.gender ?? ''}</div>
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}>{e.email}</td>
                  <td style={styles.td}>{e.departmentName}</td>
                  <td style={styles.td}>{e.position}</td>
                  <td style={styles.td}>₹{e.salary.toLocaleString()}</td>
                  <td style={styles.td}>
                    <span style={{ ...styles.badge, background: STATUS_COLORS[e.status] + '20', color: STATUS_COLORS[e.status] }}>
                      {e.status}
                    </span>
                  </td>
                  <td style={styles.td}>{new Date(e.dateOfJoining).toLocaleDateString()}</td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={styles.editBtn} onClick={() => { setEditEmployee(e); setShowModal(true); }}>✏️</button>
                      <button style={styles.delBtn} onClick={() => handleDelete(e.id)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button style={styles.pageBtn} disabled={filter.page <= 1} onClick={() => updateFilter({ page: filter.page - 1 })}>← Prev</button>
          <span style={styles.pageInfo}>Page {filter.page} of {totalPages}</span>
          <button style={styles.pageBtn} disabled={filter.page >= totalPages} onClick={() => updateFilter({ page: filter.page + 1 })}>Next →</button>
        </div>
      )}

      {showModal && (
        <EmployeeModal
          employee={editEmployee}
          departments={departments}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditEmployee(null); }}
          saving={saving}
        />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 1200, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title: { fontSize: 26, fontWeight: 800, color: '#1a1f5e', margin: 0 },
  subtitle: { color: '#6b7280', margin: '2px 0 0', fontSize: 13 },
  addBtn: {
    background: 'linear-gradient(135deg, #2d3a8c, #1e4db7)',
    color: '#fff', border: 'none', borderRadius: 8,
    padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
  },
  filterBar: { display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' },
  searchInput: {
    padding: '9px 14px', borderRadius: 8, border: '1.5px solid #e5e7eb',
    fontSize: 13, outline: 'none', minWidth: 240, flex: 1,
  },
  select: {
    padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb',
    fontSize: 13, outline: 'none', background: '#fff',
  },
  deleteBtn: {
    padding: '9px 16px', borderRadius: 8, border: 'none',
    background: '#fee2e2', color: '#ef4444', fontWeight: 600, cursor: 'pointer', fontSize: 13,
  },
  tableWrap: { background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    background: '#1a1f5e', color: '#fff', padding: '12px 14px',
    textAlign: 'left', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
  },
  td: { padding: '12px 14px', fontSize: 13, color: '#374151', borderBottom: '1px solid #f1f5f9' },
  nameCell: { display: 'flex', alignItems: 'center', gap: 10 },
  avatar: {
    width: 34, height: 34, borderRadius: '50%',
    background: 'linear-gradient(135deg, #2d3a8c, #1e4db7)',
    color: '#fff', fontWeight: 700, fontSize: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  badge: { padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 },
  editBtn: { background: '#eff6ff', border: 'none', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', fontSize: 14 },
  delBtn: { background: '#fef2f2', border: 'none', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', fontSize: 14 },
  emptyState: { textAlign: 'center', padding: '60px 20px', color: '#9ca3af', fontSize: 15 },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 20 },
  pageBtn: {
    padding: '8px 16px', borderRadius: 8, border: '1.5px solid #e5e7eb',
    background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
  },
  pageInfo: { color: '#6b7280', fontSize: 13 },
};
