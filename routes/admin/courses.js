const express = require('express');
const router = express.Router();
const { catchAsync, AppError } = require('../../middleware/errorHandler');
const { validateCourse, validateId, validatePagination } = require('../../middleware/validation');
const { auditLog } = require('../../middleware/logger');
const { paginate, buildSearchQuery, buildSearchParams } = require('../../utils/helpers');
const db = require('../../config/database');

// Get all courses with pagination, search, and filters
router.get('/api/courses', validatePagination, catchAsync(async (req, res) => {
  const { page = 1, limit = 10, search, department, semester, staff_id } = req.query;
  const { limit: queryLimit, offset } = paginate(page, limit);

  // Detect optional columns
  const [cCols] = await db.query('SHOW COLUMNS FROM Course');
  const courseColNames = cCols.map(c => c.Field);
  const hasDeleted  = courseColNames.includes('deleted_at');
  const hasIsActive = courseColNames.includes('is_active');

  const [sCols] = await db.query('SHOW COLUMNS FROM Staff');
  const staffColNames = sCols.map(c => c.Field);
  const hasEmpId = staffColNames.includes('employee_id');

  let query = `
    SELECT c.course_id, c.course_code, c.course_name, c.department, c.credits, c.semester,
           c.staff_id,
           ${hasIsActive ? 'c.is_active,' : '1 as is_active,'}
           CONCAT(s.first_name,' ',s.last_name) as staff_name,
           ${hasEmpId ? 's.employee_id,' : "'—' as employee_id,"}
           COUNT(DISTINCT ce.student_id) as enrolled_students
    FROM Course c
    LEFT JOIN Staff s ON c.staff_id = s.staff_id
    LEFT JOIN CourseEnrollment ce ON c.course_id = ce.course_id AND ce.status = 'active'
    WHERE 1=1 ${hasDeleted ? 'AND c.deleted_at IS NULL' : ''}
  `;
  const params = [];

  if (search) {
    query += ` AND (c.course_code LIKE ? OR c.course_name LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }
  if (department) { query += ' AND c.department=?'; params.push(department); }
  if (semester)   { query += ' AND c.semester=?';   params.push(semester); }
  if (staff_id)   { query += ' AND c.staff_id=?';   params.push(staff_id); }

  query += ' GROUP BY c.course_id';

  const [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM (${query}) as sub`, params);
  query += ' ORDER BY c.course_id DESC LIMIT ? OFFSET ?';
  params.push(queryLimit, offset);

  const [courses] = await db.query(query, params);
  res.json({ success: true, data: courses, pagination: { page: +page, limit: queryLimit, total, pages: Math.ceil(total / queryLimit) || 1 } });
}));

// Get single course
router.get('/api/courses/:id', validateId, catchAsync(async (req, res) => {
  const [cCols] = await db.query('SHOW COLUMNS FROM Course');
  const hasDeleted = cCols.map(c => c.Field).includes('deleted_at');

  const [courses] = await db.query(`
    SELECT c.*, CONCAT(s.first_name,' ',s.last_name) as staff_name
    FROM Course c LEFT JOIN Staff s ON c.staff_id = s.staff_id
    WHERE c.course_id = ? ${hasDeleted ? 'AND c.deleted_at IS NULL' : ''}
  `, [req.params.id]);

  if (!courses.length) throw new AppError('Course not found', 404);

  // Enrolled students
  let students = [];
  try {
    const [rows] = await db.query(`
      SELECT st.student_id, st.first_name, st.last_name, st.email, st.department, st.semester,
             ce.enrollment_date, ce.status
      FROM CourseEnrollment ce JOIN Student st ON ce.student_id = st.student_id
      WHERE ce.course_id = ? ORDER BY st.first_name
    `, [req.params.id]);
    students = rows;
  } catch(e) {}

  res.json({ success: true, data: { ...courses[0], enrolled_students: students, timetable: [] } });
}));

// Create new course
router.post('/api/courses', validateCourse, catchAsync(async (req, res) => {
  const {
    course_code, course_name, department, credits, semester, description, staff_id
  } = req.body;

  // Check if course code already exists
  const [existing] = await db.query(
    'SELECT course_id FROM Course WHERE course_code = ? AND deleted_at IS NULL',
    [course_code]
  );

  if (existing.length > 0) {
    throw new AppError('Course code already exists', 400);
  }

  // If staff_id provided, verify staff exists
  if (staff_id) {
    const [staff] = await db.query(
      'SELECT staff_id FROM Staff WHERE staff_id = ? AND deleted_at IS NULL',
      [staff_id]
    );

    if (staff.length === 0) {
      throw new AppError('Staff member not found', 404);
    }
  }

  // Create course
  const [result] = await db.query(
    `INSERT INTO Course (course_code, course_name, department, credits, semester, description, staff_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [course_code, course_name, department, credits, semester, description, staff_id || null]
  );

  const courseId = result.insertId;

  // Audit log
  await auditLog('CREATE', 'Course', courseId, req.session.userId, null, {
    course_code, course_name, department, credits, semester
  }, req);

  res.status(201).json({
    success: true,
    message: 'Course created successfully',
    data: { course_id: courseId }
  });
}));

// Update course
router.put('/api/courses/:id', validateId, catchAsync(async (req, res) => {
  const courseId = req.params.id;
  const {
    course_name, department, credits, semester, description, staff_id, is_active
  } = req.body;

  // Check if course exists
  const [existing] = await db.query(
    'SELECT * FROM Course WHERE course_id = ? AND deleted_at IS NULL',
    [courseId]
  );

  if (existing.length === 0) {
    throw new AppError('Course not found', 404);
  }

  const oldValues = existing[0];

  // If staff_id provided, verify staff exists
  if (staff_id) {
    const [staff] = await db.query(
      'SELECT staff_id FROM Staff WHERE staff_id = ? AND deleted_at IS NULL',
      [staff_id]
    );

    if (staff.length === 0) {
      throw new AppError('Staff member not found', 404);
    }
  }

  // Update course
  await db.query(
    `UPDATE Course SET
      course_name = ?, department = ?, credits = ?, semester = ?,
      description = ?, staff_id = ?, is_active = ?
    WHERE course_id = ?`,
    [course_name, department, credits, semester, description, staff_id || null, is_active, courseId]
  );

  // Audit log
  await auditLog('UPDATE', 'Course', courseId, req.session.userId, oldValues, {
    course_name, department, credits, semester, staff_id, is_active
  }, req);

  res.json({
    success: true,
    message: 'Course updated successfully'
  });
}));

// Delete course (soft delete)
router.delete('/api/courses/:id', validateId, catchAsync(async (req, res) => {
  const courseId = req.params.id;

  // Check if course exists
  const [existing] = await db.query(
    'SELECT * FROM Course WHERE course_id = ? AND deleted_at IS NULL',
    [courseId]
  );

  if (existing.length === 0) {
    throw new AppError('Course not found', 404);
  }

  // Check if course has active enrollments
  const [enrollments] = await db.query(
    'SELECT COUNT(*) as count FROM CourseEnrollment WHERE course_id = ? AND status = "active"',
    [courseId]
  );

  if (enrollments[0].count > 0) {
    throw new AppError('Cannot delete course with active enrollments', 400);
  }

  // Soft delete course
  await db.query(
    'UPDATE Course SET deleted_at = NOW(), is_active = FALSE WHERE course_id = ?',
    [courseId]
  );

  // Audit log
  await auditLog('DELETE', 'Course', courseId, req.session.userId, existing[0], null, req);

  res.json({
    success: true,
    message: 'Course deleted successfully'
  });
}));

// Assign staff to course
router.post('/api/courses/:id/assign-staff', validateId, catchAsync(async (req, res) => {
  const courseId = req.params.id;
  const { staff_id } = req.body;

  if (!staff_id) {
    throw new AppError('Staff ID is required', 400);
  }

  // Check if course exists
  const [course] = await db.query(
    'SELECT course_id FROM Course WHERE course_id = ? AND deleted_at IS NULL',
    [courseId]
  );

  if (course.length === 0) {
    throw new AppError('Course not found', 404);
  }

  // Check if staff exists
  const [staff] = await db.query(
    'SELECT staff_id FROM Staff WHERE staff_id = ? AND deleted_at IS NULL',
    [staff_id]
  );

  if (staff.length === 0) {
    throw new AppError('Staff member not found', 404);
  }

  // Assign staff
  await db.query(
    'UPDATE Course SET staff_id = ? WHERE course_id = ?',
    [staff_id, courseId]
  );

  // Audit log
  await auditLog('ASSIGN_STAFF', 'Course', courseId, req.session.userId, null, {
    staff_id
  }, req);

  res.json({
    success: true,
    message: 'Staff assigned to course successfully'
  });
}));

// Enroll students in course
router.post('/api/courses/:id/enroll', validateId, catchAsync(async (req, res) => {
  const courseId = req.params.id;
  const { student_ids } = req.body;

  if (!Array.isArray(student_ids) || student_ids.length === 0) {
    throw new AppError('Student IDs array is required', 400);
  }

  // Check if course exists
  const [course] = await db.query(
    'SELECT course_id FROM Course WHERE course_id = ? AND deleted_at IS NULL AND is_active = TRUE',
    [courseId]
  );

  if (course.length === 0) {
    throw new AppError('Course not found or inactive', 404);
  }

  const enrollmentDate = new Date().toISOString().split('T')[0];
  const enrolled = [];
  const errors = [];

  for (const studentId of student_ids) {
    try {
      // Check if student exists
      const [student] = await db.query(
        'SELECT student_id FROM Student WHERE student_id = ? AND deleted_at IS NULL',
        [studentId]
      );

      if (student.length === 0) {
        errors.push({ student_id: studentId, error: 'Student not found' });
        continue;
      }

      // Check if already enrolled
      const [existing] = await db.query(
        'SELECT enrollment_id FROM CourseEnrollment WHERE student_id = ? AND course_id = ?',
        [studentId, courseId]
      );

      if (existing.length > 0) {
        errors.push({ student_id: studentId, error: 'Already enrolled' });
        continue;
      }

      // Enroll student
      await db.query(
        'INSERT INTO CourseEnrollment (student_id, course_id, enrollment_date, status) VALUES (?, ?, ?, ?)',
        [studentId, courseId, enrollmentDate, 'active']
      );

      enrolled.push(studentId);
    } catch (error) {
      errors.push({ student_id: studentId, error: error.message });
    }
  }

  // Audit log
  await auditLog('ENROLL_STUDENTS', 'Course', courseId, req.session.userId, null, {
    student_ids: enrolled
  }, req);

  res.json({
    success: true,
    message: `${enrolled.length} students enrolled successfully`,
    data: {
      enrolled_count: enrolled.length,
      error_count: errors.length,
      errors: errors.length > 0 ? errors : undefined
    }
  });
}));

// Unenroll student from course
router.delete('/api/courses/:id/students/:studentId', validateId, catchAsync(async (req, res) => {
  const { id: courseId, studentId } = req.params;

  // Check if enrollment exists
  const [enrollment] = await db.query(
    'SELECT enrollment_id FROM CourseEnrollment WHERE course_id = ? AND student_id = ?',
    [courseId, studentId]
  );

  if (enrollment.length === 0) {
    throw new AppError('Enrollment not found', 404);
  }

  // Update enrollment status
  await db.query(
    'UPDATE CourseEnrollment SET status = ? WHERE course_id = ? AND student_id = ?',
    ['dropped', courseId, studentId]
  );

  // Audit log
  await auditLog('UNENROLL_STUDENT', 'Course', courseId, req.session.userId, 
    { student_id: studentId }, null, req);

  res.json({
    success: true,
    message: 'Student unenrolled successfully'
  });
}));

// Get course statistics
router.get('/api/courses/stats/overview', catchAsync(async (req, res) => {
  const [cCols] = await db.query('SHOW COLUMNS FROM Course');
  const courseColNames = cCols.map(c => c.Field);
  const hasDeleted  = courseColNames.includes('deleted_at');
  const hasIsActive = courseColNames.includes('is_active');

  const [[stats]] = await db.query(`
    SELECT COUNT(*) as total_courses,
           ${hasIsActive ? 'COUNT(CASE WHEN is_active=1 THEN 1 END) as active_courses,' : 'COUNT(*) as active_courses,'}
           COUNT(DISTINCT department) as total_departments
    FROM Course ${hasDeleted ? 'WHERE deleted_at IS NULL' : ''}
  `);

  let total_enrollments = 0;
  try {
    const [[e]] = await db.query("SELECT COUNT(*) as cnt FROM CourseEnrollment WHERE status='active'");
    total_enrollments = e.cnt;
  } catch(e) {}

  const [byDepartment] = await db.query(`SELECT department, COUNT(*) as count FROM Course ${hasDeleted ? 'WHERE deleted_at IS NULL' : ''} GROUP BY department ORDER BY count DESC`);
  const [bySemester]   = await db.query(`SELECT semester, COUNT(*) as count FROM Course ${hasDeleted ? 'WHERE deleted_at IS NULL' : ''} GROUP BY semester ORDER BY semester`);

  res.json({
    success: true,
    data: {
      overview: { ...stats, total_enrollments },
      by_department: byDepartment,
      by_semester: bySemester
    }
  });
}));

module.exports = router;
