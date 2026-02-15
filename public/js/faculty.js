async function loadProfile() {
  try {
    const response = await fetch('/faculty/api/profile');
    const data = await response.json();
    
    document.getElementById('facultyName').textContent = 
      `${data.first_name || 'N/A'} ${data.last_name || ''}`;
    document.getElementById('department').textContent = data.department || 'N/A';
  } catch (error) {
    console.error('Error loading profile:', error);
  }
}

async function loadCourses() {
  try {
    const response = await fetch('/faculty/api/courses');
    const data = await response.json();
    
    const tbody = document.getElementById('coursesTable');
    
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center">No courses assigned</td></tr>';
      return;
    }
    
    tbody.innerHTML = data.map(course => `
      <tr>
        <td>${course.course_code}</td>
        <td>${course.course_name}</td>
        <td>${course.credits}</td>
        <td>${course.semester || 'N/A'}</td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error loading courses:', error);
  }
}

loadProfile();
loadCourses();
