// ─── LOCAL DATA STORE ─────────────────────────────────────────────────────────
let students = [
  { student_id: 1,  first_name: 'Ujwal',     last_name: 'Kumar',     email: 'ujwal@college.edu',     phone: '9876543210', department: 'Computer Science',    semester: 5, gender: 'Male',   dob: '2003-04-12', enrollment_date: '2022-08-01', is_active: true  },
  { student_id: 2,  first_name: 'Srikar',    last_name: 'Reddy',     email: 'srikar@college.edu',    phone: '9876543211', department: 'Computer Science',    semester: 3, gender: 'Male',   dob: '2004-06-20', enrollment_date: '2023-08-01', is_active: true  },
  { student_id: 3,  first_name: 'Sameer',    last_name: 'Khan',      email: 'sameer@college.edu',    phone: '9876543212', department: 'Electronics',         semester: 5, gender: 'Male',   dob: '2003-09-15', enrollment_date: '2022-08-01', is_active: true  },
  { student_id: 4,  first_name: 'Priya',     last_name: 'Sharma',    email: 'priya@college.edu',     phone: '9876543213', department: 'Computer Science',    semester: 3, gender: 'Female', dob: '2004-02-28', enrollment_date: '2023-08-01', is_active: true  },
  { student_id: 5,  first_name: 'Rahul',     last_name: 'Verma',     email: 'rahul@college.edu',     phone: '9876543214', department: 'Mechanical',          semester: 1, gender: 'Male',   dob: '2005-11-03', enrollment_date: '2024-08-01', is_active: true  },
  { student_id: 6,  first_name: 'Sneha',     last_name: 'Patil',     email: 'sneha@college.edu',     phone: '9876543215', department: 'Civil',               semester: 5, gender: 'Female', dob: '2003-07-19', enrollment_date: '2022-08-01', is_active: false },
  { student_id: 7,  first_name: 'Arjun',     last_name: 'Nair',      email: 'arjun@college.edu',     phone: '9876543216', department: 'Information Technology', semester: 1, gender: 'Male', dob: '2005-03-25', enrollment_date: '2024-08-01', is_active: true  },
  { student_id: 8,  first_name: 'Karthik',   last_name: 'Rao',       email: 'karthik@college.edu',   phone: '9876543217', department: 'Computer Science',    semester: 3, gender: 'Male',   dob: '2004-08-14', enrollment_date: '2023-08-01', is_active: true  },
  { student_id: 9,  first_name: 'Ananya',    last_name: 'Gupta',     email: 'ananya@college.edu',    phone: '9876543218', department: 'Mathematics',         semester: 5, gender: 'Female', dob: '2003-12-01', enrollment_date: '2022-08-01', is_active: false },
  { student_id: 10, first_name: 'Rohit',     last_name: 'Singh',     email: 'rohit@college.edu',     phone: '9876543219', department: 'Electronics',         semester: 1, gender: 'Male',   dob: '2005-05-30', enrollment_date: '2024-08-01', is_active: true  },
  { student_id: 11, first_name: 'Deepak',    last_name: 'Mishra',    email: 'deepak@college.edu',    phone: '9876543220', department: 'Mechanical',          semester: 3, gender: 'Male',   dob: '2004-01-17', enrollment_date: '2023-08-01', is_active: true  },
  { student_id: 12, first_name: 'Neha',      last_name: 'Joshi',     email: 'neha@college.edu',      phone: '9876543221', department: 'Computer Science',    semester: 5, gender: 'Female', dob: '2003-10-22', enrollment_date: '2022-08-01', is_active: true  },
];

let nextId = 13;
let currentPage = 1;
let searchTimer = null;
const PAGE_SIZE = () => parseInt(document.getElementById('limitSelect').value) || 10;

// ─── FILTER + RENDER ──────────────────────────────────────────────────────────
function getFiltered() {
  const q     = (document.getElementById('searchInput').value || '').toLowerCase();
  const dept  = document.getElementById('deptFilter').value;
  const sem   = document.getElementById('semFilter').value;
  return students.filter(s => {
    const name = `${s.first_name} ${s.last_name}`.toLowerCase();
    if (q && !name.includes(q) && !s.email.toLowerCase().includes(q) && !String(s.student_id).includes(q)) return false;
    if (dept && s.department !== dept) return false;
    if (sem  && String(s.semester) !== sem) return false;
    return true;
  });
}

function loadStudents() {
  const filtered = getFiltered();
  const limit    = PAGE_SIZE();
  const total    = filtered.length;
  const pages    = Math.max(1, Math.ceil(total / limit));
  if (currentPage > pages) currentPage = pages;
  const slice = filtered.slice((currentPage - 1) * limit, currentPage * limit);

  document.getElementById('resultCount').textContent = `${total} records`;
  updateStats();

  const tbody = document.getElementById('studentsTableBody');
  if (!slice.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No students found</td></tr>';
    document.getElementById('paginationContainer').innerHTML = '';
    return;
  }

  tbody.innerHTML = slice.map(s => `
    <tr id="row-${s.student_id}">
      <td><strong>${s.student_id}</strong></td>
      <td>${s.first_name} ${s.last_name}</td>
      <td>${s.email}</td>
      <td>${s.department || '—'}</td>
      <td>Sem ${s.semester || '—'}</td>
      <td><span class="badge ${s.is_active ? 'bg-success' : 'bg-secondary'}" id="badge-${s.student_id}">${s.is_active ? 'Active' : 'Inactive'}</span></td>
      <td>
        <button class="btn btn-sm btn-outline-primary me-1"  onclick="viewStudent(${s.student_id})"   title="View"><i class="bi bi-eye"></i></button>
        <button class="btn btn-sm btn-outline-warning me-1"  onclick="editStudent(${s.student_id})"   title="Edit"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-sm btn-outline-${s.is_active ? 'secondary' : 'success'} me-1" id="toggleBtn-${s.student_id}" onclick="toggleStatus(${s.student_id})" title="${s.is_active ? 'Deactivate' : 'Activate'}">
          <i class="bi bi-${s.is_active ? 'pause-circle' : 'play-circle'}" id="toggleIcon-${s.student_id}"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteStudent(${s.student_id})" title="Delete"><i class="bi bi-trash"></i></button>
      </td>
    </tr>`).join('');

  renderPagination(currentPage, pages, total);
}

function updateStats() {
  const active   = students.filter(s => s.is_active).length;
  const inactive = students.length - active;
  const depts    = new Set(students.map(s => s.department)).size;
  document.getElementById('totalStudents').textContent  = students.length;
  document.getElementById('activeStudents').textContent = active;
  document.getElementById('inactiveStudents').textContent = inactive;
  document.getElementById('totalDepts').textContent     = depts;
}

function loadStats() { updateStats(); }

function renderPagination(page, pages, total) {
  const container = document.getElementById('paginationContainer');
  if (pages <= 1) { container.innerHTML = ''; return; }
  let html = `<small class="text-muted">Page ${page} of ${pages} (${total} total)</small><nav><ul class="pagination pagination-sm mb-0">`;
  html += `<li class="page-item ${page===1?'disabled':''}"><a class="page-link" href="#" onclick="return goPage(${page-1})">‹</a></li>`;
  for (let i = 1; i <= pages; i++) html += `<li class="page-item ${i===page?'active':''}"><a class="page-link" href="#" onclick="return goPage(${i})">${i}</a></li>`;
  html += `<li class="page-item ${page===pages?'disabled':''}"><a class="page-link" href="#" onclick="return goPage(${page+1})">›</a></li></ul></nav>`;
  container.innerHTML = html;
}

function goPage(p) { currentPage = p; loadStudents(); return false; }

function debounceSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { currentPage = 1; loadStudents(); }, 300);
}

function resetFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('deptFilter').value  = '';
  document.getElementById('semFilter').value   = '';
  currentPage = 1;
  loadStudents();
}

// ─── VIEW ─────────────────────────────────────────────────────────────────────
function viewStudent(id) {
  const s = students.find(x => x.student_id === id);
  if (!s) return;
  document.getElementById('viewModalBody').innerHTML = `
    <div class="row g-3">
      <div class="col-md-6">
        <h6 class="text-muted border-bottom pb-1">Personal Info</h6>
        <p><strong>Name:</strong> ${s.first_name} ${s.last_name}</p>
        <p><strong>Email:</strong> ${s.email}</p>
        <p><strong>Phone:</strong> ${s.phone || '—'}</p>
        <p><strong>Gender:</strong> ${s.gender || '—'}</p>
        <p><strong>Date of Birth:</strong> ${s.dob || '—'}</p>
      </div>
      <div class="col-md-6">
        <h6 class="text-muted border-bottom pb-1">Academic Info</h6>
        <p><strong>Student ID:</strong> ${s.student_id}</p>
        <p><strong>Department:</strong> ${s.department || '—'}</p>
        <p><strong>Semester:</strong> ${s.semester || '—'}</p>
        <p><strong>Enrollment Date:</strong> ${s.enrollment_date || '—'}</p>
        <p><strong>Status:</strong> <span class="badge ${s.is_active ? 'bg-success' : 'bg-secondary'}">${s.is_active ? 'Active' : 'Inactive'}</span></p>
      </div>
    </div>`;
  new bootstrap.Modal(document.getElementById('viewModal')).show();
}

// ─── ADD ──────────────────────────────────────────────────────────────────────
function openAddModal() {
  document.getElementById('modalTitle').textContent = 'Add Student';
  document.getElementById('studentForm').reset();
  document.getElementById('studentId').value = '';
  document.getElementById('username').disabled = false;
  document.getElementById('formError').classList.add('d-none');
  new bootstrap.Modal(document.getElementById('studentModal')).show();
}

// ─── EDIT ─────────────────────────────────────────────────────────────────────
function editStudent(id) {
  const s = students.find(x => x.student_id === id);
  if (!s) return;
  document.getElementById('modalTitle').textContent = 'Edit Student';
  document.getElementById('studentId').value        = id;
  document.getElementById('username').value         = `student${id}`;
  document.getElementById('username').disabled      = true;
  document.getElementById('password').required      = false;
  document.getElementById('password').placeholder   = 'Leave blank to keep current';
  document.getElementById('firstName').value        = s.first_name;
  document.getElementById('lastName').value         = s.last_name;
  document.getElementById('email').value            = s.email;
  document.getElementById('phone').value            = s.phone || '';
  document.getElementById('dob').value              = s.dob || '';
  document.getElementById('gender').value           = s.gender || '';
  document.getElementById('department').value       = s.department || '';
  document.getElementById('semester').value         = s.semester || '';
  document.getElementById('enrollmentDate').value   = s.enrollment_date || '';
  document.getElementById('formError').classList.add('d-none');
  new bootstrap.Modal(document.getElementById('studentModal')).show();
}

// ─── SAVE (Add + Edit) ────────────────────────────────────────────────────────
function saveStudent() {
  const id        = document.getElementById('studentId').value;
  const firstName = document.getElementById('firstName').value.trim();
  const lastName  = document.getElementById('lastName').value.trim();
  const email     = document.getElementById('email').value.trim();
  const dept      = document.getElementById('department').value;
  const sem       = document.getElementById('semester').value;
  const errDiv    = document.getElementById('formError');

  if (!firstName || !lastName || !email || !dept || !sem) {
    errDiv.textContent = 'Please fill in all required fields.';
    errDiv.classList.remove('d-none');
    return;
  }
  errDiv.classList.add('d-none');

  if (id) {
    // Edit
    const s = students.find(x => x.student_id === parseInt(id));
    if (s) {
      s.first_name      = firstName;
      s.last_name       = lastName;
      s.email           = email;
      s.phone           = document.getElementById('phone').value.trim();
      s.dob             = document.getElementById('dob').value;
      s.gender          = document.getElementById('gender').value;
      s.department      = dept;
      s.semester        = parseInt(sem);
      s.enrollment_date = document.getElementById('enrollmentDate').value;
    }
    showToast('Student updated successfully', 'success');
  } else {
    // Add
    students.unshift({
      student_id:      nextId++,
      first_name:      firstName,
      last_name:       lastName,
      email:           email,
      phone:           document.getElementById('phone').value.trim(),
      dob:             document.getElementById('dob').value,
      gender:          document.getElementById('gender').value,
      department:      dept,
      semester:        parseInt(sem),
      enrollment_date: document.getElementById('enrollmentDate').value,
      is_active:       true,
    });
    showToast('Student added successfully', 'success');
  }

  bootstrap.Modal.getInstance(document.getElementById('studentModal')).hide();
  loadStudents();
}

// ─── TOGGLE STATUS ────────────────────────────────────────────────────────────
function toggleStatus(id) {
  const s = students.find(x => x.student_id === id);
  if (!s) return;
  const action = s.is_active ? 'deactivate' : 'activate';
  if (!confirm(`Are you sure you want to ${action} this student?`)) return;
  s.is_active = !s.is_active;
  // Update badge and button in-place without full re-render
  const badge = document.getElementById(`badge-${id}`);
  const btn   = document.getElementById(`toggleBtn-${id}`);
  const icon  = document.getElementById(`toggleIcon-${id}`);
  if (badge) { badge.className = `badge ${s.is_active ? 'bg-success' : 'bg-secondary'}`; badge.textContent = s.is_active ? 'Active' : 'Inactive'; }
  if (btn)   { btn.className = `btn btn-sm btn-outline-${s.is_active ? 'secondary' : 'success'} me-1`; }
  if (icon)  { icon.className = `bi bi-${s.is_active ? 'pause-circle' : 'play-circle'}`; }
  updateStats();
  showToast(`Student ${action}d successfully`, 'success');
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
function deleteStudent(id) {
  const s = students.find(x => x.student_id === id);
  if (!s) return;
  showConfirm(`Are you sure you want to delete "${s.first_name} ${s.last_name}"?`, () => {
    students = students.filter(x => x.student_id !== id);
    loadStudents();
    showToast('Student deleted successfully', 'success');
  });
}

// ─── CONFIRM DIALOG ───────────────────────────────────────────────────────────
function showConfirm(message, onYes) {
  const existing = document.getElementById('confirmModal');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.id = 'confirmModal';
  el.innerHTML = `
    <div style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9998;display:flex;align-items:center;justify-content:center;">
      <div style="background:#fff;border-radius:12px;padding:28px 32px;max-width:420px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.2);animation:popIn 0.25s ease;">
        <div style="font-size:2rem;text-align:center;margin-bottom:12px;">⚠️</div>
        <p style="text-align:center;font-size:1rem;color:#374151;margin-bottom:20px;">${message}</p>
        <div style="display:flex;gap:10px;justify-content:center;">
          <button id="confirmYes" class="btn btn-danger px-4">Yes, Delete</button>
          <button id="confirmNo"  class="btn btn-outline-secondary px-4">Cancel</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(el);
  document.getElementById('confirmYes').onclick = () => { el.remove(); onYes(); };
  document.getElementById('confirmNo').onclick  = () => el.remove();
}

// ─── EXPORT (frontend CSV) ────────────────────────────────────────────────────
function exportStudents() {
  const rows = [['ID','First Name','Last Name','Email','Phone','Department','Semester','Status']];
  students.forEach(s => rows.push([s.student_id, s.first_name, s.last_name, s.email, s.phone||'', s.department||'', s.semester||'', s.is_active?'Active':'Inactive']));
  const csv  = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = 'students.csv';
  a.click();
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function showToast(message, type = 'success') {
  const t = document.createElement('div');
  t.className = `alert alert-${type === 'success' ? 'success' : 'danger'} position-fixed`;
  t.style.cssText = 'top:20px;right:20px;z-index:9999;min-width:280px;box-shadow:0 4px 12px rgba(0,0,0,0.15);animation:popIn 0.2s ease;';
  t.innerHTML = `<i class="bi bi-${type === 'success' ? 'check-circle' : 'x-circle'} me-2"></i>${message}`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// ─── ANIMATION ────────────────────────────────────────────────────────────────
const style = document.createElement('style');
style.textContent = `@keyframes popIn { from { opacity:0; transform:scale(0.85); } to { opacity:1; transform:scale(1); } }`;
document.head.appendChild(style);

// ─── INIT ─────────────────────────────────────────────────────────────────────
loadStudents();
