-- Extended Schema for Student Dashboard Features
USE college_management;

-- Course Enrollment Table
CREATE TABLE IF NOT EXISTS CourseEnrollment (
  enrollment_id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  enrollment_date DATE NOT NULL,
  status ENUM('active', 'completed', 'dropped') DEFAULT 'active',
  FOREIGN KEY (student_id) REFERENCES Student(student_id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES Course(course_id) ON DELETE CASCADE,
  UNIQUE KEY unique_enrollment (student_id, course_id)
);

-- Timetable Table
CREATE TABLE IF NOT EXISTS Timetable (
  timetable_id INT PRIMARY KEY AUTO_INCREMENT,
  course_id INT NOT NULL,
  day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday') NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room_number VARCHAR(20),
  FOREIGN KEY (course_id) REFERENCES Course(course_id) ON DELETE CASCADE
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS Notification (
  notification_id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  target_role ENUM('all', 'student', 'staff', 'parent', 'admin') DEFAULT 'all',
  target_user_id INT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (target_user_id) REFERENCES User(user_id) ON DELETE CASCADE
);

-- Fee Structure Table
CREATE TABLE IF NOT EXISTS FeeStructure (
  fee_structure_id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  semester INT NOT NULL,
  tuition_fee DECIMAL(10, 2) NOT NULL,
  hostel_fee DECIMAL(10, 2) DEFAULT 0,
  library_fee DECIMAL(10, 2) DEFAULT 0,
  lab_fee DECIMAL(10, 2) DEFAULT 0,
  other_fee DECIMAL(10, 2) DEFAULT 0,
  total_fee DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (student_id) REFERENCES Student(student_id) ON DELETE CASCADE,
  UNIQUE KEY unique_fee_structure (student_id, semester)
);

-- Update FeePayment table to include receipt number
ALTER TABLE FeePayment 
ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS description TEXT;

-- Sample Data for Testing

-- Course Enrollments
INSERT IGNORE INTO CourseEnrollment (student_id, course_id, enrollment_date, status) VALUES
(1, 1, '2023-08-01', 'active'),
(1, 2, '2023-08-01', 'active'),
(1, 3, '2023-08-01', 'active');

-- Sample Courses (if not exists)
INSERT IGNORE INTO Course (course_code, course_name, department, credits, semester, staff_id) VALUES
('CS101', 'Introduction to Programming', 'Computer Science', 4, 1, 1),
('CS201', 'Data Structures', 'Computer Science', 4, 3, 1),
('CS301', 'Database Management Systems', 'Computer Science', 3, 3, 1),
('MATH201', 'Discrete Mathematics', 'Mathematics', 3, 3, NULL);

-- Timetable
INSERT IGNORE INTO Timetable (course_id, day_of_week, start_time, end_time, room_number) VALUES
(1, 'Monday', '09:00:00', '10:30:00', 'Room 101'),
(1, 'Wednesday', '09:00:00', '10:30:00', 'Room 101'),
(2, 'Tuesday', '11:00:00', '12:30:00', 'Room 202'),
(2, 'Thursday', '11:00:00', '12:30:00', 'Room 202'),
(3, 'Monday', '14:00:00', '15:30:00', 'Lab 1'),
(3, 'Friday', '14:00:00', '15:30:00', 'Lab 1'),
(4, 'Wednesday', '11:00:00', '12:30:00', 'Room 305');

-- Notifications
INSERT INTO Notification (title, message, target_role, created_at) VALUES
('Welcome to College Management System', 'Welcome to the new academic year! Please check your course schedule and fee details.', 'student', NOW()),
('Mid-term Exams Announcement', 'Mid-term examinations will be conducted from 15th to 20th of next month. Please prepare accordingly.', 'student', DATE_SUB(NOW(), INTERVAL 2 DAY)),
('Library Hours Extended', 'Library hours have been extended till 10 PM on weekdays.', 'all', DATE_SUB(NOW(), INTERVAL 5 DAY)),
('Fee Payment Reminder', 'Please clear your pending dues before the end of this month to avoid late fees.', 'student', DATE_SUB(NOW(), INTERVAL 1 DAY));

-- Fee Structure
INSERT IGNORE INTO FeeStructure (student_id, semester, tuition_fee, hostel_fee, library_fee, lab_fee, other_fee, total_fee) VALUES
(1, 3, 50000.00, 15000.00, 2000.00, 3000.00, 1000.00, 71000.00);

-- Fee Payments
INSERT IGNORE INTO FeePayment (student_id, amount, payment_date, payment_method, semester, status, receipt_number, transaction_id, description) VALUES
(1, 50000.00, '2024-01-15', 'Online', 3, 'paid', 'RCP2024011501', 'TXN123456789', 'Tuition Fee - Semester 3'),
(1, 15000.00, '2024-01-20', 'Online', 3, 'paid', 'RCP2024012001', 'TXN123456790', 'Hostel Fee - Semester 3');

-- Hostel Data
INSERT IGNORE INTO Hostel (hostel_name, total_rooms, available_rooms) VALUES
('Boys Hostel A', 100, 25),
('Boys Hostel B', 80, 15),
('Girls Hostel A', 90, 20);

-- Hostel Allocation
INSERT IGNORE INTO HostelAllocation (student_id, hostel_id, room_number, allocation_date) VALUES
(1, 1, 'A-205', '2023-08-01');
