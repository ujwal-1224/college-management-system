const express = require('express');
const router = express.Router();
const { isAuthenticated, isRole } = require('../middleware/auth');
const db = require('../config/database');

router.use(isAuthenticated);
router.use(isRole('admin'));

router.get('/dashboard', (req, res) => {
  res.sendFile('admin-dashboard.html', { root: './views' });
});

router.get('/attendance-reports', (req, res) => {
  res.sendFile('admin-attendance-reports.html', { root: './views' });
});

router.get('/results-reports', (req, res) => {
  res.sendFile('admin-results-reports.html', { root: './views' });
});

router.get('/api/stats', async (req, res) => {
  try {
    const [students] = await db.query('SELECT COUNT(*) as count FROM Student');
    const [faculty] = await db.query('SELECT COUNT(*) as count FROM Faculty');
    const [courses] = await db.query('SELECT COUNT(*) as count FROM Course');
    
    res.json({
      students: students[0].count,
      faculty: faculty[0].count,
      courses: courses[0].count
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/api/students', async (req, res) => {
  try {
    const [students] = await db.query('SELECT * FROM Student ORDER BY student_id DESC LIMIT 10');
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/api/all-courses', async (req, res) => {
  try {
    const [courses] = await db.query('SELECT course_id, course_code, course_name FROM Course ORDER BY course_code');
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/api/attendance-report', async (req, res) => {
  try {
    const { startDate, endDate, courseId } = req.query;
    
    let query = `
      SELECT a.*, 
             CONCAT(s.first_name, ' ', s.last_name) as student_name,
             c.course_code, c.course_name
      FROM Attendance a
      JOIN Student s ON a.student_id = s.student_id
      JOIN Course c ON a.course_id = c.course_id
      WHERE a.attendance_date BETWEEN ? AND ?
    `;
    
    const params = [startDate, endDate];
    
    if (courseId) {
      query += ' AND a.course_id = ?';
      params.push(courseId);
    }
    
    query += ' ORDER BY a.attendance_date DESC, s.first_name';
    
    const [records] = await db.query(query, params);
    
    res.json({ records });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/api/results-report', async (req, res) => {
  try {
    const { courseId, examId } = req.query;
    
    let query = `
      SELECT r.*, 
             CONCAT(s.first_name, ' ', s.last_name) as student_name,
             s.student_id as roll_no,
             e.exam_name, e.max_marks, e.exam_date,
             c.course_code, c.course_name
      FROM Result r
      JOIN Student s ON r.student_id = s.student_id
      JOIN Exam e ON r.exam_id = e.exam_id
      JOIN Course c ON e.course_id = c.course_id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (courseId) {
      query += ' AND c.course_id = ?';
      params.push(courseId);
    }
    
    if (examId) {
      query += ' AND e.exam_id = ?';
      params.push(examId);
    }
    
    query += ' ORDER BY e.exam_date DESC, s.first_name';
    
    const [records] = await db.query(query, params);
    
    res.json({ records });
  } catch (error) {
    console.error('Error generating results report:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/api/all-exams', async (req, res) => {
  try {
    const [exams] = await db.query(
      `SELECT e.*, c.course_code, c.course_name 
       FROM Exam e 
       JOIN Course c ON e.course_id = c.course_id 
       ORDER BY e.exam_date DESC`
    );
    res.json(exams);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
