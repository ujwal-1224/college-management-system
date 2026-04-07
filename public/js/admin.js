async function loadStats() {
  try {
    const response = await fetch('/admin/api/stats');
    const data = await response.json();
    
    const el = id => document.getElementById(id);
    if (el('totalStudents')) el('totalStudents').textContent = data.students || 0;
    if (el('totalFaculty'))  el('totalFaculty').textContent  = data.staff || data.faculty || 0;
    if (el('totalStaff'))    el('totalStaff').textContent    = data.staff || 0;
    if (el('totalCourses'))  el('totalCourses').textContent  = data.courses || 0;
    if (el('totalParents'))  el('totalParents').textContent  = data.parents || 0;
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
