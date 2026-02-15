let currentCourseId = null;
let currentDate = null;
let students = [];

// Set today's date as default
document.getElementById('attendanceDate').valueAsDate = new Date();

// Load courses on page load
async function loadCourses() {
  try {
    const response = await fetch('/staff/api/courses');
    const courses = await response.json();
    
    const select = document.getElementById('courseSelect');
    
    if (courses.length === 0) {
      select.innerHTML = '<option value="">No courses assigned</option>';
      return;
    }
    
    select.innerHTML = '<option value="">Select a course</option>' +
      courses.map(course => 
        `<option value="${course.course_id}">${course.course_code} - ${course.course_name}</option>`
      ).join('');
  } catch (error) {
    console.error('Error loading courses:', error);
  }
}

// Handle course selection form
document.getElementById('courseSelectForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const courseId = document.getElementById('courseSelect').value;
  const date = document.getElementById('attendanceDate').value;
  
  if (!courseId || !date) {
    alert('Please select both course and date');
    return;
  }
  
  currentCourseId = courseId;
  currentDate = date;
  
  await loadStudents(courseId, date);
});

// Load students for selected course
async function loadStudents(courseId, date) {
  try {
    const response = await fetch(`/staff/api/course-students/${courseId}`);
    const data = await response.json();
    
    students = data;
    
    const tbody = document.getElementById('studentsTable');
    const courseSelect = document.getElementById('courseSelect');
    const selectedCourse = courseSelect.options[courseSelect.selectedIndex].text;
    
    document.getElementById('selectedCourse').textContent = selectedCourse;
    document.getElementById('selectedDate').textContent = new Date(date).toLocaleDateString();
    document.getElementById('totalStudents').textContent = students.length;
    
    if (students.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center">No students enrolled in this course</td></tr>';
      return;
    }
    
    // Check if attendance already exists for this date
    const existingResponse = await fetch(`/staff/api/attendance-check/${courseId}/${date}`);
    const existingAttendance = await existingResponse.json();
    
    tbody.innerHTML = students.map(student => {
      const existing = existingAttendance.find(a => a.student_id === student.student_id);
      const status = existing ? existing.status : 'present';
      
      return `
        <tr>
          <td>${student.student_id}</td>
          <td>${student.first_name} ${student.last_name}</td>
          <td>${student.email}</td>
          <td>
            <select class="form-select form-select-sm attendance-status" data-student-id="${student.student_id}">
              <option value="present" ${status === 'present' ? 'selected' : ''}>Present</option>
              <option value="absent" ${status === 'absent' ? 'selected' : ''}>Absent</option>
              <option value="late" ${status === 'late' ? 'selected' : ''}>Late</option>
            </select>
          </td>
        </tr>
      `;
    }).join('');
    
    document.getElementById('attendanceCard').style.display = 'block';
    updateStats();
    
    // Add event listeners to update stats
    document.querySelectorAll('.attendance-status').forEach(select => {
      select.addEventListener('change', updateStats);
    });
    
    if (existingAttendance.length > 0) {
      showAlert('Attendance already exists for this date. You can update it.', 'warning');
    }
  } catch (error) {
    console.error('Error loading students:', error);
    alert('Error loading students');
  }
}

// Update attendance statistics
function updateStats() {
  const statuses = Array.from(document.querySelectorAll('.attendance-status')).map(s => s.value);
  
  document.getElementById('presentCount').textContent = statuses.filter(s => s === 'present').length;
  document.getElementById('absentCount').textContent = statuses.filter(s => s === 'absent').length;
  document.getElementById('lateCount').textContent = statuses.filter(s => s === 'late').length;
}

// Mark all students with same status
function markAll(status) {
  document.querySelectorAll('.attendance-status').forEach(select => {
    select.value = status;
  });
  updateStats();
}

// Save attendance
document.getElementById('attendanceForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const attendanceData = [];
  
  document.querySelectorAll('.attendance-status').forEach(select => {
    attendanceData.push({
      student_id: parseInt(select.dataset.studentId),
      course_id: parseInt(currentCourseId),
      attendance_date: currentDate,
      status: select.value
    });
  });
  
  try {
    const response = await fetch('/staff/api/mark-attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attendance: attendanceData })
    });
    
    const result = await response.json();
    
    if (result.success) {
      showAlert('Attendance saved successfully!', 'success');
      setTimeout(() => {
        location.reload();
      }, 2000);
    } else {
      showAlert('Error saving attendance: ' + result.message, 'danger');
    }
  } catch (error) {
    console.error('Error saving attendance:', error);
    showAlert('Error saving attendance', 'danger');
  }
});

function showAlert(message, type) {
  const alertDiv = document.getElementById('alertMessage');
  alertDiv.className = `alert alert-${type}`;
  alertDiv.textContent = message;
  alertDiv.classList.remove('d-none');
  
  setTimeout(() => {
    alertDiv.classList.add('d-none');
  }, 5000);
}

loadCourses();
