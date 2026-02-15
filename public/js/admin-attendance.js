// Set default dates (last 30 days)
const today = new Date();
const thirtyDaysAgo = new Date(today);
thirtyDaysAgo.setDate(today.getDate() - 30);

document.getElementById('startDate').valueAsDate = thirtyDaysAgo;
document.getElementById('endDate').valueAsDate = today;

// Load courses
async function loadCourses() {
  try {
    const response = await fetch('/admin/api/all-courses');
    const courses = await response.json();
    
    const select = document.getElementById('courseFilter');
    select.innerHTML = '<option value="">All Courses</option>' +
      courses.map(course => 
        `<option value="${course.course_id}">${course.course_code} - ${course.course_name}</option>`
      ).join('');
  } catch (error) {
    console.error('Error loading courses:', error);
  }
}

// Generate report
document.getElementById('filterForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const courseId = document.getElementById('courseFilter').value;
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  
  if (!startDate || !endDate) {
    alert('Please select start and end dates');
    return;
  }
  
  try {
    const params = new URLSearchParams({
      startDate,
      endDate,
      ...(courseId && { courseId })
    });
    
    const response = await fetch(`/admin/api/attendance-report?${params}`);
    const data = await response.json();
    
    displayReport(data);
  } catch (error) {
    console.error('Error generating report:', error);
    alert('Error generating report');
  }
});

function displayReport(data) {
  // Update statistics
  const totalPresent = data.records.filter(r => r.status === 'present').length;
  const totalAbsent = data.records.filter(r => r.status === 'absent').length;
  const totalLate = data.records.filter(r => r.status === 'late').length;
  const total = data.records.length;
  const rate = total > 0 ? ((totalPresent + totalLate) / total * 100).toFixed(1) : 0;
  
  document.getElementById('totalPresent').textContent = totalPresent;
  document.getElementById('totalAbsent').textContent = totalAbsent;
  document.getElementById('totalLate').textContent = totalLate;
  document.getElementById('attendanceRate').textContent = rate + '%';
  
  // Display records
  const tbody = document.getElementById('attendanceTable');
  
  if (data.records.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center">No attendance records found</td></tr>';
    return;
  }
  
  tbody.innerHTML = data.records.map(record => `
    <tr>
      <td>${new Date(record.attendance_date).toLocaleDateString()}</td>
      <td>${record.student_name}</td>
      <td>${record.course_code} - ${record.course_name}</td>
      <td><span class="badge-enterprise badge-enterprise-${getBadgeColor(record.status)}">${record.status}</span></td>
    </tr>
  `).join('');
}

function getBadgeColor(status) {
  switch(status) {
    case 'present': return 'success';
    case 'absent': return 'danger';
    case 'late': return 'warning';
    default: return 'secondary';
  }
}

loadCourses();
