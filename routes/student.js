const express = require('express');
const router = express.Router();
const { isAuthenticated, isRole } = require('../middleware/auth');
const db = require('../config/database');

router.use(isAuthenticated);
router.use(isRole('student'));

router.get('/dashboard', (req, res) => {
  res.sendFile('student-dashboard-extended.html', { root: './views' });
});

router.get('/api/profile', async (req, res) => {
  try {
    const [students] = await db.query(
      'SELECT * FROM Student WHERE user_id = ?',
      [req.session.userId]
    );
    res.json(students[0] || {});
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update Profile
router.put('/api/profile', async (req, res) => {
  try {
    const { phone, email } = req.body;
    await db.query(
      'UPDATE Student SET phone = ?, email = ? WHERE user_id = ?',
      [phone, email, req.session.userId]
    );
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Change Password
router.put('/api/change-password', async (req, res) => {
  try {
    const bcrypt = require('bcrypt');
    const { currentPassword, newPassword } = req.body;
    
    const [user] = await db.query('SELECT password FROM User WHERE user_id = ?', [req.session.userId]);
    if (user.length === 0) return res.status(404).json({ error: 'User not found' });
    
    const validPassword = await bcrypt.compare(currentPassword, user[0].password);
    if (!validPassword) return res.status(400).json({ error: 'Current password is incorrect' });
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE User SET password = ? WHERE user_id = ?', [hashedPassword, req.session.userId]);
    
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/api/attendance', async (req, res) => {
  try {
    const [student] = await db.query('SELECT student_id FROM Student WHERE user_id = ?', [req.session.userId]);
    if (student.length === 0) return res.json([]);
    
    const [attendance] = await db.query(
      `SELECT a.*, c.course_name, c.course_code 
       FROM Attendance a 
       JOIN Course c ON a.course_id = c.course_id 
       WHERE a.student_id = ? 
       ORDER BY a.attendance_date DESC LIMIT 10`,
      [student[0].student_id]
    );
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/api/results', async (req, res) => {
  try {
    const [student] = await db.query('SELECT student_id FROM Student WHERE user_id = ?', [req.session.userId]);
    if (student.length === 0) return res.json([]);
    
    const [results] = await db.query(
      `SELECT r.*, e.exam_name, e.max_marks, e.exam_date, c.course_name, c.course_code
       FROM Result r
       JOIN Exam e ON r.exam_id = e.exam_id
       JOIN Course c ON e.course_id = c.course_id
       WHERE r.student_id = ?
       ORDER BY e.exam_date DESC`,
      [student[0].student_id]
    );
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get Enrolled Courses
router.get('/api/courses', async (req, res) => {
  try {
    const [student] = await db.query('SELECT student_id FROM Student WHERE user_id = ?', [req.session.userId]);
    if (student.length === 0) return res.json([]);
    
    const [courses] = await db.query(
      `SELECT c.*, ce.enrollment_date, ce.status, 
              CONCAT(s.first_name, ' ', s.last_name) as faculty_name, s.email as faculty_email
       FROM CourseEnrollment ce
       JOIN Course c ON ce.course_id = c.course_id
       LEFT JOIN Staff s ON c.staff_id = s.staff_id
       WHERE ce.student_id = ? AND ce.status = 'active'
       ORDER BY c.course_code`,
      [student[0].student_id]
    );
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get Timetable
router.get('/api/timetable', async (req, res) => {
  try {
    const [student] = await db.query('SELECT student_id FROM Student WHERE user_id = ?', [req.session.userId]);
    if (student.length === 0) return res.json([]);
    
    const [timetable] = await db.query(
      `SELECT t.*, c.course_code, c.course_name, 
              CONCAT(s.first_name, ' ', s.last_name) as faculty_name
       FROM Timetable t
       JOIN Course c ON t.course_id = c.course_id
       JOIN CourseEnrollment ce ON c.course_id = ce.course_id
       LEFT JOIN Staff s ON c.staff_id = s.staff_id
       WHERE ce.student_id = ? AND ce.status = 'active'
       ORDER BY FIELD(t.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'), t.start_time`,
      [student[0].student_id]
    );
    res.json(timetable);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get Academic Progress (GPA/CGPA)
router.get('/api/academic-progress', async (req, res) => {
  try {
    const [student] = await db.query('SELECT student_id, semester FROM Student WHERE user_id = ?', [req.session.userId]);
    if (student.length === 0) return res.json({});
    
    // Calculate GPA based on grades
    const gradePoints = { 'A+': 10, 'A': 9, 'B+': 8, 'B': 7, 'C': 6, 'D': 5, 'F': 0 };
    
    const [results] = await db.query(
      `SELECT r.grade, c.credits, e.exam_name
       FROM Result r
       JOIN Exam e ON r.exam_id = e.exam_id
       JOIN Course c ON e.course_id = c.course_id
       WHERE r.student_id = ?`,
      [student[0].student_id]
    );
    
    let totalPoints = 0;
    let totalCredits = 0;
    
    results.forEach(result => {
      if (result.grade && gradePoints[result.grade] !== undefined) {
        totalPoints += gradePoints[result.grade] * result.credits;
        totalCredits += result.credits;
      }
    });
    
    const cgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;
    
    res.json({
      cgpa,
      totalCredits,
      currentSemester: student[0].semester,
      totalExams: results.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get Fee Details
router.get('/api/fees', async (req, res) => {
  try {
    const [student] = await db.query('SELECT student_id, semester FROM Student WHERE user_id = ?', [req.session.userId]);
    if (student.length === 0) return res.json({});
    
    const [feeStructure] = await db.query(
      'SELECT * FROM FeeStructure WHERE student_id = ? AND semester = ?',
      [student[0].student_id, student[0].semester]
    );
    
    const [payments] = await db.query(
      'SELECT SUM(amount) as paid_amount FROM FeePayment WHERE student_id = ? AND semester = ? AND status = "paid"',
      [student[0].student_id, student[0].semester]
    );
    
    const totalFee = feeStructure[0]?.total_fee || 0;
    const paidAmount = payments[0]?.paid_amount || 0;
    const pendingDues = totalFee - paidAmount;
    
    res.json({
      ...feeStructure[0],
      paid_amount: paidAmount,
      pending_dues: pendingDues
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get Payment History
router.get('/api/payment-history', async (req, res) => {
  try {
    const [student] = await db.query('SELECT student_id FROM Student WHERE user_id = ?', [req.session.userId]);
    if (student.length === 0) return res.json([]);
    
    const [payments] = await db.query(
      'SELECT * FROM FeePayment WHERE student_id = ? ORDER BY payment_date DESC',
      [student[0].student_id]
    );
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Make Payment
router.post('/api/make-payment', async (req, res) => {
  try {
    const { amount, paymentMethod, description } = req.body;

    if (amount === undefined || amount === null) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    const numericAmount = parseFloat(amount);
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    let normalizedMethod = typeof paymentMethod === 'string' ? paymentMethod.trim().toLowerCase() : '';
    if (normalizedMethod === 'net banking' || normalizedMethod === 'online payment') normalizedMethod = 'online';
    if (normalizedMethod === 'card' || normalizedMethod === 'credit/debit card') normalizedMethod = 'card';

    const allowed = ['cash', 'card', 'online', 'upi', 'cheque'];
    if (!allowed.includes(normalizedMethod)) {
      return res.status(400).json({ error: 'Invalid payment method' });
    }

    const [student] = await db.query(
      'SELECT student_id, semester FROM Student WHERE user_id = ?',
      [req.session.userId]
    );
    if (student.length === 0) return res.status(404).json({ error: 'Student not found' });

    const receiptNumber = 'RCP' + Date.now();
    const transactionId = 'TXN' + Math.random().toString(36).substr(2, 9).toUpperCase();

    await db.query(
      `INSERT INTO FeePayment (student_id, amount, payment_date, payment_method, semester, status, receipt_number, transaction_id, description)
       VALUES (?, ?, CURDATE(), ?, ?, 'paid', ?, ?, ?)`,
      [student[0].student_id, numericAmount, normalizedMethod, student[0].semester, receiptNumber, transactionId, description]
    );

    res.json({
      success: true,
      message: 'Payment successful',
      receiptNumber,
      transactionId
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get Hostel Information
router.get('/api/hostel', async (req, res) => {
  try {
    const [student] = await db.query('SELECT student_id FROM Student WHERE user_id = ?', [req.session.userId]);
    if (student.length === 0) return res.json({});
    
    const [hostelInfo] = await db.query(
      `SELECT ha.room_number, ha.allocation_date, h.hostel_name, h.total_rooms, h.available_rooms,
              fs.hostel_fee
       FROM HostelAllocation ha
       JOIN Hostel h ON ha.hostel_id = h.hostel_id
       LEFT JOIN FeeStructure fs ON ha.student_id = fs.student_id
       WHERE ha.student_id = ?
       LIMIT 1`,
      [student[0].student_id]
    );
    
    res.json(hostelInfo[0] || {});
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get Notifications
router.get('/api/notifications', async (req, res) => {
  try {
    const [notifications] = await db.query(
      `SELECT * FROM Notification 
       WHERE (target_role = 'all' OR target_role = 'student' OR target_user_id = ?)
       ORDER BY created_at DESC
       LIMIT 20`,
      [req.session.userId]
    );
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark Notification as Read
router.put('/api/notifications/:id/read', async (req, res) => {
  try {
    await db.query('UPDATE Notification SET is_read = TRUE WHERE notification_id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
