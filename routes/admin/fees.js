const express = require('express');
const router = express.Router();
const { catchAsync, AppError } = require('../../middleware/errorHandler');
const { validateId, validatePagination } = require('../../middleware/validation');
const { auditLog } = require('../../middleware/logger');
const { paginate, generateReceiptNumber, calculateOverdueDays } = require('../../utils/helpers');
const db = require('../../config/database');

// ─── FEE STRUCTURES ──────────────────────────────────────────────────────────

router.get('/api/fee-structures', validatePagination, catchAsync(async (req, res) => {
  const { page = 1, limit = 10, semester, academic_year, search } = req.query;
  const { limit: queryLimit, offset } = paginate(page, limit);

  let query = `
    SELECT fs.*, CONCAT(s.first_name,' ',s.last_name) as student_name,
           s.roll_number, s.department, s.semester as student_semester
    FROM FeeStructure fs
    JOIN Student s ON fs.student_id = s.student_id
    WHERE s.deleted_at IS NULL
  `;
  const params = [];

  if (semester) { query += ' AND fs.semester = ?'; params.push(semester); }
  if (academic_year) { query += ' AND fs.academic_year = ?'; params.push(academic_year); }
  if (search) { query += ' AND (s.first_name LIKE ? OR s.last_name LIKE ? OR s.roll_number LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }

  const [countResult] = await db.query(`SELECT COUNT(*) as total FROM (${query}) as sub`, params);
  const total = countResult[0].total;

  query += ' ORDER BY fs.fee_structure_id DESC LIMIT ? OFFSET ?';
  params.push(queryLimit, offset);

  const [structures] = await db.query(query, params);
  res.json({ success: true, data: structures, pagination: { page: parseInt(page), limit: queryLimit, total, pages: Math.ceil(total / queryLimit) } });
}));

router.post('/api/fee-structures', catchAsync(async (req, res) => {
  const { student_id, semester, academic_year, tuition_fee, hostel_fee, library_fee, lab_fee, sports_fee, other_fee, due_date } = req.body;

  if (!student_id || !semester || !academic_year || !due_date) throw new AppError('Required fields missing', 400);

  const [student] = await db.query('SELECT student_id FROM Student WHERE student_id = ? AND deleted_at IS NULL', [student_id]);
  if (student.length === 0) throw new AppError('Student not found', 404);

  const [existing] = await db.query('SELECT fee_structure_id FROM FeeStructure WHERE student_id = ? AND semester = ? AND academic_year = ?', [student_id, semester, academic_year]);
  if (existing.length > 0) throw new AppError('Fee structure already exists for this student/semester/year', 409);

  const [result] = await db.query(
    `INSERT INTO FeeStructure (student_id, semester, academic_year, tuition_fee, hostel_fee, library_fee, lab_fee, sports_fee, other_fee, due_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [student_id, semester, academic_year, tuition_fee || 0, hostel_fee || 0, library_fee || 0, lab_fee || 0, sports_fee || 0, other_fee || 0, due_date]
  );

  await auditLog('CREATE', 'FeeStructure', result.insertId, req.session.userId, null, { student_id, semester, academic_year }, req);
  res.status(201).json({ success: true, message: 'Fee structure created', data: { fee_structure_id: result.insertId } });
}));

router.put('/api/fee-structures/:id', validateId, catchAsync(async (req, res) => {
  const { tuition_fee, hostel_fee, library_fee, lab_fee, sports_fee, other_fee, due_date } = req.body;

  const [existing] = await db.query('SELECT * FROM FeeStructure WHERE fee_structure_id = ?', [req.params.id]);
  if (existing.length === 0) throw new AppError('Fee structure not found', 404);

  await db.query(
    `UPDATE FeeStructure SET tuition_fee=?, hostel_fee=?, library_fee=?, lab_fee=?, sports_fee=?, other_fee=?, due_date=?
     WHERE fee_structure_id=?`,
    [tuition_fee, hostel_fee, library_fee, lab_fee, sports_fee, other_fee, due_date, req.params.id]
  );

  await auditLog('UPDATE', 'FeeStructure', req.params.id, req.session.userId, existing[0], req.body, req);
  res.json({ success: true, message: 'Fee structure updated' });
}));

router.delete('/api/fee-structures/:id', validateId, catchAsync(async (req, res) => {
  const [existing] = await db.query('SELECT * FROM FeeStructure WHERE fee_structure_id = ?', [req.params.id]);
  if (existing.length === 0) throw new AppError('Fee structure not found', 404);

  await db.query('DELETE FROM FeeStructure WHERE fee_structure_id = ?', [req.params.id]);
  await auditLog('DELETE', 'FeeStructure', req.params.id, req.session.userId, existing[0], null, req);
  res.json({ success: true, message: 'Fee structure deleted' });
}));

// ─── PAYMENTS ────────────────────────────────────────────────────────────────

router.get('/api/payments', validatePagination, catchAsync(async (req, res) => {
  const { page = 1, limit = 10, student_id, status, semester, academic_year, search } = req.query;
  const { limit: queryLimit, offset } = paginate(page, limit);

  let query = `
    SELECT fp.*, CONCAT(s.first_name,' ',s.last_name) as student_name,
           s.roll_number, s.department
    FROM FeePayment fp
    JOIN Student s ON fp.student_id = s.student_id
    WHERE s.deleted_at IS NULL
  `;
  const params = [];

  if (student_id) { query += ' AND fp.student_id = ?'; params.push(student_id); }
  if (status) { query += ' AND fp.status = ?'; params.push(status); }
  if (semester) { query += ' AND fp.semester = ?'; params.push(semester); }
  if (academic_year) { query += ' AND fp.academic_year = ?'; params.push(academic_year); }
  if (search) { query += ' AND (s.first_name LIKE ? OR s.last_name LIKE ? OR s.roll_number LIKE ? OR fp.receipt_number LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`); }

  const [countResult] = await db.query(`SELECT COUNT(*) as total FROM (${query}) as sub`, params);
  const total = countResult[0].total;

  query += ' ORDER BY fp.payment_date DESC LIMIT ? OFFSET ?';
  params.push(queryLimit, offset);

  const [payments] = await db.query(query, params);
  res.json({ success: true, data: payments, pagination: { page: parseInt(page), limit: queryLimit, total, pages: Math.ceil(total / queryLimit) } });
}));

// ─── DEFAULTERS ──────────────────────────────────────────────────────────────

router.get('/api/fee-defaulters', validatePagination, catchAsync(async (req, res) => {
  const { page = 1, limit = 10, semester, academic_year, department, search } = req.query;
  const { limit: queryLimit, offset } = paginate(page, limit);

  // Compute defaulters: students with fee structure but insufficient payments
  let query = `
    SELECT s.student_id, s.roll_number, CONCAT(s.first_name,' ',s.last_name) as student_name,
           s.department, s.semester, s.phone, s.email,
           fs.total_fee, fs.due_date, fs.semester as fee_semester, fs.academic_year,
           COALESCE(SUM(fp.amount), 0) as paid_amount,
           (fs.total_fee - COALESCE(SUM(fp.amount), 0)) as pending_amount,
           DATEDIFF(NOW(), fs.due_date) as overdue_days
    FROM FeeStructure fs
    JOIN Student s ON fs.student_id = s.student_id
    LEFT JOIN FeePayment fp ON fp.student_id = s.student_id
      AND fp.semester = fs.semester AND fp.academic_year = fs.academic_year AND fp.status = 'paid'
    WHERE s.deleted_at IS NULL AND fs.due_date < NOW()
  `;
  const params = [];

  if (semester) { query += ' AND fs.semester = ?'; params.push(semester); }
  if (academic_year) { query += ' AND fs.academic_year = ?'; params.push(academic_year); }
  if (department) { query += ' AND s.department = ?'; params.push(department); }
  if (search) { query += ' AND (s.first_name LIKE ? OR s.last_name LIKE ? OR s.roll_number LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }

  query += ' GROUP BY fs.fee_structure_id HAVING pending_amount > 0';

  const [countResult] = await db.query(`SELECT COUNT(*) as total FROM (${query}) as sub`, params);
  const total = countResult[0].total;

  query += ' ORDER BY overdue_days DESC LIMIT ? OFFSET ?';
  params.push(queryLimit, offset);

  const [defaulters] = await db.query(query, params);
  res.json({ success: true, data: defaulters, pagination: { page: parseInt(page), limit: queryLimit, total, pages: Math.ceil(total / queryLimit) } });
}));

// Export defaulters to Excel
router.get('/api/fee-defaulters/export', catchAsync(async (req, res) => {
  const { semester, academic_year, department } = req.query;

  let query = `
    SELECT s.student_id, s.roll_number, CONCAT(s.first_name,' ',s.last_name) as student_name,
           s.department, s.semester, s.phone,
           fs.total_fee, fs.due_date,
           COALESCE(SUM(fp.amount), 0) as paid_amount,
           (fs.total_fee - COALESCE(SUM(fp.amount), 0)) as total_due,
           DATEDIFF(NOW(), fs.due_date) as overdue_days,
           'pending' as status
    FROM FeeStructure fs
    JOIN Student s ON fs.student_id = s.student_id
    LEFT JOIN FeePayment fp ON fp.student_id = s.student_id AND fp.semester = fs.semester AND fp.status = 'paid'
    WHERE s.deleted_at IS NULL AND fs.due_date < NOW()
  `;
  const params = [];
  if (semester) { query += ' AND fs.semester = ?'; params.push(semester); }
  if (academic_year) { query += ' AND fs.academic_year = ?'; params.push(academic_year); }
  if (department) { query += ' AND s.department = ?'; params.push(department); }
  query += ' GROUP BY fs.fee_structure_id HAVING total_due > 0 ORDER BY overdue_days DESC';

  const [defaulters] = await db.query(query, params);

  const { exportDefaultersToExcel } = require('../../utils/excelExport');
  const workbook = await exportDefaultersToExcel(defaulters);

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=fee_defaulters_${Date.now()}.xlsx`);
  await workbook.xlsx.write(res);
  res.end();
}));

// Financial summary report
router.get('/api/fee-reports/summary', catchAsync(async (req, res) => {
  const { academic_year, semester } = req.query;

  let whereClause = 'WHERE s.deleted_at IS NULL';
  const params = [];
  if (academic_year) { whereClause += ' AND fp.academic_year = ?'; params.push(academic_year); }
  if (semester) { whereClause += ' AND fp.semester = ?'; params.push(semester); }

  const [summary] = await db.query(`
    SELECT
      COUNT(DISTINCT fp.student_id) as total_payers,
      SUM(fp.amount) as total_collected,
      COUNT(fp.payment_id) as total_transactions,
      AVG(fp.amount) as avg_payment
    FROM FeePayment fp
    JOIN Student s ON fp.student_id = s.student_id
    ${whereClause} AND fp.status = 'paid'
  `, params);

  const [byMethod] = await db.query(`
    SELECT fp.payment_method, COUNT(*) as count, SUM(fp.amount) as total
    FROM FeePayment fp JOIN Student s ON fp.student_id = s.student_id
    ${whereClause} AND fp.status = 'paid'
    GROUP BY fp.payment_method
  `, params);

  const [monthly] = await db.query(`
    SELECT DATE_FORMAT(fp.payment_date, '%Y-%m') as month,
           COUNT(*) as transactions, SUM(fp.amount) as total
    FROM FeePayment fp JOIN Student s ON fp.student_id = s.student_id
    ${whereClause} AND fp.status = 'paid'
    GROUP BY month ORDER BY month DESC LIMIT 12
  `, params);

  res.json({ success: true, data: { summary: summary[0], by_method: byMethod, monthly } });
}));

module.exports = router;
