async function loadProfile() {
  try {
    const response = await fetch('/student/api/profile');
    const data = await response.json();
    
    document.getElementById('studentName').textContent = 
      `${data.first_name || 'N/A'} ${data.last_name || ''}`;
    document.getElementById('department').textContent = data.department || 'N/A';
    document.getElementById('semester').textContent = data.semester || 'N/A';
  } catch (error) {
    console.error('Error loading profile:', error);
  }
}

async function loadAttendance() {
  try {
    const response = await fetch('/student/api/attendance');
    const data = await response.json();
    
    const tbody = document.getElementById('attendanceTable');
    
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" class="text-center">No attendance records found</td></tr>';
      return;
    }
    
    tbody.innerHTML = data.map(record => `
      <tr>
        <td>${new Date(record.attendance_date).toLocaleDateString()}</td>
        <td>${record.course_name} (${record.course_code})</td>
        <td><span class="badge-modern badge-${record.status === 'present' ? 'success' : (record.status === 'late' ? 'warning' : 'danger')}">${record.status === 'present' ? '✓ Present' : (record.status === 'late' ? '⏰ Late' : '✗ Absent')}</span></td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error loading attendance:', error);
  }
}

async function loadResults() {
  try {
    const response = await fetch('/student/api/results');
    const data = await response.json();
    
    const tbody = document.getElementById('resultsTable');
    
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">No results found</td></tr>';
      return;
    }
    
    tbody.innerHTML = data.map(result => `
      <tr>
        <td>${new Date(result.exam_date).toLocaleDateString()}</td>
        <td>${result.course_code}</td>
        <td>${result.exam_name}</td>
        <td>${result.marks_obtained}/${result.max_marks}</td>
        <td><span class="badge-modern badge-${getGradeBadge(result.grade)}">${result.grade}</span></td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error loading results:', error);
  }
}

function getGradeBadge(grade) {
  if (grade.includes('A')) return 'success';
  if (grade.includes('B')) return 'primary';
  if (grade.includes('C')) return 'info';
  if (grade.includes('D')) return 'warning';
  return 'danger';
}

loadProfile();
loadAttendance();
loadResults();
