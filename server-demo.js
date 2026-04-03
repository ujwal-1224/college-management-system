const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
require('dotenv').config();
const demoData = require('./config/demoData');

// Try to connect to real DB — used for live student/stats data
let db = null;
try {
  db = require('./config/database');
} catch(e) {}

const app = express();
const PORT = 3001;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Session configuration
app.use(session({
  secret: 'demo-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Import centralized demo data
const { 
  demoUsers, 
  demoParents, 
  demoChildren,
  demoAttendance,
  demoResults,
  DEMO_CREDENTIALS
} = demoData;

// Mutable in-memory stores (persist for session lifetime)
const demoStudents = [...(demoData.demoStudents || [])].map((s, i) => ({
  ...s, id: s.id || i + 1,
  roll_number: s.roll_number || `CS${String(i+1).padStart(3,'0')}`,
  is_active: true
}));

const demoStaff = [...(demoData.demoStaff || [])].map((s, i) => ({
  ...s, id: s.id || i + 1,
  employee_id: s.employee_id || `EMP${String(i+1).padStart(3,'0')}`,
  designation: s.designation || 'Professor',
  is_active: true
}));

const demoCourses = [...(demoData.demoCourses || [])].map((c, i) => ({
  ...c, course_id: c.course_id || i + 1, is_active: true
}));

const demoExams = [...(demoData.demoExams || [])].map((e, i) => ({
  ...e, exam_id: e.exam_id || i + 1
}));

let nextStudentId = demoStudents.length + 1;
let nextStaffId   = demoStaff.length + 1;
let nextCourseId  = demoCourses.length + 1;
let nextExamId    = demoExams.length + 1;

// Auth middleware
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  res.redirect('/login');
};

const isRole = (...roles) => {
  return (req, res, next) => {
    if (req.session && req.session.role && roles.includes(req.session.role)) {
      return next();
    }
    res.status(403).send('Access Denied');
  };
};

// Routes
app.get('/', (req, res) => {
  if (req.session.userId) {
    res.redirect(`/${req.session.role}/dashboard`);
  } else {
    res.sendFile('index.html', { root: './views' });
  }
});

app.get('/login', (req, res) => {
  if (req.session.userId) {
    return res.redirect(`/${req.session.role}/dashboard`);
  }
  res.sendFile('login.html', { root: './views' });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = demoUsers[username];
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    req.session.userId = username;
    req.session.username = username;
    req.session.role = user.role;

    res.json({ 
      success: true, 
      role: user.role,
      redirectUrl: `/${user.role}/dashboard`
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// Student routes
app.get('/student/dashboard', isAuthenticated, isRole('student'), (req, res) => {
  res.sendFile('student-dashboard-extended.html', { root: './views' });
});

app.get('/student/api/profile', isAuthenticated, isRole('student'), (req, res) => {
  const user = demoUsers[req.session.userId];
  res.json({
    ...user.profile,
    student_id: 1,
    phone: '9876543210',
    date_of_birth: '2002-05-15',
    enrollment_date: '2023-08-01'
  });
});

app.put('/student/api/profile', isAuthenticated, isRole('student'), (req, res) => {
  res.json({ success: true, message: 'Profile updated successfully (demo mode)' });
});

app.put('/student/api/change-password', isAuthenticated, isRole('student'), (req, res) => {
  res.json({ success: true, message: 'Password changed successfully (demo mode)' });
});

app.get('/student/api/attendance', isAuthenticated, isRole('student'), (req, res) => {
  res.json(demoAttendance);
});

app.get('/student/api/results', isAuthenticated, isRole('student'), (req, res) => {
  res.json(demoResults);
});

app.get('/student/api/courses', isAuthenticated, isRole('student'), (req, res) => {
  res.json([
    { course_id: 1, course_code: 'CS101', course_name: 'Introduction to Programming', credits: 4, faculty_name: 'Dr. Soubhagya Barpanda', faculty_email: 'soubhagya.barpanda@college.edu.in', status: 'active', enrollment_date: '2023-08-01' },
    { course_id: 2, course_code: 'CS201', course_name: 'Data Structures', credits: 4, faculty_name: 'Dr. Soubhagya Barpanda', faculty_email: 'soubhagya.barpanda@college.edu.in', status: 'active', enrollment_date: '2023-08-01' },
    { course_id: 3, course_code: 'CS301', course_name: 'Database Management Systems', credits: 3, faculty_name: 'Dr. Soubhagya Barpanda', faculty_email: 'soubhagya.barpanda@college.edu.in', status: 'active', enrollment_date: '2023-08-01' },
    { course_id: 4, course_code: 'MATH201', course_name: 'Discrete Mathematics', credits: 3, faculty_name: 'Dr. Soubhagya Barpanda', faculty_email: 'soubhagya.barpanda@college.edu.in', status: 'active', enrollment_date: '2023-08-01' }
  ]);
});

app.get('/student/api/timetable', isAuthenticated, isRole('student'), (req, res) => {
  res.json([
    { course_id: 1, course_code: 'CS101', course_name: 'Introduction to Programming', day_of_week: 'Monday', start_time: '09:00:00', end_time: '10:30:00', room_number: 'Room 101', faculty_name: 'Dr. Soubhagya Barpanda' },
    { course_id: 1, course_code: 'CS101', course_name: 'Introduction to Programming', day_of_week: 'Wednesday', start_time: '09:00:00', end_time: '10:30:00', room_number: 'Room 101', faculty_name: 'Dr. Soubhagya Barpanda' },
    { course_id: 2, course_code: 'CS201', course_name: 'Data Structures', day_of_week: 'Tuesday', start_time: '11:00:00', end_time: '12:30:00', room_number: 'Room 202', faculty_name: 'Dr. Soubhagya Barpanda' },
    { course_id: 2, course_code: 'CS201', course_name: 'Data Structures', day_of_week: 'Thursday', start_time: '11:00:00', end_time: '12:30:00', room_number: 'Room 202', faculty_name: 'Dr. Soubhagya Barpanda' },
    { course_id: 3, course_code: 'CS301', course_name: 'Database Management Systems', day_of_week: 'Monday', start_time: '14:00:00', end_time: '15:30:00', room_number: 'Lab 1', faculty_name: 'Dr. Soubhagya Barpanda' },
    { course_id: 3, course_code: 'CS301', course_name: 'Database Management Systems', day_of_week: 'Friday', start_time: '14:00:00', end_time: '15:30:00', room_number: 'Lab 1', faculty_name: 'Dr. Soubhagya Barpanda' },
    { course_id: 4, course_code: 'MATH201', course_name: 'Discrete Mathematics', day_of_week: 'Wednesday', start_time: '11:00:00', end_time: '12:30:00', room_number: 'Room 305', faculty_name: 'Dr. Soubhagya Barpanda' }
  ]);
});

app.get('/student/api/academic-progress', isAuthenticated, isRole('student'), (req, res) => {
  res.json({
    cgpa: 8.5,
    totalCredits: 45,
    currentSemester: 3,
    totalExams: 12
  });
});

app.get('/student/api/fees', isAuthenticated, isRole('student'), (req, res) => {
  res.json({
    fee_structure_id: 1,
    student_id: 1,
    semester: 3,
    tuition_fee: 50000,
    hostel_fee: 15000,
    library_fee: 2000,
    lab_fee: 3000,
    other_fee: 1000,
    total_fee: 71000,
    paid_amount: 65000,
    pending_dues: 6000
  });
});

app.get('/student/api/payment-history', isAuthenticated, isRole('student'), (req, res) => {
  res.json([
    { payment_id: 1, student_id: 1, amount: 50000, payment_date: '2024-01-15', payment_method: 'Online', semester: 3, status: 'paid', receipt_number: 'RCP2024011501', transaction_id: 'TXN123456789', description: 'Tuition Fee - Semester 3' },
    { payment_id: 2, student_id: 1, amount: 15000, payment_date: '2024-01-20', payment_method: 'Online', semester: 3, status: 'paid', receipt_number: 'RCP2024012001', transaction_id: 'TXN123456790', description: 'Hostel Fee - Semester 3' }
  ]);
});

app.post('/student/api/make-payment', isAuthenticated, isRole('student'), (req, res) => {
  const receiptNumber = 'RCP' + Date.now();
  const transactionId = 'TXN' + Math.random().toString(36).substr(2, 9).toUpperCase();
  res.json({ 
    success: true, 
    message: 'Payment successful (demo mode)',
    receiptNumber,
    transactionId
  });
});

app.get('/student/api/hostel', isAuthenticated, isRole('student'), (req, res) => {
  res.json({
    student_id: 1,
    hostel_id: 1,
    room_number: 'A-205',
    allocation_date: '2023-08-01',
    hostel_name: 'Boys Hostel A',
    total_rooms: 100,
    available_rooms: 25,
    hostel_fee: 15000
  });
});

app.get('/student/api/notifications', isAuthenticated, isRole('student'), (req, res) => {
  res.json([
    { notification_id: 1, title: 'Welcome to College Management System', message: 'Welcome to the new academic year! Please check your course schedule and fee details.', target_role: 'student', is_read: false, created_at: new Date().toISOString() },
    { notification_id: 2, title: 'Mid-term Exams Announcement', message: 'Mid-term examinations will be conducted from 15th to 20th of next month. Please prepare accordingly.', target_role: 'student', is_read: false, created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { notification_id: 3, title: 'Library Hours Extended', message: 'Library hours have been extended till 10 PM on weekdays.', target_role: 'all', is_read: true, created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
    { notification_id: 4, title: 'Fee Payment Reminder', message: 'Please clear your pending dues before the end of this month to avoid late fees.', target_role: 'student', is_read: false, created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
  ]);
});

app.put('/student/api/notifications/:id/read', isAuthenticated, isRole('student'), (req, res) => {
  res.json({ success: true });
});

// Staff routes
app.get('/staff/dashboard', isAuthenticated, isRole('staff'), (req, res) => {
  res.sendFile('staff-dashboard.html', { root: './views' });
});

app.get('/staff/attendance', isAuthenticated, isRole('staff'), (req, res) => {
  res.sendFile('staff-attendance.html', { root: './views' });
});

app.get('/staff/grades', isAuthenticated, isRole('staff'), (req, res) => {
  res.sendFile('staff-grades.html', { root: './views' });
});

app.get('/staff/timetable', isAuthenticated, isRole('staff'), (req, res) => {
  res.sendFile('staff-timetable.html', { root: './views' });
});

app.get('/staff/api/profile', isAuthenticated, isRole('staff'), (req, res) => {
  const user = demoUsers[req.session.userId];
  res.json(user.profile);
});

app.get('/staff/api/timetable', isAuthenticated, isRole('staff'), (req, res) => {
  const staffTimetable = [
    { day: 'Monday', time: '09:00-10:00', courseCode: 'CS201', courseName: 'Data Structures', section: 'CSE-A', room: 'R-204', semester: 'Sem 3' },
    { day: 'Monday', time: '11:00-12:00', courseCode: 'CS301', courseName: 'DBMS', section: 'CSE-B', room: 'R-310', semester: 'Sem 5' },
    { day: 'Tuesday', time: '09:00-10:00', courseCode: 'CS101', courseName: 'Programming', section: 'CSE-A', room: 'R-101', semester: 'Sem 1' },
    { day: 'Tuesday', time: '14:00-15:00', courseCode: 'CS201', courseName: 'Data Structures', section: 'CSE-B', room: 'R-204', semester: 'Sem 3' },
    { day: 'Wednesday', time: '10:00-11:00', courseCode: 'CS301', courseName: 'DBMS', section: 'CSE-A', room: 'Lab-1', semester: 'Sem 5' },
    { day: 'Thursday', time: '09:00-10:00', courseCode: 'CS201', courseName: 'Data Structures', section: 'CSE-A', room: 'R-204', semester: 'Sem 3' },
    { day: 'Thursday', time: '15:00-16:00', courseCode: 'CS101', courseName: 'Programming', section: 'CSE-B', room: 'Lab-2', semester: 'Sem 1' },
    { day: 'Friday', time: '11:00-12:00', courseCode: 'CS301', courseName: 'DBMS', section: 'CSE-B', room: 'R-310', semester: 'Sem 5' }
  ];
  res.json(staffTimetable);
});

app.get('/staff/api/courses', isAuthenticated, isRole('staff'), (req, res) => {
  res.json(demoCourses);
});

app.get('/staff/api/students', isAuthenticated, isRole('staff'), async (req, res) => {
  if (db) {
    try {
      const [rows] = await db.query(
        'SELECT s.student_id, s.first_name, s.last_name, s.email, s.department, s.semester FROM Student s ORDER BY s.student_id'
      );
      return res.json(rows);
    } catch(e) { console.error('DB staff/students error:', e.message); }
  }
  res.json(demoStudents.map(s => ({
    student_id: s.id, first_name: s.first_name, last_name: s.last_name,
    email: s.email, department: s.department, semester: s.semester
  })));
});

app.get('/staff/api/course-students/:courseId', isAuthenticated, isRole('staff'), (req, res) => {
  res.json(demoStudents.map(s => ({
    student_id: s.id,
    first_name: s.first_name,
    last_name: s.last_name,
    email: s.email,
    department: s.department
  })));
});

app.get('/staff/api/attendance-check/:courseId/:date', isAuthenticated, isRole('staff'), (req, res) => {
  res.json([]);
});

app.post('/staff/api/mark-attendance', isAuthenticated, isRole('staff'), (req, res) => {
  res.json({ success: true, message: 'Attendance saved successfully (demo mode)' });
});

app.get('/staff/api/course-exams/:courseId', isAuthenticated, isRole('staff'), (req, res) => {
  res.json(demoExams.filter(e => e.course_id == req.params.courseId));
});

app.get('/staff/api/exam-grades/:examId', isAuthenticated, isRole('staff'), (req, res) => {
  res.json([]);
});

app.post('/staff/api/create-exam', isAuthenticated, isRole('staff'), (req, res) => {
  res.json({ success: true, message: 'Exam created successfully (demo mode)' });
});

app.post('/staff/api/save-grades', isAuthenticated, isRole('staff'), (req, res) => {
  res.json({ success: true, message: 'Grades saved successfully (demo mode)' });
});

// Parent routes
app.get('/parent/dashboard', isAuthenticated, isRole('parent'), (req, res) => {
  res.sendFile('parent-dashboard.html', { root: './views' });
});

app.get('/parent/api/profile', isAuthenticated, isRole('parent'), (req, res) => {
  const user = demoUsers[req.session.userId];
  res.json(user.profile);
});

app.get('/parent/api/children', isAuthenticated, isRole('parent'), (req, res) => {
  res.json(demoChildren);
});

app.get('/parent/api/child-attendance/:studentId', isAuthenticated, isRole('parent'), (req, res) => {
  res.json(demoAttendance);
});

app.get('/parent/api/child-results/:studentId', isAuthenticated, isRole('parent'), (req, res) => {
  res.json(demoResults);
});

// Get child fees
app.get('/parent/api/child-fees/:studentId', isAuthenticated, isRole('parent'), (req, res) => {
  res.json({
    totalFee: 71000,
    tuitionFee: 50000,
    hostelFee: 15000,
    libraryFee: 2000,
    labFee: 3000,
    otherFee: 1000,
    paidAmount: 65000,
    pendingDues: 6000
  });
});

// Get child payment history
app.get('/parent/api/child-payment-history/:studentId', isAuthenticated, isRole('parent'), (req, res) => {
  res.json([
    { payment_id: 1, student_id: 1, amount: 50000, payment_date: '2024-01-15', payment_method: 'Online', semester: 3, status: 'paid', receipt_number: 'RCP2024011501', transaction_id: 'TXN123456789', description: 'Tuition Fee - Semester 3' },
    { payment_id: 2, student_id: 1, amount: 15000, payment_date: '2024-01-20', payment_method: 'Online', semester: 3, status: 'paid', receipt_number: 'RCP2024012001', transaction_id: 'TXN123456790', description: 'Hostel Fee - Semester 3' }
  ]);
});

// Get parent notifications
app.get('/parent/api/notifications', isAuthenticated, isRole('parent'), (req, res) => {
  res.json([
    { notification_id: 1, title: 'Welcome to College Management System', message: 'Welcome to the new academic year! Please check your child\'s progress regularly.', target_role: 'parent', is_read: false, created_at: new Date().toISOString() },
    { notification_id: 2, title: 'Mid-term Exams Announcement', message: 'Mid-term examinations will be conducted from 15th to 20th of next month.', target_role: 'all', is_read: false, created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { notification_id: 3, title: 'Fee Payment Reminder', message: 'Please ensure your child\'s pending dues are cleared before the end of this month.', target_role: 'parent', is_read: false, created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
    { notification_id: 4, title: 'Parent-Teacher Meeting', message: 'Parent-teacher meeting scheduled for next Saturday at 10 AM. Please confirm your attendance.', target_role: 'parent', is_read: true, created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }
  ]);
});

// Mark notification as read
app.put('/parent/api/notifications/:id/read', isAuthenticated, isRole('parent'), (req, res) => {
  res.json({ success: true });
});

// Admin page routes
app.get('/admin/dashboard',           isAuthenticated, isRole('admin'), (req, res) => res.sendFile('admin-dashboard.html',        { root: './views' }));
app.get('/admin/students',            isAuthenticated, isRole('admin'), (req, res) => res.sendFile('admin-students.html',          { root: './views' }));
app.get('/admin/staff',               isAuthenticated, isRole('admin'), (req, res) => res.sendFile('admin-staff.html',             { root: './views' }));
app.get('/admin/courses',             isAuthenticated, isRole('admin'), (req, res) => res.sendFile('admin-courses.html',           { root: './views' }));
app.get('/admin/timetable',           isAuthenticated, isRole('admin'), (req, res) => res.sendFile('admin-timetable.html',         { root: './views' }));
app.get('/admin/exams',               isAuthenticated, isRole('admin'), (req, res) => res.sendFile('admin-exams.html',             { root: './views' }));
app.get('/admin/fees',                isAuthenticated, isRole('admin'), (req, res) => res.sendFile('admin-fees.html',              { root: './views' }));
app.get('/admin/notifications',       isAuthenticated, isRole('admin'), (req, res) => res.sendFile('admin-notifications.html',     { root: './views' }));
app.get('/admin/settings',            isAuthenticated, isRole('admin'), (req, res) => res.sendFile('admin-settings.html',          { root: './views' }));
app.get('/admin/attendance-reports',  isAuthenticated, isRole('admin'), (req, res) => res.sendFile('admin-attendance-reports.html',{ root: './views' }));
app.get('/admin/results-reports',     isAuthenticated, isRole('admin'), (req, res) => res.sendFile('admin-results-reports.html',   { root: './views' }));

// Admin API: legacy stats
app.get('/admin/api/stats', isAuthenticated, isRole('admin'), (req, res) => {
  res.json({ students: 150, staff: 25, courses: 45 });
});

// Admin API: system-stats (used by new dashboard)
app.get('/admin/api/system-stats', isAuthenticated, isRole('admin'), async (req, res) => {
  let students = demoStudents.filter(s => !s.deleted).length;
  let staff    = demoStaff.length;
  let courses  = demoCourses.length;
  let exams    = demoExams.length;

  if (db) {
    try {
      const [[s]] = await db.query('SELECT COUNT(*) as c FROM Student');
      const [[c]] = await db.query('SELECT COUNT(*) as c FROM Course');
      const [[e]] = await db.query('SELECT COUNT(*) as c FROM Exam');
      let f = 0;
      try { const [[fac]] = await db.query('SELECT COUNT(*) as c FROM Faculty'); f = fac.c; } catch(_) {}
      students = s.c; courses = c.c; exams = e.c; staff = f;
    } catch(_) {}
  }

  res.json({
    success: true,
    data: {
      students, staff, courses, exams,
      fee_defaulters: 0, total_revenue: 0,
      notifications: 6, open_tickets: 0,
      recent_activity: [
        { action: 'LOGIN',  table_name: 'User',    username: 'admin',     created_at: new Date() },
        { action: 'CREATE', table_name: 'Student', username: 'admin',     created_at: new Date(Date.now() - 60000) }
      ]
    }
  });
});

// Admin API: students CRUD (demo)
app.get('/admin/api/students', isAuthenticated, isRole('admin'), async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = (req.query.search || '').toLowerCase();
  const department = req.query.department || '';
  const semester = req.query.semester || '';

  // Use real DB if available
  if (db) {
    try {
      let where = 'WHERE 1=1'; const params = [];
      if (search)     { where += ' AND (s.first_name LIKE ? OR s.last_name LIKE ? OR s.email LIKE ?)'; params.push(`%${search}%`,`%${search}%`,`%${search}%`); }
      if (department) { where += ' AND s.department=?'; params.push(department); }
      if (semester)   { where += ' AND s.semester=?';   params.push(semester); }

      const [[{total}]] = await db.query(`SELECT COUNT(*) as total FROM Student s JOIN User u ON s.user_id=u.user_id ${where}`, params);
      const [data] = await db.query(
        `SELECT s.*, u.username, u.is_active FROM Student s JOIN User u ON s.user_id=u.user_id ${where} ORDER BY s.student_id DESC LIMIT ? OFFSET ?`,
        [...params, limit, (page-1)*limit]
      );
      return res.json({ success: true, data, pagination: { page, limit, total, pages: Math.ceil(total/limit)||1 } });
    } catch(e) { console.error('DB students error:', e.message); }
  }

  // Fallback to in-memory demo data
  let data = demoStudents.filter(s => !s.deleted).map(s => ({
    student_id: s.id, first_name: s.first_name, last_name: s.last_name,
    email: s.email, department: s.department, semester: s.semester,
    is_active: s.is_active, username: s.username || s.first_name.toLowerCase()
  }));
  if (search)     data = data.filter(s => (s.first_name+' '+s.last_name+' '+s.email).toLowerCase().includes(search));
  if (department) data = data.filter(s => s.department === department);
  if (semester)   data = data.filter(s => String(s.semester) === String(semester));
  const total = data.length;
  res.json({ success: true, data: data.slice((page-1)*limit, page*limit), pagination: { page, limit, total, pages: Math.ceil(total/limit)||1 } });
});

app.get('/admin/api/students/stats/overview', isAuthenticated, isRole('admin'), async (req, res) => {
  if (db) {
    try {
      const [[stats]] = await db.query(`
        SELECT COUNT(*) as total_students,
               COUNT(CASE WHEN u.is_active=1 THEN 1 END) as active_students,
               COUNT(CASE WHEN u.is_active=0 THEN 1 END) as inactive_students,
               COUNT(DISTINCT s.department) as total_departments
        FROM Student s JOIN User u ON s.user_id=u.user_id`);
      const [byDept] = await db.query('SELECT department, COUNT(*) as count FROM Student GROUP BY department ORDER BY count DESC');
      const [bySem]  = await db.query('SELECT semester, COUNT(*) as count FROM Student GROUP BY semester ORDER BY semester');
      return res.json({ success: true, data: { overview: stats, by_department: byDept, by_semester: bySem } });
    } catch(e) { console.error('DB stats error:', e.message); }
  }
  res.json({ success: true, data: { overview: { total_students: demoStudents.length, active_students: demoStudents.length, inactive_students: 0, total_departments: 5 }, by_department: [], by_semester: [] } });
});

app.get('/admin/api/students/export', isAuthenticated, isRole('admin'), (req, res) => {
  res.json({ success: false, message: 'Export not available in demo mode' });
});

app.get('/admin/api/students/:id', isAuthenticated, isRole('admin'), (req, res) => {
  const s = demoStudents.find(s => s.id == req.params.id && !s.deleted);
  if (!s) return res.status(404).json({ success: false, message: 'Student not found' });
  res.json({ success: true, data: { ...s, student_id: s.id, is_active: s.is_active,
    username: s.username || s.first_name.toLowerCase(), enrollments: [], hostel: null, parents: [] } });
});

app.post('/admin/api/students', isAuthenticated, isRole('admin'), (req, res) => {
  const { username, password, roll_number, first_name, last_name, email, phone,
          date_of_birth, gender, blood_group, address, city, state, pincode,
          enrollment_date, department, semester } = req.body;

  // Basic validation
  if (!first_name || !last_name || !email || !department || !semester) {
    return res.status(400).json({ success: false, message: 'Required fields: first_name, last_name, email, department, semester' });
  }

  // Check duplicate email
  if (demoStudents.find(s => s.email === email)) {
    return res.status(400).json({ success: false, message: 'Email already exists' });
  }

  // Check duplicate roll number
  if (roll_number && demoStudents.find(s => s.roll_number === roll_number)) {
    return res.status(400).json({ success: false, message: 'Roll number already exists' });
  }

  const newStudent = {
    id: nextStudentId++,
    student_id: nextStudentId - 1,
    roll_number: roll_number || `CS${String(nextStudentId - 1).padStart(3,'0')}`,
    first_name, last_name, email,
    phone: phone || '',
    date_of_birth: date_of_birth || null,
    gender: gender || '',
    blood_group: blood_group || '',
    address: address || '',
    city: city || '',
    state: state || '',
    pincode: pincode || '',
    enrollment_date: enrollment_date || new Date().toISOString().split('T')[0],
    department, semester: parseInt(semester),
    username: username || first_name.toLowerCase() + nextStudentId,
    is_active: true
  };

  demoStudents.push(newStudent);
  res.status(201).json({ success: true, message: 'Student created successfully', data: { student_id: newStudent.id } });
});

app.put('/admin/api/students/:id', isAuthenticated, isRole('admin'), (req, res) => {
  const idx = demoStudents.findIndex(s => s.id == req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Student not found' });
  const { first_name, last_name, email, phone, date_of_birth, gender, blood_group,
          address, city, state, pincode, department, semester } = req.body;
  demoStudents[idx] = { ...demoStudents[idx], first_name, last_name, email, phone,
    date_of_birth, gender, blood_group, address, city, state, pincode, department,
    semester: parseInt(semester) };
  res.json({ success: true, message: 'Student updated successfully' });
});

app.delete('/admin/api/students/:id', isAuthenticated, isRole('admin'), (req, res) => {
  const idx = demoStudents.findIndex(s => s.id == req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Student not found' });
  demoStudents[idx].is_active = false;
  demoStudents[idx].deleted = true;
  res.json({ success: true, message: 'Student deleted successfully' });
});

app.patch('/admin/api/students/:id/toggle-status', isAuthenticated, isRole('admin'), (req, res) => {
  const idx = demoStudents.findIndex(s => s.id == req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Student not found' });
  demoStudents[idx].is_active = !demoStudents[idx].is_active;
  res.json({ success: true, message: `Student ${demoStudents[idx].is_active ? 'activated' : 'deactivated'}`, data: { is_active: demoStudents[idx].is_active } });
});

// Admin API: staff CRUD (demo)
app.get('/admin/api/staff', isAuthenticated, isRole('admin'), (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const data = demoStaff.map((s, i) => ({
    staff_id: i + 1, employee_id: `EMP${String(i+1).padStart(3,'0')}`,
    first_name: s.first_name, last_name: s.last_name, email: s.email,
    department: s.department, designation: s.designation || 'Professor',
    is_active: true, username: s.username || s.first_name.toLowerCase()
  }));
  const total = data.length;
  const offset = (page - 1) * limit;
  res.json({ success: true, data: data.slice(offset, offset + limit),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

app.get('/admin/api/staff/stats/overview', isAuthenticated, isRole('admin'), (req, res) => {
  res.json({ success: true, data: { overview: { total_staff: 25, active_staff: 23, inactive_staff: 2, total_departments: 5 }, by_department: [], by_designation: [] } });
});

app.get('/admin/api/staff/export', isAuthenticated, isRole('admin'), (req, res) => {
  res.json({ success: false, message: 'Export not available in demo mode' });
});

app.get('/admin/api/staff/:id', isAuthenticated, isRole('admin'), (req, res) => {
  const s = demoStaff[req.params.id - 1];
  if (!s) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: { ...s, staff_id: req.params.id, employee_id: `EMP${String(req.params.id).padStart(3,'0')}`, is_active: true, courses: [] } });
});

app.post('/admin/api/staff', isAuthenticated, isRole('admin'), (req, res) => {
  res.status(201).json({ success: true, message: 'Staff created (demo mode)', data: { staff_id: Date.now() } });
});

app.put('/admin/api/staff/:id', isAuthenticated, isRole('admin'), (req, res) => {
  res.json({ success: true, message: 'Staff updated (demo mode)' });
});

app.delete('/admin/api/staff/:id', isAuthenticated, isRole('admin'), (req, res) => {
  res.json({ success: true, message: 'Staff deleted (demo mode)' });
});

app.patch('/admin/api/staff/:id/toggle-status', isAuthenticated, isRole('admin'), (req, res) => {
  res.json({ success: true, message: 'Status toggled (demo mode)', data: { is_active: true } });
});

// Admin API: courses CRUD (demo)
app.get('/admin/api/courses', isAuthenticated, isRole('admin'), (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const data = demoCourses.map((c, i) => ({
    ...c, course_id: c.course_id || i + 1, is_active: true,
    staff_name: 'Dr. Soubhagya Barpanda', enrolled_students: Math.floor(Math.random() * 40) + 10
  }));
  const total = data.length;
  const offset = (page - 1) * limit;
  res.json({ success: true, data: data.slice(offset, offset + limit),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

app.get('/admin/api/courses/stats/overview', isAuthenticated, isRole('admin'), (req, res) => {
  res.json({ success: true, data: { overview: { total_courses: 45, active_courses: 42, inactive_courses: 3, total_departments: 5, total_enrollments: 380 }, by_department: [], by_semester: [] } });
});

app.get('/admin/api/courses/:id', isAuthenticated, isRole('admin'), (req, res) => {
  const c = demoCourses.find(c => c.course_id == req.params.id) || demoCourses[0];
  res.json({ success: true, data: { ...c, is_active: true, enrolled_students: [], timetable: [] } });
});

app.post('/admin/api/courses', isAuthenticated, isRole('admin'), (req, res) => {
  res.status(201).json({ success: true, message: 'Course created (demo mode)', data: { course_id: Date.now() } });
});

app.put('/admin/api/courses/:id', isAuthenticated, isRole('admin'), (req, res) => {
  res.json({ success: true, message: 'Course updated (demo mode)' });
});

app.delete('/admin/api/courses/:id', isAuthenticated, isRole('admin'), (req, res) => {
  res.json({ success: true, message: 'Course deleted (demo mode)' });
});

// Admin API: timetable (demo)
app.get('/admin/api/timetable', isAuthenticated, isRole('admin'), (req, res) => {
  res.json({ success: true, data: [
    { timetable_id: 1, course_id: 1, course_code: 'CS101', course_name: 'Introduction to Programming', day_of_week: 'Monday', start_time: '09:00:00', end_time: '10:30:00', room_number: 'Room 101', semester: 1, staff_name: 'Dr. Soubhagya' },
    { timetable_id: 2, course_id: 2, course_code: 'CS201', course_name: 'Data Structures', day_of_week: 'Tuesday', start_time: '11:00:00', end_time: '12:30:00', room_number: 'Room 202', semester: 3, staff_name: 'Dr. Soubhagya' },
    { timetable_id: 3, course_id: 3, course_code: 'CS301', course_name: 'Database Management', day_of_week: 'Wednesday', start_time: '14:00:00', end_time: '15:30:00', room_number: 'Lab 1', semester: 5, staff_name: 'Dr. Soubhagya' }
  ]});
});

app.post('/admin/api/timetable', isAuthenticated, isRole('admin'), (req, res) => {
  res.status(201).json({ success: true, message: 'Timetable entry created (demo mode)', data: { timetable_id: Date.now() } });
});

app.put('/admin/api/timetable/:id', isAuthenticated, isRole('admin'), (req, res) => {
  res.json({ success: true, message: 'Timetable entry updated (demo mode)' });
});

app.delete('/admin/api/timetable/:id', isAuthenticated, isRole('admin'), (req, res) => {
  res.json({ success: true, message: 'Timetable entry deleted (demo mode)' });
});

// Admin API: exams (demo)
app.get('/admin/api/exams', isAuthenticated, isRole('admin'), (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const data = demoExams.map(e => ({ ...e, course_code: 'CS201', course_name: 'Data Structures', submission_count: 35 }));
  res.json({ success: true, data: data.slice(0, limit), pagination: { page, limit, total: data.length, pages: 1 } });
});

app.get('/admin/api/exams/:id', isAuthenticated, isRole('admin'), (req, res) => {
  const e = demoExams.find(e => e.exam_id == req.params.id) || demoExams[0];
  res.json({ success: true, data: { ...e, course_code: 'CS201', course_name: 'Data Structures', results: [], stats: null } });
});

app.get('/admin/api/exams/:id/students', isAuthenticated, isRole('admin'), (req, res) => {
  res.json({ success: true, data: demoStudents.map(s => ({ student_id: s.id, roll_number: `CS${String(s.id).padStart(3,'0')}`, first_name: s.first_name, last_name: s.last_name, marks_obtained: null, grade: null })) });
});

app.post('/admin/api/exams', isAuthenticated, isRole('admin'), (req, res) => {
  res.status(201).json({ success: true, message: 'Exam created (demo mode)', data: { exam_id: Date.now() } });
});

app.put('/admin/api/exams/:id', isAuthenticated, isRole('admin'), (req, res) => {
  res.json({ success: true, message: 'Exam updated (demo mode)' });
});

app.delete('/admin/api/exams/:id', isAuthenticated, isRole('admin'), (req, res) => {
  res.json({ success: true, message: 'Exam deleted (demo mode)' });
});

app.post('/admin/api/exams/:id/results', isAuthenticated, isRole('admin'), (req, res) => {
  res.json({ success: true, message: 'Results saved (demo mode)', data: { saved_count: 5 } });
});

app.patch('/admin/api/exams/:id/publish', isAuthenticated, isRole('admin'), (req, res) => {
  res.json({ success: true, message: 'Results published (demo mode)' });
});

// Admin API: fees (demo)
app.get('/admin/api/fee-structures', isAuthenticated, isRole('admin'), (req, res) => {
  res.json({ success: true, data: [
    { fee_structure_id: 1, student_name: 'G. Ujwal', roll_number: 'CS001', semester: 3, academic_year: '2024-25', total_fee: 71000, due_date: '2024-03-31' },
    { fee_structure_id: 2, student_name: 'Sriram', roll_number: 'CS002', semester: 3, academic_year: '2024-25', total_fee: 71000, due_date: '2024-03-31' }
  ], pagination: { page: 1, limit: 10, total: 2, pages: 1 } });
});

app.post('/admin/api/fee-structures', isAuthenticated, isRole('admin'), (req, res) => {
  res.status(201).json({ success: true, message: 'Fee structure created (demo mode)' });
});

app.put('/admin/api/fee-structures/:id', isAuthenticated, isRole('admin'), (req, res) => {
  res.json({ success: true, message: 'Fee structure updated (demo mode)' });
});

app.delete('/admin/api/fee-structures/:id', isAuthenticated, isRole('admin'), (req, res) => {
  res.json({ success: true, message: 'Fee structure deleted (demo mode)' });
});

app.get('/admin/api/payments', isAuthenticated, isRole('admin'), (req, res) => {
  res.json({ success: true, data: [
    { payment_id: 1, student_name: 'G. Ujwal', roll_number: 'CS001', amount: 50000, payment_date: '2024-01-15', payment_method: 'Online', receipt_number: 'RCP001', status: 'paid' },
    { payment_id: 2, student_name: 'Sriram', roll_number: 'CS002', amount: 15000, payment_date: '2024-01-20', payment_method: 'UPI', receipt_number: 'RCP002', status: 'paid' }
  ], pagination: { page: 1, limit: 10, total: 2, pages: 1 } });
});

app.get('/admin/api/fee-defaulters', isAuthenticated, isRole('admin'), (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  res.json({ success: true, data: [
    { student_id: 3, roll_number: 'CS003', student_name: 'Shreekar', department: 'Computer Science', semester: 3, total_due: 71000, paid_amount: 0, pending_amount: 71000, overdue_days: 45, phone: '9876543212' },
    { student_id: 4, roll_number: 'CS004', student_name: 'Sammer', department: 'Computer Science', semester: 3, total_due: 71000, paid_amount: 30000, pending_amount: 41000, overdue_days: 20, phone: '9876543213' }
  ].slice(0, limit), pagination: { page: 1, limit, total: 2, pages: 1 } });
});

app.get('/admin/api/fee-defaulters/export', isAuthenticated, isRole('admin'), (req, res) => {
  res.json({ success: false, message: 'Export not available in demo mode' });
});

app.get('/admin/api/fee-reports/summary', isAuthenticated, isRole('admin'), (req, res) => {
  res.json({ success: true, data: {
    summary: { total_payers: 148, total_collected: 750000, total_transactions: 210, avg_payment: 3571 },
    by_method: [
      { payment_method: 'Online', count: 120, total: 600000 },
      { payment_method: 'UPI', count: 60, total: 120000 },
      { payment_method: 'Cash', count: 30, total: 30000 }
    ],
    monthly: [
      { month: '2024-01', transactions: 45, total: 180000 },
      { month: '2024-02', transactions: 52, total: 210000 },
      { month: '2024-03', transactions: 38, total: 150000 }
    ]
  }});
});

// Admin API: notifications (demo)
app.get('/admin/api/notifications', isAuthenticated, isRole('admin'), (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const data = [
    { notification_id: 1, title: 'Welcome to New Academic Year', message: 'Welcome!', notification_type: 'general', target_role: 'all', priority: 'high', created_at: new Date() },
    { notification_id: 2, title: 'Mid-term Exam Schedule', message: 'Exams from 15th to 20th.', notification_type: 'exam', target_role: 'student', priority: 'high', created_at: new Date(Date.now() - 86400000) },
    { notification_id: 3, title: 'Fee Payment Reminder', message: 'Clear dues before month end.', notification_type: 'fee', target_role: 'student', priority: 'medium', created_at: new Date(Date.now() - 172800000) }
  ];
  res.json({ success: true, data: data.slice(0, limit), pagination: { page, limit, total: data.length, pages: 1 } });
});

app.get('/admin/api/notifications/stats/overview', isAuthenticated, isRole('admin'), (req, res) => {
  res.json({ success: true, data: { overview: { total: 6, unread: 3, urgent: 1, broadcast: 2 }, by_role: [] } });
});

app.get('/admin/api/notifications/:id', isAuthenticated, isRole('admin'), (req, res) => {
  res.json({ success: true, data: { notification_id: req.params.id, title: 'Demo Notification', message: 'Demo message', notification_type: 'general', target_role: 'all', priority: 'medium' } });
});

app.post('/admin/api/notifications', isAuthenticated, isRole('admin'), (req, res) => {
  res.status(201).json({ success: true, message: 'Notification created (demo mode)', data: { notification_id: Date.now() } });
});

app.put('/admin/api/notifications/:id', isAuthenticated, isRole('admin'), (req, res) => {
  res.json({ success: true, message: 'Notification updated (demo mode)' });
});

app.delete('/admin/api/notifications/:id', isAuthenticated, isRole('admin'), (req, res) => {
  res.json({ success: true, message: 'Notification deleted (demo mode)' });
});

app.post('/admin/api/notifications/broadcast', isAuthenticated, isRole('admin'), (req, res) => {
  res.status(201).json({ success: true, message: `Broadcast sent to all ${req.body.target_role}s (demo mode)`, data: { notification_id: Date.now() } });
});

// Admin API: settings (demo)
app.get('/admin/api/settings', isAuthenticated, isRole('admin'), (req, res) => {
  res.json({ success: true, data: [
    { setting_id: 1, setting_key: 'college_name', setting_value: 'ABC College of Engineering', description: 'College Name' },
    { setting_id: 2, setting_key: 'academic_year', setting_value: '2024-2025', description: 'Current Academic Year' },
    { setting_id: 3, setting_key: 'attendance_threshold', setting_value: '75', description: 'Minimum Attendance %' },
    { setting_id: 4, setting_key: 'max_login_attempts', setting_value: '5', description: 'Max Failed Login Attempts' },
    { setting_id: 5, setting_key: 'session_timeout', setting_value: '24', description: 'Session Timeout (hours)' },
    { setting_id: 6, setting_key: 'enable_email_notifications', setting_value: 'true', description: 'Enable Email Notifications' },
    { setting_id: 7, setting_key: 'enable_sms_notifications', setting_value: 'false', description: 'Enable SMS Notifications' }
  ]});
});

app.put('/admin/api/settings/:key', isAuthenticated, isRole('admin'), (req, res) => {
  res.json({ success: true, message: 'Setting updated (demo mode)' });
});

app.get('/admin/api/audit-logs', isAuthenticated, isRole('admin'), (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const data = [
    { log_id: 1, action: 'LOGIN',  table_name: 'User',    record_id: 1, username: 'admin',     ip_address: '127.0.0.1', created_at: new Date() },
    { log_id: 2, action: 'CREATE', table_name: 'Student', record_id: 5, username: 'admin',     ip_address: '127.0.0.1', created_at: new Date(Date.now() - 60000) },
    { log_id: 3, action: 'UPDATE', table_name: 'Course',  record_id: 2, username: 'soubhagya', ip_address: '127.0.0.1', created_at: new Date(Date.now() - 120000) },
    { log_id: 4, action: 'DELETE', table_name: 'Exam',    record_id: 3, username: 'admin',     ip_address: '127.0.0.1', created_at: new Date(Date.now() - 180000) }
  ];
  res.json({ success: true, data: data.slice(0, limit), pagination: { page, limit, total: data.length, pages: 1 } });
});

app.get('/admin/api/alert-configs', isAuthenticated, isRole('admin'), (req, res) => {
  res.json({ success: true, data: [
    { alert_id: 1, alert_type: 'low_attendance', threshold_value: 75, is_active: true, notification_method: 'in_app', message_template: 'Attendance below {threshold}%' },
    { alert_id: 2, alert_type: 'fee_due',        threshold_value: 0,  is_active: true, notification_method: 'all',    message_template: 'Fee due: ₹{amount}' },
    { alert_id: 3, alert_type: 'exam_reminder',  threshold_value: 3,  is_active: true, notification_method: 'in_app', message_template: 'Exam in {days} days' }
  ]});
});

app.put('/admin/api/alert-configs/:id', isAuthenticated, isRole('admin'), (req, res) => {
  res.json({ success: true, message: 'Alert config updated (demo mode)' });
});

app.get('/admin/api/students', isAuthenticated, isRole('admin'), (req, res) => {
  res.json(demoStudents.map(s => ({
    student_id: s.id,
    first_name: s.first_name,
    last_name: s.last_name,
    email: s.email,
    department: s.department,
    semester: s.semester
  })));
});

app.get('/admin/api/all-courses', isAuthenticated, isRole('admin'), (req, res) => {
  res.json(demoCourses);
});

app.get('/admin/api/attendance-report', isAuthenticated, isRole('admin'), (req, res) => {
  const records = [
    { attendance_date: '2024-02-13', student_name: 'G. Ujwal', course_code: 'CS201', course_name: 'Data Structures', status: 'present' },
    { attendance_date: '2024-02-13', student_name: 'Sriram', course_code: 'CS201', course_name: 'Data Structures', status: 'present' },
    { attendance_date: '2024-02-12', student_name: 'G. Ujwal', course_code: 'CS301', course_name: 'Database Systems', status: 'absent' },
    { attendance_date: '2024-02-12', student_name: 'Shreekar', course_code: 'CS101', course_name: 'Introduction to Programming', status: 'late' }
  ];
  res.json({ records });
});

app.get('/admin/api/results-report', isAuthenticated, isRole('admin'), (req, res) => {
  const records = [
    { roll_no: 1, student_name: 'G. Ujwal', course_code: 'CS201', exam_name: 'Mid-Term', marks_obtained: 85, max_marks: 100, grade: 'A' },
    { roll_no: 2, student_name: 'Sriram', course_code: 'CS201', exam_name: 'Mid-Term', marks_obtained: 78, max_marks: 100, grade: 'B+' },
    { roll_no: 3, student_name: 'Shreekar', course_code: 'CS101', exam_name: 'Final Exam', marks_obtained: 92, max_marks: 100, grade: 'A+' }
  ];
  res.json({ records });
});

app.get('/admin/api/all-exams', isAuthenticated, isRole('admin'), (req, res) => {
  res.json(demoExams);
});

// Root redirect
app.get('/', (req, res) => {
  if (req.session.userId) {
    res.redirect(`/${req.session.role}/dashboard`);
  } else {
    res.sendFile('index.html', { root: './views' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('\n🎓 College Management System - DEMO MODE');
  console.log('==========================================');
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log('\n📝 Demo Login Credentials:');
  console.log(`   Admin:   ${DEMO_CREDENTIALS.admin.username} / ${DEMO_CREDENTIALS.admin.password}`);
  console.log(`   Student: ${DEMO_CREDENTIALS.student.username} / ${DEMO_CREDENTIALS.student.password}`);
  console.log(`   Staff:   ${DEMO_CREDENTIALS.staff.username} / ${DEMO_CREDENTIALS.staff.password}`);
  console.log(`   Parent:  ${DEMO_CREDENTIALS.parent.username} / ${DEMO_CREDENTIALS.parent.password}`);
  console.log('\n⚠️  Note: Running in demo mode (no database required)');
  console.log('   To use with MySQL, configure .env and run: npm start\n');
});
