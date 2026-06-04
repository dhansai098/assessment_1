import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { reportsApi } from '../services/api';
import { DashboardStats } from '../types';

const COLORS = ['#2d3a8c', '#1e4db7', '#3b82f6', '#60a5fa', '#93c5fd'];

const StatCard = ({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) => (
  <div style={{ ...cardStyles.card, borderLeft: `4px solid ${color}` }}>
    <div style={cardStyles.icon}>{icon}</div>
    <div>
      <div style={cardStyles.value}>{value}</div>
      <div style={cardStyles.label}>{label}</div>
    </div>
  </div>
);

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsApi.getDashboard()
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={styles.loading}>Loading dashboard...</div>;
  if (!stats) return <div style={styles.loading}>Failed to load dashboard.</div>;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Dashboard</h1>
        <p style={styles.subtitle}>Welcome back! Here's your workforce overview.</p>
      </div>

      {/* Stat Cards */}
      <div style={styles.statsGrid}>
        <StatCard label="Total Employees" value={stats.totalEmployees} icon="👥" color="#2d3a8c" />
        <StatCard label="Active Employees" value={stats.activeEmployees} icon="✅" color="#10b981" />
        <StatCard label="Departments" value={stats.totalDepartments} icon="🏢" color="#f59e0b" />
        <StatCard label="New Hires (Month)" value={stats.newHiresThisMonth} icon="🎉" color="#8b5cf6" />
        <StatCard label="Present Today" value={stats.presentToday} icon="📅" color="#06b6d4" />
        <StatCard label="Salary Budget" value={`₹${stats.totalSalaryBudget.toLocaleString()}`} icon="💰" color="#ef4444" />
      </div>

      {/* Charts Row */}
      <div style={styles.chartsRow}>
        {/* Monthly Hiring Bar Chart */}
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Monthly Hiring Trend (Last 12 Months)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.monthlyHiring} margin={{ top: 10, right: 10, bottom: 40, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#2d3a8c" radius={[4, 4, 0, 0]} name="Hires" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Department Pie Chart */}
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Employees by Department</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={stats.departmentBreakdown.filter(d => d.count > 0)}
                dataKey="count"
                nameKey="department"
                cx="50%"
                cy="50%"
                outerRadius={85}
                label={({ department, count }) => `${department}: ${count}`}
                labelLine={false}
              >
                {stats.departmentBreakdown.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department Table */}
      <div style={styles.tableCard}>
        <h3 style={styles.chartTitle}>Department Summary</h3>
        <table style={styles.table}>
          <thead>
            <tr>
              {['Department', 'Employees', 'Avg. Salary'].map(h => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stats.departmentBreakdown.map((d, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f8faff' }}>
                <td style={styles.td}>{d.department}</td>
                <td style={styles.td}>{d.count}</td>
                <td style={styles.td}>₹{d.averageSalary.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 1200, margin: '0 auto' },
  header: { marginBottom: 28 },
  title: { fontSize: 28, fontWeight: 800, color: '#1a1f5e', margin: 0 },
  subtitle: { color: '#6b7280', margin: '4px 0 0', fontSize: 14 },
  loading: { textAlign: 'center', padding: 60, color: '#6b7280', fontSize: 16 },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 16, marginBottom: 28,
  },
  chartsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 },
  chartCard: {
    background: '#fff', borderRadius: 12,
    padding: '20px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  chartTitle: { fontSize: 15, fontWeight: 700, color: '#1a1f5e', margin: '0 0 16px' },
  tableCard: {
    background: '#fff', borderRadius: 12,
    padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    background: '#1a1f5e', color: '#fff', padding: '10px 14px',
    textAlign: 'left', fontSize: 13, fontWeight: 600,
  },
  td: { padding: '10px 14px', fontSize: 14, color: '#374151', borderBottom: '1px solid #f1f5f9' },
};

const cardStyles: Record<string, React.CSSProperties> = {
  card: {
    background: '#fff', borderRadius: 12, padding: '18px 20px',
    display: 'flex', alignItems: 'center', gap: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  icon: { fontSize: 28 },
  value: { fontSize: 26, fontWeight: 800, color: '#1a1f5e', lineHeight: 1 },
  label: { fontSize: 12, color: '#6b7280', marginTop: 4, fontWeight: 500 },
};
