// ── Shared data ──────────────────────────────────────────────
const COURSES = [
  { course_id: 101, course_code: 'CS101', course_name: 'Introduction to Programming' },
  { course_id: 102, course_code: 'CS201', course_name: 'Data Structures'             },
  { course_id: 103, course_code: 'CS301', course_name: 'Database Management Systems' },
  { course_id: 104, course_code: 'MATH201', course_name: 'Discrete Mathematics'      },
];

const STUDENTS = [
  'Ujwal Kumar','Srikar Reddy','Sameer Khan','Rahul Verma','Priya Sharma',
  'Sneha Patil','Arjun Nair','Karthik Rao','Ananya Gupta','Rohit Singh',
  'Deepak Mishra','Aditya Verma','Neha Joshi','Pooja Mehta','Vivek Reddy',
  'Meera Iyer','Suresh Babu','Kavya Nair','Harish Pillai','Divya Krishnan',
];

const FACULTY = [
  'Dr. Saubhagya Barpanda','Dr. Ramesh Kumar','Dr. Anjali Sharma',
  'Prof. Vivek Reddy','Dr. Kiran Rao','Prof. Priya Nair',
];

// Seeded pseudo-random so same inputs give same output
function seededRand(seed) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function pickStatus(seed) {
  const r = seededRand(seed);
  if (r < 0.70) return 'present';
  if (r < 0.90) return 'absent';
  return 'late';
}

function fmtDate(d) {
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

function generateRecords(startDate, endDate, courseFilter) {
  const records = [];
  const courses = courseFilter
    ? COURSES.filter(c => c.course_id === parseInt(courseFilter))
    : COURSES;

  const start = new Date(startDate);
  const end   = new Date(endDate);
  let seed = 0;

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = fmtDate(new Date(d));
    courses.forEach(course => {
      // 10 students per course per day
      STUDENTS.slice(0, 10).forEach(name => {
        records.push({
          date: dateStr,
          name,
          role: 'Student',
          course: `${course.course_code} – ${course.course_name}`,
          status: pickStatus(seed++),
        });
      });
      // 1 faculty per course per day
      const fac = FACULTY[courses.indexOf(course) % FACULTY.length];
      records.push({
        date: dateStr,
        name: fac,
        role: 'Faculty',
        course: `${course.course_code} – ${course.course_name}`,
        status: pickStatus(seed++),
      });
    });
  }
  return records;
}

// ── Init ─────────────────────────────────────────────────────
const today = new Date();
const thirtyDaysAgo = new Date(today);
thirtyDaysAgo.setDate(today.getDate() - 7);
document.getElementById('startDate').valueAsDate = thirtyDaysAgo;
document.getElementById('endDate').valueAsDate   = today;

// Populate course dropdown
const sel = document.getElementById('courseFilter');
COURSES.forEach(c => {
  const opt = document.createElement('option');
  opt.value = c.course_id;
  opt.textContent = `${c.course_code} – ${c.course_name}`;
  sel.appendChild(opt);
});

function displayReport(records) {
  const present = records.filter(r => r.status === 'present').length;
  const absent  = records.filter(r => r.status === 'absent').length;
  const late    = records.filter(r => r.status === 'late').length;
  const total   = records.length;
  const rate    = total > 0 ? (((present + late) / total) * 100).toFixed(1) : 0;

  document.getElementById('totalPresent').textContent  = present;
  document.getElementById('totalAbsent').textContent   = absent;
  document.getElementById('totalLate').textContent     = late;
  document.getElementById('attendanceRate').textContent = rate + '%';

  const tbody = document.getElementById('attendanceTable');
  if (!records.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-3 text-muted">No records available</td></tr>';
    return;
  }

  const colorMap = { present: 'success', absent: 'danger', late: 'warning' };
  tbody.innerHTML = records.map(r => `
    <tr>
      <td>${r.date}</td>
      <td>${r.name}</td>
      <td><span class="badge bg-${r.role === 'Faculty' ? 'primary' : 'secondary'}">${r.role}</span></td>
      <td>${r.course}</td>
      <td><span class="badge bg-${colorMap[r.status] || 'secondary'}">${r.status.charAt(0).toUpperCase() + r.status.slice(1)}</span></td>
    </tr>`).join('');
}

// Generate on submit
document.getElementById('filterForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const startDate  = document.getElementById('startDate').value;
  const endDate    = document.getElementById('endDate').value;
  const courseFilter = document.getElementById('courseFilter').value;

  if (!startDate || !endDate) { alert('Please select start and end dates'); return; }
  if (new Date(startDate) > new Date(endDate)) { alert('Start date must be before end date'); return; }

  const records = generateRecords(startDate, endDate, courseFilter);
  displayReport(records);
});

// Auto-generate on load with defaults
displayReport(generateRecords(
  document.getElementById('startDate').value,
  document.getElementById('endDate').value,
  ''
));
