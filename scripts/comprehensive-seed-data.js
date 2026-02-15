const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function seedDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'college_management'
  });

  try {
    console.log('🌱 Starting comprehensive database seeding...\n');

    // Hash passwords
    const adminPass = await bcrypt.hash('admin123', 10);
    const studentPass = await bcrypt.hash('student123', 10);
    const staffPass = await bcrypt.hash('staff123', 10);
    const parentPass = await bcrypt.hash('parent123', 10);

    // 1. Create Users
    console.log('Creating users...');
    await connection.query(`
      INSERT INTO User (username, password, role, is_active) VALUES
      ('admin', ?, 'admin', TRUE),
      ('student1', ?, 'student', TRUE),
      ('student2', ?, 'student', TRUE),
      ('student3', ?, 'student', TRUE),
      ('student4', ?, 'student', TRUE),
      ('student5', ?, 'student', TRUE),
      ('staff1', ?, 'staff', TRUE),
      ('staff2', ?, 'staff', TRUE),
      ('staff3', ?, 'staff', TRUE),
      ('parent1', ?, 'parent', TRUE),
      ('parent2', ?, 'parent', TRUE)
    `, [adminPass, studentPass, studentPass, studentPass, studentPass, studentPass, 
        staffPass, staffPass, staffPass, parentPass, parentPass]);

    // 2. Create Students
    console.log('Creating students...');
    await connection.query(`
      INSERT INTO Student (user_id, first_name, last_name, email, phone, date_of_birth, department, semester, enrollment_date) VALUES
      (2, 'John', 'Doe', 'john.doe@college.edu', '9876543210', '2002-05-15', 'Computer Science', 3, '2023-08-01'),
      (3, 'Jane', 'Smith', 'jane.smith@college.edu', '9876543211', '2002-08-20', 'Electronics', 5, '2022-08-01'),
      (4, 'Bob', 'Johnson', 'bob.johnson@college.edu', '9876543212', '2003-03-10', 'Mechanical', 2, '2024-01-15'),
      (5, 'Alice', 'Williams', 'alice.williams@college.edu', '9876543213', '2002-11-25', 'Computer Science', 4, '2023-01-10'),
      (6, 'Charlie', 'Brown', 'charlie.brown@college.edu', '9876543214', '2003-07-30', 'Civil', 1, '2024-08-01')
    `);

    // 3. Create Staff
    console.log('Creating staff...');
    await connection.query(`
      INSERT INTO Staff (user_id, first_name, last_name, email, phone, department, designation, date_of_joining) VALUES
      (7, 'Dr. Sarah', 'Johnson', 'sarah.johnson@college.edu', '9876543220', 'Computer Science', 'Professor', '2015-07-01'),
      (8, 'Dr. Michael', 'Chen', 'michael.chen@college.edu', '9876543221', 'Electronics', 'Associate Professor', '2017-08-15'),
      (9, 'Dr. Emily', 'Davis', 'emily.davis@college.edu', '9876543222', 'Mechanical', 'Assistant Professor', '2019-01-10')
    `);

    // 4. Create Parents
    console.log('Creating parents...');
    await connection.query(`
      INSERT INTO Parent (user_id, first_name, last_name, email, phone, occupation) VALUES
      (10, 'Robert', 'Doe', 'robert.doe@email.com', '9876543230', 'Engineer'),
      (11, 'Mary', 'Smith', 'mary.smith@email.com', '9876543231', 'Doctor')
    `);

    // 5. Link Students to Parents
    console.log('Linking students to parents...');
    await connection.query(`
      INSERT INTO StudentParent (student_id, parent_id, relationship) VALUES
      (1, 1, 'Father'),
      (2, 2, 'Mother')
    `);

    // 6. Create Courses
    console.log('Creating courses...');
    await connection.query(`
      INSERT INTO Course (course_code, course_name, credits, semester, department, staff_id, description) VALUES
      ('CS101', 'Introduction to Programming', 4, 1, 'Computer Science', 1, 'Basic programming concepts using Python'),
      ('CS201', 'Data Structures', 4, 3, 'Computer Science', 1, 'Arrays, linked lists, trees, graphs'),
      ('CS301', 'Database Management Systems', 3, 5, 'Computer Science', 1, 'SQL, normalization, transactions'),
      ('CS401', 'Operating Systems', 4, 7, 'Computer Science', 1, 'Process management, memory, file systems'),
      ('EC201', 'Digital Electronics', 3, 3, 'Electronics', 2, 'Logic gates, flip-flops, counters'),
      ('EC301', 'Microprocessors', 4, 5, 'Electronics', 2, '8086, ARM architecture'),
      ('ME201', 'Thermodynamics', 3, 3, 'Mechanical', 3, 'Heat, work, energy'),
      ('ME301', 'Fluid Mechanics', 4, 5, 'Mechanical', 3, 'Fluid properties, flow'),
      ('MATH201', 'Discrete Mathematics', 3, 3, 'Computer Science', 1, 'Sets, logic, graphs'),
      ('PHY101', 'Physics I', 3, 1, 'General', 2, 'Mechanics and waves')
    `);

    // 7. Enroll Students in Courses
    console.log('Enrolling students in courses...');
    await connection.query(`
      INSERT INTO CourseEnrollment (student_id, course_id, enrollment_date, status) VALUES
      (1, 1, '2023-08-01', 'completed'),
      (1, 2, '2024-01-15', 'active'),
      (1, 3, '2024-01-15', 'active'),
      (1, 9, '2024-01-15', 'active'),
      (2, 3, '2023-08-01', 'active'),
      (2, 5, '2023-08-01', 'active'),
      (2, 6, '2023-08-01', 'active'),
      (3, 7, '2024-01-15', 'active'),
      (3, 8, '2024-01-15', 'active'),
      (4, 1, '2023-08-01', 'active'),
      (4, 2, '2024-01-15', 'active'),
      (4, 9, '2024-01-15', 'active'),
      (5, 10, '2024-08-01', 'active')
    `);

    // 8. Create Timetable
    console.log('Creating timetable...');
    await connection.query(`
      INSERT INTO Timetable (course_id, day_of_week, start_time, end_time, room_number) VALUES
      (1, 'Monday', '09:00:00', '10:30:00', 'Room 101'),
      (1, 'Wednesday', '09:00:00', '10:30:00', 'Room 101'),
      (2, 'Tuesday', '11:00:00', '12:30:00', 'Room 202'),
      (2, 'Thursday', '11:00:00', '12:30:00', 'Room 202'),
      (3, 'Monday', '14:00:00', '15:30:00', 'Lab 1'),
      (3, 'Friday', '14:00:00', '15:30:00', 'Lab 1'),
      (4, 'Wednesday', '11:00:00', '12:30:00', 'Room 305'),
      (5, 'Tuesday', '09:00:00', '10:30:00', 'Room 201'),
      (6, 'Thursday', '14:00:00', '15:30:00', 'Lab 2'),
      (7, 'Monday', '11:00:00', '12:30:00', 'Room 301'),
      (8, 'Friday', '09:00:00', '10:30:00', 'Room 302'),
      (9, 'Wednesday', '14:00:00', '15:30:00', 'Room 203'),
      (10, 'Tuesday', '14:00:00', '15:30:00', 'Room 102')
    `);

    // 9. Create Attendance Records
    console.log('Creating attendance records...');
    const dates = ['2024-02-01', '2024-02-05', '2024-02-08', '2024-02-12', '2024-02-15'];
    for (const date of dates) {
      await connection.query(`
        INSERT INTO Attendance (student_id, course_id, attendance_date, status, marked_by) VALUES
        (1, 2, ?, 'present', 1),
        (1, 3, ?, 'present', 1),
        (1, 9, ?, 'late', 1),
        (2, 3, ?, 'present', 1),
        (2, 5, ?, 'absent', 2),
        (2, 6, ?, 'present', 2),
        (3, 7, ?, 'present', 3),
        (3, 8, ?, 'present', 3),
        (4, 2, ?, 'present', 1),
        (4, 9, ?, 'present', 1)
      `, [date, date, date, date, date, date, date, date, date, date]);
    }

    // 10. Create Exams
    console.log('Creating exams...');
    await connection.query(`
      INSERT INTO Exam (course_id, exam_name, exam_date, max_marks, created_by) VALUES
      (1, 'Mid-Term Exam', '2024-02-10', 100, 1),
      (1, 'Final Exam', '2024-04-20', 100, 1),
      (2, 'Mid-Term Exam', '2024-02-15', 100, 1),
      (2, 'Quiz 1', '2024-01-25', 50, 1),
      (3, 'Mid-Term Exam', '2024-02-12', 100, 1),
      (3, 'Lab Test', '2024-01-30', 50, 1),
      (5, 'Mid-Term Exam', '2024-02-14', 100, 2),
      (7, 'Mid-Term Exam', '2024-02-16', 100, 3),
      (9, 'Quiz 1', '2024-02-05', 50, 1),
      (10, 'Mid-Term Exam', '2024-02-08', 100, 2)
    `);

    // 11. Create Results
    console.log('Creating results...');
    await connection.query(`
      INSERT INTO Result (student_id, exam_id, marks_obtained, grade, submitted_by) VALUES
      (1, 3, 85, 'A', 1),
      (1, 4, 42, 'B+', 1),
      (1, 9, 45, 'A+', 1),
      (2, 5, 78, 'B+', 1),
      (2, 6, 38, 'B', 1),
      (2, 7, 88, 'A', 2),
      (3, 8, 72, 'B', 3),
      (4, 3, 92, 'A+', 1),
      (4, 4, 48, 'A+', 1),
      (4, 9, 40, 'A', 1)
    `);

    // 12. Create Hostels
    console.log('Creating hostels...');
    await connection.query(`
      INSERT INTO Hostel (hostel_name, hostel_type, total_rooms, available_rooms, warden_name, warden_phone, address) VALUES
      ('Boys Hostel A', 'boys', 100, 25, 'Mr. Kumar', '9876543240', 'North Campus'),
      ('Boys Hostel B', 'boys', 80, 15, 'Mr. Singh', '9876543241', 'South Campus'),
      ('Girls Hostel A', 'girls', 100, 30, 'Mrs. Sharma', '9876543242', 'East Campus'),
      ('Girls Hostel B', 'girls', 80, 20, 'Mrs. Patel', '9876543243', 'West Campus')
    `);

    // 13. Allocate Hostel Rooms
    console.log('Allocating hostel rooms...');
    await connection.query(`
      INSERT INTO HostelAllocation (student_id, hostel_id, room_number, allocation_date, status) VALUES
      (1, 1, 'A-205', '2023-08-01', 'active'),
      (3, 1, 'A-310', '2024-01-15', 'active'),
      (4, 2, 'B-102', '2023-08-01', 'active'),
      (2, 3, 'A-215', '2022-08-01', 'active'),
      (5, 4, 'B-305', '2024-08-01', 'active')
    `);

    // 14. Create Fee Structures
    console.log('Creating fee structures...');
    await connection.query(`
      INSERT INTO FeeStructure (student_id, semester, tuition_fee, hostel_fee, library_fee, lab_fee, other_fee, due_date) VALUES
      (1, 3, 50000, 15000, 2000, 3000, 1000, '2024-02-28'),
      (2, 5, 50000, 15000, 2000, 3000, 1000, '2024-02-28'),
      (3, 2, 50000, 15000, 2000, 3000, 1000, '2024-02-28'),
      (4, 4, 50000, 0, 2000, 3000, 1000, '2024-02-28'),
      (5, 1, 50000, 15000, 2000, 3000, 1000, '2024-08-31')
    `);

    // 15. Create Fee Payments
    console.log('Creating fee payments...');
    await connection.query(`
      INSERT INTO FeePayment (student_id, amount, payment_date, payment_method, semester, status, receipt_number, transaction_id, description) VALUES
      (1, 50000, '2024-01-15', 'Online', 3, 'paid', 'RCP2024011501', 'TXN123456789', 'Tuition Fee - Semester 3'),
      (1, 15000, '2024-01-20', 'Online', 3, 'paid', 'RCP2024012001', 'TXN123456790', 'Hostel Fee - Semester 3'),
      (2, 71000, '2024-01-10', 'Online', 5, 'paid', 'RCP2024011001', 'TXN123456791', 'Full Fee - Semester 5'),
      (3, 40000, '2024-01-25', 'Card', 2, 'paid', 'RCP2024012501', 'TXN123456792', 'Partial Payment'),
      (4, 56000, '2024-01-18', 'UPI', 4, 'paid', 'RCP2024011801', 'TXN123456793', 'Full Fee - Semester 4')
    `);

    // 16. Create Fee Defaulters
    console.log('Creating fee defaulters...');
    await connection.query(`
      INSERT INTO FeeDefaulter (student_id, semester, total_due, due_date, days_overdue, status) VALUES
      (1, 3, 6000, '2024-02-28', 0, 'pending'),
      (3, 2, 31000, '2024-02-28', 0, 'pending')
    `);

    // 17. Create Notifications
    console.log('Creating notifications...');
    await connection.query(`
      INSERT INTO Notification (title, message, target_role, priority, created_by) VALUES
      ('Welcome to College Management System', 'Welcome to the new academic year! Please check your course schedule and fee details.', 'all', 'high', 1),
      ('Mid-term Exams Announcement', 'Mid-term examinations will be conducted from 15th to 20th of next month. Please prepare accordingly.', 'student', 'high', 1),
      ('Library Hours Extended', 'Library hours have been extended till 10 PM on weekdays.', 'all', 'medium', 1),
      ('Fee Payment Reminder', 'Please clear your pending dues before the end of this month to avoid late fees.', 'student', 'high', 1),
      ('Staff Meeting', 'All staff members are requested to attend the meeting on Friday at 3 PM.', 'staff', 'medium', 1),
      ('Parent-Teacher Meeting', 'Parent-teacher meeting scheduled for next Saturday. Please confirm your attendance.', 'parent', 'high', 1)
    `);

    // 18. Create Audit Logs
    console.log('Creating audit logs...');
    await connection.query(`
      INSERT INTO AuditLog (user_id, action, table_name, record_id, ip_address) VALUES
      (1, 'LOGIN', 'User', 1, '192.168.1.1'),
      (2, 'LOGIN', 'User', 2, '192.168.1.2'),
      (7, 'CREATE_EXAM', 'Exam', 1, '192.168.1.3'),
      (7, 'MARK_ATTENDANCE', 'Attendance', 1, '192.168.1.3'),
      (1, 'CREATE_NOTIFICATION', 'Notification', 1, '192.168.1.1')
    `);

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log('- Users: 11 (1 admin, 5 students, 3 staff, 2 parents)');
    console.log('- Courses: 10');
    console.log('- Enrollments: 13');
    console.log('- Attendance Records: 50');
    console.log('- Exams: 10');
    console.log('- Results: 10');
    console.log('- Hostels: 4');
    console.log('- Fee Structures: 5');
    console.log('- Notifications: 6');
    console.log('\n🔑 Test Credentials:');
    console.log('Admin: admin / admin123');
    console.log('Student: student1 / student123');
    console.log('Staff: staff1 / staff123');
    console.log('Parent: parent1 / parent123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = seedDatabase;
