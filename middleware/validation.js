const { body, param, query, validationResult } = require('express-validator');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

// Login validation
const validateLogin = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidationErrors
];

// Student validation
const validateStudent = [
  body('roll_number').trim().notEmpty().withMessage('Roll number is required'),
  body('first_name').trim().notEmpty().withMessage('First name is required')
    .isLength({ max: 50 }).withMessage('First name too long'),
  body('last_name').trim().notEmpty().withMessage('Last name is required')
    .isLength({ max: 50 }).withMessage('Last name too long'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('phone').optional().matches(/^[0-9]{10,15}$/).withMessage('Invalid phone number'),
  body('date_of_birth').optional().isDate().withMessage('Invalid date'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('semester').isInt({ min: 1, max: 10 }).withMessage('Semester must be 1-10'),
  handleValidationErrors
];

// Staff validation
const validateStaff = [
  body('employee_id').trim().notEmpty().withMessage('Employee ID is required'),
  body('first_name').trim().notEmpty().withMessage('First name is required'),
  body('last_name').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('phone').optional().matches(/^[0-9]{10,15}$/).withMessage('Invalid phone number'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('designation').trim().notEmpty().withMessage('Designation is required'),
  handleValidationErrors
];

// Course validation
const validateCourse = [
  body('course_code').trim().notEmpty().withMessage('Course code is required')
    .isLength({ max: 20 }).withMessage('Course code too long'),
  body('course_name').trim().notEmpty().withMessage('Course name is required')
    .isLength({ max: 100 }).withMessage('Course name too long'),
  body('credits').isInt({ min: 1, max: 10 }).withMessage('Credits must be 1-10'),
  body('semester').optional().isInt({ min: 1, max: 10 }).withMessage('Semester must be 1-10'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  handleValidationErrors
];

// Exam validation
const validateExam = [
  body('course_id').isInt().withMessage('Valid course ID required'),
  body('exam_name').trim().notEmpty().withMessage('Exam name is required'),
  body('exam_type').isIn(['mid_term', 'final', 'quiz', 'assignment', 'practical'])
    .withMessage('Invalid exam type'),
  body('exam_date').isDate().withMessage('Valid exam date required'),
  body('max_marks').isInt({ min: 1, max: 100 }).withMessage('Max marks must be 1-100'),
  handleValidationErrors
];

// Attendance validation
const validateAttendance = [
  body('attendance').isArray({ min: 1 }).withMessage('Attendance data required'),
  body('attendance.*.student_id').isInt().withMessage('Valid student ID required'),
  body('attendance.*.course_id').isInt().withMessage('Valid course ID required'),
  body('attendance.*.attendance_date').isDate().withMessage('Valid date required'),
  body('attendance.*.status').isIn(['present', 'absent', 'late', 'excused'])
    .withMessage('Invalid status'),
  handleValidationErrors
];

// Marks validation
const validateMarks = [
  body('grades').isArray({ min: 1 }).withMessage('Grades data required'),
  body('grades.*.student_id').isInt().withMessage('Valid student ID required'),
  body('grades.*.exam_id').isInt().withMessage('Valid exam ID required'),
  body('grades.*.marks_obtained').isFloat({ min: 0, max: 100 })
    .withMessage('Marks must be 0-100'),
  handleValidationErrors
];

// Fee payment validation
const validatePayment = [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
  body('payment_method').isIn(['cash', 'card', 'online', 'upi', 'cheque'])
    .withMessage('Invalid payment method'),
  body('description').optional().trim().isLength({ max: 500 })
    .withMessage('Description too long'),
  handleValidationErrors
];

// Timetable validation
const validateTimetable = [
  body('course_id').isInt().withMessage('Valid course ID required'),
  body('day_of_week').isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'])
    .withMessage('Invalid day'),
  body('start_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid start time format (HH:MM)'),
  body('end_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid end time format (HH:MM)'),
  body('room_number').optional().trim().isLength({ max: 20 }),
  body('semester').optional().isInt({ min: 1, max: 10 }),
  handleValidationErrors
];

// Notification validation
const validateNotification = [
  body('title').trim().notEmpty().withMessage('Title is required')
    .isLength({ max: 200 }).withMessage('Title too long'),
  body('message').trim().notEmpty().withMessage('Message is required'),
  body('notification_type').optional().isIn(['general', 'academic', 'fee', 'exam', 'attendance', 'urgent']),
  body('target_role').isIn(['all', 'student', 'staff', 'parent', 'admin'])
    .withMessage('Invalid target role'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  handleValidationErrors
];

// Support ticket validation
const validateTicket = [
  body('subject').trim().notEmpty().withMessage('Subject is required')
    .isLength({ max: 200 }).withMessage('Subject too long'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category').isIn(['academic', 'fee', 'hostel', 'technical', 'other'])
    .withMessage('Invalid category'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  handleValidationErrors
];

// Password change validation
const validatePasswordChange = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number and special character'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Passwords do not match');
    }
    return true;
  }),
  handleValidationErrors
];

// Profile update validation
const validateProfileUpdate = [
  body('email').optional().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('phone').optional().matches(/^[0-9]{10,15}$/).withMessage('Invalid phone number'),
  body('address').optional().trim().isLength({ max: 500 }),
  handleValidationErrors
];

// ID parameter validation
const validateId = [
  param('id').isInt({ min: 1 }).withMessage('Valid ID required'),
  handleValidationErrors
];

// Query pagination validation
const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  handleValidationErrors
];

module.exports = {
  validateLogin,
  validateStudent,
  validateStaff,
  validateCourse,
  validateExam,
  validateAttendance,
  validateMarks,
  validatePayment,
  validateTimetable,
  validateNotification,
  validateTicket,
  validatePasswordChange,
  validateProfileUpdate,
  validateId,
  validatePagination,
  handleValidationErrors
};
