-- ============================================================
-- Employee Management System - MySQL Setup Script
-- ============================================================

CREATE DATABASE IF NOT EXISTS EmployeeManagementDB
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE EmployeeManagementDB;

-- EF Core will handle table creation via migrations.
-- Run this file first to create the database, then run:
--   cd backend && dotnet ef database update

-- ============================================================
-- Optional: Sample data for testing (run AFTER migrations)
-- ============================================================

-- The seeded admin account (from AppDbContext.OnModelCreating):
--   Email:    admin@ems.com
--   Password: Admin@123

-- Sample employees (run after EF migration):
/*
INSERT INTO Employees (FirstName, LastName, Email, Phone, Position, Salary, DateOfJoining, DepartmentId, Status, Gender, CreatedAt, UpdatedAt)
VALUES
('Arjun',   'Sharma',   'arjun@ems.com',   '9876543210', 'Senior Developer',   85000, '2022-03-15', 1, 'Active', 'Male',   NOW(), NOW()),
('Priya',   'Mehta',    'priya@ems.com',    '9876543211', 'HR Manager',         75000, '2021-07-01', 2, 'Active', 'Female', NOW(), NOW()),
('Rahul',   'Gupta',    'rahul@ems.com',    '9876543212', 'Financial Analyst',  70000, '2023-01-20', 3, 'Active', 'Male',   NOW(), NOW()),
('Sneha',   'Patel',    'sneha@ems.com',    '9876543213', 'Marketing Lead',     72000, '2022-09-05', 4, 'Active', 'Female', NOW(), NOW()),
('Vikram',  'Nair',     'vikram@ems.com',   '9876543214', 'DevOps Engineer',    90000, '2020-11-12', 1, 'Active', 'Male',   NOW(), NOW()),
('Anjali',  'Singh',    'anjali@ems.com',   '9876543215', 'UI/UX Designer',     68000, '2023-06-01', 1, 'Active', 'Female', NOW(), NOW()),
('Kiran',   'Reddy',    'kiran@ems.com',    '9876543216', 'Operations Head',    80000, '2019-04-22', 5, 'Active', 'Male',   NOW(), NOW()),
('Deepa',   'Iyer',     'deepa@ems.com',    '9876543217', 'Recruiter',          55000, '2023-03-10', 2, 'Active', 'Female', NOW(), NOW()),
('Suresh',  'Kumar',    'suresh@ems.com',   '9876543218', 'Backend Developer',  78000, '2021-12-01', 1, 'Active', 'Male',   NOW(), NOW()),
('Meena',   'Bhat',     'meena@ems.com',    '9876543219', 'Accountant',         62000, '2022-05-17', 3, 'Active', 'Female', NOW(), NOW());
*/
