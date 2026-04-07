const express = require('express');
const router = express.Router();
const { catchAsync, AppError } = require('../../middleware/errorHandler');
const { auditLog } = require('../../middleware/logger');
const { paginate, calculateGrade } = require('../../utils/helpers');
const db = require('../../config/database');

// Helper: detect available columns
async function cols(table) {
  try {
    const [rows] = await db.query(`SHOW COLUMNS FROM ${table}`);
    return rows.map(r => r.Field);
  } catch(e) { return []; }
}

// Get all exams
router.get('/api/exams', catchAsync(async (req, res) => {
  const { page = 1, limit = 10, course_id, exam_type, search } = req.query;
  const { limit: queryLimit, offset } = paginate(page, limit);

  const examCols = await cols('Exam');
  const hasDeleted  = examCols.includes('deleted_at');
  const hasExamType = examCols.includes('exam_type');

  let query = `
    SELECT e.exam_id, e.course_id, e.exam_name, e.exam_date, e.max_marks,
           ${hasExamType ? 'e.exam_type,' : "'quiz' as exam_type,"}
           c.course_code, c.course_name, c.department,
           COUNT(r.result_id) as submission_count
    FROM Exam e
    JOIN Course c ON e.course_id = c.course_id
    LEFT JOIN Result r ON e.exam_id = r.exam_id
    WHERE 1=1 ${hasDeleted ? 'AND e.deleted_at IS NULL' : ''}
  `;
  const params = [];

  if (course_id) { query += ' AND e.course_id = ?'; params.push(course_id); }
  if (exam_type && hasExamType) { query += ' AND e.exam_type = ?'; params.push(exam_type); }
  if (search) { query += ' AND (e.exam_name LIKE ? OR c.course_code LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

  query += ' GROUP BY e.exam_id';

  const [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM (${query}) as sub`, params);
  query += ' ORDER BY e.exam_date DESC LIMIT ? OFFSET ?';
  params.push(queryLimit, offset);

  const [exams] = await db.query(query, params);
  res.json({ success: true, data: exams, pagination: { page: +page, limit: queryLimit, total, pages: Math.ceil(total / queryLimit) || 1 } });
}));

// Get single exam
router.get('/api/exams/:id', catchAsync(async (req, res) => {
  const examCols = await cols('Exam');
  const hasDeleted  = examCols.includes('deleted_at');
  const hasExamType = examCols.includes('exam_type');

  const [exams] = await db.query(`
    SELECT e.*, ${hasExamType ? '' : "'quiz' as exam_type,"} c.course_code, c.course_name, c.department
    FROM Exam e JOIN Course c ON e.course_id = c.course_id
    WHERE e.exam_id = ? ${hasDeleted ? 'AND e.deleted_at IS NULL' : ''}
  `, [req.params.id]);

  if (!exams.length) throw new AppError('Exam not found', 404);

  const resultCols = await cols('Result');
  const hasPublished = resultCols.includes('is_published');

  const [results] = await db.query(`
    SELECT r.*, CONCAT(s.first_name,' ',s.last_name) as student_name,
           s.department, s.semester
    FROM Result r JOIN Student s ON r.student_id = s.student_id
    WHERE r.exam_id = ? ORDER BY r.marks_obtained DESC
  `, [req.params.id]);

  res.json({ success: true, data: { ...exams[0], results } });
}));

// Create exam
router.post('/api/exams', catchAsync(async (req, res) => {
  const { course_id, exam_name, exam_type, exam_date, max_marks, duration_minutes, description } = req.body;
  if (!course_id || !exam_name || !exam_date || !max_marks) throw new AppError('Required fields missing', 400);

  const examCols = await cols('Exam');
  const hasExamType = examCols.includes('exam_type');
  const hasDuration = examCols.includes('duration_minutes');
  const hasDesc     = examCols.includes('description');
  const hasCreatedBy = examCols.includes('created_by');

  let staffId = null;
  if (hasCreatedBy && req.session.role === 'staff') {
    const [s] = await db.query('SELECT staff_id FROM Staff WHERE user_id=?', [req.session.userId]);
    if (s.length) staffId = s[0].staff_id;
  }

  const fields = ['course_id','exam_name','exam_date','max_marks'];
  const values = [course_id, exam_name, exam_date, max_marks];
  if (hasExamType)  { fields.push('exam_type');         values.push(exam_type || 'quiz'); }
  if (hasDuration)  { fields.push('duration_minutes');  values.push(duration_minutes || null); }
  if (hasDesc)      { fields.push('description');       values.push(description || null); }
  if (hasCreatedBy) { fields.push('created_by');        values.push(staffId); }

  const [result] = await db.query(
    `INSERT INTO Exam (${fields.join(',')}) VALUES (${fields.map(()=>'?').join(',')})`, values
  );
  res.status(201).json({ success: true, message: 'Exam created', data: { exam_id: result.insertId } });
}));

// Update exam
router.put('/api/exams/:id', catchAsync(async (req, res) => {
  const { exam_name, exam_type, exam_date, max_marks, duration_minutes, description } = req.body;
  const examCols = await cols('Exam');
  const hasDeleted  = examCols.includes('deleted_at');
  const hasExamType = examCols.includes('exam_type');

  const [existing] = await db.query(`SELECT * FROM Exam WHERE exam_id=? ${hasDeleted ? 'AND deleted_at IS NULL' : ''}`, [req.params.id]);
  if (!existing.length) throw new AppError('Exam not found', 404);

  const sets = ['exam_name=?','exam_date=?','max_marks=?'];
  const vals = [exam_name, exam_date, max_marks];
  if (hasExamType) { sets.push('exam_type=?'); vals.push(exam_type); }
  vals.push(req.params.id);

  await db.query(`UPDATE Exam SET ${sets.join(',')} WHERE exam_id=?`, vals);
  res.json({ success: true, message: 'Exam updated' });
}));

// Delete exam
router.delete('/api/exams/:id', catchAsync(async (req, res) => {
  const examCols = await cols('Exam');
  const hasDeleted = examCols.includes('deleted_at');

  const [existing] = await db.query(`SELECT * FROM Exam WHERE exam_id=? ${hasDeleted ? 'AND deleted_at IS NULL' : ''}`, [req.params.id]);
  if (!existing.length) throw new AppError('Exam not found', 404);

  if (hasDeleted) {
    await db.query('UPDATE Exam SET deleted_at=NOW() WHERE exam_id=?', [req.params.id]);
  } else {
    await db.query('DELETE FROM Exam WHERE exam_id=?', [req.params.id]);
  }
  res.json({ success: true, message: 'Exam deleted' });
}));

// Get students for exam
router.get('/api/exams/:id/students', catchAsync(async (req, res) => {
  const [exam] = await db.query('SELECT * FROM Exam WHERE exam_id=?', [req.params.id]);
  if (!exam.length) throw new AppError('Exam not found', 404);

  // Try enrollment-based, fall back to all students
  let students = [];
  try {
    const [rows] = await db.query(`
      SELECT s.student_id, s.first_name, s.last_name, s.department, s.semester,
             r.marks_obtained, r.grade
      FROM CourseEnrollment ce
      JOIN Student s ON ce.student_id = s.student_id
      LEFT JOIN Result r ON r.student_id=s.student_id AND r.exam_id=?
      WHERE ce.course_id=? AND ce.status='active'
      ORDER BY s.first_name`, [exam[0].exam_id, exam[0].course_id]);
    students = rows;
  } catch(e) {
    const [rows] = await db.query(`
      SELECT s.student_id, s.first_name, s.last_name, s.department, s.semester,
             r.marks_obtained, r.grade
      FROM Student s
      LEFT JOIN Result r ON r.student_id=s.student_id AND r.exam_id=?
      ORDER BY s.first_name LIMIT 50`, [exam[0].exam_id]);
    students = rows;
  }
  res.json({ success: true, data: students });
}));

// Save results
router.post('/api/exams/:id/results', catchAsync(async (req, res) => {
  const { results, grades } = req.body;
  const data = results || grades || [];
  if (!data.length) throw new AppError('No results provided', 400);

  const [exam] = await db.query('SELECT * FROM Exam WHERE exam_id=?', [req.params.id]);
  if (!exam.length) throw new AppError('Exam not found', 404);

  const maxMarks = exam[0].max_marks;
  let saved = 0;

  for (const g of data) {
    if (g.marks_obtained === null || g.marks_obtained === undefined) continue;
    const marks = parseFloat(g.marks_obtained);
    if (isNaN(marks) || marks < 0 || marks > maxMarks) continue;
    const grade = calculateGrade(marks, maxMarks);
    await db.query(
      `INSERT INTO Result (student_id,exam_id,marks_obtained,grade) VALUES (?,?,?,?)
       ON DUPLICATE KEY UPDATE marks_obtained=VALUES(marks_obtained),grade=VALUES(grade)`,
      [g.student_id, req.params.id, marks, grade]
    );
    saved++;
  }
  res.json({ success: true, message: `Results saved for ${saved} students` });
}));

// Publish results
router.patch('/api/exams/:id/publish', catchAsync(async (req, res) => {
  const resultCols = await cols('Result');
  if (resultCols.includes('is_published')) {
    await db.query('UPDATE Result SET is_published=1 WHERE exam_id=?', [req.params.id]);
  }
  res.json({ success: true, message: 'Results published' });
}));

module.exports = router;
