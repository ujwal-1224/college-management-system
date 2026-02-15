async function loadStats() {
  try {
    const response = await fetch('/admin/api/stats');
    const data = await response.json();
    
    document.getElementById('totalStudents').textContent = data.students || 0;
    document.getElementById('totalFaculty').textContent = data.faculty || 0;
    document.getElementById('totalCourses').textContent = data.courses || 0;
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

async function loadStudents() {
  try {
    const response = await fetch('/admin/api/students');
    const data = await response.json();
    
    const tbody = document.getElementById('studentsTable');
    
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">No students found</td></tr>';
      return;
    }
    
    tbody.innerHTML = data.map(student => `
      <tr>
        <td>${student.student_id}</td>
        <td>${student.first_name} ${student.last_name}</td>
        <td>${student.email}</td>
        <td>${student.department || 'N/A'}</td>
        <td>${student.semester || 'N/A'}</td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error loading students:', error);
  }
}

loadStats();
loadStudents();
