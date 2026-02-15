const express = require('express');
const router = express.Router();
const { isAuthenticated, isRole } = require('../middleware/auth');
const db = require('../config/database');

router.use(isAuthenticated);
router.use(isRole('faculty'));

router.get('/dashboard', (req, res) => {
  res.sendFile('faculty-dashboard.html', { root: './views' });
});

router.get('/api/profile', async (req, res) => {
  try {
    const [faculty] = await db.query(
      'SELECT * FROM Faculty WHERE user_id = ?',
      [req.session.userId]
    );
    res.json(faculty[0] || {});
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/api/courses', async (req, res) => {
  try {
    const [faculty] = await db.query('SELECT faculty_id FROM Faculty WHERE user_id = ?', [req.session.userId]);
    if (faculty.length === 0) return res.json([]);
    
    const [courses] = await db.query(
      'SELECT * FROM Course WHERE faculty_id = ?',
      [faculty[0].faculty_id]
    );
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
