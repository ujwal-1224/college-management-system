const express = require('express');
const router = express.Router();
const { catchAsync, AppError } = require('../../middleware/errorHandler');
const { validatePagination } = require('../../middleware/validation');
const { auditLog } = require('../../middleware/logger');
const { paginate } = require('../../utils/helpers');
const db = require('../../config/database');

// Get all settings
router.get('/api/settings', catchAsync(async (req, res) => {
  const [settings] = await db.query('SELECT * FROM SystemSettings ORDER BY setting_key');
  const map = {};
  settings.forEach(s => { map[s.setting_key] = s; });
  res.json({ success: true, data: map });
}));

// Update a setting
router.put('/api/settings/:key', catchAsync(async (req, res) => {
  const { key } = req.params;
  const { value } = req.body;

  if (value === undefined || value === null) throw new AppError('Value is required', 400);

  const [existing] = await db.query('SELECT * FROM SystemSettings WHERE setting_key = ?', [key]);
  if (existing.length === 0) throw new AppError('Setting not found', 404);

  await db.query(
    'UPDATE SystemSettings SET setting_value = ?, updated_by = ? WHERE setting_key = ?',
    [String(value), req.session.userId, key]
  );

  await auditLog('UPDATE_SETTING', 'SystemSettings', existing[0].setting_id, req.session.userId,
    { value: existing[0].setting_value }, { value: String(value) }, req);

  res.json({ success: true, message: 'Setting updated successfully' });
}));

// Get audit logs with pagination and filters
router.get('/api/audit-logs', validatePagination, catchAsync(async (req, res) => {
  const { page = 1, limit = 20, user_id, action, table_name, start_date, end_date } = req.query;
  const { limit: queryLimit, offset } = paginate(page, limit);

  let query = `
    SELECT al.*, u.username, u.role
    FROM AuditLog al
    LEFT JOIN User u ON al.user_id = u.user_id
    WHERE 1=1
  `;
  const params = [];

  if (user_id) { query += ' AND al.user_id = ?'; params.push(user_id); }
  if (action) { query += ' AND al.action LIKE ?'; params.push(`%${action}%`); }
  if (table_name) { query += ' AND al.table_name = ?'; params.push(table_name); }
  if (start_date) { query += ' AND DATE(al.created_at) >= ?'; params.push(start_date); }
  if (end_date) { query += ' AND DATE(al.created_at) <= ?'; params.push(end_date); }

  const [countResult] = await db.query(`SELECT COUNT(*) as total FROM (${query}) as sub`, params);
  const total = countResult[0].total;

  query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
  params.push(queryLimit, offset);

  const [logs] = await db.query(query, params);
  res.json({ success: true, data: logs, pagination: { page: parseInt(page), limit: queryLimit, total, pages: Math.ceil(total / queryLimit) } });
}));

// System statistics overview — reads from real DB
router.get('/api/system-stats', catchAsync(async (req, res) => {
  const [[students]]     = await db.query('SELECT COUNT(*) as count FROM Student');
  const [[courses]]      = await db.query('SELECT COUNT(*) as count FROM Course');
  const [[exams]]        = await db.query('SELECT COUNT(*) as count FROM Exam');
  const [[notifications]]= await db.query('SELECT COUNT(*) as count FROM Notification');

  // Optional tables — fall back to 0 if missing
  let staff = 0, payments = { count: 0, total: 0 }, tickets = 0, defaulters = 0;
  try { [[{ count: staff }]] = await db.query('SELECT COUNT(*) as count FROM Faculty'); } catch(e) {}
  try { [[payments]] = await db.query("SELECT COUNT(*) as count, COALESCE(SUM(amount),0) as total FROM FeePayment WHERE status='paid'"); } catch(e) {}
  try { [[{ count: tickets }]] = await db.query("SELECT COUNT(*) as count FROM SupportTicket WHERE status='open'"); } catch(e) {}

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
      students:        students.count,
      staff,
      courses:         courses.count,
      exams:           exams.count,
      total_payments:  payments.count,
      total_revenue:   payments.total,
      notifications:   notifications.count,
      open_tickets:    tickets,
      fee_defaulters:  defaulters,
      recent_activity: recentActivity
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
