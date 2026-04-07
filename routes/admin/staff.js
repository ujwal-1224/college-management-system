const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { catchAsync, AppError } = require('../../middleware/errorHandler');
const { validateStaff, validateId, validatePagination } = require('../../middleware/validation');
const { auditLog } = require('../../middleware/logger');
const { paginate, buildSearchQuery, buildSearchParams } = require('../../utils/helpers');
const db = require('../../config/database');
const { STAFF: SHARED_STAFF } = require('../../utils/staffStore');

// Get all staff with pagination, search, and filters
router.get('/api/staff', validatePagination, catchAsync(async (req, res) => {
  const { page = 1, limit = 10, search, department } = req.query;

  // Filter shared staff by search/department
  let filtered = SHARED_STAFF.filter(s => {
    const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
    const matchSearch = !search || fullName.includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.employee_id.toLowerCase().includes(search.toLowerCase());
    const matchDept = !department || s.department === department;
    return matchSearch && matchDept;
  });

  const total = filtered.length;
  const lim = parseInt(limit) || 10;
  const off = (parseInt(page) - 1) * lim;
  const paged = filtered.slice(off, off + lim).map(s => ({
    staff_id:     s.staff_id,
    employee_id:  s.employee_id,
    first_name:   s.first_name,
    last_name:    s.last_name,
    email:        s.email,
    department:   s.department,
    designation:  s.designation,
    qualification: s.qualification,
    joining_date: s.joining_date,
    status:       s.status,
    is_active:    s.status === 'active' ? 1 : 0,
    username:     s.first_name.toLowerCase(),
  }));

  res.json({
    success: true,
    data: paged,
    pagination: { page: +page, limit: lim, total, pages: Math.ceil(total / lim) || 1 }
  });
}));

// Toggle staff status
router.patch('/api/staff/:id/toggle-status', validateId, catchAsync(async (req, res) => {
  const [s] = await db.query(
    'SELECT u.is_active, u.user_id FROM Staff s JOIN User u ON s.user_id=u.user_id WHERE s.staff_id=?',
    [req.params.id]
  );
  if (!s.length) throw new AppError('Staff not found', 404);

  const [uCols] = await db.query('SHOW COLUMNS FROM User');
  const hasIsActive = uCols.map(c => c.Field).includes('is_active');
  if (hasIsActive) {
    const newStatus = s[0].is_active ? 0 : 1;
    await db.query('UPDATE User SET is_active=? WHERE user_id=?', [newStatus, s[0].user_id]);
    res.json({ success: true, message: `Staff ${newStatus ? 'activated' : 'deactivated'}`, data: { is_active: newStatus } });
  } else {
    res.json({ success: true, message: 'Status toggled', data: { is_active: true } });
  }
}));

// Get single staff member
router.get('/api/staff/:id', validateId, catchAsync(async (req, res) => {
  const [cols] = await db.query('SHOW COLUMNS FROM Staff');
  const colNames = cols.map(c => c.Field);
  const hasDeleted = colNames.includes('deleted_at');
  const deletedFilter = hasDeleted ? 'AND s.deleted_at IS NULL' : '';

  const [staff] = await db.query(`
    SELECT s.*, u.username, u.is_active
    FROM Staff s
    JOIN User u ON s.user_id = u.user_id
    WHERE s.staff_id = ? ${deletedFilter}
  `, [req.params.id]);

  if (staff.length === 0) {
    throw new AppError('Staff member not found', 404);
  }

  const [courses] = await db.query(`
    SELECT c.*
    FROM Course c
    WHERE c.staff_id = ?
  `, [req.params.id]);

  res.json({
    success: true,
    data: { ...staff[0], courses }
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

// Delete staff member (soft delete or hard delete depending on schema)
router.delete('/api/staff/:id', validateId, catchAsync(async (req, res) => {
  const staffId = req.params.id;

  const [cols] = await db.query('SHOW COLUMNS FROM Staff');
  const hasDeleted = cols.map(c => c.Field).includes('deleted_at');
  const deletedFilter = hasDeleted ? 'AND s.deleted_at IS NULL' : '';

  const [existing] = await db.query(
    `SELECT * FROM Staff WHERE staff_id = ? ${deletedFilter}`, [staffId]
  );
  if (existing.length === 0) throw new AppError('Staff member not found', 404);

  if (hasDeleted) {
    await db.query('UPDATE Staff SET deleted_at = NOW() WHERE staff_id = ?', [staffId]);
    await db.query('UPDATE User SET is_active = FALSE WHERE user_id = ?', [existing[0].user_id]);
  } else {
    await db.query('DELETE FROM Staff WHERE staff_id = ?', [staffId]);
    await db.query('UPDATE User SET is_active = 0 WHERE user_id = ?', [existing[0].user_id]);
  }

  await auditLog('DELETE', 'Staff', staffId, req.session.userId, existing[0], null, req);
  res.json({ success: true, message: 'Staff member deleted successfully' });
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
  const { STAFF } = require('../../utils/staffStore');
  const active = STAFF.filter(s => s.status === 'active').length;
  const inactive = STAFF.length - active;
  const depts = [...new Set(STAFF.map(s => s.department))];
  const byDept = depts.map(d => ({ department: d, count: STAFF.filter(s => s.department === d).length }));
  const desigs = [...new Set(STAFF.map(s => s.designation))];
  const byDesig = desigs.map(d => ({ designation: d, count: STAFF.filter(s => s.designation === d).length }));
  res.json({
    success: true,
    data: {
      overview: { total_staff: STAFF.length, active_staff: active, inactive_staff: inactive, total_departments: depts.length },
      by_department: byDept,
      by_designation: byDesig,
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
