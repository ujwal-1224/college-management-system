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

module.exports = router;
