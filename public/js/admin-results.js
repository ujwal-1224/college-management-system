// Load courses and exams
async function loadFilters() {
  try {
    const [coursesRes, examsRes] = await Promise.all([
      fetch('/admin/api/all-courses'),
      fetch('/admin/api/all-exams')
    ]);
    
    const courses = await coursesRes.json();
    const exams = await examsRes.json();
    
    const courseSelect = document.getElementById('courseFilter');
    courseSelect.innerHTML = '<option value="">All Courses</option>' +
      courses.map(course => 
        `<option value="${course.course_id}">${course.course_code} - ${course.course_name}</option>`
      ).join('');
    
    const examSelect = document.getElementById('examFilter');
    examSelect.innerHTML = '<option value="">All Exams</option>' +
      exams.map(exam => 
        `<option value="${exam.exam_id}">${exam.course_code} - ${exam.exam_name} (${new Date(exam.exam_date).toLocaleDateString()})</option>`
      ).join('');
  } catch (error) {
    console.error('Error loading filters:', error);
  }
}

// Generate report
document.getElementById('filterForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const courseId = document.getElementById('courseFilter').value;
  const examId = document.getElementById('examFilter').value;
  
  try {
    const params = new URLSearchParams({
      ...(courseId && { courseId }),
      ...(examId && { examId })
    });
    
    const response = await fetch(`/admin/api/results-report?${params}`);
    const data = await response.json();
    
    displayReport(data);
  } catch (error) {
    console.error('Error generating report:', error);
    alert('Error generating report');
  }
});

function displayReport(data) {
  const records = data.records;
  
  if (records.length === 0) {
    document.getElementById('avgMarks').textContent = '0';
    document.getElementById('highestMarks').textContent = '0';
    document.getElementById('lowestMarks').textContent = '0';
    document.getElementById('passRate').textContent = '0%';
    
    const tbody = document.getElementById('resultsTable');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">No results found</td></tr>';
    return;
  }
  
  // Calculate statistics
  const marks = records.map(r => r.marks_obtained);
  const avgMarks = (marks.reduce((a, b) => a + b, 0) / marks.length).toFixed(2);
  const highestMarks = Math.max(...marks);
  const lowestMarks = Math.min(...marks);
  
  // Calculate pass rate (assuming 40% is passing)
  const passCount = records.filter(r => {
    const percentage = (r.marks_obtained / r.max_marks) * 100;
    return percentage >= 40;
  }).length;
  const passRate = ((passCount / records.length) * 100).toFixed(1);
  
  document.getElementById('avgMarks').textContent = avgMarks;
  document.getElementById('highestMarks').textContent = highestMarks;
  document.getElementById('lowestMarks').textContent = lowestMarks;
  document.getElementById('passRate').textContent = passRate + '%';
  
  // Display records
  const tbody = document.getElementById('resultsTable');
  tbody.innerHTML = records.map(record => `
    <tr>
      <td>${record.roll_no}</td>
      <td>${record.student_name}</td>
      <td>${record.course_code}</td>
      <td>${record.exam_name}</td>
      <td>${record.marks_obtained}/${record.max_marks}</td>
      <td><span class="badge-enterprise badge-enterprise-${getGradeBadge(record.grade)}">${record.grade}</span></td>
    </tr>
  `).join('');
}

function getGradeBadge(grade) {
  if (grade.includes('A')) return 'success';
  if (grade.includes('B')) return 'info';
  if (grade.includes('C')) return 'info';
  if (grade.includes('D')) return 'warning';
  return 'danger';
}

loadFilters();
