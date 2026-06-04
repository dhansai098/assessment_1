import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Employee, Department, EmployeeFormData } from '../../types';

interface Props {
  employee?: Employee | null;
  departments: Department[];
  onSave: (data: EmployeeFormData) => void;
  onClose: () => void;
  saving: boolean;
}

export default function EmployeeModal({ employee, departments, onSave, onClose, saving }: Props) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<EmployeeFormData>();

  useEffect(() => {
    if (employee) {
      reset({
        ...employee,
        dateOfJoining: employee.dateOfJoining?.split('T')[0],
        dateOfBirth: employee.dateOfBirth?.split('T')[0] ?? '',
      });
    } else {
      reset({ status: 'Active', salary: 0 });
    }
  }, [employee, reset]);

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>{employee ? 'Edit Employee' : 'Add Employee'}</h2>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit(onSave)} style={styles.form}>
          <div style={styles.grid2}>
            <Field label="First Name *" error={errors.firstName?.message}>
              <input style={styles.input} {...register('firstName', { required: 'Required' })} />
            </Field>
            <Field label="Last Name *" error={errors.lastName?.message}>
              <input style={styles.input} {...register('lastName', { required: 'Required' })} />
            </Field>
          </div>

          <div style={styles.grid2}>
            <Field label="Email *" error={errors.email?.message}>
              <input style={styles.input} type="email" {...register('email', { required: 'Required' })} />
            </Field>
            <Field label="Phone">
              <input style={styles.input} {...register('phone')} />
            </Field>
          </div>

          <div style={styles.grid2}>
            <Field label="Position *" error={errors.position?.message}>
              <input style={styles.input} {...register('position', { required: 'Required' })} />
            </Field>
            <Field label="Salary *" error={errors.salary?.message}>
              <input style={styles.input} type="number" step="0.01" {...register('salary', { required: 'Required', min: 0 })} />
            </Field>
          </div>

          <div style={styles.grid2}>
            <Field label="Department *" error={errors.departmentId?.message}>
              <select style={styles.input} {...register('departmentId', { required: 'Required', valueAsNumber: true })}>
                <option value="">Select department</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select style={styles.input} {...register('status')}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="OnLeave">On Leave</option>
              </select>
            </Field>
          </div>

          <div style={styles.grid2}>
            <Field label="Date of Joining *" error={errors.dateOfJoining?.message}>
              <input style={styles.input} type="date" {...register('dateOfJoining', { required: 'Required' })} />
            </Field>
            <Field label="Date of Birth">
              <input style={styles.input} type="date" {...register('dateOfBirth')} />
            </Field>
          </div>

          <div style={styles.grid2}>
            <Field label="Gender">
              <select style={styles.input} {...register('gender')}>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </Field>
            <Field label="Address">
              <input style={styles.input} {...register('address')} />
            </Field>
          </div>

          <div style={styles.actions}>
            <button type="button" style={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" style={styles.saveBtn} disabled={saving}>
              {saving ? 'Saving...' : employee ? 'Update Employee' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{label}</label>
      {children}
      {error && <span style={{ color: '#ef4444', fontSize: 11 }}>{error}</span>}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  modal: {
    background: '#fff', borderRadius: 16, width: '100%', maxWidth: 640,
    maxHeight: '90vh', overflow: 'auto',
    boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 24px', borderBottom: '1px solid #f1f5f9',
  },
  title: { fontSize: 18, fontWeight: 700, color: '#1a1f5e', margin: 0 },
  closeBtn: {
    background: 'none', border: 'none', fontSize: 18,
    cursor: 'pointer', color: '#9ca3af', padding: 4,
  },
  form: { padding: 24, display: 'flex', flexDirection: 'column', gap: 16 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  input: {
    padding: '9px 12px', borderRadius: 8, fontSize: 13,
    border: '1.5px solid #e5e7eb', outline: 'none', width: '100%',
    boxSizing: 'border-box',
  },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  cancelBtn: {
    padding: '9px 20px', borderRadius: 8, border: '1.5px solid #e5e7eb',
    background: '#fff', fontSize: 14, cursor: 'pointer', fontWeight: 600,
  },
  saveBtn: {
    padding: '9px 24px', borderRadius: 8, border: 'none',
    background: 'linear-gradient(135deg, #2d3a8c, #1e4db7)',
    color: '#fff', fontSize: 14, cursor: 'pointer', fontWeight: 600,
  },
};
