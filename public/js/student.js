// ── Dummy data ──────────────────────────────────────────────
const DUMMY = {
  profile: { first_name: 'Ujwal', last_name: 'Kumar', email: 'ujwal@college.edu', phone: '9876543210', department: 'Computer Science', semester: '5', roll_number: 'CS2021045' },
  attendance: [
    { attendance_date: '2026-04-04', course_name: 'Data Structures', course_code: 'CS301', status: 'present' },
    { attendance_date: '2026-04-03', course_name: 'Operating Systems', course_code: 'CS302', status: 'absent' },
    { attendance_date: '2026-04-03', course_name: 'Data Structures', course_code: 'CS301', status: 'present' },
    { attendance_date: '2026-04-02', course_name: 'DBMS', course_code: 'CS303', status: 'present' },
    { attendance_date: '2026-04-02', course_name: 'Computer Networks', course_code: 'CS304', status: 'late' },
    { attendance_date: '2026-04-01', course_name: 'Software Engineering', course_code: 'CS305', status: 'present' },
  ],
  results: [
    { exam_date: '2026-03-20', course_code: 'CS301', exam_name: 'Mid-Term', marks_obtained: 42, max_marks: 50, grade: 'A' },
    { exam_date: '2026-03-18', course_code: 'CS302', exam_name: 'Mid-Term', marks_obtained: 38, max_marks: 50, grade: 'B+' },
    { exam_date: '2026-03-15', course_code: 'CS303', exam_name: 'Quiz 2', marks_obtained: 18, max_marks: 20, grade: 'A+' },
    { exam_date: '2026-03-10', course_code: 'CS304', exam_name: 'Assignment 1', marks_obtained: 28, max_marks: 30, grade: 'A' },
    { exam_date: '2026-02-28', course_code: 'CS305', exam_name: 'Mid-Term', marks_obtained: 35, max_marks: 50, grade: 'B' },
  ],
  subjectAttendance: [
    { subject: 'Data Structures', code: 'CS301', pct: 90 },
    { subject: 'Operating Systems', code: 'CS302', pct: 72 },
    { subject: 'DBMS', code: 'CS303', pct: 88 },
    { subject: 'Computer Networks', code: 'CS304', pct: 78 },
    { subject: 'Software Engineering', code: 'CS305', pct: 85 },
  ],
  courses: [
    { code: 'CS301', name: 'Data Structures & Algorithms', faculty: 'Dr. Ramesh Patel', credits: 4, semester: 5, dept: 'Computer Science' },
    { code: 'CS302', name: 'Operating Systems', faculty: 'Prof. Sunita Rao', credits: 3, semester: 5, dept: 'Computer Science' },
    { code: 'CS303', name: 'Database Management Systems', faculty: 'Dr. Anil Sharma', credits: 4, semester: 5, dept: 'Computer Science' },
    { code: 'CS304', name: 'Computer Networks', faculty: 'Prof. Meena Joshi', credits: 3, semester: 5, dept: 'Computer Science' },
    { code: 'CS305', name: 'Software Engineering', faculty: 'Dr. Vikram Singh', credits: 3, semester: 5, dept: 'Computer Science' },
    { code: 'CS306', name: 'Web Technologies', faculty: 'Prof. Priya Nair', credits: 2, semester: 5, dept: 'Computer Science' },
  ],
  timetable: [
    { day: 'Monday',    time: '09:00 - 10:00', subject: 'Data Structures',    faculty: 'Dr. Ramesh Patel',  room: 'A101' },
    { day: 'Monday',    time: '10:00 - 11:00', subject: 'Operating Systems',  faculty: 'Prof. Sunita Rao',  room: 'B202' },
    { day: 'Monday',    time: '11:15 - 12:15', subject: 'DBMS',               faculty: 'Dr. Anil Sharma',   room: 'A103' },
    { day: 'Tuesday',   time: '09:00 - 10:00', subject: 'Computer Networks',  faculty: 'Prof. Meena Joshi', room: 'C301' },
    { day: 'Tuesday',   time: '10:00 - 11:00', subject: 'Software Engg.',     faculty: 'Dr. Vikram Singh',  room: 'A102' },
    { day: 'Tuesday',   time: '02:00 - 04:00', subject: 'Web Tech Lab',       faculty: 'Prof. Priya Nair',  room: 'Lab-1' },
    { day: 'Wednesday', time: '09:00 - 10:00', subject: 'Data Structures',    faculty: 'Dr. Ramesh Patel',  room: 'A101' },
    { day: 'Wednesday', time: '11:15 - 12:15', subject: 'DBMS',               faculty: 'Dr. Anil Sharma',   room: 'A103' },
    { day: 'Thursday',  time: '09:00 - 10:00', subject: 'Operating Systems',  faculty: 'Prof. Sunita Rao',  room: 'B202' },
    { day: 'Thursday',  time: '10:00 - 11:00', subject: 'Computer Networks',  faculty: 'Prof. Meena Joshi', room: 'C301' },
    { day: 'Thursday',  time: '02:00 - 04:00', subject: 'DS Lab',             faculty: 'Dr. Ramesh Patel',  room: 'Lab-2' },
    { day: 'Friday',    time: '09:00 - 10:00', subject: 'Software Engg.',     faculty: 'Dr. Vikram Singh',  room: 'A102' },
    { day: 'Friday',    time: '10:00 - 11:00', subject: 'Web Technologies',   faculty: 'Prof. Priya Nair',  room: 'B101' },
  ],
  fees: [
    { date: '2026-01-05', desc: 'Tuition Fee - Sem 5', amount: 25000, status: 'paid' },
    { date: '2026-01-05', desc: 'Library Fee',          amount:  2000, status: 'paid' },
    { date: '2026-01-05', desc: 'Lab Fee',              amount:  5000, status: 'paid' },
    { date: '2026-02-01', desc: 'Sports Fee',           amount:  1500, status: 'paid' },
    { date: '2026-03-01', desc: 'Hostel Fee - Mar',     amount:  9091, status: 'paid' },
    { date: '2026-04-01', desc: 'Hostel Fee - Apr',     amount:  7409, status: 'pending' },
  ],
  notifications: [
    { id: 1, title: 'Mid-term exam starts next week', msg: 'Mid-term examinations begin from April 12. Check timetable.', time: '2h ago', read: false },
    { id: 2, title: 'Fee payment deadline approaching', msg: 'Hostel fee for April is due by April 10, 2026.', time: '5h ago', read: false },
    { id: 3, title: 'New assignment uploaded', msg: 'Dr. Anil Sharma uploaded DBMS Assignment 3. Submit by April 8.', time: '1d ago', read: false },
    { id: 4, title: 'Holiday notice', msg: 'College will remain closed on April 14 for Dr. Ambedkar Jayanti.', time: '2d ago', read: true },
    { id: 5, title: 'Result published', msg: 'CS303 Quiz 2 results have been published. Check your marks.', time: '3d ago', read: true },
  ],
  cgpa: [7.2, 7.6, 7.9, 8.1, 8.4]
};

// ── Section navigation ───────────────────────────────────────
function showSection(name) {
  document.querySelectorAll('.tab-content-section').forEach(s => s.classList.remove('active'));
  document.getElementById('section-' + name).classList.add('active');
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  event && event.target && event.target.classList.add('active');
}

// ── Profile ──────────────────────────────────────────────────
async function loadProfile() {
  let data = DUMMY.profile;
  try {
    const r = await fetch('/student/api/profile');
    if (r.ok) data = await r.json();
  } catch (_) {}
  const name = `${data.first_name || ''} ${data.last_name || ''}`.trim();
  document.getElementById('studentName').textContent = name || 'Student';
  document.getElementById('statDept').textContent = data.department || 'N/A';
  document.getElementById('statSem').textContent = `Sem ${data.semester || 'N/A'}`;
  document.getElementById('profileFirstName').value = data.first_name || '';
  document.getElementById('profileLastName').value  = data.last_name  || '';
  document.getElementById('profileEmail').value     = data.email      || '';
  document.getElementById('profilePhone').value     = data.phone      || '';
  document.getElementById('profileDept').value      = data.department || '';
  document.getElementById('profileSem').value       = `Semester ${data.semester || ''}`;
}

function saveProfile() {
  const msg = document.getElementById('profileSaveMsg');
  msg.style.display = 'inline';
  setTimeout(() => msg.style.display = 'none', 3000);
}

// ── Attendance ───────────────────────────────────────────────
async function loadAttendance() {
  let data = DUMMY.attendance;
  try {
    const r = await fetch('/student/api/attendance');
    if (r.ok) { const d = await r.json(); if (d.length) data = d; }
  } catch (_) {}
  const tbody = document.getElementById('attendanceTable');
  if (!data.length) { tbody.innerHTML = '<tr><td colspan="3" class="text-center py-3 text-muted">No records available</td></tr>'; return; }
  tbody.innerHTML = data.map(rec => `
    <tr>
      <td>${new Date(rec.attendance_date).toLocaleDateString('en-IN')}</td>
      <td>${rec.course_name} <small class="text-muted">(${rec.course_code})</small></td>
      <td>${statusBadge(rec.status)}</td>
    </tr>`).join('');
}

function statusBadge(s) {
  const map = { present: ['success','✓ Present'], late: ['warning','⏰ Late'], absent: ['danger','✗ Absent'] };
  const [c, l] = map[s] || ['secondary', s];
  return `<span class="badge bg-${c}">${l}</span>`;
}

function renderSubjectAttendance() {
  const el = document.getElementById('subjectAttendance');
  el.innerHTML = DUMMY.subjectAttendance.map(s => {
    const color = s.pct >= 85 ? '#22c55e' : s.pct >= 75 ? '#f59e0b' : '#ef4444';
    return `
      <div class="mb-3">
        <div class="d-flex justify-content-between mb-1">
          <span style="font-size:0.85rem">${s.subject} <small class="text-muted">${s.code}</small></span>
          <span style="font-size:0.85rem;font-weight:600;color:${color}">${s.pct}%</span>
        </div>
        <div class="attendance-bar"><div class="attendance-fill" style="width:${s.pct}%;background:${color}"></div></div>
      </div>`;
  }).join('');
}

// ── Results ──────────────────────────────────────────────────
async function loadResults() {
  let data = DUMMY.results;
  try {
    const r = await fetch('/student/api/results');
    if (r.ok) { const d = await r.json(); if (d.length) data = d; }
  } catch (_) {}
  const tbody = document.getElementById('resultsTable');
  if (!data.length) { tbody.innerHTML = '<tr><td colspan="5" class="text-center py-3 text-muted">No records available</td></tr>'; return; }
  tbody.innerHTML = data.map(res => `
    <tr>
      <td>${new Date(res.exam_date).toLocaleDateString('en-IN')}</td>
      <td>${res.course_code}</td>
      <td>${res.exam_name}</td>
      <td>${res.marks_obtained}/${res.max_marks}</td>
      <td><span class="badge bg-${gradeBadge(res.grade)}">${res.grade}</span></td>
    </tr>`).join('');
}

function gradeBadge(g) {
  if (g.startsWith('A')) return 'success';
  if (g.startsWith('B')) return 'primary';
  if (g.startsWith('C')) return 'info';
  return 'warning';
}

// ── Courses ──────────────────────────────────────────────────
function renderCourses() {
  const grid = document.getElementById('coursesGrid');
  if (!DUMMY.courses.length) { grid.innerHTML = '<div class="col-12 text-center text-muted py-4">No records available</div>'; return; }
  grid.innerHTML = DUMMY.courses.map(c => `
    <div class="col-md-4 mb-4">
      <div class="card-enterprise h-100">
        <div class="card-enterprise-header"><i class="bi bi-book me-2"></i>${c.code}</div>
        <div class="card-body">
          <h6 class="fw-semibold mb-3">${c.name}</h6>
          <div class="d-flex flex-column gap-1" style="font-size:0.85rem;color:#6b7280">
            <span><i class="bi bi-person me-1"></i>${c.faculty}</span>
            <span><i class="bi bi-award me-1"></i>${c.credits} Credits</span>
            <span><i class="bi bi-layers me-1"></i>Semester ${c.semester}</span>
            <span><i class="bi bi-building me-1"></i>${c.dept}</span>
          </div>
        </div>
      </div>
    </div>`).join('');
}

// ── Timetable ────────────────────────────────────────────────
function renderTimetable() {
  const tbody = document.getElementById('timetableBody');
  if (!DUMMY.timetable.length) { tbody.innerHTML = '<tr><td colspan="5" class="text-center py-3 text-muted">No records available</td></tr>'; return; }
  const dayColors = { Monday:'#eff6ff', Tuesday:'#f0fdf4', Wednesday:'#fefce8', Thursday:'#fdf4ff', Friday:'#fff7ed' };
  tbody.innerHTML = DUMMY.timetable.map(t => `
    <tr>
      <td><span class="badge" style="background:${dayColors[t.day]||'#f8fafc'};color:#374151;font-weight:600">${t.day}</span></td>
      <td>${t.time}</td>
      <td><strong>${t.subject}</strong></td>
      <td>${t.faculty}</td>
      <td><span class="badge bg-light text-dark">${t.room}</span></td>
    </tr>`).join('');
}

// ── Fees ─────────────────────────────────────────────────────
function renderFees() {
  const tbody = document.getElementById('feesTable');
  if (!DUMMY.fees.length) { tbody.innerHTML = '<tr><td colspan="4" class="text-center py-3 text-muted">No records available</td></tr>'; return; }
  tbody.innerHTML = DUMMY.fees.map(f => `
    <tr>
      <td>${new Date(f.date).toLocaleDateString('en-IN')}</td>
      <td>${f.desc}</td>
      <td>₹${f.amount.toLocaleString('en-IN')}</td>
      <td><span class="badge bg-${f.status === 'paid' ? 'success' : 'danger'}">${f.status === 'paid' ? '✓ Paid' : '⏳ Pending'}</span></td>
    </tr>`).join('');
}

// ── Notifications ────────────────────────────────────────────
function renderNotifications() {
  const list = document.getElementById('notifList');
  const unread = DUMMY.notifications.filter(n => !n.read).length;
  document.getElementById('notifBadge').textContent = unread;
  document.getElementById('notifBadge').style.display = unread ? 'flex' : 'none';
  if (!DUMMY.notifications.length) { list.innerHTML = '<div class="p-3 text-center text-muted">No notifications</div>'; return; }
  list.innerHTML = DUMMY.notifications.map(n => `
    <div class="notif-item ${n.read ? 'read' : 'unread'}" onclick="markRead(${n.id})">
      <div style="font-size:0.85rem;font-weight:${n.read ? '400' : '600'}">${n.title}</div>
      <div style="font-size:0.78rem;color:#6b7280;margin-top:2px">${n.msg}</div>
      <div style="font-size:0.72rem;color:#9ca3af;margin-top:4px">${n.time}</div>
    </div>`).join('');
}

function toggleNotifications(e) {
  e.preventDefault();
  e.stopPropagation();
  const d = document.getElementById('notifDropdown');
  d.style.display = d.style.display === 'none' ? 'block' : 'none';
}

function markRead(id) {
  const n = DUMMY.notifications.find(x => x.id === id);
  if (n) n.read = true;
  renderNotifications();
}

function markAllRead(e) {
  e.preventDefault();
  DUMMY.notifications.forEach(n => n.read = true);
  renderNotifications();
}

document.addEventListener('click', e => {
  const d = document.getElementById('notifDropdown');
  if (!d.contains(e.target) && !e.target.closest('.nav-item.position-relative')) {
    d.style.display = 'none';
  }
});

// ── CGPA Chart ───────────────────────────────────────────────
function renderCgpaChart() {
  const ctx = document.getElementById('cgpaChart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5'],
      datasets: [{
        label: 'CGPA',
        data: DUMMY.cgpa,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37,99,235,0.08)',
        borderWidth: 2,
        pointBackgroundColor: '#2563eb',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { min: 6, max: 10, ticks: { stepSize: 1 } }
      }
    }
  });
}

// ── Init ─────────────────────────────────────────────────────
loadProfile();
loadAttendance();
loadResults();
renderSubjectAttendance();
renderCourses();
renderTimetable();
renderFees();
renderNotifications();
renderCgpaChart();
