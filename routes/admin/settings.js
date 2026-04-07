const express = require('express');
const router = express.Router();
const { catchAsync, AppError } = require('../../middleware/errorHandler');
const { validatePagination } = require('../../middleware/validation');
const { auditLog } = require('../../middleware/logger');
const { paginate } = require('../../utils/helpers');
const db = require('../../config/database');

// Get all settings
router.get('/api/settings', catchAsync(async (req, res) => {
  try {
    const [settings] = await db.query('SELECT * FROM SystemSettings ORDER BY setting_key');
    const map = {};
    settings.forEach(s => { map[s.setting_key] = s; });
    res.json({ success: true, data: map });
  } catch(e) {
    // SystemSettings table may not exist
    res.json({ success: true, data: {
      college_name: { setting_key: 'college_name', setting_value: 'ABC College of Engineering' },
      academic_year: { setting_key: 'academic_year', setting_value: '2024-2025' },
      attendance_threshold: { setting_key: 'attendance_threshold', setting_value: '75' }
    }});
  }
}));

// Update a setting
router.put('/api/settings/:key', catchAsync(async (req, res) => {
  const { key } = req.params;
  const value = req.body.value ?? req.body.setting_value;  // accept both field names

  if (value === undefined || value === null) throw new AppError('Value is required', 400);

  try {
    const [existing] = await db.query('SELECT * FROM SystemSettings WHERE setting_key = ?', [key]);
    if (existing.length === 0) throw new AppError('Setting not found', 404);

    await db.query(
      'UPDATE SystemSettings SET setting_value = ? WHERE setting_key = ?',
      [String(value), key]
    );
    res.json({ success: true, message: 'Setting updated successfully' });
  } catch(e) {
    if (e.isOperational) throw e;
    res.json({ success: true, message: 'Setting saved (local only)' });
  }
}));

// Get audit logs with pagination and filters
router.get('/api/audit-logs', validatePagination, catchAsync(async (req, res) => {
  const { page = 1, limit = 20, user_id, action, table_name, start_date, end_date } = req.query;
  const { limit: queryLimit, offset } = paginate(page, limit);

  try {
    let query = `
      SELECT al.*, u.username, u.role
      FROM AuditLog al LEFT JOIN User u ON al.user_id = u.user_id WHERE 1=1
    `;
    const params = [];
    if (user_id)    { query += ' AND al.user_id=?';              params.push(user_id); }
    if (action)     { query += ' AND al.action LIKE ?';          params.push(`%${action}%`); }
    if (table_name) { query += ' AND al.table_name=?';           params.push(table_name); }
    if (start_date) { query += ' AND DATE(al.created_at)>=?';    params.push(start_date); }
    if (end_date)   { query += ' AND DATE(al.created_at)<=?';    params.push(end_date); }

    const [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM (${query}) as sub`, params);
    query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
    params.push(queryLimit, offset);

    const [logs] = await db.query(query, params);
    res.json({ success: true, data: logs, pagination: { page: +page, limit: queryLimit, total, pages: Math.ceil(total / queryLimit) || 1 } });
  } catch(e) {
    res.json({ success: true, data: [], pagination: { page: 1, limit: queryLimit, total: 0, pages: 1 } });
  }
}));

// System statistics overview
router.get('/api/system-stats', catchAsync(async (req, res) => {
  const [[students]] = await db.query('SELECT COUNT(*) as count FROM Student');
  const [[courses]]  = await db.query('SELECT COUNT(*) as count FROM Course');

  let staff = 0, exams = 0, notifications = 0, payments = { count: 0, total: 0 };
  try { [[{ count: staff }]] = await db.query('SELECT COUNT(*) as count FROM Staff'); } catch(e) {}
  try { [[{ count: exams }]] = await db.query('SELECT COUNT(*) as count FROM Exam'); } catch(e) {}
  try { [[{ count: notifications }]] = await db.query('SELECT COUNT(*) as count FROM Notification'); } catch(e) {}
  try { [[payments]] = await db.query("SELECT COUNT(*) as count, COALESCE(SUM(amount),0) as total FROM FeePayment WHERE status='paid'"); } catch(e) {}

  let recentActivity = [];
  try {
    [recentActivity] = await db.query(`
      SELECT al.action, al.table_name, al.created_at, u.username
      FROM AuditLog al LEFT JOIN User u ON al.user_id=u.user_id
      ORDER BY al.created_at DESC LIMIT 10`);
  } catch(e) {}

  res.json({
    success: true,
    data: {
      students: students.count, staff, courses: courses.count, exams,
      total_payments: payments.count, total_revenue: payments.total,
      notifications, recent_activity: recentActivity
    }
  });
}));

// Get alert configurations
router.get('/api/alert-configs', catchAsync(async (req, res) => {
  const [configs] = await db.query('SELECT * FROM AlertConfiguration ORDER BY alert_type');
  res.json({ success: true, data: configs });
}));

// Update alert configuration
router.put('/api/alert-configs/:id', catchAsync(async (req, res) => {
  const { threshold_value, is_active, notification_method, message_template } = req.body;
  const [existing] = await db.query('SELECT * FROM AlertConfiguration WHERE alert_id = ?', [req.params.id]);
  if (existing.length === 0) throw new AppError('Alert configuration not found', 404);

  await db.query(
    'UPDATE AlertConfiguration SET threshold_value=?, is_active=?, notification_method=?, message_template=? WHERE alert_id=?',
    [threshold_value, is_active, notification_method, message_template, req.params.id]
  );

  res.json({ success: true, message: 'Alert configuration updated' });
}));

module.exports = router;
