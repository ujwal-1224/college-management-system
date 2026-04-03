const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { catchAsync, AppError } = require('../../middleware/errorHandler');
const { auditLog } = require('../../middleware/logger');
const { paginate } = require('../../utils/helpers');
const db = require('../../config/database');

// ── GET ALL STUDENTS ──────────────────────────────────────────
router.get('/api/students', catchAsync(async (req, res) => {
  const { page = 1, limit = 10, search = '', department = '', semester = '' } = req.query;
  const { limit: qLimit, offset } = paginate(page, limit);

  let where = 'WHERE 1=1';
  const params = [];

  if (search) {
    where += ' AND (s.first_name LIKE ? OR s.last_name LIKE ? OR s.email LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (department) { where += ' AND s.department = ?'; params.push(department); }
  if (semester)   { where += ' AND s.semester = ?';   params.push(semester); }

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) as total FROM Student s JOIN User u ON s.user_id = u.user_id ${where}`,
    params
  );

  const [students] = await db.query(
    `SELECT s.*, u.username, u.is_active, u.last_login
     FROM Student s JOIN User u ON s.user_id = u.user_id
     ${where} ORDER BY s.student_id DESC LIMIT ? OFFSET ?`,
    [...params, qLimit, offset]
  );

  res.json({
    success: true,
    data: students,
    pagination: { page: +page, limit: qLimit, total, pages: Math.ceil(total / qLimit) || 1 }
  });
}));

// ── GET STATS ─────────────────────────────────────────────────
router.get('/api/students/stats/overview', catchAsync(async (req, res) => {
  const [[stats]] = await db.query(`
    SELECT COUNT(*) as total_students,
           COUNT(CASE WHEN u.is_active=1 THEN 1 END) as active_students,
           COUNT(CASE WHEN u.is_active=0 THEN 1 END) as inactive_students,
           COUNT(DISTINCT s.department) as total_departments
    FROM Student s JOIN User u ON s.user_id = u.user_id`);

  const [byDept] = await db.query(
    'SELECT department, COUNT(*) as count FROM Student GROUP BY department ORDER BY count DESC');
  const [bySem] = await db.query(
    'SELECT semester, COUNT(*) as count FROM Student GROUP BY semester ORDER BY semester');

  res.json({ success: true, data: { overview: stats, by_department: byDept, by_semester: bySem } });
}));

// ── EXPORT ────────────────────────────────────────────────────
router.get('/api/students/export', catchAsync(async (req, res) => {
  const { department = '', semester = '' } = req.query;
  let where = 'WHERE 1=1'; const params = [];
  if (department) { where += ' AND s.department=?'; params.push(department); }
  if (semester)   { where += ' AND s.semester=?';   params.push(semester); }

  const [students] = await db.query(
    `SELECT s.*, u.username, u.is_active FROM Student s
     JOIN User u ON s.user_id=u.user_id ${where} ORDER BY s.student_id DESC`, params);

  const { exportStudentsToExcel } = require('../../utils/excelExport');
  const workbook = await exportStudentsToExcel(students);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=students_${Date.now()}.xlsx`);
  await workbook.xlsx.write(res);
  res.end();
}));

// ── GET SINGLE ────────────────────────────────────────────────
router.get('/api/students/:id', catchAsync(async (req, res) => {
  const [rows] = await db.query(
    `SELECT s.*, u.username, u.is_active, u.last_login
     FROM Student s JOIN User u ON s.user_id=u.user_id WHERE s.student_id=?`,
    [req.params.id]);

  if (!rows.length) throw new AppError('Student not found', 404);
  res.json({ success: true, data: { ...rows[0], enrollments: [], hostel: null, parents: [] } });
}));

// ── CREATE ────────────────────────────────────────────────────
router.post('/api/students', catchAsync(async (req, res) => {
  const { username, password, first_name, last_name, email,
          phone, date_of_birth, enrollment_date, department, semester } = req.body;

  if (!first_name || !last_name || !email || !department || !semester) {
    throw new AppError('Required: first_name, last_name, email, department, semester', 400);
  }

  // Duplicate checks
  const [[dupUser]] = await db.query('SELECT user_id FROM User WHERE username=?', [username]);
  if (dupUser) throw new AppError('Username already exists', 400);

  const [[dupEmail]] = await db.query('SELECT student_id FROM Student WHERE email=?', [email]);
  if (dupEmail) throw new AppError('Email already exists', 400);

  const hashed = await bcrypt.hash(password || 'Student@123', 10);
  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    const [userRes] = await conn.query(
      'INSERT INTO User (username, password, role) VALUES (?, ?, ?)',
      [username || first_name.toLowerCase() + Date.now(), hashed, 'student']
    );

    const [stuRes] = await conn.query(
      `INSERT INTO Student (user_id, first_name, last_name, email, phone,
         date_of_birth, enrollment_date, department, semester)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userRes.insertId, first_name, last_name, email,
       phone || null, date_of_birth || null,
       enrollment_date || new Date().toISOString().split('T')[0],
       department, semester]
    );

    await conn.commit();
    await auditLog('CREATE', 'Student', stuRes.insertId, req.session.userId, null,
      { first_name, last_name, email, department, semester }, req);

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: { student_id: stuRes.insertId, user_id: userRes.insertId }
    });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

// ── UPDATE ────────────────────────────────────────────────────
router.put('/api/students/:id', catchAsync(async (req, res) => {
  const { first_name, last_name, email, phone, date_of_birth,
          enrollment_date, department, semester } = req.body;

  const [[existing]] = await db.query('SELECT * FROM Student WHERE student_id=?', [req.params.id]);
  if (!existing) throw new AppError('Student not found', 404);

  if (email && email !== existing.email) {
    const [[dup]] = await db.query('SELECT student_id FROM Student WHERE email=? AND student_id!=?', [email, req.params.id]);
    if (dup) throw new AppError('Email already exists', 400);
  }

  await db.query(
    `UPDATE Student SET first_name=?, last_name=?, email=?, phone=?,
     date_of_birth=?, enrollment_date=?, department=?, semester=?
     WHERE student_id=?`,
    [first_name, last_name, email, phone || null, date_of_birth || null,
     enrollment_date || existing.enrollment_date, department, semester, req.params.id]
  );

  await auditLog('UPDATE', 'Student', req.params.id, req.session.userId, existing,
    { first_name, last_name, email, department, semester }, req);

  res.json({ success: true, message: 'Student updated successfully' });
}));

// ── DELETE ────────────────────────────────────────────────────
router.delete('/api/students/:id', catchAsync(async (req, res) => {
  const [[existing]] = await db.query(
    'SELECT s.*, u.user_id FROM Student s JOIN User u ON s.user_id=u.user_id WHERE s.student_id=?',
    [req.params.id]);
  if (!existing) throw new AppError('Student not found', 404);

  await db.query('DELETE FROM Student WHERE student_id=?', [req.params.id]);
  await db.query('UPDATE User SET is_active=0 WHERE user_id=?', [existing.user_id]);

  await auditLog('DELETE', 'Student', req.params.id, req.session.userId, existing, null, req);
  res.json({ success: true, message: 'Student deleted successfully' });
}));

// ── TOGGLE STATUS ─────────────────────────────────────────────
router.patch('/api/students/:id/toggle-status', catchAsync(async (req, res) => {
  const [[s]] = await db.query(
    'SELECT u.is_active, u.user_id FROM Student s JOIN User u ON s.user_id=u.user_id WHERE s.student_id=?',
    [req.params.id]);
  if (!s) throw new AppError('Student not found', 404);

  const newStatus = !s.is_active;
  await db.query('UPDATE User SET is_active=? WHERE user_id=?', [newStatus, s.user_id]);
  res.json({ success: true, message: `Student ${newStatus ? 'activated' : 'deactivated'}`, data: { is_active: newStatus } });
}));

module.exports = router;
