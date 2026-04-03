// Calculate grade based on marks
const calculateGrade = (marksObtained, maxMarks) => {
  const percentage = (marksObtained / maxMarks) * 100;
  
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
};

// Calculate CGPA
const calculateCGPA = (results, courses) => {
  const gradePoints = {
    'A+': 10, 'A': 9, 'B+': 8, 'B': 7, 'C': 6, 'D': 5, 'F': 0
  };

  let totalPoints = 0;
  let totalCredits = 0;

  results.forEach(result => {
    const course = courses.find(c => c.course_id === result.course_id);
    if (course && result.grade && gradePoints[result.grade] !== undefined) {
      totalPoints += gradePoints[result.grade] * course.credits;
      totalCredits += course.credits;
    }
  });

  return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;
};

// Calculate attendance percentage
const calculateAttendancePercentage = (attendanceRecords) => {
  if (attendanceRecords.length === 0) return 0;
  
  const presentCount = attendanceRecords.filter(
    r => r.status === 'present' || r.status === 'late'
  ).length;
  const pct = (presentCount / attendanceRecords.length) * 100;
  return Math.min(100, Math.max(0, pct)).toFixed(2);
};

// Generate unique receipt number
const generateReceiptNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `RCP${year}${month}${day}${random}`;
};

// Generate unique ticket number
const generateTicketNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `TKT${year}${month}${random}`;
};

// Pagination helper
const paginate = (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  return { limit: parseInt(limit), offset: parseInt(offset) };
};

// Format date
const formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

// Check if date is overdue
const isOverdue = (dueDate) => {
  const due = new Date(dueDate);
  const now = new Date();
  return now > due;
};

// Calculate overdue days
const calculateOverdueDays = (dueDate) => {
  const due = new Date(dueDate);
  const now = new Date();
  const diffTime = now - due;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number
const isValidPhone = (phone) => {
  const phoneRegex = /^[0-9]{10,15}$/;
  return phoneRegex.test(phone);
};

// Sanitize string
const sanitizeString = (str) => {
  if (!str) return '';
  return str.trim().replace(/[<>]/g, '');
};

// Generate random password
const generateRandomPassword = (length = 12) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@$!%*?&';
  let password = '';
  
  // Ensure at least one of each required character type
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
  password += '0123456789'[Math.floor(Math.random() * 10)];
  password += '@$!%*?&'[Math.floor(Math.random() * 7)];
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

// Check low attendance
const checkLowAttendance = (attendancePercentage, threshold = 75) => {
  return parseFloat(attendancePercentage) < threshold;
};

// Format currency
const formatCurrency = (amount) => {
  return `₹${parseFloat(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

// Get academic year
const getAcademicYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  // Academic year starts in July (month 6)
  if (month >= 6) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
};

// Get current semester based on date
const getCurrentSemester = (enrollmentDate) => {
  const now = new Date();
  const enrolled = new Date(enrollmentDate);
  const monthsDiff = (now.getFullYear() - enrolled.getFullYear()) * 12 + 
                     (now.getMonth() - enrolled.getMonth());
  
  // Assuming 6 months per semester
  return Math.floor(monthsDiff / 6) + 1;
};

// Validate marks range
const isValidMarks = (marks, maxMarks) => {
  return marks >= 0 && marks <= maxMarks;
};

// Check if timetable slot conflicts
const hasTimeConflict = (slot1, slot2) => {
  if (slot1.day_of_week !== slot2.day_of_week) return false;
  
  const start1 = new Date(`2000-01-01 ${slot1.start_time}`);
  const end1 = new Date(`2000-01-01 ${slot1.end_time}`);
  const start2 = new Date(`2000-01-01 ${slot2.start_time}`);
  const end2 = new Date(`2000-01-01 ${slot2.end_time}`);
  
  return (start1 < end2 && end1 > start2);
};

// Build search query
const buildSearchQuery = (searchTerm, fields) => {
  if (!searchTerm) return '';
  
  const conditions = fields.map(field => `${field} LIKE ?`).join(' OR ');
  return `(${conditions})`;
};

// Build search params
const buildSearchParams = (searchTerm, fieldsCount) => {
  if (!searchTerm) return [];
  return Array(fieldsCount).fill(`%${searchTerm}%`);
};

module.exports = {
  calculateGrade,
  calculateCGPA,
  calculateAttendancePercentage,
  generateReceiptNumber,
  generateTicketNumber,
  paginate,
  formatDate,
  isOverdue,
  calculateOverdueDays,
  isValidEmail,
  isValidPhone,
  sanitizeString,
  generateRandomPassword,
  checkLowAttendance,
  formatCurrency,
  getAcademicYear,
  getCurrentSemester,
  isValidMarks,
  hasTimeConflict,
  buildSearchQuery,
  buildSearchParams
};
