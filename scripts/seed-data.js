const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function seedData() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('Seeding sample data...');

    // Create sample student user
    const studentPassword = await bcrypt.hash('student123', 10);
    await connection.query(
      'INSERT INTO User (username, password, role) VALUES (?, ?, ?)',
      ['student1', studentPassword, 'student']
    );
    const [studentUser] = await connection.query('SELECT LAST_INSERT_ID() as id');
    const studentUserId = studentUser[0].id;

    await connection.query(
      `INSERT INTO Student (user_id, first_name, last_name, email, phone, date_of_birth, enrollment_date, department, semester) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [studentUserId, 'John', 'Doe', 'john.doe@college.edu', '9876543210', '2002-05-15', '2023-08-01', 'Computer Science', 3]
    );

    // Create sample faculty user
    const facultyPassword = await bcrypt.hash('faculty123', 10);
    await connection.query(
      'INSERT INTO User (username, password, role) VALUES (?, ?, ?)',
      ['faculty1', facultyPassword, 'faculty']
    );
    const [facultyUser] = await connection.query('SELECT LAST_INSERT_ID() as id');
    const facultyUserId = facultyUser[0].id;

    await connection.query(
      `INSERT INTO Faculty (user_id, first_name, last_name, email, phone, department, designation, joining_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [facultyUserId, 'Jane', 'Smith', 'jane.smith@college.edu', '9876543211', 'Computer Science', 'Professor', '2020-01-15']
    );

    const [faculty] = await connection.query('SELECT faculty_id FROM Faculty WHERE user_id = ?', [facultyUserId]);
    const facultyId = faculty[0].faculty_id;

    // Create sample courses
    await connection.query(
      `INSERT INTO Course (course_code, course_name, department, credits, semester, faculty_id) VALUES 
       ('CS101', 'Introduction to Programming', 'Computer Science', 4, 1, ?),
       ('CS201', 'Data Structures', 'Computer Science', 4, 3, ?),
       ('CS301', 'Database Systems', 'Computer Science', 3, 5, ?)`,
      [facultyId, facultyId, facultyId]
    );

    // Add sample attendance
    const [student] = await connection.query('SELECT student_id FROM Student WHERE user_id = ?', [studentUserId]);
    const studentId = student[0].student_id;
    const [courses] = await connection.query('SELECT course_id FROM Course LIMIT 2');

    for (const course of courses) {
      await connection.query(
        `INSERT INTO Attendance (student_id, course_id, attendance_date, status) VALUES 
         (?, ?, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'present'),
         (?, ?, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'present'),
         (?, ?, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'absent')`,
        [studentId, course.course_id, studentId, course.course_id, studentId, course.course_id]
      );
    }

    // Add hostel
    await connection.query(
      `INSERT INTO Hostel (hostel_name, total_rooms, available_rooms) VALUES 
       ('North Wing', 100, 85),
       ('South Wing', 120, 95)`
    );

    await connection.end();
    
    console.log('✓ Sample data seeded successfully!');
    console.log('\nTest Credentials:');
    console.log('Admin    - username: admin     password: admin123');
    console.log('Student  - username: student1  password: student123');
    console.log('Faculty  - username: faculty1  password: faculty123');
  } catch (error) {
    console.error('Error seeding data:', error.message);
    process.exit(1);
  }
}

seedData();
