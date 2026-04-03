-- =====================================================
-- PRODUCTION-READY DATABASE SCHEMA
-- College Management System v2.0
-- =====================================================

CREATE DATABASE IF NOT EXISTS college_management;
USE college_management;

-- =====================================================
-- CORE TABLES
-- =====================================================

-- User Table with enhanced security
CREATE TABLE IF NOT EXISTS User (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('student', 'staff', 'admin', 'parent') NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  failed_login_attempts INT DEFAULT 0,
  locked_until DATETIME NULL,
  last_login DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_username (username),
  INDEX idx_role (role),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student Table
CREATE TABLE IF NOT EXISTS Student (
  student_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE NOT NULL,
  roll_number VARCHAR(20) UNIQUE NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(15),
  date_of_birth DATE,
  gender ENUM('Male', 'Female', 'Other'),
  blood_group VARCHAR(5),
  address TEXT,
  city VARCHAR(50),
  state VARCHAR(50),
  pincode VARCHAR(10),
  enrollment_date DATE NOT NULL,
  department VARCHAR(50),
  semester INT,
  profile_image VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE,
  INDEX idx_department (department),
  INDEX idx_semester (semester),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Staff Table
CREATE TABLE IF NOT EXISTS Staff (
  staff_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE NOT NULL,
  employee_id VARCHAR(20) UNIQUE NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(15),
  date_of_birth DATE,
  gender ENUM('Male', 'Female', 'Other'),
  department VARCHAR(50),
  designation VARCHAR(50),
  qualification VARCHAR(100),
  joining_date DATE NOT NULL,
  profile_image VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE,
  INDEX idx_department (department),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Parent Table
CREATE TABLE IF NOT EXISTS Parent (
  parent_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(15),
  occupation VARCHAR(100),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- StudentParent Relationship
CREATE TABLE IF NOT EXISTS StudentParent (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  parent_id INT NOT NULL,
  relationship VARCHAR(20) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES Student(student_id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES Parent(parent_id) ON DELETE CASCADE,
  UNIQUE KEY unique_student_parent (student_id, parent_id),
  INDEX idx_student (student_id),
  INDEX idx_parent (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admin Table
CREATE TABLE IF NOT EXISTS Admin (
  admin_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(15),
  role_level ENUM('super_admin', 'admin', 'moderator') DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Course Table
CREATE TABLE IF NOT EXISTS Course (
  course_id INT PRIMARY KEY AUTO_INCREMENT,
  course_code VARCHAR(20) UNIQUE NOT NULL,
  course_name VARCHAR(100) NOT NULL,
  department VARCHAR(50),
  credits INT NOT NULL,
  semester INT,
  description TEXT,
  staff_id INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  FOREIGN KEY (staff_id) REFERENCES Staff(staff_id) ON DELETE SET NULL,
  INDEX idx_course_code (course_code),
  INDEX idx_department (department),
  INDEX idx_semester (semester),
  INDEX idx_staff (staff_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CourseEnrollment Table
CREATE TABLE IF NOT EXISTS CourseEnrollment (
  enrollment_id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  enrollment_date DATE NOT NULL,
  status ENUM('active', 'completed', 'dropped', 'failed') DEFAULT 'active',
  grade VARCHAR(2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES Student(student_id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES Course(course_id) ON DELETE CASCADE,
  UNIQUE KEY unique_enrollment (student_id, course_id),
  INDEX idx_student (student_id),
  INDEX idx_course (course_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Timetable Table
CREATE TABLE IF NOT EXISTS Timetable (
  timetable_id INT PRIMARY KEY AUTO_INCREMENT,
  course_id INT NOT NULL,
  day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday') NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room_number VARCHAR(20),
  semester INT,
  academic_year VARCHAR(10),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES Course(course_id) ON DELETE CASCADE,
  INDEX idx_course (course_id),
  INDEX idx_day (day_of_week),
  INDEX idx_semester (semester)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Attendance Table
CREATE TABLE IF NOT EXISTS Attendance (
  attendance_id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  attendance_date DATE NOT NULL,
  status ENUM('present', 'absent', 'late', 'excused') NOT NULL,
  remarks TEXT,
  marked_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES Student(student_id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES Course(course_id) ON DELETE CASCADE,
  FOREIGN KEY (marked_by) REFERENCES Staff(staff_id) ON DELETE SET NULL,
  UNIQUE KEY unique_attendance (student_id, course_id, attendance_date),
  INDEX idx_student (student_id),
  INDEX idx_course (course_id),
  INDEX idx_date (attendance_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exam Table
CREATE TABLE IF NOT EXISTS Exam (
  exam_id INT PRIMARY KEY AUTO_INCREMENT,
  course_id INT NOT NULL,
  exam_name VARCHAR(100) NOT NULL,
  exam_type ENUM('mid_term', 'final', 'quiz', 'assignment', 'practical') NOT NULL,
  exam_date DATE NOT NULL,
  max_marks INT NOT NULL,
  duration_minutes INT,
  description TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  FOREIGN KEY (course_id) REFERENCES Course(course_id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES Staff(staff_id) ON DELETE SET NULL,
  INDEX idx_course (course_id),
  INDEX idx_date (exam_date),
  INDEX idx_type (exam_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Result Table
CREATE TABLE IF NOT EXISTS Result (
  result_id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  exam_id INT NOT NULL,
  marks_obtained DECIMAL(5,2) NOT NULL,
  grade VARCHAR(2),
  remarks TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES Student(student_id) ON DELETE CASCADE,
  FOREIGN KEY (exam_id) REFERENCES Exam(exam_id) ON DELETE CASCADE,
  UNIQUE KEY unique_result (student_id, exam_id),
  INDEX idx_student (student_id),
  INDEX idx_exam (exam_id),
  INDEX idx_published (is_published)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FeeStructure Table
CREATE TABLE IF NOT EXISTS FeeStructure (
  fee_structure_id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  semester INT NOT NULL,
  academic_year VARCHAR(10) NOT NULL,
  tuition_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  hostel_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  library_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  lab_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  sports_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  other_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_fee DECIMAL(10, 2) GENERATED ALWAYS AS (tuition_fee + hostel_fee + library_fee + lab_fee + sports_fee + other_fee) STORED,
  due_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES Student(student_id) ON DELETE CASCADE,
  INDEX idx_student (student_id),
  INDEX idx_semester (semester),
  INDEX idx_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FeePayment Table
CREATE TABLE IF NOT EXISTS FeePayment (
  payment_id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method ENUM('cash', 'card', 'online', 'upi', 'cheque') NOT NULL,
  transaction_id VARCHAR(100) UNIQUE,
  receipt_number VARCHAR(50) UNIQUE NOT NULL,
  semester INT,
  academic_year VARCHAR(10),
  status ENUM('paid', 'pending', 'failed', 'refunded') NOT NULL DEFAULT 'paid',
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES Student(student_id) ON DELETE CASCADE,
  INDEX idx_student (student_id),
  INDEX idx_date (payment_date),
  INDEX idx_status (status),
  INDEX idx_receipt (receipt_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FeeDefaulter Table
CREATE TABLE IF NOT EXISTS FeeDefaulter (
  defaulter_id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  semester INT NOT NULL,
  academic_year VARCHAR(10) NOT NULL,
  total_due DECIMAL(10, 2) NOT NULL,
  overdue_days INT NOT NULL,
  last_reminder_sent DATETIME,
  status ENUM('pending', 'notified', 'cleared') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES Student(student_id) ON DELETE CASCADE,
  INDEX idx_student (student_id),
  INDEX idx_status (status),
  INDEX idx_semester (semester)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Hostel Table
CREATE TABLE IF NOT EXISTS Hostel (
  hostel_id INT PRIMARY KEY AUTO_INCREMENT,
  hostel_name VARCHAR(100) NOT NULL,
  hostel_type ENUM('boys', 'girls', 'mixed') NOT NULL,
  total_rooms INT NOT NULL,
  available_rooms INT NOT NULL,
  warden_name VARCHAR(100),
  warden_phone VARCHAR(15),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_type (hostel_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- HostelAllocation Table
CREATE TABLE IF NOT EXISTS HostelAllocation (
  allocation_id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT UNIQUE NOT NULL,
  hostel_id INT NOT NULL,
  room_number VARCHAR(10) NOT NULL,
  bed_number VARCHAR(5),
  allocation_date DATE NOT NULL,
  checkout_date DATE,
  status ENUM('active', 'vacated', 'transferred') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES Student(student_id) ON DELETE CASCADE,
  FOREIGN KEY (hostel_id) REFERENCES Hostel(hostel_id) ON DELETE CASCADE,
  INDEX idx_student (student_id),
  INDEX idx_hostel (hostel_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notification Table
CREATE TABLE IF NOT EXISTS Notification (
  notification_id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  notification_type ENUM('general', 'academic', 'fee', 'exam', 'attendance', 'urgent') DEFAULT 'general',
  target_role ENUM('all', 'student', 'staff', 'parent', 'admin') DEFAULT 'all',
  target_user_id INT NULL,
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  is_read BOOLEAN DEFAULT FALSE,
  read_at DATETIME NULL,
  created_by INT,
  expires_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES User(user_id) ON DELETE SET NULL,
  INDEX idx_target_role (target_role),
  INDEX idx_target_user (target_user_id),
  INDEX idx_created_at (created_at),
  INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Query/Ticket System
CREATE TABLE IF NOT EXISTS SupportTicket (
  ticket_id INT PRIMARY KEY AUTO_INCREMENT,
  ticket_number VARCHAR(20) UNIQUE NOT NULL,
  student_id INT NOT NULL,
  subject VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category ENUM('academic', 'fee', 'hostel', 'technical', 'other') NOT NULL,
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
  assigned_to INT,
  resolution TEXT,
  resolved_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES Student(student_id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES Staff(staff_id) ON DELETE SET NULL,
  INDEX idx_student (student_id),
  INDEX idx_status (status),
  INDEX idx_priority (priority),
  INDEX idx_ticket_number (ticket_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ticket Messages
CREATE TABLE IF NOT EXISTS TicketMessage (
  message_id INT PRIMARY KEY AUTO_INCREMENT,
  ticket_id INT NOT NULL,
  user_id INT NOT NULL,
  message TEXT NOT NULL,
  attachment VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES SupportTicket(ticket_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE,
  INDEX idx_ticket (ticket_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Announcement Table
CREATE TABLE IF NOT EXISTS Announcement (
  announcement_id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  announcement_type ENUM('general', 'academic', 'event', 'holiday', 'urgent') DEFAULT 'general',
  target_audience ENUM('all', 'students', 'staff', 'parents') DEFAULT 'all',
  department VARCHAR(50),
  semester INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT NOT NULL,
  publish_date DATETIME NOT NULL,
  expiry_date DATETIME,
  attachment VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES User(user_id) ON DELETE CASCADE,
  INDEX idx_type (announcement_type),
  INDEX idx_audience (target_audience),
  INDEX idx_active (is_active),
  INDEX idx_publish_date (publish_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Document Upload Table
CREATE TABLE IF NOT EXISTS Document (
  document_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  document_type ENUM('profile', 'certificate', 'assignment', 'report', 'other') NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  description TEXT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_type (document_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit Log Table
CREATE TABLE IF NOT EXISTS AuditLog (
  log_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(50) NOT NULL,
  record_id INT,
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_action (action),
  INDEX idx_table (table_name),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- System Settings Table
CREATE TABLE IF NOT EXISTS SystemSettings (
  setting_id INT PRIMARY KEY AUTO_INCREMENT,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  updated_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (updated_by) REFERENCES User(user_id) ON DELETE SET NULL,
  INDEX idx_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Alert Configuration Table
CREATE TABLE IF NOT EXISTS AlertConfiguration (
  alert_id INT PRIMARY KEY AUTO_INCREMENT,
  alert_type ENUM('low_attendance', 'fee_due', 'exam_reminder', 'result_published') NOT NULL,
  threshold_value DECIMAL(10, 2),
  is_active BOOLEAN DEFAULT TRUE,
  notification_method ENUM('email', 'sms', 'in_app', 'all') DEFAULT 'in_app',
  message_template TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_type (alert_type),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- INSERT DEFAULT DATA
-- =====================================================

-- Default System Settings
INSERT INTO SystemSettings (setting_key, setting_value, setting_type, description, is_public) VALUES
('college_name', 'ABC College of Engineering', 'string', 'College Name', TRUE),
('academic_year', '2024-2025', 'string', 'Current Academic Year', TRUE),
('attendance_threshold', '75', 'number', 'Minimum Attendance Percentage Required', TRUE),
('max_login_attempts', '5', 'number', 'Maximum Failed Login Attempts', FALSE),
('session_timeout', '24', 'number', 'Session Timeout in Hours', FALSE),
('enable_email_notifications', 'true', 'boolean', 'Enable Email Notifications', FALSE),
('enable_sms_notifications', 'false', 'boolean', 'Enable SMS Notifications', FALSE);

-- Default Alert Configurations
INSERT INTO AlertConfiguration (alert_type, threshold_value, is_active, notification_method, message_template) VALUES
('low_attendance', 75.00, TRUE, 'all', 'Your attendance is below {threshold}%. Current: {current}%'),
('fee_due', 0.00, TRUE, 'all', 'Fee payment due. Amount: ₹{amount}. Due date: {due_date}'),
('exam_reminder', 3.00, TRUE, 'in_app', 'Exam reminder: {exam_name} on {exam_date}'),
('result_published', 0.00, TRUE, 'all', 'Results published for {exam_name}');

-- =====================================================
-- END OF SCHEMA
-- =====================================================
