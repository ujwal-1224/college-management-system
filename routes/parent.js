const express = require('express');
const router = express.Router();
const { isAuthenticated, isRole } = require('../middleware/auth');
const db = require('../config/database');

router.use(isAuthenticated);
router.use(isRole('parent'));

router.get('/dashboard', (req, res) => {
  res.sendFile('parent-dashboard.html', { root: './views' });
});

router.get('/api/profile', async (req, res) => {
  try {
    const [parent] = await db.query(
      'SELECT * FROM Parent WHERE user_id = ?',
      [req.session.userId]
    );
    res.json(parent[0] || {});
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/api/children', async (req, res) => {
  try {
    const [parent] = await db.query('SELECT parent_id FROM Parent WHERE user_id = ?', [req.session.userId]);
    if (parent.length === 0) return res.json([]);
    
    const [children] = await db.query(
      `SELECT s.*, sp.relationship 
       FROM Student s
       JOIN StudentParent sp ON s.student_id = sp.student_id
       WHERE sp.parent_id = ?`,
      [parent[0].parent_id]
    );
    res.json(children);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/api/child-attendance/:studentId', async (req, res) => {
  try {
    const [parent] = await db.query('SELECT parent_id FROM Parent WHERE user_id = ?', [req.session.userId]);
    if (parent.length === 0) return res.json([]);
    
    // Verify parent has access to this student
    const [access] = await db.query(
      'SELECT 1 FROM StudentParent WHERE parent_id = ? AND student_id = ?',
      [parent[0].parent_id, req.params.studentId]
    );
    
    if (access.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const [attendance] = await db.query(
      `SELECT a.*, c.course_name, c.course_code 
       FROM Attendance a 
       JOIN Course c ON a.course_id = c.course_id 
       WHERE a.student_id = ? 
       ORDER BY a.attendance_date DESC LIMIT 10`,
      [req.params.studentId]
    );
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/api/child-results/:studentId', async (req, res) => {
  try {
    const [parent] = await db.query('SELECT parent_id FROM Parent WHERE user_id = ?', [req.session.userId]);
    if (parent.length === 0) return res.json([]);
    
    // Verify parent has access to this student
    const [access] = await db.query(
      'SELECT 1 FROM StudentParent WHERE parent_id = ? AND student_id = ?',
      [parent[0].parent_id, req.params.studentId]
    );
    
    if (access.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const [results] = await db.query(
      `SELECT r.*, e.exam_name, e.max_marks, c.course_name 
       FROM Result r 
       JOIN Exam e ON r.exam_id = e.exam_id
       JOIN Course c ON e.course_id = c.course_id
       WHERE r.student_id = ? 
       ORDER BY e.exam_date DESC LIMIT 10`,
      [req.params.studentId]
    );
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/api/child-fees/:studentId', async (req, res) => {
  try {
    const [parent] = await db.query('SELECT parent_id FROM Parent WHERE user_id = ?', [req.session.userId]);
    if (parent.length === 0) return res.json({});

    const [access] = await db.query(
      'SELECT 1 FROM StudentParent WHERE parent_id = ? AND student_id = ?',
      [parent[0].parent_id, req.params.studentId]
    );
    if (access.length === 0) return res.status(403).json({ error: 'Access denied' });

    const [student] = await db.query(
      'SELECT student_id, semester FROM Student WHERE student_id = ? AND deleted_at IS NULL',
      [req.params.studentId]
    );
    if (student.length === 0) return res.json({});

    const [feeStructure] = await db.query(
      'SELECT * FROM FeeStructure WHERE student_id = ? AND semester = ? ORDER BY due_date DESC, created_at DESC LIMIT 1',
      [req.params.studentId, student[0].semester]
    );
    const fee = feeStructure[0];
    if (!fee) return res.json({});

    const [payments] = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as paid_amount
       FROM FeePayment
       WHERE student_id = ? AND semester = ? AND status = 'paid'`,
      [req.params.studentId, fee.semester]
    );

    const totalFee = parseFloat(fee.total_fee || 0);
    const paidAmount = parseFloat(payments[0]?.paid_amount || 0);
    const pendingDues = totalFee - paidAmount;

    res.json({
      totalFee,
      tuitionFee: parseFloat(fee.tuition_fee || 0),
      hostelFee: parseFloat(fee.hostel_fee || 0),
      libraryFee: parseFloat(fee.library_fee || 0),
      labFee: parseFloat(fee.lab_fee || 0),
      otherFee: parseFloat(fee.other_fee || 0),
      paidAmount,
      pendingDues: pendingDues > 0 ? pendingDues : 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/api/child-payment-history/:studentId', async (req, res) => {
  try {
    const [parent] = await db.query('SELECT parent_id FROM Parent WHERE user_id = ?', [req.session.userId]);
    if (parent.length === 0) return res.json([]);

    const [access] = await db.query(
      'SELECT 1 FROM StudentParent WHERE parent_id = ? AND student_id = ?',
      [parent[0].parent_id, req.params.studentId]
    );
    if (access.length === 0) return res.status(403).json({ error: 'Access denied' });

    const [payments] = await db.query(
      `SELECT payment_id, amount, payment_date, payment_method, semester, academic_year, status, description, receipt_number, transaction_id
       FROM FeePayment
       WHERE student_id = ?
       ORDER BY payment_date DESC
       LIMIT 50`,
      [req.params.studentId]
    );

    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/api/notifications', async (req, res) => {
  try {
    const [notifications] = await db.query(
      `SELECT * FROM Notification
       WHERE (target_role = 'all' OR target_role = 'parent' OR target_user_id = ?)
       ORDER BY created_at DESC
       LIMIT 20`,
      [req.session.userId]
    );
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/api/notifications/:id/read', async (req, res) => {
  try {
    await db.query(
      'UPDATE Notification SET is_read = TRUE, read_at = NOW() WHERE notification_id = ?',
      [req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
