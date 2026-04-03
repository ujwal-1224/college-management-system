console.log("🔥 ADMIN ROUTES FILE LOADED");
const express = require('express');
const router = express.Router();
const path = require('path');

const { isAuthenticated, isRole } = require('../middleware/auth');
const { catchAsync } = require('../middleware/errorHandler');
const db = require('../config/database');

// 🔐 Apply auth to all admin routes
// router.use(isAuthenticated);
// router.use(isRole('admin'));

// ─── PAGE ROUTES (FIXED PATHS) ───────────────────────────────────────────────
router.get('/dashboard', (req, res) =>
  res.sendFile(path.join(__dirname, '../views/admin-dashboard.html'))
);

router.get('/students', (req, res) =>
  res.sendFile(path.join(__dirname, '../views/admin-students.html'))
);

router.get('/staff', (req, res) =>
  res.sendFile(path.join(__dirname, '../views/admin-staff.html'))
);

router.get('/courses', (req, res) =>
  res.sendFile(path.join(__dirname, '../views/admin-courses.html'))
);

router.get('/timetable', (req, res) =>
  res.sendFile(path.join(__dirname, '../views/admin-timetable.html'))
);

router.get('/exams', (req, res) =>
  res.sendFile(path.join(__dirname, '../views/admin-exams.html'))
);

router.get('/fees', (req, res) =>
  res.sendFile(path.join(__dirname, '../views/admin-fees.html'))
);

router.get('/notifications', (req, res) =>
  res.sendFile(path.join(__dirname, '../views/admin-notifications.html'))
);

router.get('/settings', (req, res) =>
  res.sendFile(path.join(__dirname, '../views/admin-settings.html'))
);

router.get('/attendance-reports', (req, res) =>
  res.sendFile(path.join(__dirname, '../views/admin-attendance-reports.html'))
);

router.get('/results-reports', (req, res) =>
  res.sendFile(path.join(__dirname, '../views/admin-results-reports.html'))
);

// ─── API ROUTES ──────────────────────────────────────────────────────────────

// Basic stats (fallback)
router.get('/api/stats', catchAsync(async (req, res) => {
  const [[students]] = await db.query('SELECT COUNT(*) as count FROM Student');
  const [[courses]]  = await db.query('SELECT COUNT(*) as count FROM Course');
  let staff = 0;
  try { [[{ count: staff }]] = await db.query('SELECT COUNT(*) as count FROM Faculty'); } catch(e) {}
  res.json({ students: students.count, staff, courses: courses.count });
}));
  const [[courses]]  = await db.query('SELECT COUNT(*) as count FROM Course WHERE deleted_at IS NULL');

  res.json({
    students: students.count,
    staff: staff.count,
    courses: courses.count
  });
}));

// Courses
router.get('/api/all-courses', catchAsync(async (req, res) => {
  const [courses] = await db.query(
    'SELECT course_id, course_code, course_name FROM Course ORDER BY course_code'
  );
  res.json(courses);
}));

// Exams
router.get('/api/all-exams', catchAsync(async (req, res) => {
  const [exams] = await db.query(`
    SELECT e.*, c.course_code, c.course_name
    FROM Exam e
    JOIN Course c ON e.course_id = c.course_id
    ORDER BY e.exam_date DESC
  `);
  res.json(exams);
}));

// Attendance report
router.get('/api/attendance-report', catchAsync(async (req, res) => {
  const { startDate, endDate, courseId } = req.query;

  let query = `
    SELECT a.*, CONCAT(s.first_name,' ',s.last_name) as student_name,
           c.course_code, c.course_name
    FROM Attendance a
    JOIN Student s ON a.student_id = s.student_id
    JOIN Course c ON a.course_id = c.course_id
    WHERE a.attendance_date BETWEEN ? AND ?
  `;

  const params = [startDate || '2000-01-01', endDate || '2099-12-31'];

  if (courseId) {
    query += ' AND a.course_id = ?';
    params.push(courseId);
  }

  query += ' ORDER BY a.attendance_date DESC, s.first_name';

  const [records] = await db.query(query, params);
  res.json({ records });
}));

// Results report
router.get('/api/results-report', catchAsync(async (req, res) => {
  const { courseId, examId } = req.query;

  let query = `
    SELECT r.*, CONCAT(s.first_name,' ',s.last_name) as student_name,
           s.student_id as roll_no, e.exam_name, e.max_marks, e.exam_date,
           c.course_code, c.course_name
    FROM Result r
    JOIN Student s ON r.student_id = s.student_id
    JOIN Exam e ON r.exam_id = e.exam_id
    JOIN Course c ON e.course_id = c.course_id
    WHERE 1=1
  `;

  const params = [];

  if (courseId) {
    query += ' AND c.course_id = ?';
    params.push(courseId);
  }

  if (examId) {
    query += ' AND e.exam_id = ?';
    params.push(examId);
  }

  query += ' ORDER BY e.exam_date DESC, s.first_name';

  const [records] = await db.query(query, params);
  res.json({ records });
}));

// ─── SUB-ROUTERS ─────────────────────────────────────────────────────────────
router.use('/', require('./admin/students'));
router.use('/', require('./admin/staff'));
router.use('/', require('./admin/courses'));
router.use('/', require('./admin/timetable'));
router.use('/', require('./admin/exams'));
router.use('/', require('./admin/fees'));
router.use('/', require('./admin/notifications'));
router.use('/', require('./admin/settings'));

module.exports = router;