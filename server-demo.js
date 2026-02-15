const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const demoData = require('./config/demoData');

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
  demoStudents, 
  demoStaff, 
  demoParents, 
  demoChildren,
  demoCourses,
  demoAttendance,
  demoResults,
  demoExams,
  DEMO_CREDENTIALS
} = demoData;

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

app.get('/staff/api/students', isAuthenticated, isRole('staff'), (req, res) => {
  res.json(demoStudents.map(s => ({
    student_id: s.id,
    first_name: s.first_name,
    last_name: s.last_name,
    email: s.email,
    department: s.department,
    semester: s.semester
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

// Admin routes
app.get('/admin/dashboard', isAuthenticated, isRole('admin'), (req, res) => {
  res.sendFile('admin-dashboard.html', { root: './views' });
});

app.get('/admin/attendance-reports', isAuthenticated, isRole('admin'), (req, res) => {
  res.sendFile('admin-attendance-reports.html', { root: './views' });
});

app.get('/admin/results-reports', isAuthenticated, isRole('admin'), (req, res) => {
  res.sendFile('admin-results-reports.html', { root: './views' });
});

app.get('/admin/api/stats', isAuthenticated, isRole('admin'), (req, res) => {
  res.json({
    students: 150,
    faculty: 25,
    courses: 45
  });
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
