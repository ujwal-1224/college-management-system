-- Create Database
CREATE DATABASE IF NOT EXISTS college_management;
USE college_management;

-- User Table
CREATE TABLE IF NOT EXISTS User (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('student', 'staff', 'admin', 'parent') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student Table
CREATE TABLE IF NOT EXISTS Student (
  student_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(15),
  date_of_birth DATE,
  enrollment_date DATE NOT NULL,
  department VARCHAR(50),
  semester INT,
  FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE
);

-- Staff Table (Faculty)
CREATE TABLE IF NOT EXISTS Staff (
  staff_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(15),
  department VARCHAR(50),
  designation VARCHAR(50),
  joining_date DATE NOT NULL,
  FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE
);

-- Parent Table
CREATE TABLE IF NOT EXISTS Parent (
  parent_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(15),
  occupation VARCHAR(100),
  FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE
);

-- StudentParent Relationship Table
CREATE TABLE IF NOT EXISTS StudentParent (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  parent_id INT NOT NULL,
  relationship VARCHAR(20) NOT NULL,
  FOREIGN KEY (student_id) REFERENCES Student(student_id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES Parent(parent_id) ON DELETE CASCADE,
  UNIQUE KEY unique_student_parent (student_id, parent_id)
);

-- Admin Table
CREATE TABLE IF NOT EXISTS Admin (
  admin_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(15),
  FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE
);

-- Course Table
CREATE TABLE IF NOT EXISTS Course (
  course_id INT PRIMARY KEY AUTO_INCREMENT,
  course_code VARCHAR(20) UNIQUE NOT NULL,
  course_name VARCHAR(100) NOT NULL,
  department VARCHAR(50),
  credits INT NOT NULL,
  semester INT,
  staff_id INT,
  FOREIGN KEY (staff_id) REFERENCES Staff(staff_id) ON DELETE SET NULL
);

-- Attendance Table
CREATE TABLE IF NOT EXISTS Attendance (
  attendance_id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  attendance_date DATE NOT NULL,
  status ENUM('present', 'absent', 'late') NOT NULL,
  FOREIGN KEY (student_id) REFERENCES Student(student_id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES Course(course_id) ON DELETE CASCADE,
  UNIQUE KEY unique_attendance (student_id, course_id, attendance_date)
);

-- Exam Table
CREATE TABLE IF NOT EXISTS Exam (
  exam_id INT PRIMARY KEY AUTO_INCREMENT,
  course_id INT NOT NULL,
  exam_name VARCHAR(100) NOT NULL,
  exam_date DATE NOT NULL,
  max_marks INT NOT NULL,
  FOREIGN KEY (course_id) REFERENCES Course(course_id) ON DELETE CASCADE
);

-- Result Table
CREATE TABLE IF NOT EXISTS Result (
  result_id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  exam_id INT NOT NULL,
  marks_obtained INT NOT NULL,
  grade VARCHAR(2),
  FOREIGN KEY (student_id) REFERENCES Student(student_id) ON DELETE CASCADE,
  FOREIGN KEY (exam_id) REFERENCES Exam(exam_id) ON DELETE CASCADE,
  UNIQUE KEY unique_result (student_id, exam_id)
);

-- FeePayment Table
CREATE TABLE IF NOT EXISTS FeePayment (
  payment_id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method VARCHAR(50),
  semester INT,
  status ENUM('paid', 'pending', 'overdue') NOT NULL,
  FOREIGN KEY (student_id) REFERENCES Student(student_id) ON DELETE CASCADE
);

-- Hostel Table
CREATE TABLE IF NOT EXISTS Hostel (
  hostel_id INT PRIMARY KEY AUTO_INCREMENT,
  hostel_name VARCHAR(100) NOT NULL,
  total_rooms INT NOT NULL,
  available_rooms INT NOT NULL
);

-- HostelAllocation Table
CREATE TABLE IF NOT EXISTS HostelAllocation (
  allocation_id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT UNIQUE NOT NULL,
  hostel_id INT NOT NULL,
  room_number VARCHAR(10) NOT NULL,
  allocation_date DATE NOT NULL,
  FOREIGN KEY (student_id) REFERENCES Student(student_id) ON DELETE CASCADE,
  FOREIGN KEY (hostel_id) REFERENCES Hostel(hostel_id) ON DELETE CASCADE
);

-- Insert sample users for all roles (password: admin123, student123, staff123, parent123)
INSERT INTO User (username, password, role) VALUES 
('admin', '$2b$10$deStkUCsOOCNmvkQCo0/feOq2XHAFUcAG1tuoU.bpU.Swp8dn9x0u', 'admin'),
('student1', '$2b$10$deStkUCsOOCNmvkQCo0/feOq2XHAFUcAG1tuoU.bpU.Swp8dn9x0u', 'student'),
('staff1', '$2b$10$deStkUCsOOCNmvkQCo0/feOq2XHAFUcAG1tuoU.bpU.Swp8dn9x0u', 'staff'),
('parent1', '$2b$10$deStkUCsOOCNmvkQCo0/feOq2XHAFUcAG1tuoU.bpU.Swp8dn9x0u', 'parent');

INSERT INTO Admin (user_id, first_name, last_name, email, phone) VALUES 
(1, 'System', 'Admin', 'admin@college.edu', '1234567890');

INSERT INTO Student (user_id, first_name, last_name, email, phone, date_of_birth, enrollment_date, department, semester) VALUES 
(2, 'John', 'Doe', 'john.doe@college.edu', '9876543210', '2002-05-15', '2023-08-01', 'Computer Science', 3);

INSERT INTO Staff (user_id, first_name, last_name, email, phone, department, designation, joining_date) VALUES 
(3, 'Jane', 'Smith', 'jane.smith@college.edu', '9876543211', 'Computer Science', 'Professor', '2020-01-15');

INSERT INTO Parent (user_id, first_name, last_name, email, phone, occupation) VALUES 
(4, 'Robert', 'Doe', 'robert.doe@email.com', '9876543212', 'Engineer');

-- Link parent to student
INSERT INTO StudentParent (student_id, parent_id, relationship) VALUES 
(1, 1, 'Father');
