-- ============================================
-- FINAL COMPREHENSIVE DATABASE SCHEMA
-- College Management System - Complete SRS
-- ============================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS AuditLog;
DROP TABLE IF EXISTS Message;
DROP TABLE IF EXISTS SystemNotification;
DROP TABLE IF EXISTS FeeDefaulter;
DROP TABLE IF EXISTS HostelAllocation;
DROP TABLE IF EXISTS Hostel;
DROP TABLE IF EXISTS Notification;
DROP TABLE IF EXISTS FeePayment;
DROP TABLE IF EXISTS FeeStructure;
DROP TABLE IF EXISTS Timetable;
DROP TABLE IF EXISTS CourseEnrollment;
DROP TABLE IF EXISTS Result;
DROP TABLE IF EXISTS Exam;
DROP TABLE IF EXISTS Attendance;
DROP TABLE IF EXISTS Course;
DROP TABLE IF EXISTS StudentParent;
DROP TABLE IF EXISTS Parent;
DROP TABLE IF EXISTS Student;
DROP TABLE IF EXISTS Staff;
DROP TABLE IF EXISTS User;

-- ============================================
-- CORE TABLES
-- ============================================

CREATE TABLE User (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'student', 'staff', 'parent') NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  failed_login_attempts INT DEFAULT 0,
  account_locked_until DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL,
  INDEX idx_username (username),
  INDEX idx_role (role)
);

CREATE TABLE Student (
  student_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(15),
  date_of_birth DATE,
  department VARCHAR(100),
  semester INT,
  enrollment_date DATE,
  FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE,
  INDEX idx_department (department),
  INDEX idx_semester (semester)
);

CREATE TABLE Staff (
  staff_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(15),
  department VARCHAR(100),
  designation VARCHAR(100),
  date_of_joining DATE,
  FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE,
  INDEX idx_department (department)
);

CREATE TABLE Parent (
  parent_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(15),
  occupation VARCHAR(100),
  FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE
);

CREATE TABLE StudentParent (
  student_id INT NOT NULL,
  parent_id INT NOT NULL,
  relationship VARCHAR(50),
  PRIMARY KEY (student_id, parent_id),
  FOREIGN KEY (student_id) REFERENCES Student(student_id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES Parent(parent_id) ON DELETE CASCADE
);

-- ============================================
-- ACADEMIC TABLES
-- ============================================

CREATE TABLE Course (
  course_id INT PRIMARY KEY AUTO_INCREMENT,
  course_code VARCHAR(20) UNIQUE NOT NULL,
  course_name VARCHAR(200) NOT NULL,
  credits INT NOT NULL,
  semester INT,
  department VARCHAR(100),
  staff_id INT,
  description TEXT,
  FOREIGN KEY (staff_id) REFERENCES Staff(staff_id) ON DELETE SET NULL,
  INDEX idx_course_code (course_code),
  INDEX idx_department (department),
  INDEX idx_semester (semester)
);

CREATE TABLE CourseEnrollment (
  enrollment_id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  enrollment_date DATE NOT NULL,
  status ENUM('active', 'dropped', 'completed') DEFAULT 'active',
  FOREIGN KEY (student_id) REFERENCES Student(student_id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES Course(course_id) ON DELETE CASCADE,
  UNIQUE KEY unique_enrollment (student_id, course_id),
  INDEX idx_student (student_id),
  INDEX idx_course (course_id),
  INDEX idx_status (status)
);

CREATE TABLE Timetable (
  timetable_id INT PRIMARY KEY AUTO_INCREMENT,
  course_id INT NOT NULL,
  day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday') NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room_number VARCHAR(20),
  FOREIGN KEY (course_id) REFERENCES Course(course_id) ON DELETE CASCADE,
  INDEX idx_course (course_id),
  INDEX idx_day (day_of_week)
);

CREATE TABLE Attendance (
  attendance_id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  attendance_date DATE NOT NULL,
  status ENUM('present', 'absent', 'late') NOT NULL,
  marked_by INT,
  marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES Student(student_id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES Course(course_id) ON DELETE CASCADE,
  FOREIGN KEY (marked_by) REFERENCES Staff(staff_id) ON DELETE SET NULL,
  UNIQUE KEY unique_attendance (student_id, course_id, attendance_date),
  INDEX idx_student (student_id),
  INDEX idx_course (course_id),
  INDEX idx_date (attendance_date)
);

CREATE TABLE Exam (
  exam_id INT PRIMARY KEY AUTO_INCREMENT,
  course_id INT NOT NULL,
  exam_name VARCHAR(100) NOT NULL,
  exam_date DATE NOT NULL,
  max_marks INT NOT NULL,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES Course(course_id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES Staff(staff_id) ON DELETE SET NULL,
  INDEX idx_course (course_id),
  INDEX idx_date (exam_date)
);

CREATE TABLE Result (
  result_id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  exam_id INT NOT NULL,
  marks_obtained INT NOT NULL,
  grade VARCHAR(5),
  submitted_by INT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES Student(student_id) ON DELETE CASCADE,
  FOREIGN KEY (exam_id) REFERENCES Exam(exam_id) ON DELETE CASCADE,
  FOREIGN KEY (submitted_by) REFERENCES Staff(staff_id) ON DELETE SET NULL,
  UNIQUE KEY unique_result (student_id, exam_id),
  INDEX idx_student (student_id),
  INDEX idx_exam (exam_id)
);

-- ============================================
-- FEE MANAGEMENT TABLES
-- ============================================

CREATE TABLE FeeStructure (
  fee_structure_id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  semester INT NOT NULL,
  tuition_fee DECIMAL(10, 2) DEFAULT 0,
  hostel_fee DECIMAL(10, 2) DEFAULT 0,
  library_fee DECIMAL(10, 2) DEFAULT 0,
  lab_fee DECIMAL(10, 2) DEFAULT 0,
  other_fee DECIMAL(10, 2) DEFAULT 0,
  total_fee DECIMAL(10, 2) GENERATED ALWAYS AS (tuition_fee + hostel_fee + library_fee + lab_fee + other_fee) STORED,
  due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES Student(student_id) ON DELETE CASCADE,
  UNIQUE KEY unique_fee_structure (student_id, semester),
  INDEX idx_student (student_id),
  INDEX idx_semester (semester)
);

CREATE TABLE FeePayment (
  payment_id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method VARCHAR(50),
  semester INT,
  status ENUM('paid', 'pending', 'failed') DEFAULT 'paid',
  receipt_number VARCHAR(50) UNIQUE,
  transaction_id VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES Student(student_id) ON DELETE CASCADE,
  INDEX idx_student (student_id),
  INDEX idx_date (payment_date),
  INDEX idx_status (status)
);

CREATE TABLE FeeDefaulter (
  defaulter_id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  semester INT NOT NULL,
  total_due DECIMAL(10, 2) NOT NULL,
  due_date DATE,
  days_overdue INT,
  status ENUM('pending', 'notified', 'resolved') DEFAULT 'pending',
  last_notified DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES Student(student_id) ON DELETE CASCADE,
  INDEX idx_student (student_id),
  INDEX idx_status (status)
);

-- ============================================
-- HOSTEL MANAGEMENT TABLES
-- ============================================

CREATE TABLE Hostel (
  hostel_id INT PRIMARY KEY AUTO_INCREMENT,
  hostel_name VARCHAR(100) NOT NULL,
  hostel_type ENUM('boys', 'girls', 'mixed') NOT NULL,
  total_rooms INT NOT NULL,
  available_rooms INT NOT NULL,
  warden_name VARCHAR(100),
  warden_phone VARCHAR(15),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE HostelAllocation (
  allocation_id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  hostel_id INT NOT NULL,
  room_number VARCHAR(20) NOT NULL,
  allocation_date DATE NOT NULL,
  checkout_date DATE,
  status ENUM('active', 'vacated') DEFAULT 'active',
  FOREIGN KEY (student_id) REFERENCES Student(student_id) ON DELETE CASCADE,
  FOREIGN KEY (hostel_id) REFERENCES Hostel(hostel_id) ON DELETE CASCADE,
  INDEX idx_student (student_id),
  INDEX idx_hostel (hostel_id),
  INDEX idx_status (status)
);

-- ============================================
-- NOTIFICATION & MESSAGING TABLES
-- ============================================

CREATE TABLE Notification (
  notification_id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  target_role ENUM('all', 'student', 'staff', 'parent', 'admin'),
  target_user_id INT,
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  is_read BOOLEAN DEFAULT FALSE,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  FOREIGN KEY (target_user_id) REFERENCES User(user_id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES User(user_id) ON DELETE SET NULL,
  INDEX idx_target_role (target_role),
  INDEX idx_target_user (target_user_id),
  INDEX idx_created_at (created_at),
  INDEX idx_is_read (is_read)
);

CREATE TABLE Message (
  message_id INT PRIMARY KEY AUTO_INCREMENT,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  subject VARCHAR(200),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  parent_message_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES User(user_id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES User(user_id) ON DELETE CASCADE,
  FOREIGN KEY (parent_message_id) REFERENCES Message(message_id) ON DELETE CASCADE,
  INDEX idx_sender (sender_id),
  INDEX idx_receiver (receiver_id),
  INDEX idx_is_read (is_read)
);

-- ============================================
-- AUDIT & SECURITY TABLES
-- ============================================

CREATE TABLE AuditLog (
  log_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(50),
  record_id INT,
  old_value TEXT,
  new_value TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
);

-- ============================================
-- VIEWS FOR REPORTING
-- ============================================

CREATE OR REPLACE VIEW vw_student_attendance_summary AS
SELECT 
  s.student_id,
  CONCAT(s.first_name, ' ', s.last_name) as student_name,
  s.department,
  s.semester,
  c.course_id,
  c.course_code,
  c.course_name,
  COUNT(*) as total_classes,
  SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_count,
  SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent_count,
  SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as late_count,
  ROUND((SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as attendance_percentage
FROM Student s
JOIN Attendance a ON s.student_id = a.student_id
JOIN Course c ON a.course_id = c.course_id
GROUP BY s.student_id, c.course_id;

CREATE OR REPLACE VIEW vw_student_performance AS
SELECT 
  s.student_id,
  CONCAT(s.first_name, ' ', s.last_name) as student_name,
  s.department,
  s.semester,
  COUNT(DISTINCT r.exam_id) as total_exams,
  AVG(r.marks_obtained) as average_marks,
  AVG(CASE 
    WHEN r.grade = 'A+' THEN 10
    WHEN r.grade = 'A' THEN 9
    WHEN r.grade = 'B+' THEN 8
    WHEN r.grade = 'B' THEN 7
    WHEN r.grade = 'C' THEN 6
    WHEN r.grade = 'D' THEN 5
    ELSE 0
  END) as cgpa
FROM Student s
LEFT JOIN Result r ON s.student_id = r.student_id
GROUP BY s.student_id;

CREATE OR REPLACE VIEW vw_fee_collection_summary AS
SELECT 
  s.semester,
  s.department,
  COUNT(DISTINCT s.student_id) as total_students,
  SUM(fs.total_fee) as total_fee_amount,
  SUM(COALESCE(fp.paid_amount, 0)) as total_collected,
  SUM(fs.total_fee) - SUM(COALESCE(fp.paid_amount, 0)) as total_pending
FROM Student s
LEFT JOIN FeeStructure fs ON s.student_id = fs.student_id
LEFT JOIN (
  SELECT student_id, semester, SUM(amount) as paid_amount
  FROM FeePayment
  WHERE status = 'paid'
  GROUP BY student_id, semester
) fp ON s.student_id = fp.student_id AND fs.semester = fp.semester
GROUP BY s.semester, s.department;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_attendance_composite ON Attendance(student_id, course_id, attendance_date);
CREATE INDEX idx_result_composite ON Result(student_id, exam_id);
CREATE INDEX idx_fee_payment_composite ON FeePayment(student_id, semester, status);
CREATE INDEX idx_notification_composite ON Notification(target_role, is_read, created_at);

-- ============================================
-- END OF SCHEMA
-- ============================================
