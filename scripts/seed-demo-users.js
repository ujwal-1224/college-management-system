/**
 * Seed all demo users + full dummy data into MySQL
 * Run: node scripts/seed-demo-users.js
 *
 * Credentials:
 *   admin     / admin123
 *   ujwal     / student123
 *   soubhagya / staff123
 *   shashi    / parent123
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function seed() {
  const connection = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'college_management',
    multipleStatements: true,
  });

  console.log('✓ Connected to MySQL\n');

  // ── Hash passwords fresh at runtime ──────────────────────────────────────
  console.log('Hashing passwords...');
  const PASSWORDS = {
    admin123:   await bcrypt.hash('admin123',   10),
    student123: await bcrypt.hash('student123', 10),
    staff123:   await bcrypt.hash('staff123',   10),
    parent123:  await bcrypt.hash('parent123',  10),
  };
  console.log('✓ Passwords hashed\n');

  // ── helpers ──────────────────────────────────────────────────────────────
  async function upsertUser(username, hashedPw, role) {
    const [rows] = await connection.query(
      'SELECT user_id FROM User WHERE username = ?', [username]
    );
    if (rows.length) {
      await connection.query(
        'UPDATE User SET password = ?, role = ?, is_active = 1 WHERE user_id = ?',
        [hashedPw, role, rows[0].user_id]
      );
      console.log(`  ↻ Updated user: ${username}`);
      return rows[0].user_id;
    }
    const [r] = await connection.query(
      'INSERT INTO User (username, password, role, is_active) VALUES (?, ?, ?, 1)',
      [username, hashedPw, role]
    );
    console.log(`  ✓ Created user: ${username}`);
    return r.insertId;
  }

  // ── 1. Users ─────────────────────────────────────────────────────────────
  console.log('── Users ──');
  const adminId     = await upsertUser('admin',     PASSWORDS.admin123,   'admin');
  const ujwalId     = await upsertUser('ujwal',     PASSWORDS.student123, 'student');
  const sriramId    = await upsertUser('sriram',    PASSWORDS.student123, 'student');
  const shreekarId  = await upsertUser('shreekar',  PASSWORDS.student123, 'student');
  const sammerId    = await upsertUser('sammer',    PASSWORDS.student123, 'student');
  const soubhagyaId = await upsertUser('soubhagya', PASSWORDS.staff123,   'staff');
  const shashiId    = await upsertUser('shashi',    PASSWORDS.parent123,  'parent');

  // ── 2. Admin profile ─────────────────────────────────────────────────────
  console.log('\n── Admin profile ──');
  await connection.query(`
    INSERT INTO Admin (user_id, first_name, last_name, email, phone)
    VALUES (?, 'System', 'Administrator', 'admin@college.edu.in', '9000000000')
    ON DUPLICATE KEY UPDATE first_name='System'
  `, [adminId]);
  console.log('  ✓ Admin profile');

  // ── 3. Staff ─────────────────────────────────────────────────────────────
  console.log('\n── Staff ──');
  // Detect which column name the Staff table uses for joining date
  const [staffCols] = await connection.query(`SHOW COLUMNS FROM Staff`);
  const staffColNames = staffCols.map(c => c.Field);
  const joiningCol = staffColNames.includes('date_of_joining') ? 'date_of_joining' : 'joining_date';
  const empIdCol   = staffColNames.includes('employee_id') ? 'employee_id,' : '';
  const empIdVal   = staffColNames.includes('employee_id') ? "'EMP001'," : '';

  await connection.query(`
    INSERT INTO Staff (user_id, ${empIdCol} first_name, last_name, email, phone, department, designation, ${joiningCol})
    VALUES (?, ${empIdVal} 'Dr. Soubhagya', 'Barpanda', 'soubhagya.barpanda@college.edu.in', '9876543220', 'Computer Science', 'Professor', '2015-07-01')
    ON DUPLICATE KEY UPDATE first_name='Dr. Soubhagya'
  `, [soubhagyaId]);
  console.log('  ✓ Staff: soubhagya');

  // Get staff_id
  const [[staffRow]] = await connection.query('SELECT staff_id FROM Staff WHERE user_id = ?', [soubhagyaId]);
  const staffDbId = staffRow.staff_id;

  // ── 4. Students ───────────────────────────────────────────────────────────
  console.log('\n── Students ──');
  // Detect if roll_number column exists
  const [stuCols] = await connection.query(`SHOW COLUMNS FROM Student`);
  const stuColNames = stuCols.map(c => c.Field);
  const hasRoll = stuColNames.includes('roll_number');

  async function upsertStudent(userId, rollNum, firstName, lastName, email, phone, dob, dept, sem, enrollDate) {
    const rollPart = hasRoll ? `roll_number,` : '';
    const rollVal  = hasRoll ? `'${rollNum}',` : '';
    await connection.query(`
      INSERT INTO Student (user_id, ${rollPart} first_name, last_name, email, phone, date_of_birth, enrollment_date, department, semester)
      VALUES (?, ${rollVal} ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE first_name=VALUES(first_name)
    `, [userId, firstName, lastName, email, phone, dob, enrollDate, dept, sem]);
  }

  await upsertStudent(ujwalId,    'CS2300001', 'G.',       'Ujwal',   'g.ujwal@college.edu.in',    '9876543210', '2002-05-15', 'Computer Science', 3, '2023-08-01');
  await upsertStudent(sriramId,   'EC2200002', 'Sriram',   '',        'sriram@college.edu.in',     '9876543211', '2002-08-20', 'Electronics',      5, '2022-08-01');
  await upsertStudent(shreekarId, 'ME2400003', 'Shreekar', '',        'shreekar@college.edu.in',   '9876543212', '2003-03-10', 'Mechanical',       2, '2024-01-15');
  await upsertStudent(sammerId,   'CS2400004', 'Sammer',   '',        'sammer@college.edu.in',     '9876543213', '2003-07-30', 'Computer Science', 1, '2024-08-01');
  console.log('  ✓ 4 students');

  // Get student IDs
  const [[ujwalStu]]    = await connection.query('SELECT student_id FROM Student WHERE user_id = ?', [ujwalId]);
  const [[sriramStu]]   = await connection.query('SELECT student_id FROM Student WHERE user_id = ?', [sriramId]);
  const [[shreekarStu]] = await connection.query('SELECT student_id FROM Student WHERE user_id = ?', [shreekarId]);
  const [[sammerStu]]   = await connection.query('SELECT student_id FROM Student WHERE user_id = ?', [sammerId]);
  const ujwalStuId    = ujwalStu.student_id;
  const sriramStuId   = sriramStu.student_id;
  const shreekarStuId = shreekarStu.student_id;
  const sammerStuId   = sammerStu.student_id;

  // ── 5. Parent ─────────────────────────────────────────────────────────────
  console.log('\n── Parent ──');
  await connection.query(`
    INSERT INTO Parent (user_id, first_name, last_name, email, phone, occupation)
    VALUES (?, 'G.', 'Shashi', 'g.shashi@email.com', '9876543230', 'Engineer')
    ON DUPLICATE KEY UPDATE first_name='G.'
  `, [shashiId]);
  const [[parentRow]] = await connection.query('SELECT parent_id FROM Parent WHERE user_id = ?', [shashiId]);
  const parentDbId = parentRow.parent_id;

  // Link parent → ujwal
  await connection.query(`
    INSERT INTO StudentParent (student_id, parent_id, relationship)
    VALUES (?, ?, 'Father')
    ON DUPLICATE KEY UPDATE relationship='Father'
  `, [ujwalStuId, parentDbId]);
  console.log('  ✓ Parent: shashi → ujwal');

  // ── 6. Courses ────────────────────────────────────────────────────────────
  console.log('\n── Courses ──');
  const courses = [
    ['CS101', 'Introduction to Programming',  'Computer Science', 4, 1],
    ['CS201', 'Data Structures',               'Computer Science', 4, 3],
    ['CS301', 'Database Management Systems',   'Computer Science', 3, 5],
    ['CS401', 'Operating Systems',             'Computer Science', 4, 7],
    ['EC201', 'Digital Electronics',           'Electronics',      3, 3],
    ['EC301', 'Microprocessors',               'Electronics',      4, 5],
    ['ME201', 'Thermodynamics',                'Mechanical',       3, 3],
    ['ME301', 'Fluid Mechanics',               'Mechanical',       4, 5],
    ['MATH201','Discrete Mathematics',         'Computer Science', 3, 3],
    ['PHY101', 'Physics I',                    'General',          3, 1],
  ];
  for (const [code, name, dept, credits, sem] of courses) {
    await connection.query(`
      INSERT INTO Course (course_code, course_name, department, credits, semester, staff_id)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE course_name=VALUES(course_name)
    `, [code, name, dept, credits, sem, staffDbId]);
  }
  console.log('  ✓ 10 courses');

  // Get course IDs
  const [courseRows] = await connection.query('SELECT course_id, course_code FROM Course');
  const courseMap = {};
  courseRows.forEach(c => { courseMap[c.course_code] = c.course_id; });

  // ── 7. Enrollments ────────────────────────────────────────────────────────
  console.log('\n── Enrollments ──');
  const enrollments = [
    [ujwalStuId,    courseMap['CS201'], '2024-01-15', 'active'],
    [ujwalStuId,    courseMap['CS301'], '2024-01-15', 'active'],
    [ujwalStuId,    courseMap['MATH201'],'2024-01-15','active'],
    [ujwalStuId,    courseMap['CS101'], '2023-08-01', 'completed'],
    [sriramStuId,   courseMap['EC201'], '2023-08-01', 'active'],
    [sriramStuId,   courseMap['EC301'], '2023-08-01', 'active'],
    [sriramStuId,   courseMap['CS301'], '2023-08-01', 'active'],
    [shreekarStuId, courseMap['ME201'], '2024-01-15', 'active'],
    [shreekarStuId, courseMap['ME301'], '2024-01-15', 'active'],
    [sammerStuId,   courseMap['CS101'], '2024-08-01', 'active'],
    [sammerStuId,   courseMap['PHY101'],'2024-08-01', 'active'],
  ];
  for (const [sid, cid, date, status] of enrollments) {
    if (!cid) continue;
    await connection.query(`
      INSERT INTO CourseEnrollment (student_id, course_id, enrollment_date, status)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE status=VALUES(status)
    `, [sid, cid, date, status]);
  }
  console.log('  ✓ Enrollments');

  // ── 8. Timetable ──────────────────────────────────────────────────────────
  console.log('\n── Timetable ──');
  const timetable = [
    [courseMap['CS101'], 'Monday',    '09:00:00', '10:30:00', 'Room 101'],
    [courseMap['CS101'], 'Wednesday', '09:00:00', '10:30:00', 'Room 101'],
    [courseMap['CS201'], 'Tuesday',   '11:00:00', '12:30:00', 'Room 202'],
    [courseMap['CS201'], 'Thursday',  '11:00:00', '12:30:00', 'Room 202'],
    [courseMap['CS301'], 'Monday',    '14:00:00', '15:30:00', 'Lab 1'],
    [courseMap['CS301'], 'Friday',    '14:00:00', '15:30:00', 'Lab 1'],
    [courseMap['MATH201'],'Wednesday','14:00:00', '15:30:00', 'Room 203'],
    [courseMap['EC201'], 'Tuesday',   '09:00:00', '10:30:00', 'Room 201'],
    [courseMap['EC301'], 'Thursday',  '14:00:00', '15:30:00', 'Lab 2'],
    [courseMap['ME201'], 'Monday',    '11:00:00', '12:30:00', 'Room 301'],
    [courseMap['ME301'], 'Friday',    '09:00:00', '10:30:00', 'Room 302'],
    [courseMap['PHY101'],'Tuesday',   '14:00:00', '15:30:00', 'Room 102'],
  ];
  for (const [cid, day, start, end, room] of timetable) {
    if (!cid) continue;
    await connection.query(`
      INSERT INTO Timetable (course_id, day_of_week, start_time, end_time, room_number)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE room_number=VALUES(room_number)
    `, [cid, day, start, end, room]);
  }
  console.log('  ✓ Timetable');

  // ── 9. Attendance ─────────────────────────────────────────────────────────
  console.log('\n── Attendance ──');
  const attDates = ['2024-02-01','2024-02-05','2024-02-08','2024-02-12','2024-02-15',
                    '2024-02-19','2024-02-22','2024-02-26'];
  const attRecords = [
    // ujwal
    [ujwalStuId, courseMap['CS201'], 'present'],
    [ujwalStuId, courseMap['CS301'], 'present'],
    [ujwalStuId, courseMap['MATH201'],'late'],
    // sriram
    [sriramStuId, courseMap['EC201'], 'present'],
    [sriramStuId, courseMap['EC301'], 'absent'],
    // shreekar
    [shreekarStuId, courseMap['ME201'], 'present'],
    [shreekarStuId, courseMap['ME301'], 'present'],
    // sammer
    [sammerStuId, courseMap['CS101'], 'present'],
  ];
  for (const date of attDates) {
    for (const [sid, cid, status] of attRecords) {
      if (!cid) continue;
      await connection.query(`
        INSERT INTO Attendance (student_id, course_id, attendance_date, status)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE status=VALUES(status)
      `, [sid, cid, date, status]);
    }
  }
  console.log('  ✓ Attendance records');

  // ── 10. Exams ─────────────────────────────────────────────────────────────
  console.log('\n── Exams ──');
  // Check if exam_type column exists
  const [examCols] = await connection.query('SHOW COLUMNS FROM Exam');
  const examColNames = examCols.map(c => c.Field);
  const hasExamType = examColNames.includes('exam_type');
  const examTypePart = hasExamType ? ', exam_type' : '';
  const examTypeVal  = hasExamType ? ", 'mid_term'" : '';

  const exams = [
    [courseMap['CS201'], 'Mid-Term Exam',  '2024-02-15', 100],
    [courseMap['CS201'], 'Quiz 1',         '2024-01-25', 50],
    [courseMap['CS301'], 'Mid-Term Exam',  '2024-02-12', 100],
    [courseMap['CS301'], 'Lab Test',       '2024-01-30', 50],
    [courseMap['MATH201'],'Quiz 1',        '2024-02-05', 50],
    [courseMap['CS101'], 'Final Exam',     '2024-04-20', 100],
    [courseMap['EC201'], 'Mid-Term Exam',  '2024-02-14', 100],
    [courseMap['ME201'], 'Mid-Term Exam',  '2024-02-16', 100],
    [courseMap['PHY101'],'Mid-Term Exam',  '2024-02-08', 100],
  ];
  const examIds = [];
  for (const [cid, name, date, marks] of exams) {
    if (!cid) { examIds.push(null); continue; }
    // Check if already exists
    const [existing] = await connection.query(
      'SELECT exam_id FROM Exam WHERE course_id = ? AND exam_name = ?', [cid, name]
    );
    if (existing.length) {
      examIds.push(existing[0].exam_id);
    } else {
      const [r] = await connection.query(
        `INSERT INTO Exam (course_id, exam_name ${examTypePart}, exam_date, max_marks, created_by)
         VALUES (?, ? ${examTypeVal}, ?, ?, ?)`,
        [cid, name, date, marks, staffDbId]
      );
      examIds.push(r.insertId);
    }
  }
  console.log('  ✓ Exams');

  // ── 11. Results ───────────────────────────────────────────────────────────
  console.log('\n── Results ──');
  // examIds index: 0=CS201 Mid, 1=CS201 Quiz, 2=CS301 Mid, 3=CS301 Lab, 4=MATH201 Quiz, 5=CS101 Final, 6=EC201 Mid, 7=ME201 Mid, 8=PHY101 Mid
  const results = [
    [ujwalStuId,    examIds[0], 85, 'A'],
    [ujwalStuId,    examIds[1], 42, 'B+'],
    [ujwalStuId,    examIds[2], 78, 'B+'],
    [ujwalStuId,    examIds[3], 38, 'B'],
    [ujwalStuId,    examIds[4], 45, 'A+'],
    [ujwalStuId,    examIds[5], 92, 'A+'],
    [sriramStuId,   examIds[6], 88, 'A'],
    [shreekarStuId, examIds[7], 72, 'B'],
    [sammerStuId,   examIds[8], 65, 'B'],
  ];
  for (const [sid, eid, marks, grade] of results) {
    if (!eid) continue;
    await connection.query(`
      INSERT INTO Result (student_id, exam_id, marks_obtained, grade)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE marks_obtained=VALUES(marks_obtained), grade=VALUES(grade)
    `, [sid, eid, marks, grade]);
  }
  console.log('  ✓ Results');

  // ── 12. Fee Structure ─────────────────────────────────────────────────────
  console.log('\n── Fee Structure ──');
  // Check if academic_year column exists
  const [feeCols] = await connection.query('SHOW COLUMNS FROM FeeStructure');
  const feeColNames = feeCols.map(c => c.Field);
  const hasAcYear = feeColNames.includes('academic_year');
  const acYearPart = hasAcYear ? ', academic_year' : '';
  const acYearVal  = hasAcYear ? ", '2024-25'" : '';

  const feeStructures = [
    [ujwalStuId,    3, 50000, 15000, 2000, 3000, 1000, '2024-03-31'],
    [sriramStuId,   5, 50000, 15000, 2000, 3000, 1000, '2024-03-31'],
    [shreekarStuId, 2, 50000, 15000, 2000, 3000, 1000, '2024-03-31'],
    [sammerStuId,   1, 50000,     0, 2000, 3000, 1000, '2024-08-31'],
  ];
  for (const [sid, sem, tuition, hostel, lib, lab, other, due] of feeStructures) {
    const [existing] = await connection.query(
      'SELECT fee_structure_id FROM FeeStructure WHERE student_id = ? AND semester = ?', [sid, sem]
    );
    if (!existing.length) {
      await connection.query(`
        INSERT INTO FeeStructure (student_id, semester ${acYearPart}, tuition_fee, hostel_fee, library_fee, lab_fee, other_fee, due_date)
        VALUES (?, ? ${acYearVal}, ?, ?, ?, ?, ?, ?)
      `, [sid, sem, tuition, hostel, lib, lab, other, due]);
    }
  }
  console.log('  ✓ Fee structures');

  // ── 13. Fee Payments ──────────────────────────────────────────────────────
  console.log('\n── Fee Payments ──');
  const payments = [
    [ujwalStuId,    50000, '2024-01-15', 'online', 3, 'RCP2024011501', 'TXN001', 'Tuition Fee Sem 3'],
    [ujwalStuId,    15000, '2024-01-20', 'online', 3, 'RCP2024012001', 'TXN002', 'Hostel Fee Sem 3'],
    [sriramStuId,   71000, '2024-01-10', 'online', 5, 'RCP2024011001', 'TXN003', 'Full Fee Sem 5'],
    [shreekarStuId, 40000, '2024-01-25', 'card',   2, 'RCP2024012501', 'TXN004', 'Partial Payment'],
    [sammerStuId,   56000, '2024-01-18', 'upi',    1, 'RCP2024011801', 'TXN005', 'Full Fee Sem 1'],
  ];
  for (const [sid, amt, date, method, sem, receipt, txn, desc] of payments) {
    const [existing] = await connection.query(
      'SELECT payment_id FROM FeePayment WHERE receipt_number = ?', [receipt]
    );
    if (!existing.length) {
      await connection.query(`
        INSERT INTO FeePayment (student_id, amount, payment_date, payment_method, semester, status, receipt_number, transaction_id, description)
        VALUES (?, ?, ?, ?, ?, 'paid', ?, ?, ?)
      `, [sid, amt, date, method, sem, receipt, txn, desc]);
    }
  }
  console.log('  ✓ Fee payments');

  // ── 14. Hostels ───────────────────────────────────────────────────────────
  console.log('\n── Hostels ──');
  const [existingHostels] = await connection.query('SELECT COUNT(*) as cnt FROM Hostel');
  if (existingHostels[0].cnt === 0) {
    // Check if hostel_type column exists
    const [hostelCols] = await connection.query('SHOW COLUMNS FROM Hostel');
    const hostelColNames = hostelCols.map(c => c.Field);
    const hasHostelType = hostelColNames.includes('hostel_type');
    const htPart = hasHostelType ? ', hostel_type' : '';
    const htVals = hasHostelType
      ? [["'boys'"], ["'boys'"], ["'girls'"], ["'girls'"]]
      : [[], [], [], []];

    const hostelData = [
      ['Boys Hostel A', 100, 25, 'Mr. Kumar', '9876543240', 'North Campus'],
      ['Boys Hostel B', 80,  15, 'Mr. Singh',  '9876543241', 'South Campus'],
      ['Girls Hostel A', 100, 30, 'Mrs. Sharma','9876543242', 'East Campus'],
      ['Girls Hostel B', 80,  20, 'Mrs. Patel', '9876543243', 'West Campus'],
    ];
    for (let i = 0; i < hostelData.length; i++) {
      const [name, total, avail, warden, phone, addr] = hostelData[i];
      if (hasHostelType) {
        const types = ['boys','boys','girls','girls'];
        await connection.query(
          `INSERT INTO Hostel (hostel_name, hostel_type, total_rooms, available_rooms, warden_name, warden_phone, address) VALUES (?,?,?,?,?,?,?)`,
          [name, types[i], total, avail, warden, phone, addr]
        );
      } else {
        await connection.query(
          `INSERT INTO Hostel (hostel_name, total_rooms, available_rooms) VALUES (?,?,?)`,
          [name, total, avail]
        );
      }
    }
  }
  const [hostelRows] = await connection.query('SELECT hostel_id FROM Hostel LIMIT 2');
  const hostel1 = hostelRows[0]?.hostel_id;
  const hostel3 = hostelRows[1]?.hostel_id || hostel1;

  // ── 15. Hostel Allocations ────────────────────────────────────────────────
  console.log('\n── Hostel Allocations ──');
  const allocations = [
    [ujwalStuId,    hostel1, 'A-205', '2023-08-01'],
    [shreekarStuId, hostel1, 'A-310', '2024-01-15'],
    [sriramStuId,   hostel3, 'B-215', '2022-08-01'],
  ];
  for (const [sid, hid, room, date] of allocations) {
    if (!hid) continue;
    await connection.query(`
      INSERT INTO HostelAllocation (student_id, hostel_id, room_number, allocation_date)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE room_number=VALUES(room_number)
    `, [sid, hid, room, date]);
  }
  console.log('  ✓ Hostel allocations');

  // ── 16. Notifications ─────────────────────────────────────────────────────
  console.log('\n── Notifications ──');
  const [existingNotifs] = await connection.query('SELECT COUNT(*) as cnt FROM Notification');
  if (existingNotifs[0].cnt === 0) {
    const notifs = [
      ['Welcome to College Management System', 'Welcome to the new academic year! Check your schedule and fee details.', 'all',    'high'],
      ['Mid-term Exams Announcement',          'Mid-term exams from 15th to 20th next month. Prepare accordingly.',       'student','high'],
      ['Library Hours Extended',               'Library hours extended till 10 PM on weekdays.',                          'all',    'medium'],
      ['Fee Payment Reminder',                 'Clear pending dues before month end to avoid late fees.',                 'student','high'],
      ['Staff Meeting',                        'All staff attend meeting on Friday at 3 PM.',                             'staff',  'medium'],
      ['Parent-Teacher Meeting',               'Parent-teacher meeting next Saturday. Confirm attendance.',               'parent', 'high'],
    ];
    for (const [title, msg, role, priority] of notifs) {
      await connection.query(`
        INSERT INTO Notification (title, message, target_role, priority, created_by)
        VALUES (?, ?, ?, ?, ?)
      `, [title, msg, role, priority, adminId]);
    }
  }
  console.log('  ✓ Notifications');

  await connection.end();

  console.log('\n✅ All done!\n');
  console.log('🔑 Login credentials:');
  console.log('   Admin:   admin     / admin123');
  console.log('   Student: ujwal     / student123');
  console.log('   Staff:   soubhagya / staff123');
  console.log('   Parent:  shashi    / parent123');
}

seed().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  console.error(err);
  process.exit(1);
});
