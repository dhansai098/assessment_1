import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ems_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ems_token');
      localStorage.removeItem('ems_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Auth ──────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: { username: string; email: string; password: string; role: string }) =>
    api.post('/auth/register', data),
};

// ── Employees ─────────────────────────────────────────
export const employeeApi = {
  getAll: (params?: object) => api.get('/employees', { params }),
  getById: (id: number) => api.get(`/employees/${id}`),
  create: (data: object) => api.post('/employees', data),
  update: (id: number, data: object) => api.put(`/employees/${id}`, data),
  delete: (id: number) => api.delete(`/employees/${id}`),
  bulkDelete: (ids: number[]) => api.post('/employees/bulk-delete', ids),
};

// ── Departments ───────────────────────────────────────
export const departmentApi = {
  getAll: () => api.get('/departments'),
  getById: (id: number) => api.get(`/departments/${id}`),
  create: (data: object) => api.post('/departments', data),
  update: (id: number, data: object) => api.put(`/departments/${id}`, data),
  delete: (id: number) => api.delete(`/departments/${id}`),
};

// ── Attendance ────────────────────────────────────────
export const attendanceApi = {
  getAll: (params?: object) => api.get('/attendance', { params }),
  create: (data: object) => api.post('/attendance', data),
  update: (id: number, data: object) => api.put(`/attendance/${id}`, data),
  delete: (id: number) => api.delete(`/attendance/${id}`),
  getSummary: (params?: object) => api.get('/attendance/summary', { params }),
  bulkCreate: (data: object[]) => api.post('/attendance/bulk', data),
};

// ── Reports ───────────────────────────────────────────
export const reportsApi = {
  getDashboard: () => api.get('/reports/dashboard'),
  exportEmployeesExcel: (params?: object) =>
    api.get('/reports/export/employees/excel', { params, responseType: 'blob' }),
  exportEmployeesPdf: (params?: object) =>
    api.get('/reports/export/employees/pdf', { params, responseType: 'blob' }),
  exportAttendanceExcel: (params?: object) =>
    api.get('/reports/export/attendance/excel', { params, responseType: 'blob' }),
  exportSalaryExcel: (params?: object) =>
    api.get('/reports/export/salary/excel', { params, responseType: 'blob' }),
};

// Helper to trigger file download
export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}
