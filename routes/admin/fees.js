const express = require('express');
const router = express.Router();
const { catchAsync, AppError } = require('../../middleware/errorHandler');
const { paginate, generateReceiptNumber } = require('../../utils/helpers');
const db = require('../../config/database');

async function cols(table) {
  try {
    const [rows] = await db.query(`SHOW COLUMNS FROM ${table}`);
    return rows.map(r => r.Field);
  } catch(e) { return []; }
}

// Fee Structures
router.get('/api/fee-structures', catchAsync(async (req, res) => {
  const { page = 1, limit = 10, semester, search } = req.query;
  const { limit: queryLimit, offset } = paginate(page, limit);

  const fsCols = await cols('FeeStructure');
  const stuCols = await cols('Student');
  const hasDeleted  = stuCols.includes('deleted_at');
  const hasRoll     = stuCols.includes('roll_number');
  const hasTotalFee = fsCols.includes('total_fee');
  const hasAcYear   = fsCols.includes('academic_year');

  const totalFeeExpr = hasTotalFee
    ? ''  // fs.* already includes it
    : ', (COALESCE(fs.tuition_fee,0)+COALESCE(fs.hostel_fee,0)+COALESCE(fs.library_fee,0)+COALESCE(fs.lab_fee,0)+COALESCE(fs.other_fee,0)) as total_fee';

  let query = `
    SELECT fs.*${totalFeeExpr},
           CONCAT(s.first_name,' ',s.last_name) as student_name,
           ${hasRoll ? 's.roll_number,' : "'—' as roll_number,"}
           s.department
    FROM FeeStructure fs
    JOIN Student s ON fs.student_id = s.student_id
    WHERE 1=1 ${hasDeleted ? 'AND s.deleted_at IS NULL' : ''}
  `;
  const params = [];
  if (semester) { query += ' AND fs.semester=?'; params.push(semester); }
  if (search) { query += ' AND (s.first_name LIKE ? OR s.last_name LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

  const [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM (${query}) as sub`, params);
  query += ' ORDER BY fs.fee_structure_id DESC LIMIT ? OFFSET ?';
  params.push(queryLimit, offset);

  const [structures] = await db.query(query, params);
  res.json({ success: true, data: structures, pagination: { page: +page, limit: queryLimit, total, pages: Math.ceil(total / queryLimit) || 1 } });
}));

router.post('/api/fee-structures', catchAsync(async (req, res) => {
  const { student_id, semester, academic_year, tuition_fee, hostel_fee, library_fee, lab_fee, other_fee, due_date } = req.body;
  if (!student_id || !semester) throw new AppError('student_id and semester required', 400);

  const fsCols = await cols('FeeStructure');
  const fields = ['student_id','semester'];
  const values = [student_id, semester];
  if (fsCols.includes('academic_year')) { fields.push('academic_year'); values.push(academic_year || '2024-25'); }
  if (fsCols.includes('tuition_fee'))   { fields.push('tuition_fee');   values.push(tuition_fee || 0); }
  if (fsCols.includes('hostel_fee'))    { fields.push('hostel_fee');    values.push(hostel_fee || 0); }
  if (fsCols.includes('library_fee'))   { fields.push('library_fee');   values.push(library_fee || 0); }
  if (fsCols.includes('lab_fee'))       { fields.push('lab_fee');       values.push(lab_fee || 0); }
  if (fsCols.includes('other_fee'))     { fields.push('other_fee');     values.push(other_fee || 0); }
  if (fsCols.includes('total_fee'))     { fields.push('total_fee');     values.push((+tuition_fee||0)+(+hostel_fee||0)+(+library_fee||0)+(+lab_fee||0)+(+other_fee||0)); }
  if (fsCols.includes('due_date'))      { fields.push('due_date');      values.push(due_date || null); }

  const [result] = await db.query(
    `INSERT INTO FeeStructure (${fields.join(',')}) VALUES (${fields.map(()=>'?').join(',')})`, values
  );
  res.status(201).json({ success: true, message: 'Fee structure created', data: { fee_structure_id: result.insertId } });
}));

router.put('/api/fee-structures/:id', catchAsync(async (req, res) => {
  const { tuition_fee, hostel_fee, library_fee, lab_fee, other_fee, due_date } = req.body;
  const fsCols = await cols('FeeStructure');

  const sets = [];
  const vals = [];
  if (fsCols.includes('tuition_fee'))  { sets.push('tuition_fee=?');  vals.push(tuition_fee || 0); }
  if (fsCols.includes('hostel_fee'))   { sets.push('hostel_fee=?');   vals.push(hostel_fee || 0); }
  if (fsCols.includes('library_fee'))  { sets.push('library_fee=?');  vals.push(library_fee || 0); }
  if (fsCols.includes('lab_fee'))      { sets.push('lab_fee=?');      vals.push(lab_fee || 0); }
  if (fsCols.includes('other_fee'))    { sets.push('other_fee=?');    vals.push(other_fee || 0); }
  if (fsCols.includes('total_fee'))    { sets.push('total_fee=?');    vals.push((+tuition_fee||0)+(+hostel_fee||0)+(+library_fee||0)+(+lab_fee||0)+(+other_fee||0)); }
  if (fsCols.includes('due_date'))     { sets.push('due_date=?');     vals.push(due_date || null); }

  if (!sets.length) return res.json({ success: true, message: 'Nothing to update' });
  vals.push(req.params.id);
  await db.query(`UPDATE FeeStructure SET ${sets.join(',')} WHERE fee_structure_id=?`, vals);
  res.json({ success: true, message: 'Fee structure updated' });
}));

router.delete('/api/fee-structures/:id', catchAsync(async (req, res) => {
  await db.query('DELETE FROM FeeStructure WHERE fee_structure_id=?', [req.params.id]);
  res.json({ success: true, message: 'Fee structure deleted' });
}));

// Payments
router.get('/api/payments', catchAsync(async (req, res) => {
  const { page = 1, limit = 10, status, semester, search } = req.query;
  const { limit: queryLimit, offset } = paginate(page, limit);

  const fpCols = await cols('FeePayment');
  const stuCols = await cols('Student');
  const hasDeleted = stuCols.includes('deleted_at');
  const hasRoll    = stuCols.includes('roll_number');
  const hasReceipt = fpCols.includes('receipt_number');

  let query = `
    SELECT fp.*, CONCAT(s.first_name,' ',s.last_name) as student_name,
           ${hasRoll ? 's.roll_number,' : "'—' as roll_number,"} s.department
    FROM FeePayment fp
    JOIN Student s ON fp.student_id = s.student_id
    WHERE 1=1 ${hasDeleted ? 'AND s.deleted_at IS NULL' : ''}
  `;
  const params = [];
  if (status) { query += ' AND fp.status=?'; params.push(status); }
  if (semester) { query += ' AND fp.semester=?'; params.push(semester); }
  if (search) { query += ' AND (s.first_name LIKE ? OR s.last_name LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

  const [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM (${query}) as sub`, params);
  query += ' ORDER BY fp.payment_date DESC LIMIT ? OFFSET ?';
  params.push(queryLimit, offset);

  const [payments] = await db.query(query, params);
  res.json({ success: true, data: payments, pagination: { page: +page, limit: queryLimit, total, pages: Math.ceil(total / queryLimit) || 1 } });
}));

// Defaulters
router.get('/api/fee-defaulters', catchAsync(async (req, res) => {
  const { page = 1, limit = 10, semester, department } = req.query;
  const { limit: queryLimit, offset } = paginate(page, limit);

  const fsCols = await cols('FeeStructure');
  const stuCols = await cols('Student');
  const hasDeleted  = stuCols.includes('deleted_at');
  const hasRoll     = stuCols.includes('roll_number');
  const hasDueDate  = fsCols.includes('due_date');
  const hasTotalFee = fsCols.includes('total_fee');

  const totalFeeExpr2 = hasTotalFee
    ? 'fs.total_fee'
    : '(COALESCE(fs.tuition_fee,0)+COALESCE(fs.hostel_fee,0)+COALESCE(fs.library_fee,0)+COALESCE(fs.lab_fee,0)+COALESCE(fs.other_fee,0))';

  let query = `
    SELECT s.student_id, ${hasRoll ? 's.roll_number,' : "'—' as roll_number,"}
           CONCAT(s.first_name,' ',s.last_name) as student_name,
           s.department, s.semester, s.phone,
           ${totalFeeExpr2} as total_due,
           COALESCE(SUM(fp.amount),0) as paid_amount,
           (${totalFeeExpr2} - COALESCE(SUM(fp.amount),0)) as pending_amount
           ${hasDueDate ? ', DATEDIFF(NOW(),fs.due_date) as overdue_days' : ', 0 as overdue_days'}
    FROM FeeStructure fs
    JOIN Student s ON fs.student_id = s.student_id
    LEFT JOIN FeePayment fp ON fp.student_id=s.student_id AND fp.semester=fs.semester AND fp.status='paid'
    WHERE 1=1 ${hasDeleted ? 'AND s.deleted_at IS NULL' : ''}
    ${hasDueDate ? 'AND fs.due_date < NOW()' : ''}
  `;
  const params = [];
  if (semester) { query += ' AND fs.semester=?'; params.push(semester); }
  if (department) { query += ' AND s.department=?'; params.push(department); }
  query += ' GROUP BY fs.fee_structure_id HAVING pending_amount > 0';
  const [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM (${query}) as sub`, params).catch(() => [[{ total: 0 }]]);
  query += ' ORDER BY overdue_days DESC LIMIT ? OFFSET ?';
  params.push(queryLimit, offset);

  const [defaulters] = await db.query(query, params).catch(() => [[]]);
  res.json({ success: true, data: defaulters, pagination: { page: +page, limit: queryLimit, total, pages: Math.ceil(total / queryLimit) || 1 } });
}));

// Fee reports summary
router.get('/api/fee-reports/summary', catchAsync(async (req, res) => {
  const [[summary]] = await db.query(`
    SELECT COUNT(DISTINCT student_id) as total_payers,
           COALESCE(SUM(amount),0) as total_collected,
           COUNT(*) as total_transactions,
           COALESCE(AVG(amount),0) as avg_payment
    FROM FeePayment WHERE status='paid'
  `).catch(() => [[{ total_payers:0, total_collected:0, total_transactions:0, avg_payment:0 }]]);

  const [byMethod] = await db.query(`
    SELECT payment_method, COUNT(*) as transaction_count, SUM(amount) as total_amount
    FROM FeePayment WHERE status='paid'
    GROUP BY payment_method
  `).catch(() => [[]]);

  res.json({ success: true, data: { ...summary, by_method: byMethod } });
}));

module.exports = router;
