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
  res.json([
    { attendance_date: '2026-04-04', course_name: 'Data Structures',   course_code: 'CS301', status: 'present' },
    { attendance_date: '2026-04-03', course_name: 'Operating Systems', course_code: 'CS302', status: 'absent'  },
    { attendance_date: '2026-04-03', course_name: 'Data Structures',   course_code: 'CS301', status: 'present' },
    { attendance_date: '2026-04-02', course_name: 'DBMS',              course_code: 'CS303', status: 'present' },
    { attendance_date: '2026-04-02', course_name: 'Computer Networks', course_code: 'CS304', status: 'late'    },
    { attendance_date: '2026-04-01', course_name: 'Software Engg.',    course_code: 'CS305', status: 'present' },
    { attendance_date: '2026-03-31', course_name: 'DBMS',              course_code: 'CS303', status: 'present' },
    { attendance_date: '2026-03-31', course_name: 'Operating Systems', course_code: 'CS302', status: 'present' },
    { attendance_date: '2026-03-28', course_name: 'Data Structures',   course_code: 'CS301', status: 'absent'  },
    { attendance_date: '2026-03-28', course_name: 'Computer Networks', course_code: 'CS304', status: 'present' },
  ]);
});

router.get('/api/results', async (req, res) => {
  res.json([
    { exam_date: '2026-04-20', course_code: 'CS301', course_name: 'Data Structures & Algorithms', exam_name: 'Final Exam',   marks_obtained: 92, max_marks: 100, grade: 'A+' },
    { exam_date: '2026-04-15', course_code: 'CS302', course_name: 'Operating Systems',            exam_name: 'Final Exam',   marks_obtained: 78, max_marks: 100, grade: 'B+' },
    { exam_date: '2026-03-20', course_code: 'CS303', course_name: 'Database Management Systems',  exam_name: 'Mid-Term',     marks_obtained: 42, max_marks: 50,  grade: 'A'  },
    { exam_date: '2026-03-18', course_code: 'CS304', course_name: 'Computer Networks',            exam_name: 'Mid-Term',     marks_obtained: 38, max_marks: 50,  grade: 'B+' },
    { exam_date: '2026-03-15', course_code: 'CS305', course_name: 'Software Engineering',         exam_name: 'Quiz 2',       marks_obtained: 18, max_marks: 20,  grade: 'A+' },
    { exam_date: '2026-02-28', course_code: 'CS306', course_name: 'Web Technologies',             exam_name: 'Assignment 1', marks_obtained: 28, max_marks: 30,  grade: 'A'  },
  ]);
});

// Get Enrolled Courses
router.get('/api/courses', async (req, res) => {
  // Return consistent dummy course data with correct faculty mapping
  res.json([
    { course_code: 'CS301', course_name: 'Data Structures & Algorithms', credits: 4, faculty_name: 'Dr. Saubhagya Barpanda', status: 'active', semester: 5 },
    { course_code: 'CS302', course_name: 'Operating Systems',            credits: 3, faculty_name: 'Dr. Ramesh Kumar',        status: 'active', semester: 5 },
    { course_code: 'CS303', course_name: 'Database Management Systems',  credits: 4, faculty_name: 'Dr. Anjali Sharma',       status: 'active', semester: 5 },
    { course_code: 'CS304', course_name: 'Computer Networks',            credits: 3, faculty_name: 'Prof. Vivek Reddy',       status: 'active', semester: 5 },
    { course_code: 'CS305', course_name: 'Software Engineering',         credits: 3, faculty_name: 'Dr. Kiran Rao',           status: 'active', semester: 5 },
    { course_code: 'CS306', course_name: 'Web Technologies',             credits: 2, faculty_name: 'Prof. Priya Nair',        status: 'active', semester: 5 },
  ]);
});

// Get Timetable
router.get('/api/timetable', async (req, res) => {
  res.json([
    { day_of_week: 'Monday',    start_time: '09:00', end_time: '10:00', course_code: 'CS301', course_name: 'Data Structures',   faculty_name: 'Dr. Saubhagya Barpanda', room_number: 'A101' },
    { day_of_week: 'Monday',    start_time: '10:00', end_time: '11:00', course_code: 'CS302', course_name: 'Operating Systems', faculty_name: 'Dr. Ramesh Kumar',       room_number: 'B202' },
    { day_of_week: 'Monday',    start_time: '11:15', end_time: '12:15', course_code: 'CS303', course_name: 'DBMS',              faculty_name: 'Dr. Anjali Sharma',      room_number: 'A103' },
    { day_of_week: 'Tuesday',   start_time: '09:00', end_time: '10:00', course_code: 'CS304', course_name: 'Computer Networks', faculty_name: 'Prof. Vivek Reddy',      room_number: 'C301' },
    { day_of_week: 'Tuesday',   start_time: '10:00', end_time: '11:00', course_code: 'CS305', course_name: 'Software Engg.',    faculty_name: 'Dr. Kiran Rao',          room_number: 'A102' },
    { day_of_week: 'Tuesday',   start_time: '14:00', end_time: '16:00', course_code: 'CS306', course_name: 'Web Tech Lab',      faculty_name: 'Prof. Priya Nair',       room_number: 'Lab-1' },
    { day_of_week: 'Wednesday', start_time: '09:00', end_time: '10:00', course_code: 'CS301', course_name: 'Data Structures',   faculty_name: 'Dr. Saubhagya Barpanda', room_number: 'A101' },
    { day_of_week: 'Wednesday', start_time: '11:15', end_time: '12:15', course_code: 'CS303', course_name: 'DBMS',              faculty_name: 'Dr. Anjali Sharma',      room_number: 'A103' },
    { day_of_week: 'Thursday',  start_time: '09:00', end_time: '10:00', course_code: 'CS302', course_name: 'Operating Systems', faculty_name: 'Dr. Ramesh Kumar',       room_number: 'B202' },
    { day_of_week: 'Thursday',  start_time: '10:00', end_time: '11:00', course_code: 'CS304', course_name: 'Computer Networks', faculty_name: 'Prof. Vivek Reddy',      room_number: 'C301' },
    { day_of_week: 'Thursday',  start_time: '14:00', end_time: '16:00', course_code: 'CS301', course_name: 'DS Lab',            faculty_name: 'Dr. Saubhagya Barpanda', room_number: 'Lab-2' },
    { day_of_week: 'Friday',    start_time: '09:00', end_time: '10:00', course_code: 'CS305', course_name: 'Software Engg.',    faculty_name: 'Dr. Kiran Rao',          room_number: 'A102' },
    { day_of_week: 'Friday',    start_time: '10:00', end_time: '11:00', course_code: 'CS306', course_name: 'Web Technologies',  faculty_name: 'Prof. Priya Nair',       room_number: 'B101' },
  ]);
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
  const { getFees } = require('../utils/feeStore');
  const f = getFees();
  res.json({
    total_fee:    f.totalFee,
    paid_amount:  f.paidAmount,
    pending_dues: f.pendingDues,
    tuition_fee:  f.tuitionFee,
    hostel_fee:   f.hostelFee,
    library_fee:  f.libraryFee,
    lab_fee:      f.labFee,
    other_fee:    f.otherFee,
  });
});

// Get Payment History
router.get('/api/payment-history', async (req, res) => {
  const { getFees } = require('../utils/feeStore');
  res.json(getFees().payments);
});

// Make Payment
router.post('/api/make-payment', async (req, res) => {
  const { amount, paymentMethod, description } = req.body;
  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number' });
  }
  const { addPayment } = require('../utils/feeStore');
  const { receipt_number, transaction_id } = addPayment(numericAmount, paymentMethod, description);
  res.json({
    success: true,
    message: 'Payment successful. Updated dues reflected across modules.',
    receiptNumber: receipt_number,
    transactionId: transaction_id,
  });
});

// Get Hostel Information
router.get('/api/hostel', async (req, res) => {
  try {
    const [student] = await db.query('SELECT student_id FROM Student WHERE user_id = ?', [req.session.userId]);
    if (student.length === 0) return res.json({});
    
    try {
      const [hostelInfo] = await db.query(
        `SELECT ha.room_number, ha.allocation_date, h.hostel_name, h.total_rooms, h.available_rooms
         FROM HostelAllocation ha
         JOIN Hostel h ON ha.hostel_id = h.hostel_id
         WHERE ha.student_id = ?
         LIMIT 1`,
        [student[0].student_id]
      );
      res.json(hostelInfo[0] || {});
    } catch (e) {
      res.json({});
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get Notifications
router.get('/api/notifications', async (req, res) => {
  try {
    const [notifications] = await db.query(
      `SELECT * FROM Notification 
       WHERE (target_role = 'all' OR target_role = 'student')
       ORDER BY created_at DESC
       LIMIT 20`
    );
    res.json(notifications);
  } catch (error) {
    // Notification table may not exist in basic schema
    res.json([]);
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
