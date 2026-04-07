document.addEventListener('DOMContentLoaded', loadTimetable);

const DAY_ORDER = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

async function loadTimetable() {
  const container = document.getElementById('timetableContainer');
  try {
    const res  = await fetch('/staff/api/timetable');
    const data = await res.json();

    if (!data.length) {
      container.innerHTML = '<p class="text-muted text-center py-4">No classes scheduled.</p>';
      return;
    }

    // Deduplicate client-side as safety net
    const seen = new Set();
    const unique = data.filter(s => {
      const key = `${s.day}|${s.time}|${s.courseCode}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Group by day
    const byDay = {};
    unique.forEach(s => {
      if (!byDay[s.day]) byDay[s.day] = [];
      byDay[s.day].push(s);
    });

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    const html = DAY_ORDER
      .filter(day => byDay[day])
      .map(day => {
        const isToday = day === today;
        const slots   = byDay[day];
        const rows = slots.map((s, i) => `
          <div class="tt-slot ${i % 2 === 1 ? 'tt-slot-alt' : ''}">
            <div class="tt-time">
              <i class="bi bi-clock"></i> ${s.time}
            </div>
            <div class="tt-info">
              <span class="tt-code">${s.courseCode}</span>
              <span class="tt-name">${s.courseName}</span>
            </div>
            <div class="tt-meta">
              <span><i class="bi bi-door-open"></i> ${s.room || '—'}</span>
              <span><i class="bi bi-mortarboard"></i> Sem ${s.semester}</span>
              <span><i class="bi bi-building"></i> ${s.section}</span>
            </div>
          </div>`).join('');

        return `
          <div class="tt-day-card ${isToday ? 'tt-today' : ''}">
            <div class="tt-day-header">
              <span>${day}</span>
              ${isToday ? '<span class="tt-today-badge">Today</span>' : ''}
              <span class="tt-count">${slots.length} class${slots.length > 1 ? 'es' : ''}</span>
            </div>
            <div class="tt-slots">${rows}</div>
          </div>`;
      }).join('');

    container.innerHTML = html;
  } catch (e) {
    container.innerHTML = '<p class="text-danger text-center py-4">Error loading timetable.</p>';
  }
}
