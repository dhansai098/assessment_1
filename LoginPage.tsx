import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const res = await authApi.login(data.email, data.password);
      login(res.data);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.logoArea}>
          <div style={styles.logoIcon}>EMS</div>
          <h1 style={styles.title}>Employee Management</h1>
          <p style={styles.subtitle}>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              style={{ ...styles.input, ...(errors.email ? styles.inputError : {}) }}
              type="email"
              placeholder="admin@ems.com"
              {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' } })}
            />
            {errors.email && <span style={styles.error}>{errors.email.message}</span>}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={{ ...styles.input, ...(errors.password ? styles.inputError : {}) }}
              type="password"
              placeholder="••••••••"
              {...register('password', { required: 'Password is required' })}
            />
            {errors.password && <span style={styles.error}>{errors.password.message}</span>}
          </div>

          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={styles.hint}>Default: admin@ems.com / Admin@123</p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1a1f5e 0%, #2d3a8c 50%, #1e4db7 100%)',
  },
  card: {
    background: '#fff',
    borderRadius: 16,
    padding: '48px 40px',
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
  },
  logoArea: { textAlign: 'center', marginBottom: 32 },
  logoIcon: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 64, height: 64, borderRadius: 16,
    background: 'linear-gradient(135deg, #2d3a8c, #1e4db7)',
    color: '#fff', fontSize: 20, fontWeight: 800,
    marginBottom: 16, letterSpacing: 1,
  },
  title: { fontSize: 24, fontWeight: 800, color: '#1a1f5e', margin: '0 0 4px' },
  subtitle: { color: '#6b7280', fontSize: 14, margin: 0 },
  form: { display: 'flex', flexDirection: 'column', gap: 20 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: '#374151' },
  input: {
    padding: '10px 14px', borderRadius: 8, fontSize: 14,
    border: '1.5px solid #e5e7eb', outline: 'none',
    transition: 'border-color 0.2s',
  },
  inputError: { borderColor: '#ef4444' },
  error: { color: '#ef4444', fontSize: 12 },
  btn: {
    background: 'linear-gradient(135deg, #2d3a8c, #1e4db7)',
    color: '#fff', border: 'none', borderRadius: 8,
    padding: '12px', fontSize: 15, fontWeight: 700,
    cursor: 'pointer', marginTop: 4,
    transition: 'opacity 0.2s',
  },
  hint: { textAlign: 'center', color: '#9ca3af', fontSize: 12, marginTop: 20, marginBottom: 0 },
};
