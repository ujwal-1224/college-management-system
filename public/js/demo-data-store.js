// ============================================
// DEMO DATA STORE - Frontend Only
// Shared state for all modules
// ============================================

class DemoDataStore {
  constructor() {
    this.initializeData();
  }

  initializeData() {
    // Check if data exists in localStorage
    const stored = localStorage.getItem('collegeManagementData');
    if (stored) {
      const data = JSON.parse(stored);
      this.users = data.users;
      this.students = data.students;
      this.staff = data.staff;
      this.parents = data.parents;
      this.courses = data.courses;
      this.enrollments = data.enrollments;
      this.attendance = data.attendance;
      this.exams = data.exams;
      this.results = data.results;
      this.fees = data.fees;
      this.payments = data.payments;
      this.hostels = data.hostels;
      this.hostelAllocations = data.hostelAllocations;
      this.notifications = data.notifications;
      this.messages = data.messages;
      this.timetable = data.timetable;
      this.auditLogs = data.auditLogs;
    } else {
      this.loadDefaultData();
    }
  }

  loadDefaultData() {
    // Users
    this.users = [
      { id: 1, username: 'admin', password: 'admin123', role: 'admin', isActive: true },
      { id: 2, username: 'ujwal', password: 'student123', role: 'student', isActive: true },
      { id: 3, username: 'sriram', password: 'student123', role: 'student', isActive: true },
      { id: 4, username: 'shreekar', password: 'student123', role: 'student', isActive: true },
      { id: 5, username: 'sammer', password: 'student123', role: 'student', isActive: true },
      { id: 6, username: 'soubhagya', password: 'staff123', role: 'staff', isActive: true },
      { id: 7, username: 'priya', password: 'staff123', role: 'staff', isActive: true },
      { id: 8, username: 'shashi', password: 'parent123', role: 'parent', isActive: true },
      { id: 9, username: 'lakshmi', password: 'parent123', role: 'parent', isActive: true }
    ];

    // Students
    this.students = [
      { id: 1, userId: 2, firstName: 'G.', lastName: 'Ujwal', email: 'g.ujwal@college.edu.in', phone: '9876543210', dob: '2002-05-15', department: 'Computer Science', semester: 3, enrollmentDate: '2023-08-01' },
      { id: 2, userId: 3, firstName: 'Sriram', lastName: '', email: 'sriram@college.edu.in', phone: '9876543211', dob: '2002-08-20', department: 'Electronics', semester: 5, enrollmentDate: '2022-08-01' },
      { id: 3, userId: 4, firstName: 'Shreekar', lastName: '', email: 'shreekar@college.edu.in', phone: '9876543212', dob: '2003-03-10', department: 'Mechanical', semester: 2, enrollmentDate: '2024-01-15' },
      { id: 4, userId: 5, firstName: 'Sammer', lastName: '', email: 'sammer@college.edu.in', phone: '9876543213', dob: '2003-07-22', department: 'Computer Science', semester: 1, enrollmentDate: '2024-08-01' }
    ];

    // Staff
    this.staff = [
      { id: 1, userId: 6, firstName: 'Dr. Soubhagya', lastName: 'Barpanda', email: 'soubhagya.barpanda@college.edu.in', phone: '9876543220', department: 'Computer Science', designation: 'Professor' },
      { id: 2, userId: 7, firstName: 'Dr. Priya', lastName: '', email: 'priya@college.edu.in', phone: '9876543221', department: 'Electronics', designation: 'Associate Professor' }
    ];

    // Parents
    this.parents = [
      { id: 1, userId: 8, firstName: 'G.', lastName: 'Shashi', email: 'g.shashi@email.com', phone: '9876543230', occupation: 'Engineer', children: [1] },
      { id: 2, userId: 9, firstName: 'Lakshmi', lastName: '', email: 'lakshmi@email.com', phone: '9876543231', occupation: 'Doctor', children: [2] }
    ];

    // Courses
    this.courses = [
      { id: 1, code: 'CS101', name: 'Introduction to Programming', credits: 4, semester: 1, department: 'Computer Science', staffId: 1 },
      { id: 2, code: 'CS201', name: 'Data Structures', credits: 4, semester: 3, department: 'Computer Science', staffId: 1 },
      { id: 3, code: 'CS301', name: 'Database Systems', credits: 3, semester: 5, department: 'Computer Science', staffId: 1 },
      { id: 4, code: 'EC201', name: 'Digital Electronics', credits: 3, semester: 3, department: 'Electronics', staffId: 2 },
      { id: 5, code: 'MATH201', name: 'Discrete Mathematics', credits: 3, semester: 3, department: 'Computer Science', staffId: 1 }
    ];

    // Enrollments
    this.enrollments = [
      { id: 1, studentId: 1, courseId: 2, status: 'active', enrollmentDate: '2024-01-15' },
      { id: 2, studentId: 1, courseId: 3, status: 'active', enrollmentDate: '2024-01-15' },
      { id: 3, studentId: 1, courseId: 5, status: 'active', enrollmentDate: '2024-01-15' },
      { id: 4, studentId: 2, courseId: 3, status: 'active', enrollmentDate: '2023-08-01' },
      { id: 5, studentId: 2, courseId: 4, status: 'active', enrollmentDate: '2023-08-01' }
    ];

    // Attendance
    this.attendance = [];
    const dates = this.getLast10Days();
    dates.forEach((date, idx) => {
      this.attendance.push(
        { id: this.attendance.length + 1, studentId: 1, courseId: 2, date, status: idx % 5 === 0 ? 'absent' : 'present', markedBy: 1 },
        { id: this.attendance.length + 2, studentId: 1, courseId: 3, date, status: 'present', markedBy: 1 },
        { id: this.attendance.length + 3, studentId: 2, courseId: 3, date, status: 'present', markedBy: 1 },
        { id: this.attendance.length + 4, studentId: 2, courseId: 4, date, status: idx % 7 === 0 ? 'absent' : 'present', markedBy: 2 }
      );
    });

    // Exams
    this.exams = [
      { id: 1, courseId: 2, name: 'Mid-Term Exam', date: '2024-02-15', maxMarks: 100, createdBy: 1 },
      { id: 2, courseId: 2, name: 'Quiz 1', date: '2024-01-25', maxMarks: 50, createdBy: 1 },
      { id: 3, courseId: 3, name: 'Mid-Term Exam', date: '2024-02-12', maxMarks: 100, createdBy: 1 },
      { id: 4, courseId: 4, name: 'Mid-Term Exam', date: '2024-02-14', maxMarks: 100, createdBy: 2 },
      { id: 5, courseId: 5, name: 'Quiz 1', date: '2024-02-05', maxMarks: 50, createdBy: 1 }
    ];

    // Results
    this.results = [
      { id: 1, studentId: 1, examId: 1, marksObtained: 85, grade: 'A', submittedBy: 1 },
      { id: 2, studentId: 1, examId: 2, marksObtained: 42, grade: 'B+', submittedBy: 1 },
      { id: 3, studentId: 1, examId: 5, marksObtained: 45, grade: 'A+', submittedBy: 1 },
      { id: 4, studentId: 2, examId: 3, marksObtained: 78, grade: 'B+', submittedBy: 1 },
      { id: 5, studentId: 2, examId: 4, marksObtained: 88, grade: 'A', submittedBy: 2 }
    ];

    // Fees
    this.fees = [
      { id: 1, studentId: 1, semester: 3, tuitionFee: 50000, hostelFee: 15000, libraryFee: 2000, labFee: 3000, otherFee: 1000, totalFee: 71000, dueDate: '2024-02-28' },
      { id: 2, studentId: 2, semester: 5, tuitionFee: 50000, hostelFee: 15000, libraryFee: 2000, labFee: 3000, otherFee: 1000, totalFee: 71000, dueDate: '2024-02-28' },
      { id: 3, studentId: 3, semester: 2, tuitionFee: 50000, hostelFee: 15000, libraryFee: 2000, labFee: 3000, otherFee: 1000, totalFee: 71000, dueDate: '2024-02-28' }
    ];

    // Payments
    this.payments = [
      { id: 1, studentId: 1, amount: 50000, date: '2024-01-15', method: 'Online', semester: 3, status: 'paid', receiptNumber: 'RCP2024011501', transactionId: 'TXN123456789', description: 'Tuition Fee' },
      { id: 2, studentId: 1, amount: 15000, date: '2024-01-20', method: 'Online', semester: 3, status: 'paid', receiptNumber: 'RCP2024012001', transactionId: 'TXN123456790', description: 'Hostel Fee' },
      { id: 3, studentId: 2, amount: 71000, date: '2024-01-10', method: 'Online', semester: 5, status: 'paid', receiptNumber: 'RCP2024011001', transactionId: 'TXN123456791', description: 'Full Fee' }
    ];

    // Hostels
    this.hostels = [
      { id: 1, name: 'Boys Hostel A', type: 'boys', totalRooms: 100, availableRooms: 25 },
      { id: 2, name: 'Girls Hostel A', type: 'girls', totalRooms: 100, availableRooms: 30 }
    ];

    // Hostel Allocations
    this.hostelAllocations = [
      { id: 1, studentId: 1, hostelId: 1, roomNumber: 'A-205', allocationDate: '2023-08-01', status: 'active' },
      { id: 2, studentId: 2, hostelId: 2, roomNumber: 'A-215', allocationDate: '2022-08-01', status: 'active' }
    ];

    // Notifications
    this.notifications = [
      { id: 1, title: 'Welcome to College Management System', message: 'Welcome to the new academic year!', targetRole: 'all', priority: 'high', isRead: false, createdAt: new Date().toISOString(), createdBy: 1 },
      { id: 2, title: 'Mid-term Exams Announcement', message: 'Mid-term examinations will be conducted from 15th to 20th of next month.', targetRole: 'student', priority: 'high', isRead: false, createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), createdBy: 1 },
      { id: 3, title: 'Fee Payment Reminder', message: 'Please clear your pending dues before the end of this month.', targetRole: 'student', priority: 'high', isRead: false, createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), createdBy: 1 }
    ];

    // Messages
    this.messages = [];

    // Timetable
    this.timetable = [
      { id: 1, courseId: 1, day: 'Monday', startTime: '09:00', endTime: '10:30', room: 'Room 101' },
      { id: 2, courseId: 1, day: 'Wednesday', startTime: '09:00', endTime: '10:30', room: 'Room 101' },
      { id: 3, courseId: 2, day: 'Tuesday', startTime: '11:00', endTime: '12:30', room: 'Room 202' },
      { id: 4, courseId: 2, day: 'Thursday', startTime: '11:00', endTime: '12:30', room: 'Room 202' },
      { id: 5, courseId: 3, day: 'Monday', startTime: '14:00', endTime: '15:30', room: 'Lab 1' },
      { id: 6, courseId: 3, day: 'Friday', startTime: '14:00', endTime: '15:30', room: 'Lab 1' },
      { id: 7, courseId: 4, day: 'Tuesday', startTime: '09:00', endTime: '10:30', room: 'Room 201' },
      { id: 8, courseId: 5, day: 'Wednesday', startTime: '14:00', endTime: '15:30', room: 'Room 203' }
    ];

    // Audit Logs
    this.auditLogs = [
      { id: 1, userId: 1, action: 'LOGIN', timestamp: new Date().toISOString(), details: 'Admin logged in' },
      { id: 2, userId: 2, action: 'LOGIN', timestamp: new Date().toISOString(), details: 'Student logged in' }
    ];

    this.save();
  }

  getLast10Days() {
    const dates = [];
    for (let i = 9; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  }

  save() {
    const data = {
      users: this.users,
      students: this.students,
      staff: this.staff,
      parents: this.parents,
      courses: this.courses,
      enrollments: this.enrollments,
      attendance: this.attendance,
      exams: this.exams,
      results: this.results,
      fees: this.fees,
      payments: this.payments,
      hostels: this.hostels,
      hostelAllocations: this.hostelAllocations,
      notifications: this.notifications,
      messages: this.messages,
      timetable: this.timetable,
      auditLogs: this.auditLogs
    };
    localStorage.setItem('collegeManagementData', JSON.stringify(data));
  }

  // Helper methods
  getNextId(array) {
    return array.length > 0 ? Math.max(...array.map(item => item.id)) + 1 : 1;
  }

  addAuditLog(userId, action, details) {
    this.auditLogs.push({
      id: this.getNextId(this.auditLogs),
      userId,
      action,
      timestamp: new Date().toISOString(),
      details
    });
    this.save();
  }

  // User methods
  authenticateUser(username, password) {
    return this.users.find(u => u.username === username && u.password === password && u.isActive);
  }

  getUserProfile(userId, role) {
    if (role === 'student') {
      return this.students.find(s => s.userId === userId);
    } else if (role === 'staff') {
      return this.staff.find(s => s.userId === userId);
    } else if (role === 'parent') {
      return this.parents.find(p => p.userId === userId);
    }
    return null;
  }

  // Student methods
  getStudentCourses(studentId) {
    const enrollments = this.enrollments.filter(e => e.studentId === studentId && e.status === 'active');
    return enrollments.map(e => {
      const course = this.courses.find(c => c.id === e.courseId);
      const staff = this.staff.find(s => s.id === course.staffId);
      return {
        ...course,
        facultyName: staff ? `${staff.firstName} ${staff.lastName}` : 'TBA'
      };
    });
  }

  getStudentAttendance(studentId) {
    return this.attendance.filter(a => a.studentId === studentId).map(a => {
      const course = this.courses.find(c => c.id === a.courseId);
      return { ...a, courseName: course.name, courseCode: course.code };
    });
  }

  getStudentResults(studentId) {
    return this.results.filter(r => r.studentId === studentId).map(r => {
      const exam = this.exams.find(e => e.id === r.examId);
      const course = this.courses.find(c => c.id === exam.courseId);
      return { ...r, examName: exam.name, examDate: exam.date, maxMarks: exam.maxMarks, courseName: course.name, courseCode: course.code };
    });
  }

  calculateCGPA(studentId) {
    const results = this.getStudentResults(studentId);
    if (results.length === 0) return 0;
    
    const gradePoints = { 'A+': 10, 'A': 9, 'B+': 8, 'B': 7, 'C': 6, 'D': 5, 'F': 0 };
    const totalPoints = results.reduce((sum, r) => sum + (gradePoints[r.grade] || 0), 0);
    return (totalPoints / results.length).toFixed(2);
  }

  getStudentFees(studentId) {
    const fee = this.fees.find(f => f.studentId === studentId);
    const payments = this.payments.filter(p => p.studentId === studentId && p.status === 'paid');
    const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    return {
      ...fee,
      paidAmount,
      pendingDues: fee ? fee.totalFee - paidAmount : 0
    };
  }

  // Reset data
  resetData() {
    localStorage.removeItem('collegeManagementData');
    this.loadDefaultData();
  }
}

// Create global instance
window.dataStore = new DemoDataStore();
