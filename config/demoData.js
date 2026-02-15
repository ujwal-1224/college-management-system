// ============================================
// CENTRALIZED DEMO DATA
// Single source of truth for all demo users and records
// ============================================

const bcrypt = require('bcrypt');

// Demo Login Credentials
const DEMO_CREDENTIALS = {
  admin: { username: 'admin', password: 'admin123' },
  student: { username: 'ujwal', password: 'student123' },
  staff: { username: 'soubhagya', password: 'staff123' },
  parent: { username: 'shashi', password: 'parent123' }
};

// Hashed passwords (bcrypt with 10 rounds)
const HASHED_PASSWORDS = {
  admin123: '$2b$10$6fYBRjNb4rm.ZWZP5UX8aeAarzeFBoaJzo6tLgKPv72bb8wWTNRbm',
  student123: '$2b$10$/t9rGbrSpUr7W1Gc0X.7aO8ZCvE4JHvqP/BfsfvOWQ4TV5nSHH0Fe',
  staff123: '$2b$10$GXnz5OxJiLCoMG/Up1d3Te9JkHyRg.PMjiTgQ28LzSVpGZ5Z9rV72',
  parent123: '$2b$10$Ze/pbbpDKbncZXGd89LtPevPbEIXcch4SC2FgX51PAcsTVIOQV82e'
};

// Demo Users
const demoUsers = {
  admin: {
    password: HASHED_PASSWORDS.admin123,
    role: 'admin',
    profile: { 
      first_name: 'System', 
      last_name: 'Administrator', 
      email: 'admin@college.edu.in' 
    }
  },
  ujwal: {
    password: HASHED_PASSWORDS.student123,
    role: 'student',
    profile: { 
      first_name: 'G.', 
      last_name: 'Ujwal', 
      email: 'g.ujwal@college.edu.in',
      department: 'Computer Science',
      semester: 3
    }
  },
  sriram: {
    password: HASHED_PASSWORDS.student123,
    role: 'student',
    profile: { 
      first_name: 'Sriram', 
      last_name: '', 
      email: 'sriram@college.edu.in',
      department: 'Electronics',
      semester: 5
    }
  },
  shreekar: {
    password: HASHED_PASSWORDS.student123,
    role: 'student',
    profile: { 
      first_name: 'Shreekar', 
      last_name: '', 
      email: 'shreekar@college.edu.in',
      department: 'Mechanical',
      semester: 2
    }
  },
  sammer: {
    password: HASHED_PASSWORDS.student123,
    role: 'student',
    profile: { 
      first_name: 'Sammer', 
      last_name: '', 
      email: 'sammer@college.edu.in',
      department: 'Computer Science',
      semester: 1
    }
  },
  soubhagya: {
    password: HASHED_PASSWORDS.staff123,
    role: 'staff',
    profile: { 
      first_name: 'Dr. Soubhagya', 
      last_name: 'Barpanda', 
      email: 'soubhagya.barpanda@college.edu.in',
      department: 'Computer Science',
      designation: 'Professor'
    }
  },
  shashi: {
    password: HASHED_PASSWORDS.parent123,
    role: 'parent',
    profile: { 
      first_name: 'G.', 
      last_name: 'Shashi', 
      email: 'g.shashi@email.com',
      phone: '9876543230',
      occupation: 'Engineer'
    }
  }
};

// Demo Students
const demoStudents = [
  { 
    id: 1, 
    username: 'ujwal',
    first_name: 'G.', 
    last_name: 'Ujwal', 
    email: 'g.ujwal@college.edu.in',
    phone: '9876543210',
    department: 'Computer Science',
    semester: 3,
    enrollment_date: '2023-08-01'
  },
  { 
    id: 2, 
    username: 'sriram',
    first_name: 'Sriram', 
    last_name: '', 
    email: 'sriram@college.edu.in',
    phone: '9876543211',
    department: 'Electronics',
    semester: 5,
    enrollment_date: '2022-08-01'
  },
  { 
    id: 3, 
    username: 'shreekar',
    first_name: 'Shreekar', 
    last_name: '', 
    email: 'shreekar@college.edu.in',
    phone: '9876543212',
    department: 'Mechanical',
    semester: 2,
    enrollment_date: '2024-01-15'
  },
  { 
    id: 4, 
    username: 'sammer',
    first_name: 'Sammer', 
    last_name: '', 
    email: 'sammer@college.edu.in',
    phone: '9876543213',
    department: 'Computer Science',
    semester: 1,
    enrollment_date: '2024-08-01'
  }
];

// Demo Staff
const demoStaff = [
  { 
    id: 1, 
    username: 'soubhagya',
    first_name: 'Dr. Soubhagya', 
    last_name: 'Barpanda', 
    email: 'soubhagya.barpanda@college.edu.in',
    phone: '9876543220',
    department: 'Computer Science',
    designation: 'Professor'
  }
];

// Demo Parents
const demoParents = [
  { 
    id: 1, 
    username: 'shashi',
    first_name: 'G.', 
    last_name: 'Shashi', 
    email: 'g.shashi@email.com',
    phone: '9876543230',
    occupation: 'Engineer'
  }
];

// Demo Children (Parent-Student relationships)
const demoChildren = [
  { 
    student_id: 1, 
    parent_username: 'shashi',
    first_name: 'G.', 
    last_name: 'Ujwal', 
    email: 'g.ujwal@college.edu.in',
    department: 'Computer Science',
    semester: 3,
    relationship: 'Son'
  }
];

// Demo Courses
const demoCourses = [
  { 
    course_code: 'CS101', 
    course_name: 'Introduction to Programming', 
    credits: 4, 
    semester: 1, 
    department: 'Computer Science',
    staff_username: 'soubhagya'
  },
  { 
    course_code: 'CS201', 
    course_name: 'Data Structures', 
    credits: 4, 
    semester: 3, 
    department: 'Computer Science',
    staff_username: 'soubhagya'
  },
  { 
    course_code: 'CS301', 
    course_name: 'Database Systems', 
    credits: 3, 
    semester: 5, 
    department: 'Computer Science',
    staff_username: 'soubhagya'
  },
  { 
    course_code: 'MATH201', 
    course_name: 'Discrete Mathematics', 
    credits: 3, 
    semester: 3, 
    department: 'Computer Science',
    staff_username: 'soubhagya'
  }
];

// Demo Attendance
const demoAttendance = [
  { attendance_date: '2024-02-13', course_name: 'Data Structures', course_code: 'CS201', status: 'present', student_username: 'ujwal' },
  { attendance_date: '2024-02-12', course_name: 'Database Systems', course_code: 'CS301', status: 'present', student_username: 'ujwal' },
  { attendance_date: '2024-02-11', course_name: 'Data Structures', course_code: 'CS201', status: 'absent', student_username: 'ujwal' },
  { attendance_date: '2024-02-13', course_name: 'Database Systems', course_code: 'CS301', status: 'present', student_username: 'sriram' },
  { attendance_date: '2024-02-12', course_name: 'Database Systems', course_code: 'CS301', status: 'present', student_username: 'sriram' }
];

// Demo Results
const demoResults = [
  { exam_date: '2024-02-10', course_code: 'CS201', exam_name: 'Mid-Term', marks_obtained: 85, max_marks: 100, grade: 'A', student_username: 'ujwal' },
  { exam_date: '2024-02-05', course_code: 'CS301', exam_name: 'Quiz 1', marks_obtained: 78, max_marks: 100, grade: 'B+', student_username: 'ujwal' },
  { exam_date: '2024-01-28', course_code: 'CS101', exam_name: 'Final Exam', marks_obtained: 92, max_marks: 100, grade: 'A+', student_username: 'ujwal' },
  { exam_date: '2024-02-10', course_code: 'CS301', exam_name: 'Mid-Term', marks_obtained: 88, max_marks: 100, grade: 'A', student_username: 'sriram' }
];

// Demo Exams
const demoExams = [
  { exam_id: 1, course_code: 'CS101', exam_name: 'Mid-Term', exam_date: '2024-02-15', max_marks: 100 },
  { exam_id: 2, course_code: 'CS201', exam_name: 'Final Exam', exam_date: '2024-02-20', max_marks: 100 },
  { exam_id: 3, course_code: 'CS301', exam_name: 'Quiz 1', exam_date: '2024-02-10', max_marks: 50 }
];

// Helper function to get credentials display string
function getCredentialsDisplay() {
  return `Admin: ${DEMO_CREDENTIALS.admin.username} / ${DEMO_CREDENTIALS.admin.password}
Student: ${DEMO_CREDENTIALS.student.username} / ${DEMO_CREDENTIALS.student.password}
Staff: ${DEMO_CREDENTIALS.staff.username} / ${DEMO_CREDENTIALS.staff.password}
Parent: ${DEMO_CREDENTIALS.parent.username} / ${DEMO_CREDENTIALS.parent.password}`;
}

// Helper function to get credentials for HTML display
function getCredentialsHTML() {
  return {
    admin: `${DEMO_CREDENTIALS.admin.username}/${DEMO_CREDENTIALS.admin.password}`,
    student: `${DEMO_CREDENTIALS.student.username}/${DEMO_CREDENTIALS.student.password}`,
    staff: `${DEMO_CREDENTIALS.staff.username}/${DEMO_CREDENTIALS.staff.password}`,
    parent: `${DEMO_CREDENTIALS.parent.username}/${DEMO_CREDENTIALS.parent.password}`
  };
}

module.exports = {
  DEMO_CREDENTIALS,
  HASHED_PASSWORDS,
  demoUsers,
  demoStudents,
  demoStaff,
  demoParents,
  demoChildren,
  demoCourses,
  demoAttendance,
  demoResults,
  demoExams,
  getCredentialsDisplay,
  getCredentialsHTML
};
