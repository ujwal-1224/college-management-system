async function loadProfile() {
  try {
    const response = await fetch('/staff/api/profile');
    const data = await response.json();
    
    document.getElementById('staffName').textContent = 
      `${data.first_name || 'N/A'} ${data.last_name || ''}`;
    document.getElementById('fullName').textContent = 
      `${data.first_name || 'N/A'} ${data.last_name || ''}`;
    document.getElementById('email').textContent = data.email || 'N/A';
    document.getElementById('department').textContent = data.department || 'N/A';
    document.getElementById('designation').textContent = data.designation || 'N/A';
  } catch (error) {
    console.error('Error loading profile:', error);
  }
}

async function loadCourses() {
  try {
    const response = await fetch('/staff/api/courses');
    const data = await response.json();
    
    const tbody = document.getElementById('coursesTable');
    document.getElementById('totalCourses').textContent = data.length;
    
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">No courses assigned</td></tr>';
      return;
    }
    
    tbody.innerHTML = data.map(course => `
      <tr>
        <td>${course.course_code}</td>
        <td>${course.course_name}</td>
        <td>${course.credits}</td>
        <td>${course.semester || 'N/A'}</td>
        <td>${course.department || 'N/A'}</td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error loading courses:', error);
  }
}

async function loadStudents() {
  try {
    const response = await fetch('/staff/api/students');
    const data = await response.json();
    
    const tbody = document.getElementById('studentsTable');
    document.getElementById('totalStudents').textContent = data.length;
    
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

loadProfile();
loadCourses();
loadStudents();
