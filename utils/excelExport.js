const ExcelJS = require('exceljs');

// Export attendance to Excel
const exportAttendanceToExcel = async (attendanceData, courseInfo) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Attendance Report');

  // Set column widths
  worksheet.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Student ID', key: 'student_id', width: 12 },
    { header: 'Student Name', key: 'student_name', width: 25 },
    { header: 'Course Code', key: 'course_code', width: 12 },
    { header: 'Course Name', key: 'course_name', width: 30 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Remarks', key: 'remarks', width: 30 }
  ];

  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E3A8A' }
  };
  worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

  // Add data
  attendanceData.forEach(record => {
    worksheet.addRow({
      date: new Date(record.attendance_date).toLocaleDateString(),
      student_id: record.student_id,
      student_name: record.student_name,
      course_code: record.course_code,
      course_name: record.course_name,
      status: record.status.toUpperCase(),
      remarks: record.remarks || ''
    });
  });

  // Add summary
  const totalRows = attendanceData.length;
  const presentCount = attendanceData.filter(r => r.status === 'present').length;
  const absentCount = attendanceData.filter(r => r.status === 'absent').length;
  const lateCount = attendanceData.filter(r => r.status === 'late').length;

  worksheet.addRow([]);
  worksheet.addRow(['Summary']);
  worksheet.addRow(['Total Records', totalRows]);
  worksheet.addRow(['Present', presentCount]);
  worksheet.addRow(['Absent', absentCount]);
  worksheet.addRow(['Late', lateCount]);

  return workbook;
};

// Export marks to Excel
const exportMarksToExcel = async (marksData, examInfo) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Marks Report');

  // Set column widths
  worksheet.columns = [
    { header: 'Roll No', key: 'roll_no', width: 12 },
    { header: 'Student Name', key: 'student_name', width: 25 },
    { header: 'Course Code', key: 'course_code', width: 12 },
    { header: 'Course Name', key: 'course_name', width: 30 },
    { header: 'Exam Name', key: 'exam_name', width: 20 },
    { header: 'Max Marks', key: 'max_marks', width: 12 },
    { header: 'Marks Obtained', key: 'marks_obtained', width: 15 },
    { header: 'Percentage', key: 'percentage', width: 12 },
    { header: 'Grade', key: 'grade', width: 10 }
  ];

  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E3A8A' }
  };
  worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

  // Add data
  marksData.forEach(record => {
    const percentage = ((record.marks_obtained / record.max_marks) * 100).toFixed(2);
    worksheet.addRow({
      roll_no: record.roll_no || record.student_id,
      student_name: record.student_name,
      course_code: record.course_code,
      course_name: record.course_name,
      exam_name: record.exam_name,
      max_marks: record.max_marks,
      marks_obtained: record.marks_obtained,
      percentage: `${percentage}%`,
      grade: record.grade || ''
    });
  });

  // Add statistics
  const totalStudents = marksData.length;
  const avgMarks = marksData.reduce((sum, r) => sum + parseFloat(r.marks_obtained), 0) / totalStudents;
  const maxMarks = Math.max(...marksData.map(r => parseFloat(r.marks_obtained)));
  const minMarks = Math.min(...marksData.map(r => parseFloat(r.marks_obtained)));

  worksheet.addRow([]);
  worksheet.addRow(['Statistics']);
  worksheet.addRow(['Total Students', totalStudents]);
  worksheet.addRow(['Average Marks', avgMarks.toFixed(2)]);
  worksheet.addRow(['Highest Marks', maxMarks]);
  worksheet.addRow(['Lowest Marks', minMarks]);

  return workbook;
};

// Export students list to Excel
const exportStudentsToExcel = async (studentsData) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Students List');

  // Set column widths
  worksheet.columns = [
    { header: 'Student ID', key: 'student_id', width: 12 },
    { header: 'Roll Number', key: 'roll_number', width: 15 },
    { header: 'First Name', key: 'first_name', width: 20 },
    { header: 'Last Name', key: 'last_name', width: 20 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Phone', key: 'phone', width: 15 },
    { header: 'Department', key: 'department', width: 20 },
    { header: 'Semester', key: 'semester', width: 10 },
    { header: 'Enrollment Date', key: 'enrollment_date', width: 15 }
  ];

  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E3A8A' }
  };
  worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

  // Add data
  studentsData.forEach(student => {
    worksheet.addRow({
      student_id: student.student_id,
      roll_number: student.roll_number,
      first_name: student.first_name,
      last_name: student.last_name,
      email: student.email,
      phone: student.phone || '',
      department: student.department,
      semester: student.semester,
      enrollment_date: student.enrollment_date ? new Date(student.enrollment_date).toLocaleDateString() : ''
    });
  });

  return workbook;
};

// Export fee defaulters to Excel
const exportDefaultersToExcel = async (defaultersData) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Fee Defaulters');

  // Set column widths
  worksheet.columns = [
    { header: 'Student ID', key: 'student_id', width: 12 },
    { header: 'Roll Number', key: 'roll_number', width: 15 },
    { header: 'Student Name', key: 'student_name', width: 25 },
    { header: 'Department', key: 'department', width: 20 },
    { header: 'Semester', key: 'semester', width: 10 },
    { header: 'Total Due', key: 'total_due', width: 15 },
    { header: 'Overdue Days', key: 'overdue_days', width: 15 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Contact', key: 'phone', width: 15 }
  ];

  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFEF4444' }
  };
  worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

  // Add data
  defaultersData.forEach(defaulter => {
    worksheet.addRow({
      student_id: defaulter.student_id,
      roll_number: defaulter.roll_number,
      student_name: defaulter.student_name,
      department: defaulter.department,
      semester: defaulter.semester,
      total_due: `₹${parseFloat(defaulter.total_due).toLocaleString('en-IN')}`,
      overdue_days: defaulter.overdue_days,
      status: defaulter.status.toUpperCase(),
      phone: defaulter.phone || ''
    });
  });

  // Add summary
  const totalDefaulters = defaultersData.length;
  const totalAmount = defaultersData.reduce((sum, d) => sum + parseFloat(d.total_due), 0);

  worksheet.addRow([]);
  worksheet.addRow(['Summary']);
  worksheet.addRow(['Total Defaulters', totalDefaulters]);
  worksheet.addRow(['Total Amount Due', `₹${totalAmount.toLocaleString('en-IN')}`]);

  return workbook;
};

module.exports = {
  exportAttendanceToExcel,
  exportMarksToExcel,
  exportStudentsToExcel,
  exportDefaultersToExcel
};
