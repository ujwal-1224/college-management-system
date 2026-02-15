document.addEventListener('DOMContentLoaded', async () => {
  await loadTimetable();
});

async function loadTimetable() {
  try {
    const response = await fetch('/staff/api/timetable');
    const timetable = await response.json();
    
    const tbody = document.getElementById('timetableBody');
    
    if (timetable.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No classes scheduled</td></tr>';
      return;
    }
    
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    
    tbody.innerHTML = timetable.map(slot => {
      const isToday = slot.day === today;
      const rowClass = isToday ? 'table-active' : '';
      
      return `
        <tr class="${rowClass}">
          <td><strong>${slot.day}</strong>${isToday ? ' <span class="badge-enterprise badge-enterprise-info">Today</span>' : ''}</td>
          <td>${slot.time}</td>
          <td><strong>${slot.courseCode}</strong></td>
          <td>${slot.courseName}</td>
          <td>${slot.section}</td>
          <td>${slot.room}</td>
          <td>${slot.semester}</td>
        </tr>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading timetable:', error);
    document.getElementById('timetableBody').innerHTML = 
      '<tr><td colspan="7" class="text-center text-danger">Error loading timetable</td></tr>';
  }
}
