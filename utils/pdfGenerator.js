const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Generate result PDF
const generateResultPDF = async (studentData, results, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(outputPath);

      doc.pipe(stream);

      // Header
      doc.fontSize(20).text('ABC College of Engineering', { align: 'center' });
      doc.fontSize(16).text('Academic Result Report', { align: 'center' });
      doc.moveDown();

      // Student Information
      doc.fontSize(12).text(`Student Name: ${studentData.first_name} ${studentData.last_name}`);
      doc.text(`Roll Number: ${studentData.roll_number}`);
      doc.text(`Department: ${studentData.department}`);
      doc.text(`Semester: ${studentData.semester}`);
      doc.text(`Date: ${new Date().toLocaleDateString()}`);
      doc.moveDown();

      // Results Table Header
      doc.fontSize(14).text('Examination Results', { underline: true });
      doc.moveDown(0.5);

      // Table
      const tableTop = doc.y;
      const col1 = 50;
      const col2 = 200;
      const col3 = 300;
      const col4 = 400;
      const col5 = 480;

      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Course', col1, tableTop);
      doc.text('Exam', col2, tableTop);
      doc.text('Max Marks', col3, tableTop);
      doc.text('Obtained', col4, tableTop);
      doc.text('Grade', col5, tableTop);

      doc.moveTo(col1, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      // Table Data
      doc.font('Helvetica');
      let y = tableTop + 25;
      let totalMarks = 0;
      let totalObtained = 0;

      results.forEach(result => {
        doc.text(result.course_code, col1, y, { width: 140 });
        doc.text(result.exam_name, col2, y, { width: 90 });
        doc.text(result.max_marks.toString(), col3, y);
        doc.text(result.marks_obtained.toString(), col4, y);
        doc.text(result.grade || 'N/A', col5, y);
        
        totalMarks += parseFloat(result.max_marks);
        totalObtained += parseFloat(result.marks_obtained);
        
        y += 25;
      });

      // Summary
      doc.moveTo(col1, y).lineTo(550, y).stroke();
      y += 10;
      doc.font('Helvetica-Bold');
      doc.text('Total:', col1, y);
      doc.text(totalMarks.toString(), col3, y);
      doc.text(totalObtained.toString(), col4, y);
      
      const percentage = ((totalObtained / totalMarks) * 100).toFixed(2);
      doc.text(`${percentage}%`, col5, y);

      // CGPA
      if (studentData.cgpa) {
        doc.moveDown(2);
        doc.fontSize(12).text(`CGPA: ${studentData.cgpa}`, { align: 'center' });
      }

      // Footer
      doc.moveDown(3);
      doc.fontSize(10).font('Helvetica');
      doc.text('This is a computer-generated document and does not require a signature.', {
        align: 'center'
      });

      doc.end();

      stream.on('finish', () => resolve(outputPath));
      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};

// Generate fee receipt PDF
const generateFeeReceiptPDF = async (paymentData, studentData, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(outputPath);

      doc.pipe(stream);

      // Header
      doc.fontSize(20).text('ABC College of Engineering', { align: 'center' });
      doc.fontSize(16).text('Fee Payment Receipt', { align: 'center' });
      doc.moveDown();

      // Receipt Details
      doc.fontSize(12);
      doc.text(`Receipt Number: ${paymentData.receipt_number}`);
      doc.text(`Transaction ID: ${paymentData.transaction_id || 'N/A'}`);
      doc.text(`Date: ${new Date(paymentData.payment_date).toLocaleDateString()}`);
      doc.moveDown();

      // Student Details
      doc.fontSize(14).text('Student Information', { underline: true });
      doc.fontSize(12);
      doc.text(`Name: ${studentData.first_name} ${studentData.last_name}`);
      doc.text(`Roll Number: ${studentData.roll_number}`);
      doc.text(`Department: ${studentData.department}`);
      doc.text(`Semester: ${paymentData.semester || studentData.semester}`);
      doc.moveDown();

      // Payment Details
      doc.fontSize(14).text('Payment Details', { underline: true });
      doc.fontSize(12);
      doc.text(`Description: ${paymentData.description || 'Fee Payment'}`);
      doc.text(`Payment Method: ${paymentData.payment_method}`);
      doc.text(`Amount Paid: ₹${parseFloat(paymentData.amount).toLocaleString('en-IN')}`);
      doc.text(`Status: ${paymentData.status.toUpperCase()}`);
      doc.moveDown();

      // Amount in words
      doc.fontSize(10);
      doc.text(`Amount in words: ${numberToWords(paymentData.amount)} Rupees Only`);
      doc.moveDown(2);

      // Footer
      doc.fontSize(10);
      doc.text('This is a computer-generated receipt and does not require a signature.', {
        align: 'center'
      });
      doc.text('For any queries, please contact the accounts department.', {
        align: 'center'
      });

      doc.end();

      stream.on('finish', () => resolve(outputPath));
      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};

// Generate attendance report PDF
const generateAttendanceReportPDF = async (studentData, attendanceData, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(outputPath);

      doc.pipe(stream);

      // Header
      doc.fontSize(20).text('ABC College of Engineering', { align: 'center' });
      doc.fontSize(16).text('Attendance Report', { align: 'center' });
      doc.moveDown();

      // Student Information
      doc.fontSize(12);
      doc.text(`Student Name: ${studentData.first_name} ${studentData.last_name}`);
      doc.text(`Roll Number: ${studentData.roll_number}`);
      doc.text(`Department: ${studentData.department}`);
      doc.text(`Semester: ${studentData.semester}`);
      doc.text(`Report Date: ${new Date().toLocaleDateString()}`);
      doc.moveDown();

      // Attendance Summary
      const totalClasses = attendanceData.length;
      const presentCount = attendanceData.filter(a => a.status === 'present').length;
      const percentage = totalClasses > 0 ? ((presentCount / totalClasses) * 100).toFixed(2) : 0;

      doc.fontSize(14).text('Attendance Summary', { underline: true });
      doc.fontSize(12);
      doc.text(`Total Classes: ${totalClasses}`);
      doc.text(`Classes Attended: ${presentCount}`);
      doc.text(`Attendance Percentage: ${percentage}%`);
      doc.moveDown();

      // Attendance Details
      doc.fontSize(14).text('Attendance Details', { underline: true });
      doc.moveDown(0.5);

      // Table
      const tableTop = doc.y;
      const col1 = 50;
      const col2 = 150;
      const col3 = 350;
      const col4 = 480;

      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Date', col1, tableTop);
      doc.text('Course', col2, tableTop);
      doc.text('Course Name', col3, tableTop);
      doc.text('Status', col4, tableTop);

      doc.moveTo(col1, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      // Table Data
      doc.font('Helvetica');
      let y = tableTop + 25;

      attendanceData.forEach(record => {
        if (y > 700) {
          doc.addPage();
          y = 50;
        }

        doc.text(new Date(record.attendance_date).toLocaleDateString(), col1, y);
        doc.text(record.course_code, col2, y);
        doc.text(record.course_name, col3, y, { width: 120 });
        doc.text(record.status.toUpperCase(), col4, y);
        
        y += 20;
      });

      doc.end();

      stream.on('finish', () => resolve(outputPath));
      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};

// Helper function to convert number to words
const numberToWords = (num) => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  if (num === 0) return 'Zero';

  const convert = (n) => {
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + convert(n % 10000000) : '');
  };

  return convert(Math.floor(num));
};

module.exports = {
  generateResultPDF,
  generateFeeReceiptPDF,
  generateAttendanceReportPDF
};
