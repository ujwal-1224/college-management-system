const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { catchAsync, AppError } = require('../../middleware/errorHandler');
const { validateStaff, validateId, validatePagination } = require('../../middleware/validation');
const { auditLog } = require('../../middleware/logger');
const { paginate, buildSearchQuery, buildSearchParams } = require('../../utils/helpers');
const db = require('../../config/database');

// Get all staff with pagination, search, and filters
router.get('/api/staff', validatePagination, catchAsync(async (req, res) => {
  const { page = 1, limit = 10, search, department, sortBy = 'staff_id', sortOrder = 'DESC' } = req.query;
  const { limit: queryLimit, offset } = paginate(page, limit);

  let query = `
    SELECT s.*, u.username, u.is_active, u.last_login
    FROM Staff s
    JOIN User u ON s.user_id = u.user_id
    WHERE s.deleted_at IS NULL
  `;
  
  const params = [];

  // Search
  if (search) {
    query += ` AND (${buildSearchQuery(search, ['s.first_name', 's.last_name', 's.email', 's.employee_id'])})`;
    params.push(...buildSearchParams(search, 4));
  }

  // Filters
  if (department) {
    query += ` AND s.department = ?`;
    params.push(department);
  }

  // Count total
  const countQuery = query.replace(/SELECT s\.\*, u\.username, u\.is_active, u\.last_login/, 'SELECT COUNT(*) as total');
  const [countResult] = await db.query(countQuery, params);
  const total = countResult[0].total;

  // Add sorting and pagination
  query += ` ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`;
  params.push(queryLimit, offset);

  const [staff] = await db.query(query, params);

  res.json({
    success: true,
    data: staff,
    pagination: {
      page: parseInt(page),
      limit: queryLimit,
      total,
      pages: Math.ceil(total / queryLimit)
    }
  });
}));

// Get single staff member
router.get('/api/staff/:id', validateId, catchAsync(async (req, res) => {
  const [staff] = await db.query(`
    SELECT s.*, u.username, u.is_active, u.last_login, u.created_at as account_created
    FROM Staff s
    JOIN User u ON s.user_id = u.user_id
    WHERE s.staff_id = ? AND s.deleted_at IS NULL
  `, [req.params.id]);

  if (staff.length === 0) {
    throw new AppError('Staff member not found', 404);
  }

  // Get assigned courses
  const [courses] = await db.query(`
    SELECT c.*, COUNT(ce.enrollment_id) as enrolled_students
    FROM Course c
    LEFT JOIN CourseEnrollment ce ON c.course_id = ce.course_id AND ce.status = 'active'
    WHERE c.staff_id = ? AND c.deleted_at IS NULL
    GROUP BY c.course_id
  `, [req.params.id]);

  res.json({
    success: true,
    data: {
      ...staff[0],
      courses
    }
  });
}));

// Create new staff member
router.post('/api/staff', validateStaff, catchAsync(async (req, res) => {
  const {
    username, password, employee_id, first_name, last_name, email, phone,
    date_of_birth, gender, department, designation, qualification, joining_date
  } = req.body;

  // Check if username or email already exists
  const [existing] = await db.query(
    'SELECT user_id FROM User WHERE username = ? OR EXISTS (SELECT 1 FROM Staff WHERE email = ?)',
    [username, email]
  );

  if (existing.length > 0) {
    throw new AppError('Username or email already exists', 400);
  }

  // Check if employee ID exists
  const [existingEmp] = await db.query(
    'SELECT staff_id FROM Staff WHERE employee_id = ?',
    [employee_id]
  );

  if (existingEmp.length > 0) {
    throw new AppError('Employee ID already exists', 400);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Start transaction
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // Create user account
    const [userResult] = await connection.query(
      'INSERT INTO User (username, password, role) VALUES (?, ?, ?)',
      [username, hashedPassword, 'staff']
    );

    const userId = userResult.insertId;

    // Create staff record
    const [staffResult] = await connection.query(
      `INSERT INTO Staff (
        user_id, employee_id, first_name, last_name, email, phone,
        date_of_birth, gender, department, designation, qualification, joining_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, employee_id, first_name, last_name, email, phone,
        date_of_birth, gender, department, designation, qualification, joining_date
      ]
    );

    const staffId = staffResult.insertId;

    await connection.commit();

    // Audit log
    await auditLog('CREATE', 'Staff', staffId, req.session.userId, null, {
      employee_id, first_name, last_name, email, department, designation
    }, req);

    res.status(201).json({
      success: true,
      message: 'Staff member created successfully',
      data: { staff_id: staffId, user_id: userId }
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}));

// Update staff member
router.put('/api/staff/:id', validateId, catchAsync(async (req, res) => {
  const staffId = req.params.id;
  const {
    first_name, last_name, email, phone, date_of_birth, gender,
    department, designation, qualification
  } = req.body;

  // Check if staff exists
  const [existing] = await db.query(
    'SELECT * FROM Staff WHERE staff_id = ? AND deleted_at IS NULL',
    [staffId]
  );

  if (existing.length === 0) {
    throw new AppError('Staff member not found', 404);
  }

  const oldValues = existing[0];

  // Check email uniqueness
  if (email && email !== oldValues.email) {
    const [emailCheck] = await db.query(
      'SELECT staff_id FROM Staff WHERE email = ? AND staff_id != ?',
      [email, staffId]
    );

    if (emailCheck.length > 0) {
      throw new AppError('Email already exists', 400);
    }
  }

  // Update staff
  await db.query(
    `UPDATE Staff SET
      first_name = ?, last_name = ?, email = ?, phone = ?,
      date_of_birth = ?, gender = ?, department = ?,
      designation = ?, qualification = ?
    WHERE staff_id = ?`,
    [
      first_name, last_name, email, phone, date_of_birth, gender,
      department, designation, qualification, staffId
    ]
  );

  // Audit log
  await auditLog('UPDATE', 'Staff', staffId, req.session.userId, oldValues, {
    first_name, last_name, email, phone, department, designation
  }, req);

  res.json({
    success: true,
    message: 'Staff member updated successfully'
  });
}));

// Delete staff member (soft delete)
router.delete('/api/staff/:id', validateId, catchAsync(async (req, res) => {
  const staffId = req.params.id;

  // Check if staff exists
  const [existing] = await db.query(
    'SELECT * FROM Staff WHERE staff_id = ? AND deleted_at IS NULL',
    [staffId]
  );

  if (existing.length === 0) {
    throw new AppError('Staff member not found', 404);
  }

  // Check if staff has assigned courses
  const [courses] = await db.query(
    'SELECT COUNT(*) as count FROM Course WHERE staff_id = ? AND is_active = TRUE',
    [staffId]
  );

  if (courses[0].count > 0) {
    throw new AppError('Cannot delete staff member with active course assignments', 400);
  }

  // Soft delete staff
  await db.query(
    'UPDATE Staff SET deleted_at = NOW() WHERE staff_id = ?',
    [staffId]
  );

  // Deactivate user account
  await db.query(
    'UPDATE User SET is_active = FALSE, deleted_at = NOW() WHERE user_id = ?',
    [existing[0].user_id]
  );

  // Audit log
  await auditLog('DELETE', 'Staff', staffId, req.session.userId, existing[0], null, req);

  res.json({
    success: true,
    message: 'Staff member deleted successfully'
  });
}));

// Assign courses to staff
router.post('/api/staff/:id/assign-courses', validateId, catchAsync(async (req, res) => {
  const staffId = req.params.id;
  const { course_ids } = req.body;

  if (!Array.isArray(course_ids) || course_ids.length === 0) {
    throw new AppError('Course IDs array is required', 400);
  }

  // Check if staff exists
  const [staff] = await db.query(
    'SELECT staff_id FROM Staff WHERE staff_id = ? AND deleted_at IS NULL',
    [staffId]
  );

  if (staff.length === 0) {
    throw new AppError('Staff member not found', 404);
  }

  // Update courses
  await db.query(
    'UPDATE Course SET staff_id = ? WHERE course_id IN (?)',
    [staffId, course_ids]
  );

  // Audit log
  await auditLog('ASSIGN_COURSES', 'Staff', staffId, req.session.userId, null, {
    course_ids
  }, req);

  res.json({
    success: true,
    message: 'Courses assigned successfully'
  });
}));

// Remove course assignment
router.delete('/api/staff/:id/courses/:courseId', validateId, catchAsync(async (req, res) => {
  const { id: staffId, courseId } = req.params;

  // Check if course is assigned to this staff
  const [course] = await db.query(
    'SELECT course_id FROM Course WHERE course_id = ? AND staff_id = ?',
    [courseId, staffId]
  );

  if (course.length === 0) {
    throw new AppError('Course not assigned to this staff member', 404);
  }

  // Remove assignment
  await db.query(
    'UPDATE Course SET staff_id = NULL WHERE course_id = ?',
    [courseId]
  );

  // Audit log
  await auditLog('REMOVE_COURSE', 'Staff', staffId, req.session.userId, 
    { course_id: courseId }, null, req);

  res.json({
    success: true,
    message: 'Course assignment removed successfully'
  });
}));

// Get staff statistics
router.get('/api/staff/stats/overview', catchAsync(async (req, res) => {
  const [stats] = await db.query(`
    SELECT 
      COUNT(*) as total_staff,
      COUNT(CASE WHEN u.is_active = TRUE THEN 1 END) as active_staff,
      COUNT(CASE WHEN u.is_active = FALSE THEN 1 END) as inactive_staff,
      COUNT(DISTINCT s.department) as total_departments
    FROM Staff s
    JOIN User u ON s.user_id = u.user_id
    WHERE s.deleted_at IS NULL
  `);

  const [byDepartment] = await db.query(`
    SELECT department, COUNT(*) as count
    FROM Staff
    WHERE deleted_at IS NULL
    GROUP BY department
    ORDER BY count DESC
  `);

  const [byDesignation] = await db.query(`
    SELECT designation, COUNT(*) as count
    FROM Staff
    WHERE deleted_at IS NULL
    GROUP BY designation
    ORDER BY count DESC
  `);

  res.json({
    success: true,
    data: {
      overview: stats[0],
      by_department: byDepartment,
      by_designation: byDesignation
    }
  });
}));

// Export staff to Excel
router.get('/api/staff/export', catchAsync(async (req, res) => {
  const { department } = req.query;

  let query = `
    SELECT s.*, u.username, u.is_active
    FROM Staff s
    JOIN User u ON s.user_id = u.user_id
    WHERE s.deleted_at IS NULL
  `;
  
  const params = [];

  if (department) {
    query += ` AND s.department = ?`;
    params.push(department);
  }

  query += ` ORDER BY s.staff_id DESC`;

  const [staff] = await db.query(query, params);

  // Create Excel workbook
  const ExcelJS = require('exceljs');
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Staff List');

  worksheet.columns = [
    { header: 'Staff ID', key: 'staff_id', width: 12 },
    { header: 'Employee ID', key: 'employee_id', width: 15 },
    { header: 'First Name', key: 'first_name', width: 20 },
    { header: 'Last Name', key: 'last_name', width: 20 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Phone', key: 'phone', width: 15 },
    { header: 'Department', key: 'department', width: 20 },
    { header: 'Designation', key: 'designation', width: 20 },
    { header: 'Joining Date', key: 'joining_date', width: 15 }
  ];

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E3A8A' }
  };
  worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

  staff.forEach(member => {
    worksheet.addRow({
      staff_id: member.staff_id,
      employee_id: member.employee_id,
      first_name: member.first_name,
      last_name: member.last_name,
      email: member.email,
      phone: member.phone || '',
      department: member.department,
      designation: member.designation,
      joining_date: member.joining_date ? new Date(member.joining_date).toLocaleDateString() : ''
    });
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=staff_${Date.now()}.xlsx`);

  await workbook.xlsx.write(res);
  res.end();
}));

module.exports = router;
