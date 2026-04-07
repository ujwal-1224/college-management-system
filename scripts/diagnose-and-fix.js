/**
 * DIAGNOSE AND FIX - detects all schema differences and fixes everything
 * node scripts/diagnose-and-fix.js
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function getColumns(conn, table) {
  try {
    const [cols] = await conn.query(`SHOW COLUMNS FROM ${table}`);
    return cols.map(c => c.Field);
  } catch (e) {
    return null; // table doesn't exist
  }
}

async function addColIfMissing(conn, table, col, definition) {
  const cols = await getColumns(conn, table);
  if (cols && !cols.includes(col)) {
    await conn.query(`ALTER TABLE ${table} ADD COLUMN ${col} ${definition}`);
    console.log(`  ✓ Added ${table}.${col}`);
  }
}

async function run() {
  const cfg = {
    host:     process.env.DB_HOST     || 'localhost',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'college_management',
  };
  console.log(`\n=== Connecting to ${cfg.database} ===`);
  const conn = await mysql.createConnection(cfg);
  console.log('✓ Connected\n');

  // ── Step 1: Fix role ENUM ─────────────────────────────────────────────────
  console.log('=== Step 1: Fix User.role ENUM ===');
  await conn.query(`ALTER TABLE User MODIFY COLUMN role ENUM('student','staff','admin','parent') NOT NULL`);
  console.log('  ✓ role ENUM: student, staff, admin, parent\n');

  // ── Step 2: Create missing tables ─────────────────────────────────────────
  console.log('=== Step 2: Create missing tables ===');

  await conn.query(`CREATE TABLE IF NOT EXISTS Staff (
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
  )`);

  await conn.query(`CREATE TABLE IF NOT EXISTS Parent (
    parent_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15),
    occupation VARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE
  )`);

  await conn.query(`CREATE TABLE IF NOT EXISTS Admin (
    admin_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15),
    FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE
  )`);

  await conn.query(`CREATE TABLE IF NOT EXISTS StudentParent (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    parent_id INT NOT NULL,
    relationship VARCHAR(20) NOT NULL,
    UNIQUE KEY uq_sp (student_id, parent_id),
    FOREIGN KEY (student_id) REFERENCES Student(student_id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES Parent(parent_id) ON DELETE CASCADE
  )`);

  await conn.query(`CREATE TABLE IF NOT EXISTS CourseEnrollment (
    enrollment_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    enrollment_date DATE NOT NULL,
    status ENUM('active','completed','dropped','failed') DEFAULT 'active',
    UNIQUE KEY uq_enroll (student_id, course_id),
    FOREIGN KEY (student_id) REFERENCES Student(student_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES Course(course_id) ON DELETE CASCADE
  )`);

  await conn.query(`CREATE TABLE IF NOT EXISTS Timetable (
    timetable_id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    day_of_week ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room_number VARCHAR(20),
    FOREIGN KEY (course_id) REFERENCES Course(course_id) ON DELETE CASCADE
  )`);

  await conn.query(`CREATE TABLE IF NOT EXISTS HostelAllocation (
    allocation_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT UNIQUE NOT NULL,
    hostel_id INT NOT NULL,
    room_number VARCHAR(10) NOT NULL,
    allocation_date DATE NOT NULL,
    FOREIGN KEY (student_id) REFERENCES Student(student_id) ON DELETE CASCADE,
    FOREIGN KEY (hostel_id) REFERENCES Hostel(hostel_id) ON DELETE CASCADE
  )`);

  await conn.query(`CREATE TABLE IF NOT EXISTS Notification (
    notification_id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    target_role ENUM('all','student','staff','parent','admin') DEFAULT 'all',
    priority ENUM('low','medium','high','urgent') DEFAULT 'medium',
    is_read BOOLEAN DEFAULT FALSE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES User(user_id) ON DELETE SET NULL
  )`);

  console.log('  ✓ All tables created/verified\n');

  // ── Step 3: Add ALL missing columns upfront ───────────────────────────────
  console.log('=== Step 3: Patch missing columns ===');

  // Course
  await addColIfMissing(conn, 'Course', 'staff_id', 'INT');
  try {
    const [fks] = await conn.query(`SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA=? AND TABLE_NAME='Course' AND COLUMN_NAME='staff_id' AND REFERENCED_TABLE_NAME='Staff'`,
      [cfg.database]);
    if (!fks.length) {
      await conn.query(`ALTER TABLE Course ADD FOREIGN KEY (staff_id) REFERENCES Staff(staff_id) ON DELETE SET NULL`);
    }
  } catch(e) {}

  // Exam
  await addColIfMissing(conn, 'Exam', 'created_by', 'INT');

  // FeePayment
  await addColIfMissing(conn, 'FeePayment', 'receipt_number', 'VARCHAR(50)');
  await addColIfMissing(conn, 'FeePayment', 'transaction_id', 'VARCHAR(100)');
  await addColIfMissing(conn, 'FeePayment', 'description', 'TEXT');
  await addColIfMissing(conn, 'FeePayment', 'academic_year', 'VARCHAR(10)');
  // Fix payment_method to ENUM if it's VARCHAR
  try {
    const [pmCol] = await conn.query(`SHOW COLUMNS FROM FeePayment LIKE 'payment_method'`);
    if (pmCol.length && !pmCol[0].Type.includes('enum')) {
      await conn.query(`ALTER TABLE FeePayment MODIFY COLUMN payment_method ENUM('cash','card','online','upi','cheque') NOT NULL DEFAULT 'online'`);
      console.log('  ✓ Fixed FeePayment.payment_method ENUM');
    }
  } catch(e) {}

  // FeeStructure
  await addColIfMissing(conn, 'FeeStructure', 'academic_year', "VARCHAR(10) NOT NULL DEFAULT '2024-25'");
  await addColIfMissing(conn, 'FeeStructure', 'tuition_fee', 'DECIMAL(10,2) NOT NULL DEFAULT 0');
  await addColIfMissing(conn, 'FeeStructure', 'hostel_fee', 'DECIMAL(10,2) NOT NULL DEFAULT 0');
  await addColIfMissing(conn, 'FeeStructure', 'library_fee', 'DECIMAL(10,2) NOT NULL DEFAULT 0');
  await addColIfMissing(conn, 'FeeStructure', 'lab_fee', 'DECIMAL(10,2) NOT NULL DEFAULT 0');
  await addColIfMissing(conn, 'FeeStructure', 'other_fee', 'DECIMAL(10,2) NOT NULL DEFAULT 0');
  await addColIfMissing(conn, 'FeeStructure', 'due_date', 'DATE');
  // Fix total_fee default
  try {
    const [tfCol] = await conn.query(`SHOW COLUMNS FROM FeeStructure LIKE 'total_fee'`);
    if (tfCol.length) {
      await conn.query(`ALTER TABLE FeeStructure MODIFY COLUMN total_fee DECIMAL(10,2) NOT NULL DEFAULT 0`);
      console.log('  ✓ Fixed FeeStructure.total_fee default');
    }
  } catch(e) {}

  // Hostel
  await addColIfMissing(conn, 'Hostel', 'hostel_type', "ENUM('boys','girls','mixed') NOT NULL DEFAULT 'boys'");
  await addColIfMissing(conn, 'Hostel', 'warden_name', 'VARCHAR(100)');
  await addColIfMissing(conn, 'Hostel', 'warden_phone', 'VARCHAR(15)');
  await addColIfMissing(conn, 'Hostel', 'address', 'TEXT');

  // HostelAllocation
  await addColIfMissing(conn, 'HostelAllocation', 'status', "ENUM('active','vacated','transferred') DEFAULT 'active'");

  // Notification
  await addColIfMissing(conn, 'Notification', 'priority', "ENUM('low','medium','high','urgent') DEFAULT 'medium'");
  await addColIfMissing(conn, 'Notification', 'target_role', "ENUM('all','student','staff','parent','admin') DEFAULT 'all'");
  await addColIfMissing(conn, 'Notification', 'is_read', 'BOOLEAN DEFAULT FALSE');
  await addColIfMissing(conn, 'Notification', 'created_by', 'INT');
  await addColIfMissing(conn, 'Notification', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

  console.log('  ✓ All columns patched\n');

  // ── Step 4: Upsert demo users ─────────────────────────────────────────────
  console.log('=== Step 4: Upsert demo users ===');
  const demos = [
    { username: 'admin',     password: 'admin123',   role: 'admin'   },
    { username: 'ujwal',     password: 'student123', role: 'student' },
    { username: 'soubhagya', password: 'staff123',   role: 'staff'   },
    { username: 'shashi',    password: 'parent123',  role: 'parent'  },
  ];
  const userIds = {};
  for (const d of demos) {
    const hash = await bcrypt.hash(d.password, 10);
    const [rows] = await conn.query('SELECT user_id FROM User WHERE username=?', [d.username]);
    if (rows.length) {
      await conn.query('UPDATE User SET password=?, role=? WHERE user_id=?', [hash, d.role, rows[0].user_id]);
      userIds[d.username] = rows[0].user_id;
      console.log(`  ↻ Updated: ${d.username} (id=${rows[0].user_id})`);
    } else {
      const [r] = await conn.query('INSERT INTO User (username,password,role) VALUES (?,?,?)', [d.username, hash, d.role]);
      userIds[d.username] = r.insertId;
      console.log(`  ✓ Created: ${d.username} (id=${r.insertId})`);
    }
  }

  // ── Step 5: Role profiles ─────────────────────────────────────────────────
  console.log('\n=== Step 5: Role profiles ===');

  await conn.query(`INSERT INTO Admin (user_id,first_name,last_name,email,phone)
    VALUES (?,'System','Administrator','admin@college.edu.in','9000000000')
    ON DUPLICATE KEY UPDATE first_name='System'`, [userIds['admin']]);
  console.log('  ✓ Admin');

  await conn.query(`INSERT INTO Staff (user_id,first_name,last_name,email,phone,department,designation,joining_date)
    VALUES (?,'Dr. Soubhagya','Barpanda','soubhagya.barpanda@college.edu.in','9876543220','Computer Science','Professor','2015-07-01')
    ON DUPLICATE KEY UPDATE first_name='Dr. Soubhagya'`, [userIds['soubhagya']]);
  console.log('  ✓ Staff');

  await conn.query(`INSERT INTO Parent (user_id,first_name,last_name,email,phone,occupation)
    VALUES (?,'G.','Shashi','g.shashi@email.com','9876543230','Engineer')
    ON DUPLICATE KEY UPDATE first_name='G.'`, [userIds['shashi']]);
  console.log('  ✓ Parent');

  // ── Step 6: Seed data ─────────────────────────────────────────────────────
  console.log('\n=== Step 6: Seed student data ===');

  const [[staffRow]] = await conn.query('SELECT staff_id FROM Staff WHERE user_id=?', [userIds['soubhagya']]);
  const staffId = staffRow.staff_id;
  const [[ujwalStu]] = await conn.query('SELECT student_id FROM Student WHERE user_id=?', [userIds['ujwal']]);
  const sid = ujwalStu.student_id;

  // Courses
  const courses = [
    ['CS101','Introduction to Programming','Computer Science',4,1],
    ['CS201','Data Structures','Computer Science',4,3],
    ['CS301','Database Management Systems','Computer Science',3,5],
    ['MATH201','Discrete Mathematics','Computer Science',3,3],
    ['EC201','Digital Electronics','Electronics',3,3],
    ['ME201','Thermodynamics','Mechanical',3,3],
    ['PHY101','Physics I','General',3,1],
  ];
  for (const [code,name,dept,credits,sem] of courses) {
    await conn.query(`INSERT INTO Course (course_code,course_name,department,credits,semester,staff_id)
      VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE course_name=VALUES(course_name),staff_id=VALUES(staff_id)`,
      [code,name,dept,credits,sem,staffId]);
  }
  const [cRows] = await conn.query('SELECT course_id,course_code FROM Course');
  const cm = {};
  cRows.forEach(c => { cm[c.course_code] = c.course_id; });
  console.log('  ✓ Courses');

  // Enrollments
  for (const [code,status] of [['CS201','active'],['CS301','active'],['MATH201','active'],['CS101','completed']]) {
    if (!cm[code]) continue;
    await conn.query(`INSERT INTO CourseEnrollment (student_id,course_id,enrollment_date,status)
      VALUES (?,?,'2024-01-15',?) ON DUPLICATE KEY UPDATE status=VALUES(status)`,
      [sid,cm[code],status]);
  }
  console.log('  ✓ Enrollments');

  // Timetable
  for (const [code,day,s,e,room] of [
    ['CS201','Tuesday','11:00:00','12:30:00','Room 202'],
    ['CS301','Monday','14:00:00','15:30:00','Lab 1'],
    ['MATH201','Wednesday','14:00:00','15:30:00','Room 203'],
    ['CS101','Monday','09:00:00','10:30:00','Room 101'],
  ]) {
    if (!cm[code]) continue;
    await conn.query(`INSERT INTO Timetable (course_id,day_of_week,start_time,end_time,room_number)
      VALUES (?,?,?,?,?)`, [cm[code],day,s,e,room]).catch(()=>{});
  }
  console.log('  ✓ Timetable');

  // Attendance
  for (const date of ['2024-02-01','2024-02-05','2024-02-08','2024-02-12','2024-02-15','2024-02-19','2024-02-22','2024-02-26']) {
    for (const [code,status] of [['CS201','present'],['CS301','present'],['MATH201','late']]) {
      if (!cm[code]) continue;
      await conn.query(`INSERT INTO Attendance (student_id,course_id,attendance_date,status)
        VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE status=VALUES(status)`,
        [sid,cm[code],date,status]);
    }
  }
  console.log('  ✓ Attendance');

  // Exams + Results
  for (const [code,name,date,max,marks,grade] of [
    ['CS201','Mid-Term Exam','2024-02-15',100,85,'A'],
    ['CS301','Mid-Term Exam','2024-02-12',100,78,'B+'],
    ['MATH201','Quiz 1','2024-02-05',50,45,'A+'],
    ['CS101','Final Exam','2024-04-20',100,92,'A+'],
  ]) {
    if (!cm[code]) continue;
    let examId;
    const [ex] = await conn.query('SELECT exam_id FROM Exam WHERE course_id=? AND exam_name=?',[cm[code],name]);
    if (ex.length) {
      examId = ex[0].exam_id;
    } else {
      const [r] = await conn.query(`INSERT INTO Exam (course_id,exam_name,exam_date,max_marks,created_by) VALUES (?,?,?,?,?)`,
        [cm[code],name,date,max,staffId]);
      examId = r.insertId;
    }
    await conn.query(`INSERT INTO Result (student_id,exam_id,marks_obtained,grade) VALUES (?,?,?,?)
      ON DUPLICATE KEY UPDATE marks_obtained=VALUES(marks_obtained),grade=VALUES(grade)`,
      [sid,examId,marks,grade]);
  }
  console.log('  ✓ Exams & Results');

  // Fee structure
  const fsCols = await getColumns(conn, 'FeeStructure');
  const hasTotalFee = fsCols && fsCols.includes('total_fee');
  const [exFee] = await conn.query('SELECT fee_structure_id FROM FeeStructure WHERE student_id=? AND semester=3',[sid]);
  if (!exFee.length) {
    if (hasTotalFee) {
      await conn.query(`INSERT INTO FeeStructure (student_id,semester,academic_year,tuition_fee,hostel_fee,library_fee,lab_fee,other_fee,total_fee,due_date)
        VALUES (?,3,'2024-25',50000,15000,2000,3000,1000,71000,'2024-03-31')`, [sid]);
    } else {
      await conn.query(`INSERT INTO FeeStructure (student_id,semester,academic_year,tuition_fee,hostel_fee,library_fee,lab_fee,other_fee,due_date)
        VALUES (?,3,'2024-25',50000,15000,2000,3000,1000,'2024-03-31')`, [sid]);
    }
  }
  const [exPay] = await conn.query("SELECT payment_id FROM FeePayment WHERE receipt_number='RCP2024011501'");
  if (!exPay.length) {
    await conn.query(`INSERT INTO FeePayment (student_id,amount,payment_date,payment_method,semester,status,receipt_number,transaction_id,description)
      VALUES (?,50000,'2024-01-15','online',3,'paid','RCP2024011501','TXN001','Tuition Fee Sem 3')`, [sid]);
  }
  console.log('  ✓ Fees');

  // Hostel
  const [[hCount]] = await conn.query('SELECT COUNT(*) as cnt FROM Hostel');
  if (hCount.cnt === 0) {
    const hCols = await getColumns(conn, 'Hostel');
    const hasType = hCols && hCols.includes('hostel_type');
    const hasWarden = hCols && hCols.includes('warden_name');
    if (hasType && hasWarden) {
      await conn.query(`INSERT INTO Hostel (hostel_name,hostel_type,total_rooms,available_rooms,warden_name,warden_phone,address) VALUES
        ('Boys Hostel A','boys',100,25,'Mr. Kumar','9876543240','North Campus'),
        ('Girls Hostel A','girls',100,30,'Mrs. Sharma','9876543242','East Campus')`);
    } else {
      await conn.query(`INSERT INTO Hostel (hostel_name,total_rooms,available_rooms) VALUES
        ('Boys Hostel A',100,25),('Girls Hostel A',100,30)`);
    }
  }
  const [[hostel]] = await conn.query('SELECT hostel_id FROM Hostel LIMIT 1');
  const [exAlloc] = await conn.query('SELECT allocation_id FROM HostelAllocation WHERE student_id=?',[sid]);
  if (!exAlloc.length) {
    await conn.query(`INSERT INTO HostelAllocation (student_id,hostel_id,room_number,allocation_date) VALUES (?,?,'A-205','2023-08-01')`,
      [sid,hostel.hostel_id]);
  }
  console.log('  ✓ Hostel');

  // Parent-student link
  const [[parentRow]] = await conn.query('SELECT parent_id FROM Parent WHERE user_id=?',[userIds['shashi']]);
  await conn.query(`INSERT INTO StudentParent (student_id,parent_id,relationship) VALUES (?,?,'Father')
    ON DUPLICATE KEY UPDATE relationship='Father'`, [sid,parentRow.parent_id]);
  console.log('  ✓ Parent-student link');

  // Notifications
  const nCols = await getColumns(conn, 'Notification');
  const hasPriority = nCols && nCols.includes('priority');
  const [[nCount]] = await conn.query('SELECT COUNT(*) as cnt FROM Notification');
  if (nCount.cnt === 0) {
    if (hasPriority) {
      await conn.query(`INSERT INTO Notification (title,message,target_role,priority,created_by) VALUES
        ('Welcome','Welcome to the new academic year!','all','high',?),
        ('Exam Notice','Mid-term exams next month.','student','high',?),
        ('Fee Reminder','Clear pending dues before month end.','student','high',?)`,
        [userIds['admin'],userIds['admin'],userIds['admin']]);
    } else {
      await conn.query(`INSERT INTO Notification (title,message,target_role,created_by) VALUES
        ('Welcome','Welcome to the new academic year!','all',?),
        ('Exam Notice','Mid-term exams next month.','student',?),
        ('Fee Reminder','Clear pending dues before month end.','student',?)`,
        [userIds['admin'],userIds['admin'],userIds['admin']]);
    }
  }
  console.log('  ✓ Notifications');

  // ── Final verification ────────────────────────────────────────────────────
  console.log('\n=== Final verification ===');
  for (const d of demos) {
    const [[u]] = await conn.query('SELECT password,role FROM User WHERE username=?',[d.username]);
    const ok = await bcrypt.compare(d.password, u.password);
    console.log(`  ${d.username}/${d.password}: ${ok ? '✓ LOGIN WILL WORK' : '✗ BROKEN'} (role=${u.role})`);
  }

  await conn.end();
  console.log('\n✅ Done! Restart your server.\n');
}

run().catch(err => {
  console.error('\n❌ Error:', err.message);
  console.error(err.stack);
  process.exit(1);
});

// Run standalone to clean duplicate timetable rows:
// node -e "require('dotenv').config();const m=require('mysql2/promise');m.createConnection({host:process.env.DB_HOST,user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME}).then(async c=>{await c.query('DELETE t1 FROM Timetable t1 INNER JOIN Timetable t2 WHERE t1.timetable_id>t2.timetable_id AND t1.course_id=t2.course_id AND t1.day_of_week=t2.day_of_week AND t1.start_time=t2.start_time');console.log('Dupes removed');c.end()})"
