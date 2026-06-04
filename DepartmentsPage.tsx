import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { departmentApi } from '../services/api';
import { Department } from '../types';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await departmentApi.getAll();
      setDepartments(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDepartments(); }, []);

  const openForm = (dept?: Department) => {
    setEditing(dept ?? null);
    setName(dept?.name ?? '');
    setDescription(dept?.description ?? '');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      if (editing) {
        await departmentApi.update(editing.id, { name, description });
        toast.success('Department updated');
      } else {
        await departmentApi.create({ name, description });
        toast.success('Department created');
      }
      setShowForm(false);
      fetchDepartments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (dept: Department) => {
    if (dept.employeeCount > 0) { toast.error('Cannot delete department with employees'); return; }
    if (!confirm(`Delete "${dept.name}"?`)) return;
    try {
      await departmentApi.delete(dept.id);
      toast.success('Deleted');
      fetchDepartments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Departments</h1>
          <p style={styles.subtitle}>{departments.length} departments</p>
        </div>
        <button style={styles.addBtn} onClick={() => openForm()}>+ Add Department</button>
      </div>

      {loading ? (
        <div style={styles.empty}>Loading...</div>
      ) : (
        <div style={styles.grid}>
          {departments.map(d => (
            <div key={d.id} style={styles.card}>
              <div style={styles.cardIcon}>🏢</div>
              <div style={styles.cardName}>{d.name}</div>
              <div style={styles.cardDesc}>{d.description || 'No description'}</div>
              <div style={styles.cardCount}>
                <span style={styles.badge}>{d.employeeCount} employees</span>
              </div>
              <div style={styles.cardActions}>
                <button style={styles.editBtn} onClick={() => openForm(d)}>✏️ Edit</button>
                <button style={styles.delBtn} onClick={() => handleDelete(d)}>🗑 Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div style={styles.overlay} onClick={() => setShowForm(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{editing ? 'Edit Department' : 'New Department'}</h2>
              <button style={styles.closeBtn} onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.field}>
                <label style={styles.label}>Name *</label>
                <input style={styles.input} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Engineering" />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Description</label>
                <textarea style={{ ...styles.input, height: 80, resize: 'vertical' }}
                  value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description" />
              </div>
              <div style={styles.modalActions}>
                <button style={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
                <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 1100, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  title: { fontSize: 26, fontWeight: 800, color: '#1a1f5e', margin: 0 },
  subtitle: { color: '#6b7280', margin: '2px 0 0', fontSize: 13 },
  addBtn: {
    background: 'linear-gradient(135deg, #2d3a8c, #1e4db7)',
    color: '#fff', border: 'none', borderRadius: 8,
    padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
  },
  empty: { textAlign: 'center', padding: 60, color: '#9ca3af' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 },
  card: {
    background: '#fff', borderRadius: 14, padding: 24,
    boxShadow: '0 2px 10px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', gap: 10,
  },
  cardIcon: { fontSize: 36 },
  cardName: { fontSize: 17, fontWeight: 700, color: '#1a1f5e' },
  cardDesc: { fontSize: 13, color: '#6b7280', flex: 1 },
  cardCount: {},
  badge: {
    background: '#eff6ff', color: '#2d3a8c',
    padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
  },
  cardActions: { display: 'flex', gap: 8, marginTop: 4 },
  editBtn: {
    flex: 1, padding: '7px', border: '1.5px solid #e5e7eb', borderRadius: 8,
    background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600,
  },
  delBtn: {
    flex: 1, padding: '7px', border: '1.5px solid #fee2e2', borderRadius: 8,
    background: '#fef2f2', color: '#ef4444', cursor: 'pointer', fontSize: 12, fontWeight: 600,
  },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  modal: {
    background: '#fff', borderRadius: 14, width: '100%', maxWidth: 440,
    boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
  },
  modalHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '18px 24px', borderBottom: '1px solid #f1f5f9',
  },
  modalTitle: { fontSize: 17, fontWeight: 700, color: '#1a1f5e', margin: 0 },
  closeBtn: { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#9ca3af' },
  modalBody: { padding: 24, display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: '#374151' },
  input: {
    padding: '9px 12px', borderRadius: 8, fontSize: 13,
    border: '1.5px solid #e5e7eb', outline: 'none', width: '100%', boxSizing: 'border-box',
  },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: {
    padding: '9px 18px', borderRadius: 8, border: '1.5px solid #e5e7eb',
    background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13,
  },
  saveBtn: {
    padding: '9px 22px', borderRadius: 8, border: 'none',
    background: 'linear-gradient(135deg, #2d3a8c, #1e4db7)',
    color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13,
  },
};
