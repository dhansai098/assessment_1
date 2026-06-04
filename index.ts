export interface User {
  username: string;
  email: string;
  role: string;
  token: string;
  expiresAt: string;
}

export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  position: string;
  salary: number;
  dateOfJoining: string;
  status: 'Active' | 'Inactive' | 'OnLeave';
  departmentId: number;
  departmentName: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: string;
  salary: number;
  dateOfJoining: string;
  departmentId: number;
  status: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
}

export interface EmployeeListResponse {
  employees: Employee[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Department {
  id: number;
  name: string;
  description?: string;
  employeeCount: number;
  createdAt: string;
}

export interface AttendanceRecord {
  id: number;
  employeeId: number;
  employeeName: string;
  departmentName: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late' | 'HalfDay' | 'Leave';
  checkIn?: string;
  checkOut?: string;
  notes?: string;
}

export interface AttendanceSummary {
  employeeId: number;
  employeeName: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  halfDays: number;
  leaveDays: number;
  attendancePercentage: number;
}

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  totalDepartments: number;
  totalSalaryBudget: number;
  newHiresThisMonth: number;
  presentToday: number;
  departmentBreakdown: { department: string; count: number; averageSalary: number }[];
  monthlyHiring: { month: string; count: number }[];
}

export interface EmployeeFilter {
  search?: string;
  departmentId?: number;
  status?: string;
  gender?: string;
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface AttendanceFilter {
  employeeId?: number;
  departmentId?: number;
  fromDate?: string;
  toDate?: string;
  status?: string;
  page: number;
  pageSize: number;
}
