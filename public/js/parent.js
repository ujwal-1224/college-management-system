// ── Shared dummy data (mirrors student module) ───────────────
const P_ATTENDANCE = [
  { attendance_date: '2026-04-04', course_name: 'Data Structures & Algorithms', course_code: 'CS301', status: 'present' },
  { attendance_date: '2026-04-03', course_name: 'Operating Systems',            course_code: 'CS302', status: 'absent'  },
  { attendance_date: '2026-04-03', course_name: 'Data Structures & Algorithms', course_code: 'CS301', status: 'present' },
  { attendance_date: '2026-04-02', course_name: 'Database Management Systems',  course_code: 'CS303', status: 'present' },
  { attendance_date: '2026-04-02', course_name: 'Computer Networks',            course_code: 'CS304', status: 'late'    },
  { attendance_date: '2026-04-01', course_name: 'Software Engineering',         course_code: 'CS305', status: 'present' },
  { attendance_date: '2026-03-31', course_name: 'Database Management Systems',  course_code: 'CS303', status: 'present' },
  { attendance_date: '2026-03-31', course_name: 'Operating Systems',            course_code: 'CS302', status: 'present' },
  { attendance_date: '2026-03-28', course_name: 'Data Structures & Algorithms', course_code: 'CS301', status: 'absent'  },
  { attendance_date: '2026-03-28', course_name: 'Computer Networks',            course_code: 'CS304', status: 'present' },
];

const P_SUBJECT_ATTENDANCE = [
  { subject: 'Data Structures & Algorithms', code: 'CS301', pct: 90 },
  { subject: 'Operating Systems',            code: 'CS302', pct: 72 },
  { subject: 'Database Management Systems',  code: 'CS303', pct: 88 },
  { subject: 'Computer Networks',            code: 'CS304', pct: 78 },
  { subject: 'Software Engineering',         code: 'CS305', pct: 85 },
  { subject: 'Web Technologies',             code: 'CS306', pct: 80 },
];

const P_RESULTS = [
  { exam_date: '2026-04-20', course_code: 'CS301', course_name: 'Data Structures & Algorithms', exam_name: 'Final Exam',   marks_obtained: 92, max_marks: 100, grade: 'A+' },
  { exam_date: '2026-04-15', course_code: 'CS302', course_name: 'Operating Systems',            exam_name: 'Final Exam',   marks_obtained: 78, max_marks: 100, grade: 'B+' },
  { exam_date: '2026-03-20', course_code: 'CS303', course_name: 'Database Management Systems',  exam_name: 'Mid-Term',     marks_obtained: 42, max_marks: 50,  grade: 'A'  },
  { exam_date: '2026-03-18', course_code: 'CS304', course_name: 'Computer Networks',            exam_name: 'Mid-Term',     marks_obtained: 38, max_marks: 50,  grade: 'B+' },
  { exam_date: '2026-03-15', course_code: 'CS305', course_name: 'Software Engineering',         exam_name: 'Quiz 2',       marks_obtained: 18, max_marks: 20,  grade: 'A+' },
  { exam_date: '2026-02-28', course_code: 'CS306', course_name: 'Web Technologies',             exam_name: 'Assignment 1', marks_obtained: 28, max_marks: 30,  grade: 'A'  },
];

const P_PAYMENTS = [
  { payment_date: '2026-01-05', description: 'Tuition Fee - Sem 5', amount: 25000, payment_method: 'Online', status: 'paid' },
  { payment_date: '2026-01-05', description: 'Library Fee',          amount:  2000, payment_method: 'Online', status: 'paid' },
  { payment_date: '2026-01-05', description: 'Lab Fee',              amount:  5000, payment_method: 'UPI',    status: 'paid' },
  { payment_date: '2026-02-01', description: 'Sports Fee',           amount:  1500, payment_method: 'Cash',   status: 'paid' },
  { payment_date: '2026-03-01', description: 'Hostel Fee - Mar',     amount:  4091, payment_method: 'Online', status: 'paid' },
  { payment_date: '2026-04-01', description: 'Hostel Fee - Apr',     amount: 12409, payment_method: 'Online', status: 'pending' },
];

// ── Helpers ──────────────────────────────────────────────────
function fmtDate(iso) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

function statusBadge(s) {
  const map = { present:['success','✓ Present'], late:['warning','⏰ Late'], absent:['danger','✗ Absent'] };
  const [c,l] = map[s] || ['secondary', s];
  return `<span class="badge bg-${c}">${l}</span>`;
}

function gradeBadge(g) {
  if (!g) return 'secondary';
  if (g.startsWith('A')) return 'success';
  if (g.startsWith('B')) return 'primary';
  if (g.startsWith('C')) return 'info';
  return 'warning';
}

// ── Section navigation ───────────────────────────────────────
function showSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById('section-' + name).classList.add('active');
  document.querySelectorAll('.navbar-nav .nav-link').forEach(l => l.classList.remove('active'));
  const navEl = document.getElementById('nav-' + name);
  if (navEl) navEl.classList.add('active');
  const nc = document.querySelector('.navbar-collapse');
  if (nc && nc.classList.contains('show')) nc.classList.remove('show');
  return false;
}

// ── Profile ──────────────────────────────────────────────────
async function loadProfile() {
  let data = { first_name: 'Shashi', last_name: 'Kumar', email: 'shashi@parent.edu', phone: '9876500001', occupation: 'Engineer' };
  try {
    const r = await fetch('/parent/api/profile');
    if (r.ok) { const d = await r.json(); if (d.first_name) data = d; }
  } catch (_) {}
  const name = `${data.first_name || ''} ${data.last_name || ''}`.trim();
  document.getElementById('parentName').textContent = name;
  document.getElementById('profileName').textContent = name;
  document.getElementById('profileEmail').textContent = data.email || 'N/A';
  document.getElementById('profilePhone').textContent = data.phone || 'N/A';
  document.getElementById('profileOccupation').textContent = data.occupation || 'N/A';
}

// ── Attendance ───────────────────────────────────────────────
function renderAttendance() {
  // Subject bars
  const bars = document.getElementById('parentSubjectBars');
  bars.innerHTML = P_SUBJECT_ATTENDANCE.map(s => {
    const color = s.pct >= 85 ? '#22c55e' : s.pct >= 75 ? '#f59e0b' : '#ef4444';
    return `<div class="mb-3">
      <div class="d-flex justify-content-between mb-1">
        <span style="font-size:0.85rem">${s.subject} <small class="text-muted">${s.code}</small></span>
        <span style="font-size:0.85rem;font-weight:600;color:${color}">${s.pct}%</span>
      </div>
      <div class="attendance-bar"><div class="attendance-fill" style="width:${s.pct}%;background:${color}"></div></div>
    </div>`;
  }).join('');

  // Table
  const tbody = document.getElementById('parentAttendanceTable');
  tbody.innerHTML = P_ATTENDANCE.map(r => `
    <tr>
      <td>${fmtDate(r.attendance_date)}</td>
      <td>${r.course_code} – ${r.course_name}</td>
      <td>${statusBadge(r.status)}</td>
    </tr>`).join('');
}

// ── Results ──────────────────────────────────────────────────
function renderResults() {
  const tbody = document.getElementById('parentResultsTable');
  tbody.innerHTML = P_RESULTS.map(r => `
    <tr>
      <td>${fmtDate(r.exam_date)}</td>
      <td>${r.course_code} – ${r.course_name}</td>
      <td>${r.exam_name}</td>
      <td>${r.marks_obtained}/${r.max_marks}</td>
      <td><span class="badge bg-${gradeBadge(r.grade)}">${r.grade}</span></td>
    </tr>`).join('');
}

// ── Fees ─────────────────────────────────────────────────────
function renderPayments() {
  const tbody = document.getElementById('parentPaymentTable');
  tbody.innerHTML = P_PAYMENTS.map(p => `
    <tr>
      <td>${fmtDate(p.payment_date)}</td>
      <td>${p.description}</td>
      <td>₹${p.amount.toLocaleString('en-IN')}</td>
      <td>${p.payment_method}</td>
      <td><span class="badge bg-${p.status === 'paid' ? 'success' : 'danger'}">${p.status === 'paid' ? '✓ Paid' : '⏳ Pending'}</span></td>
    </tr>`).join('');
}

// ── Init ─────────────────────────────────────────────────────
loadProfile();
renderAttendance();
renderResults();
renderPayments();
