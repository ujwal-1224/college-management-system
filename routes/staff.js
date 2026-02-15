const express = require('express');
const router = express.Router();
const { isAuthenticated, isRole } = require('../middleware/auth');
const db = require('../config/database');

router.use(isAuthenticated);
router.use(isRole('staff'));

router.get('/dashboard', (req, res) => {
  res.sendFile('staff-dashboard.html', { root: './views' });
});

router.get('/attendance', (req, res) => {
  res.sendFile('staff-attendance.html', { root: './views' });
});

router.get('/grades', (req, res) => {
  res.sendFile('staff-grades.html', { root: './views' });
});

router.get('/api/profile', async (req, res) => {
  try {
    const [staff] = await db.query(
      'SELECT * FROM Staff WHERE user_id = ?',
      [req.session.userId]
    );
    res.json(staff[0] || {});
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/api/courses', async (req, res) => {
  try {
    const [staff] = await db.query('SELECT staff_id FROM Staff WHERE user_id = ?', [req.session.userId]);
    if (staff.length === 0) return res.json([]);
    
    const [courses] = await db.query(
      'SELECT * FROM Course WHERE staff_id = ?',
      [staff[0].staff_id]
    );
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/api/students', async (req, res) => {
  try {
    const [staff] = await db.query('SELECT staff_id FROM Staff WHERE user_id = ?', [req.session.userId]);
    if (staff.length === 0) return res.json([]);
    
    // Get students enrolled in staff's courses
    const [students] = await db.query(
      `SELECT DISTINCT s.* FROM Student s
       JOIN Attendance a ON s.student_id = a.student_id
       JOIN Course c ON a.course_id = c.course_id
       WHERE c.staff_id = ?
       LIMIT 20`,
      [staff[0].staff_id]
    );
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/api/course-students/:courseId', async (req, res) => {
  try {
    const [staff] = await db.query('SELECT staff_id FROM Staff WHERE user_id = ?', [req.session.userId]);
    if (staff.length === 0) return res.json([]);
    
    // Verify staff teaches this course
    const [course] = await db.query(
      'SELECT 1 FROM Course WHERE course_id = ? AND staff_id = ?',
      [req.params.courseId, staff[0].staff_id]
    );
    
    if (course.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get all students (in a real system, this would be enrollment-based)
    const [students] = await db.query(
      'SELECT student_id, first_name, last_name, email, department FROM Student ORDER BY student_id'
    );
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/api/attendance-check/:courseId/:date', async (req, res) => {
  try {
    const [attendance] = await db.query(
      'SELECT student_id, status FROM Attendance WHERE course_id = ? AND attendance_date = ?',
      [req.params.courseId, req.params.date]
    );
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/api/mark-attendance', async (req, res) => {
  try {
    const { attendance } = req.body;
    
    if (!attendance || !Array.isArray(attendance)) {
      return res.status(400).json({ success: false, message: 'Invalid data' });
    }
    
    // Verify staff has access to this course
    const [staff] = await db.query('SELECT staff_id FROM Staff WHERE user_id = ?', [req.session.userId]);
    if (staff.length === 0) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const courseId = attendance[0].course_id;
    const [course] = await db.query(
      'SELECT 1 FROM Course WHERE course_id = ? AND staff_id = ?',
      [courseId, staff[0].staff_id]
    );
    
    if (course.length === 0) {
      return res.status(403).json({ success: false, message: 'Access denied to this course' });
    }
    
    // Insert or update attendance records
    for (const record of attendance) {
      await db.query(
        `INSERT INTO Attendance (student_id, course_id, attendance_date, status) 
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE status = ?`,
        [record.student_id, record.course_id, record.attendance_date, record.status, record.status]
      );
    }
    
    res.json({ success: true, message: 'Attendance saved successfully' });
  } catch (error) {
    console.error('Error saving attendance:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/api/course-exams/:courseId', async (req, res) => {
  try {
    const [staff] = await db.query('SELECT staff_id FROM Staff WHERE user_id = ?', [req.session.userId]);
    if (staff.length === 0) return res.json([]);
    
    // Verify staff teaches this course
    const [course] = await db.query(
      'SELECT 1 FROM Course WHERE course_id = ? AND staff_id = ?',
      [req.params.courseId, staff[0].staff_id]
    );
    
    if (course.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const [exams] = await db.query(
      'SELECT * FROM Exam WHERE course_id = ? ORDER BY exam_date DESC',
      [req.params.courseId]
    );
    res.json(exams);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/api/exam-grades/:examId', async (req, res) => {
  try {
    const [grades] = await db.query(
      'SELECT student_id, marks_obtained, grade FROM Result WHERE exam_id = ?',
      [req.params.examId]
    );
    res.json(grades);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/api/create-exam', async (req, res) => {
  try {
    const { course_id, exam_name, exam_date, max_marks } = req.body;
    
    // Verify staff has access to this course
    const [staff] = await db.query('SELECT staff_id FROM Staff WHERE user_id = ?', [req.session.userId]);
    if (staff.length === 0) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const [course] = await db.query(
      'SELECT 1 FROM Course WHERE course_id = ? AND staff_id = ?',
      [course_id, staff[0].staff_id]
    );
    
    if (course.length === 0) {
      return res.status(403).json({ success: false, message: 'Access denied to this course' });
    }
    
    await db.query(
      'INSERT INTO Exam (course_id, exam_name, exam_date, max_marks) VALUES (?, ?, ?, ?)',
      [course_id, exam_name, exam_date, max_marks]
    );
    
    res.json({ success: true, message: 'Exam created successfully' });
  } catch (error) {
    console.error('Error creating exam:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/api/save-grades', async (req, res) => {
  try {
    const { grades } = req.body;
    
    if (!grades || !Array.isArray(grades)) {
      return res.status(400).json({ success: false, message: 'Invalid data' });
    }
    
    // Verify staff has access
    const [staff] = await db.query('SELECT staff_id FROM Staff WHERE user_id = ?', [req.session.userId]);
    if (staff.length === 0) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    // Verify exam belongs to staff's course
    const examId = grades[0].exam_id;
    const [exam] = await db.query(
      `SELECT e.exam_id FROM Exam e
       JOIN Course c ON e.course_id = c.course_id
       WHERE e.exam_id = ? AND c.staff_id = ?`,
      [examId, staff[0].staff_id]
    );
    
    if (exam.length === 0) {
      return res.status(403).json({ success: false, message: 'Access denied to this exam' });
    }
    
    // Insert or update grades
    for (const grade of grades) {
      await db.query(
        `INSERT INTO Result (student_id, exam_id, marks_obtained, grade) 
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE marks_obtained = ?, grade = ?`,
        [grade.student_id, grade.exam_id, grade.marks_obtained, grade.grade, grade.marks_obtained, grade.grade]
      );
    }
    
    res.json({ success: true, message: 'Grades saved successfully' });
  } catch (error) {
    console.error('Error saving grades:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
