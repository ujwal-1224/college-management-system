const express = require('express');
const router = express.Router();
const { catchAsync, AppError } = require('../../middleware/errorHandler');
const { validateExam, validateMarks, validateId, validatePagination } = require('../../middleware/validation');
const { auditLog } = require('../../middleware/logger');
const { paginate, calculateGrade } = require('../../utils/helpers');
const db = require('../../config/database');

// Get all exams with pagination and filters
router.get('/api/exams', validatePagination, catchAsync(async (req, res) => {
  const { page = 1, limit = 10, course_id, exam_type, search } = req.query;
  const { limit: queryLimit, offset } = paginate(page, limit);

  let query = `
    SELECT e.*, c.course_code, c.course_name, c.department,
           CONCAT(st.first_name, ' ', st.last_name) as created_by_name,
           COUNT(r.result_id) as submissions
    FROM Exam e
    JOIN Course c ON e.course_id = c.course_id
    LEFT JOIN Staff st ON e.created_by = st.staff_id
    LEFT JOIN Result r ON e.exam_id = r.exam_id
    WHERE e.deleted_at IS NULL
  `;
  const params = [];

  if (course_id) { query += ' AND e.course_id = ?'; params.push(course_id); }
  if (exam_type) { query += ' AND e.exam_type = ?'; params.push(exam_type); }
  if (search) { query += ' AND (e.exam_name LIKE ? OR c.course_code LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

  query += ' GROUP BY e.exam_id';

  const [countResult] = await db.query(`SELECT COUNT(*) as total FROM (${query}) as sub`, params);
  const total = countResult[0].total;

  query += ' ORDER BY e.exam_date DESC LIMIT ? OFFSET ?';
  params.push(queryLimit, offset);

  const [exams] = await db.query(query, params);

  res.json({
    success: true,
    data: exams,
    pagination: { page: parseInt(page), limit: queryLimit, total, pages: Math.ceil(total / queryLimit) }
  });
}));

// Get single exam with results
router.get('/api/exams/:id', validateId, catchAsync(async (req, res) => {
  const [exams] = await db.query(`
    SELECT e.*, c.course_code, c.course_name, c.department
    FROM Exam e JOIN Course c ON e.course_id = c.course_id
    WHERE e.exam_id = ? AND e.deleted_at IS NULL
  `, [req.params.id]);

  if (exams.length === 0) throw new AppError('Exam not found', 404);

  const [results] = await db.query(`
    SELECT r.*, s.roll_number, CONCAT(s.first_name, ' ', s.last_name) as student_name,
           s.department, s.semester
    FROM Result r JOIN Student s ON r.student_id = s.student_id
    WHERE r.exam_id = ?
    ORDER BY r.marks_obtained DESC
  `, [req.params.id]);

  // Stats
  const stats = results.length > 0 ? {
    total: results.length,
    avg: (results.reduce((s, r) => s + parseFloat(r.marks_obtained), 0) / results.length).toFixed(2),
    highest: Math.max(...results.map(r => parseFloat(r.marks_obtained))),
    lowest: Math.min(...results.map(r => parseFloat(r.marks_obtained))),
    pass_count: results.filter(r => r.grade !== 'F').length
  } : null;

  res.json({ success: true, data: { ...exams[0], results, stats } });
}));

// Create exam
router.post('/api/exams', validateExam, catchAsync(async (req, res) => {
  const { course_id, exam_name, exam_type, exam_date, max_marks, duration_minutes, description } = req.body;

  const [course] = await db.query('SELECT course_id, staff_id FROM Course WHERE course_id = ? AND deleted_at IS NULL', [course_id]);
  if (course.length === 0) throw new AppError('Course not found', 404);

  // Get staff_id for created_by
  let staffId = null;
  if (req.session.role === 'staff') {
    const [staff] = await db.query('SELECT staff_id FROM Staff WHERE user_id = ?', [req.session.userId]);
    if (staff.length > 0) staffId = staff[0].staff_id;
  }

  const [result] = await db.query(
    `INSERT INTO Exam (course_id, exam_name, exam_type, exam_date, max_marks, duration_minutes, description, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [course_id, exam_name, exam_type, exam_date, max_marks, duration_minutes, description, staffId]
  );

  await auditLog('CREATE', 'Exam', result.insertId, req.session.userId, null,
    { course_id, exam_name, exam_type, exam_date, max_marks }, req);

  res.status(201).json({ success: true, message: 'Exam created successfully', data: { exam_id: result.insertId } });
}));

// Update exam
router.put('/api/exams/:id', validateId, catchAsync(async (req, res) => {
  const { exam_name, exam_type, exam_date, max_marks, duration_minutes, description } = req.body;

  const [existing] = await db.query('SELECT * FROM Exam WHERE exam_id = ? AND deleted_at IS NULL', [req.params.id]);
  if (existing.length === 0) throw new AppError('Exam not found', 404);

  await db.query(
    `UPDATE Exam SET exam_name=?, exam_type=?, exam_date=?, max_marks=?, duration_minutes=?, description=?
     WHERE exam_id=?`,
    [exam_name, exam_type, exam_date, max_marks, duration_minutes, description, req.params.id]
  );

  await auditLog('UPDATE', 'Exam', req.params.id, req.session.userId, existing[0],
    { exam_name, exam_type, exam_date, max_marks }, req);

  res.json({ success: true, message: 'Exam updated successfully' });
}));

// Delete exam
router.delete('/api/exams/:id', validateId, catchAsync(async (req, res) => {
  const [existing] = await db.query('SELECT * FROM Exam WHERE exam_id = ? AND deleted_at IS NULL', [req.params.id]);
  if (existing.length === 0) throw new AppError('Exam not found', 404);

  const [results] = await db.query('SELECT COUNT(*) as count FROM Result WHERE exam_id = ?', [req.params.id]);
  if (results[0].count > 0) throw new AppError('Cannot delete exam with existing results', 400);

  await db.query('UPDATE Exam SET deleted_at = NOW() WHERE exam_id = ?', [req.params.id]);
  await auditLog('DELETE', 'Exam', req.params.id, req.session.userId, existing[0], null, req);

  res.json({ success: true, message: 'Exam deleted successfully' });
}));

// Save/update results for an exam
router.post('/api/exams/:id/results', validateId, validateMarks, catchAsync(async (req, res) => {
  const examId = req.params.id;
  const { grades } = req.body;

  const [exam] = await db.query('SELECT * FROM Exam WHERE exam_id = ? AND deleted_at IS NULL', [examId]);
  if (exam.length === 0) throw new AppError('Exam not found', 404);

  const maxMarks = exam[0].max_marks;
  const saved = [], errors = [];

  for (const g of grades) {
    if (parseFloat(g.marks_obtained) > maxMarks) {
      errors.push({ student_id: g.student_id, error: `Marks cannot exceed ${maxMarks}` });
      continue;
    }
    if (parseFloat(g.marks_obtained) < 0) {
      errors.push({ student_id: g.student_id, error: 'Marks cannot be negative' });
      continue;
    }

    const grade = calculateGrade(g.marks_obtained, maxMarks);

    await db.query(
      `INSERT INTO Result (student_id, exam_id, marks_obtained, grade)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE marks_obtained = ?, grade = ?`,
      [g.student_id, examId, g.marks_obtained, grade, g.marks_obtained, grade]
    );
    saved.push(g.student_id);
  }

  await auditLog('SAVE_RESULTS', 'Exam', examId, req.session.userId, null,
    { saved_count: saved.length }, req);

  res.json({
    success: true,
    message: `Results saved for ${saved.length} students`,
    data: { saved_count: saved.length, error_count: errors.length, errors: errors.length ? errors : undefined }
  });
}));

// Publish results
router.patch('/api/exams/:id/publish', validateId, catchAsync(async (req, res) => {
  const [exam] = await db.query('SELECT * FROM Exam WHERE exam_id = ? AND deleted_at IS NULL', [req.params.id]);
  if (exam.length === 0) throw new AppError('Exam not found', 404);

  await db.query('UPDATE Result SET is_published = TRUE WHERE exam_id = ?', [req.params.id]);
  await auditLog('PUBLISH_RESULTS', 'Exam', req.params.id, req.session.userId, null, null, req);

  res.json({ success: true, message: 'Results published successfully' });
}));

// Get students for an exam (enrolled in the course)
router.get('/api/exams/:id/students', validateId, catchAsync(async (req, res) => {
  const [exam] = await db.query('SELECT * FROM Exam WHERE exam_id = ? AND deleted_at IS NULL', [req.params.id]);
  if (exam.length === 0) throw new AppError('Exam not found', 404);

  const [students] = await db.query(`
    SELECT s.student_id, s.roll_number, CONCAT(s.first_name, ' ', s.last_name) as student_name,
           s.department, s.semester,
           r.marks_obtained, r.grade, r.is_published
    FROM CourseEnrollment ce
    JOIN Student s ON ce.student_id = s.student_id
    LEFT JOIN Result r ON r.student_id = s.student_id AND r.exam_id = ?
    WHERE ce.course_id = ? AND ce.status = 'active' AND s.deleted_at IS NULL
    ORDER BY s.roll_number
  `, [exam[0].exam_id, exam[0].course_id]);

  res.json({ success: true, data: students });
}));

// Export results to Excel
router.get('/api/exams/:id/export', validateId, catchAsync(async (req, res) => {
  const [exam] = await db.query(`
    SELECT e.*, c.course_code, c.course_name FROM Exam e
    JOIN Course c ON e.course_id = c.course_id
    WHERE e.exam_id = ? AND e.deleted_at IS NULL
  `, [req.params.id]);
  if (exam.length === 0) throw new AppError('Exam not found', 404);

  const [results] = await db.query(`
    SELECT s.roll_number, CONCAT(s.first_name, ' ', s.last_name) as student_name,
           s.department, r.marks_obtained, r.grade, e.max_marks, e.exam_name,
           c.course_code, c.course_name
    FROM Result r
    JOIN Student s ON r.student_id = s.student_id
    JOIN Exam e ON r.exam_id = e.exam_id
    JOIN Course c ON e.course_id = c.course_id
    WHERE r.exam_id = ?
    ORDER BY r.marks_obtained DESC
  `, [req.params.id]);

  const { exportMarksToExcel } = require('../../utils/excelExport');
  const workbook = await exportMarksToExcel(results.map(r => ({
    ...r, roll_no: r.roll_number, student_name: r.student_name
  })), exam[0]);

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=exam_results_${req.params.id}_${Date.now()}.xlsx`);
  await workbook.xlsx.write(res);
  res.end();
}));

module.exports = router;
