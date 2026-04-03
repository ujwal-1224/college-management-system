const express = require('express');
const router = express.Router();
const { catchAsync, AppError } = require('../../middleware/errorHandler');
const { validateNotification, validateId, validatePagination } = require('../../middleware/validation');
const { auditLog } = require('../../middleware/logger');
const { paginate } = require('../../utils/helpers');
const db = require('../../config/database');

// Get all notifications
router.get('/api/notifications', validatePagination, catchAsync(async (req, res) => {
  const { page = 1, limit = 10, target_role, notification_type, priority, search } = req.query;
  const { limit: queryLimit, offset } = paginate(page, limit);

  let query = `
    SELECT n.*, CONCAT(u.username) as created_by_name
    FROM Notification n
    LEFT JOIN User u ON n.created_by = u.user_id
    WHERE 1=1
  `;
  const params = [];

  if (target_role) { query += ' AND n.target_role = ?'; params.push(target_role); }
  if (notification_type) { query += ' AND n.notification_type = ?'; params.push(notification_type); }
  if (priority) { query += ' AND n.priority = ?'; params.push(priority); }
  if (search) { query += ' AND (n.title LIKE ? OR n.message LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

  const [countResult] = await db.query(`SELECT COUNT(*) as total FROM (${query}) as sub`, params);
  const total = countResult[0].total;

  query += ' ORDER BY n.created_at DESC LIMIT ? OFFSET ?';
  params.push(queryLimit, offset);

  const [notifications] = await db.query(query, params);
  res.json({ success: true, data: notifications, pagination: { page: parseInt(page), limit: queryLimit, total, pages: Math.ceil(total / queryLimit) } });
}));

// Get single notification
router.get('/api/notifications/:id', validateId, catchAsync(async (req, res) => {
  const [notifications] = await db.query('SELECT * FROM Notification WHERE notification_id = ?', [req.params.id]);
  if (notifications.length === 0) throw new AppError('Notification not found', 404);
  res.json({ success: true, data: notifications[0] });
}));

// Create notification
router.post('/api/notifications', validateNotification, catchAsync(async (req, res) => {
  const { title, message, notification_type, target_role, target_user_id, priority, expires_at } = req.body;

  const [result] = await db.query(
    `INSERT INTO Notification (title, message, notification_type, target_role, target_user_id, priority, created_by, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, message, notification_type || 'general', target_role, target_user_id || null, priority || 'medium', req.session.userId, expires_at || null]
  );

  await auditLog('CREATE', 'Notification', result.insertId, req.session.userId, null,
    { title, target_role, priority }, req);

  res.status(201).json({ success: true, message: 'Notification created', data: { notification_id: result.insertId } });
}));

// Update notification
router.put('/api/notifications/:id', validateId, catchAsync(async (req, res) => {
  const { title, message, notification_type, target_role, priority, expires_at } = req.body;

  const [existing] = await db.query('SELECT * FROM Notification WHERE notification_id = ?', [req.params.id]);
  if (existing.length === 0) throw new AppError('Notification not found', 404);

  await db.query(
    `UPDATE Notification SET title=?, message=?, notification_type=?, target_role=?, priority=?, expires_at=?
     WHERE notification_id=?`,
    [title, message, notification_type, target_role, priority, expires_at || null, req.params.id]
  );

  await auditLog('UPDATE', 'Notification', req.params.id, req.session.userId, existing[0], req.body, req);
  res.json({ success: true, message: 'Notification updated' });
}));

// Delete notification
router.delete('/api/notifications/:id', validateId, catchAsync(async (req, res) => {
  const [existing] = await db.query('SELECT * FROM Notification WHERE notification_id = ?', [req.params.id]);
  if (existing.length === 0) throw new AppError('Notification not found', 404);

  await db.query('DELETE FROM Notification WHERE notification_id = ?', [req.params.id]);
  await auditLog('DELETE', 'Notification', req.params.id, req.session.userId, existing[0], null, req);
  res.json({ success: true, message: 'Notification deleted' });
}));

// Broadcast notification to all users of a role
router.post('/api/notifications/broadcast', catchAsync(async (req, res) => {
  const { title, message, notification_type, target_role, priority } = req.body;
  if (!title || !message || !target_role) throw new AppError('title, message, and target_role are required', 400);

  const [result] = await db.query(
    `INSERT INTO Notification (title, message, notification_type, target_role, priority, created_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [title, message, notification_type || 'general', target_role, priority || 'medium', req.session.userId]
  );

  await auditLog('BROADCAST', 'Notification', result.insertId, req.session.userId, null,
    { title, target_role }, req);

  res.status(201).json({ success: true, message: `Notification broadcast to all ${target_role}s`, data: { notification_id: result.insertId } });
}));

// Get notification stats
router.get('/api/notifications/stats/overview', catchAsync(async (req, res) => {
  const [stats] = await db.query(`
    SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN is_read = FALSE THEN 1 END) as unread,
      COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent,
      COUNT(CASE WHEN target_role = 'all' THEN 1 END) as broadcast
    FROM Notification
  `);
  const [byRole] = await db.query(`SELECT target_role, COUNT(*) as count FROM Notification GROUP BY target_role`);
  res.json({ success: true, data: { overview: stats[0], by_role: byRole } });
}));

module.exports = router;
