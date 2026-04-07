const express = require('express');
const router = express.Router();
const { isAuthenticated, isRole } = require('../middleware/auth');
const db = require('../config/database');
const { calculateGrade } = require('../utils/helpers');

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

router.get('/timetable', (req, res) => {
  res.sendFile('staff-timetable.html', { root: './views' });
});

router.get('/api/timetable', async (req, res) => {
  try {
    const [staff] = await db.query('SELECT staff_id FROM Staff WHERE user_id = ?', [req.session.userId]);
    if (staff.length === 0) return res.json([]);

    // Pull all rows then deduplicate in JS to avoid GROUP BY strict mode issues
    const [rows] = await db.query(
      `SELECT t.day_of_week as day,
              TIME_FORMAT(t.start_time,'%h:%i %p') as start_fmt,
              TIME_FORMAT(t.end_time,'%h:%i %p') as end_fmt,
              t.start_time,
              c.course_code as courseCode,
              c.course_name as courseName,
              c.department as section,
              t.room_number as room,
              c.semester
       FROM Timetable t
       JOIN Course c ON t.course_id = c.course_id
       WHERE c.staff_id = ?
       ORDER BY FIELD(t.day_of_week,'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'), t.start_time`,
      [staff[0].staff_id]
    );

    // Deduplicate: same day + course + time = one entry
    const seen = new Set();
    const timetable = rows
      .filter(r => {
        const key = `${r.day}|${r.courseCode}|${r.start_fmt}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map(r => ({
        day: r.day,
        time: `${r.start_fmt} - ${r.end_fmt}`,
        courseCode: r.courseCode,
        courseName: r.courseName,
        section: r.section,
        room: r.room,
        semester: r.semester
      }));

    res.json(timetable);
  } catch (error) {
    console.error('Timetable error:', error);
    res.status(500).json({ error: 'Server error' });
  }
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
  res.json([
    { course_id: 101, course_code: 'CS101',   course_name: 'Introduction to Programming', credits: 3, semester: 1, department: 'SCOPE' },
    { course_id: 102, course_code: 'CS201',   course_name: 'Data Structures',             credits: 4, semester: 3, department: 'SCOPE' },
    { course_id: 103, course_code: 'CS301',   course_name: 'Database Management Systems', credits: 4, semester: 5, department: 'SCOPE' },
    { course_id: 104, course_code: 'MATH201', course_name: 'Discrete Mathematics',        credits: 4, semester: 3, department: 'SAS'   },
  ]);
});

router.get('/api/students', async (req, res) => {
  const sems = [1,3,5];
  res.json([
    { student_id:  1, first_name: 'Ujwal',    last_name: 'Kumar',      email: 'ujwal@college.edu',    department: 'Computer Science', semester: sems[0] },
    { student_id:  2, first_name: 'Srikar',   last_name: 'Reddy',      email: 'srikar@college.edu',   department: 'Computer Science', semester: sems[1] },
    { student_id:  3, first_name: 'Sameer',   last_name: 'Khan',       email: 'sameer@college.edu',   department: 'Computer Science', semester: sems[2] },
    { student_id:  4, first_name: 'Rahul',    last_name: 'Verma',      email: 'rahul@college.edu',    department: 'Computer Science', semester: sems[0] },
    { student_id:  5, first_name: 'Priya',    last_name: 'Sharma',     email: 'priya@college.edu',    department: 'Computer Science', semester: sems[1] },
    { student_id:  6, first_name: 'Sneha',    last_name: 'Patil',      email: 'sneha@college.edu',    department: 'Computer Science', semester: sems[2] },
    { student_id:  7, first_name: 'Arjun',    last_name: 'Nair',       email: 'arjun@college.edu',    department: 'Computer Science', semester: sems[0] },
    { student_id:  8, first_name: 'Karthik',  last_name: 'Rao',        email: 'karthik@college.edu',  department: 'Computer Science', semester: sems[1] },
    { student_id:  9, first_name: 'Ananya',   last_name: 'Gupta',      email: 'ananya@college.edu',   department: 'Computer Science', semester: sems[2] },
    { student_id: 10, first_name: 'Rohit',    last_name: 'Singh',      email: 'rohit@college.edu',    department: 'Computer Science', semester: sems[0] },
    { student_id: 11, first_name: 'Deepak',   last_name: 'Mishra',     email: 'deepak@college.edu',   department: 'Computer Science', semester: sems[1] },
    { student_id: 12, first_name: 'Aditya',   last_name: 'Verma',      email: 'aditya@college.edu',   department: 'Computer Science', semester: sems[2] },
    { student_id: 13, first_name: 'Neha',     last_name: 'Joshi',      email: 'neha@college.edu',     department: 'Computer Science', semester: sems[0] },
    { student_id: 14, first_name: 'Pooja',    last_name: 'Mehta',      email: 'pooja@college.edu',    department: 'Computer Science', semester: sems[1] },
    { student_id: 15, first_name: 'Vivek',    last_name: 'Reddy',      email: 'vivek@college.edu',    department: 'Computer Science', semester: sems[2] },
    { student_id: 16, first_name: 'Meera',    last_name: 'Iyer',       email: 'meera@college.edu',    department: 'Computer Science', semester: sems[0] },
    { student_id: 17, first_name: 'Suresh',   last_name: 'Babu',       email: 'suresh@college.edu',   department: 'Computer Science', semester: sems[1] },
    { student_id: 18, first_name: 'Kavya',    last_name: 'Nair',       email: 'kavya@college.edu',    department: 'Computer Science', semester: sems[2] },
    { student_id: 19, first_name: 'Harish',   last_name: 'Pillai',     email: 'harish@college.edu',   department: 'Computer Science', semester: sems[0] },
    { student_id: 20, first_name: 'Divya',    last_name: 'Krishnan',   email: 'divya@college.edu',    department: 'Computer Science', semester: sems[1] },
    { student_id: 21, first_name: 'Nikhil',   last_name: 'Tiwari',     email: 'nikhil@college.edu',   department: 'Computer Science', semester: sems[2] },
    { student_id: 22, first_name: 'Swathi',   last_name: 'Rao',        email: 'swathi@college.edu',   department: 'Computer Science', semester: sems[0] },
    { student_id: 23, first_name: 'Pranav',   last_name: 'Desai',      email: 'pranav@college.edu',   department: 'Computer Science', semester: sems[1] },
    { student_id: 24, first_name: 'Lakshmi',  last_name: 'Venkat',     email: 'lakshmi@college.edu',  department: 'Computer Science', semester: sems[2] },
    { student_id: 25, first_name: 'Akash',    last_name: 'Pandey',     email: 'akash@college.edu',    department: 'Computer Science', semester: sems[0] },
    { student_id: 26, first_name: 'Riya',     last_name: 'Shah',       email: 'riya@college.edu',     department: 'Computer Science', semester: sems[1] },
    { student_id: 27, first_name: 'Manish',   last_name: 'Dubey',      email: 'manish@college.edu',   department: 'Computer Science', semester: sems[2] },
    { student_id: 28, first_name: 'Tanvi',    last_name: 'Kulkarni',   email: 'tanvi@college.edu',    department: 'Computer Science', semester: sems[0] },
    { student_id: 29, first_name: 'Gaurav',   last_name: 'Saxena',     email: 'gaurav@college.edu',   department: 'Computer Science', semester: sems[1] },
    { student_id: 30, first_name: 'Ishaan',   last_name: 'Bose',       email: 'ishaan@college.edu',   department: 'Computer Science', semester: sems[2] },
    { student_id: 31, first_name: 'Shruti',   last_name: 'Agarwal',    email: 'shruti@college.edu',   department: 'Computer Science', semester: sems[0] },
    { student_id: 32, first_name: 'Varun',    last_name: 'Malhotra',   email: 'varun@college.edu',    department: 'Computer Science', semester: sems[1] },
    { student_id: 33, first_name: 'Nandini',  last_name: 'Choudhary',  email: 'nandini@college.edu',  department: 'Computer Science', semester: sems[2] },
    { student_id: 34, first_name: 'Soubhagya',last_name: 'Panda',      email: 'soubhagya@college.edu',department: 'Computer Science', semester: sems[0] },
  ]);
});

router.get('/api/course-students/:courseId', async (req, res) => {
  const sems = [1,3,5];
  res.json([
    { student_id:  1, first_name: 'Ujwal',    last_name: 'Kumar',      email: 'ujwal@college.edu',    department: 'Computer Science', semester: sems[0] },
    { student_id:  2, first_name: 'Srikar',   last_name: 'Reddy',      email: 'srikar@college.edu',   department: 'Computer Science', semester: sems[1] },
    { student_id:  3, first_name: 'Sameer',   last_name: 'Khan',       email: 'sameer@college.edu',   department: 'Computer Science', semester: sems[2] },
    { student_id:  4, first_name: 'Rahul',    last_name: 'Verma',      email: 'rahul@college.edu',    department: 'Computer Science', semester: sems[0] },
    { student_id:  5, first_name: 'Priya',    last_name: 'Sharma',     email: 'priya@college.edu',    department: 'Computer Science', semester: sems[1] },
    { student_id:  6, first_name: 'Sneha',    last_name: 'Patil',      email: 'sneha@college.edu',    department: 'Computer Science', semester: sems[2] },
    { student_id:  7, first_name: 'Arjun',    last_name: 'Nair',       email: 'arjun@college.edu',    department: 'Computer Science', semester: sems[0] },
    { student_id:  8, first_name: 'Karthik',  last_name: 'Rao',        email: 'karthik@college.edu',  department: 'Computer Science', semester: sems[1] },
    { student_id:  9, first_name: 'Ananya',   last_name: 'Gupta',      email: 'ananya@college.edu',   department: 'Computer Science', semester: sems[2] },
    { student_id: 10, first_name: 'Rohit',    last_name: 'Singh',      email: 'rohit@college.edu',    department: 'Computer Science', semester: sems[0] },
    { student_id: 11, first_name: 'Deepak',   last_name: 'Mishra',     email: 'deepak@college.edu',   department: 'Computer Science', semester: sems[1] },
    { student_id: 12, first_name: 'Aditya',   last_name: 'Verma',      email: 'aditya@college.edu',   department: 'Computer Science', semester: sems[2] },
    { student_id: 13, first_name: 'Neha',     last_name: 'Joshi',      email: 'neha@college.edu',     department: 'Computer Science', semester: sems[0] },
    { student_id: 14, first_name: 'Pooja',    last_name: 'Mehta',      email: 'pooja@college.edu',    department: 'Computer Science', semester: sems[1] },
    { student_id: 15, first_name: 'Vivek',    last_name: 'Reddy',      email: 'vivek@college.edu',    department: 'Computer Science', semester: sems[2] },
    { student_id: 16, first_name: 'Meera',    last_name: 'Iyer',       email: 'meera@college.edu',    department: 'Computer Science', semester: sems[0] },
    { student_id: 17, first_name: 'Suresh',   last_name: 'Babu',       email: 'suresh@college.edu',   department: 'Computer Science', semester: sems[1] },
    { student_id: 18, first_name: 'Kavya',    last_name: 'Nair',       email: 'kavya@college.edu',    department: 'Computer Science', semester: sems[2] },
    { student_id: 19, first_name: 'Harish',   last_name: 'Pillai',     email: 'harish@college.edu',   department: 'Computer Science', semester: sems[0] },
    { student_id: 20, first_name: 'Divya',    last_name: 'Krishnan',   email: 'divya@college.edu',    department: 'Computer Science', semester: sems[1] },
    { student_id: 21, first_name: 'Nikhil',   last_name: 'Tiwari',     email: 'nikhil@college.edu',   department: 'Computer Science', semester: sems[2] },
    { student_id: 22, first_name: 'Swathi',   last_name: 'Rao',        email: 'swathi@college.edu',   department: 'Computer Science', semester: sems[0] },
    { student_id: 23, first_name: 'Pranav',   last_name: 'Desai',      email: 'pranav@college.edu',   department: 'Computer Science', semester: sems[1] },
    { student_id: 24, first_name: 'Lakshmi',  last_name: 'Venkat',     email: 'lakshmi@college.edu',  department: 'Computer Science', semester: sems[2] },
    { student_id: 25, first_name: 'Akash',    last_name: 'Pandey',     email: 'akash@college.edu',    department: 'Computer Science', semester: sems[0] },
    { student_id: 26, first_name: 'Riya',     last_name: 'Shah',       email: 'riya@college.edu',     department: 'Computer Science', semester: sems[1] },
    { student_id: 27, first_name: 'Manish',   last_name: 'Dubey',      email: 'manish@college.edu',   department: 'Computer Science', semester: sems[2] },
    { student_id: 28, first_name: 'Tanvi',    last_name: 'Kulkarni',   email: 'tanvi@college.edu',    department: 'Computer Science', semester: sems[0] },
    { student_id: 29, first_name: 'Gaurav',   last_name: 'Saxena',     email: 'gaurav@college.edu',   department: 'Computer Science', semester: sems[1] },
    { student_id: 30, first_name: 'Ishaan',   last_name: 'Bose',       email: 'ishaan@college.edu',   department: 'Computer Science', semester: sems[2] },
    { student_id: 31, first_name: 'Shruti',   last_name: 'Agarwal',    email: 'shruti@college.edu',   department: 'Computer Science', semester: sems[0] },
    { student_id: 32, first_name: 'Varun',    last_name: 'Malhotra',   email: 'varun@college.edu',    department: 'Computer Science', semester: sems[1] },
    { student_id: 33, first_name: 'Nandini',  last_name: 'Choudhary',  email: 'nandini@college.edu',  department: 'Computer Science', semester: sems[2] },
    { student_id: 34, first_name: 'Soubhagya',last_name: 'Panda',      email: 'soubhagya@college.edu',department: 'Computer Science', semester: sems[0] },
  ]);
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
  const courseId = parseInt(req.params.courseId);
  // Fixed exams per course — Mid-Term + Final for each assigned course
  const examMap = {
    101: [
      { exam_id: 1001, exam_name: 'Mid-Term Exam',  exam_date: '2026-03-15', max_marks: 50  },
      { exam_id: 1002, exam_name: 'Final Exam',      exam_date: '2026-04-20', max_marks: 100 },
    ],
    102: [
      { exam_id: 1003, exam_name: 'Mid-Term Exam',  exam_date: '2026-03-15', max_marks: 50  },
      { exam_id: 1004, exam_name: 'Final Exam',      exam_date: '2026-04-20', max_marks: 100 },
    ],
    103: [
      { exam_id: 1005, exam_name: 'Mid-Term Exam',  exam_date: '2026-03-15', max_marks: 50  },
      { exam_id: 1006, exam_name: 'Final Exam',      exam_date: '2026-04-20', max_marks: 100 },
    ],
    104: [
      { exam_id: 1007, exam_name: 'Mid-Term Exam',  exam_date: '2026-03-15', max_marks: 50  },
      { exam_id: 1008, exam_name: 'Final Exam',      exam_date: '2026-04-20', max_marks: 100 },
    ],
  };
  res.json(examMap[courseId] || []);
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

    const maxMarksNumeric = parseInt(max_marks, 10);
    if (Number.isNaN(maxMarksNumeric) || maxMarksNumeric < 1 || maxMarksNumeric > 100) {
      return res.status(400).json({ success: false, message: 'Max marks must be 1-100' });
    }
    
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
      `INSERT INTO Exam (course_id, exam_name, exam_type, exam_date, max_marks, created_by)
       VALUES (?, ?, 'mid_term', ?, ?, ?)`,
      [course_id, exam_name, exam_date, maxMarksNumeric, staff[0].staff_id]
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
      `SELECT e.exam_id, e.max_marks FROM Exam e
       JOIN Course c ON e.course_id = c.course_id
       WHERE e.exam_id = ? AND c.staff_id = ?`,
      [examId, staff[0].staff_id]
    );
    
    if (exam.length === 0) {
      return res.status(403).json({ success: false, message: 'Access denied to this exam' });
    }

    const maxMarks = parseFloat(exam[0].max_marks);
    
    for (const grade of grades) {
      const marks = parseFloat(grade.marks_obtained);
      if (Number.isNaN(marks) || marks < 0 || marks > maxMarks) {
        return res.status(400).json({
          success: false,
          message: `Invalid marks. Marks must be between 0 and ${maxMarks}`
        });
      }

      const computedGrade = calculateGrade(marks, maxMarks);
      await db.query(
        `INSERT INTO Result (student_id, exam_id, marks_obtained, grade) 
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE marks_obtained = ?, grade = ?`,
        [grade.student_id, examId, marks, computedGrade, marks, computedGrade]
      );
    }
    
    res.json({ success: true, message: 'Grades saved successfully' });
  } catch (error) {
    console.error('Error saving grades:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
