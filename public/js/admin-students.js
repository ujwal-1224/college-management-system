let currentPage = 1;
let searchTimer = null;

// ─── LOAD ─────────────────────────────────────────────────────────────────────
async function loadStudents() {
  const search = document.getElementById('searchInput').value;
  const department = document.getElementById('deptFilter').value;
  const semester = document.getElementById('semFilter').value;
  const limit = document.getElementById('limitSelect').value;

  const params = new URLSearchParams({ page: currentPage, limit, search, department, semester });
  const tbody = document.getElementById('studentsTableBody');
  tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4"><div class="spinner-border spinner-border-sm"></div> Loading...</td></tr>';

  try {
    const res = await fetch('/admin/api/students?' + params);
    const { data, pagination } = await res.json();

    document.getElementById('resultCount').textContent = `${pagination.total} records`;

    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No students found</td></tr>';
      document.getElementById('paginationContainer').innerHTML = '';
      return;
    }

    tbody.innerHTML = data.map(s => `
      <tr>
        <td><strong>${s.student_id}</strong></td>
        <td>${s.first_name} ${s.last_name}</td>
        <td>${s.email}</td>
        <td>${s.department || '—'}</td>
        <td>Sem ${s.semester || '—'}</td>
        <td>
          <span class="badge ${s.is_active ? 'bg-success' : 'bg-secondary'}">
            ${s.is_active ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td>
          <button class="btn btn-sm btn-outline-primary me-1" onclick="viewStudent(${s.student_id})" title="View"><i class="bi bi-eye"></i></button>
          <button class="btn btn-sm btn-outline-warning me-1" onclick="editStudent(${s.student_id})" title="Edit"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-${s.is_active ? 'secondary' : 'success'} me-1" onclick="toggleStatus(${s.student_id}, ${s.is_active})" title="${s.is_active ? 'Deactivate' : 'Activate'}">
            <i class="bi bi-${s.is_active ? 'pause-circle' : 'play-circle'}"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteStudent(${s.student_id}, '${s.first_name} ${s.last_name}')" title="Delete"><i class="bi bi-trash"></i></button>
        </td>
      </tr>`).join('');

    renderPagination(pagination);
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-danger">Error loading students</td></tr>';
  }
}

async function loadStats() {
  try {
    const res = await fetch('/admin/api/students/stats/overview');
    const { data } = await res.json();
    document.getElementById('totalStudents').textContent = data.overview.total_students;
    document.getElementById('activeStudents').textContent = data.overview.active_students;
    document.getElementById('inactiveStudents').textContent = data.overview.inactive_students;
    document.getElementById('totalDepts').textContent = data.overview.total_departments;
  } catch (e) {}
}

function renderPagination({ page, pages, total, limit }) {
  const container = document.getElementById('paginationContainer');
  if (pages <= 1) { container.innerHTML = ''; return; }

  let html = `<small class="text-muted">Page ${page} of ${pages} (${total} total)</small><nav><ul class="pagination pagination-sm mb-0">`;
  html += `<li class="page-item ${page === 1 ? 'disabled' : ''}"><a class="page-link" href="#" onclick="goPage(${page - 1})">‹</a></li>`;

  const start = Math.max(1, page - 2), end = Math.min(pages, page + 2);
  if (start > 1) html += `<li class="page-item"><a class="page-link" href="#" onclick="goPage(1)">1</a></li>${start > 2 ? '<li class="page-item disabled"><span class="page-link">…</span></li>' : ''}`;
  for (let i = start; i <= end; i++) html += `<li class="page-item ${i === page ? 'active' : ''}"><a class="page-link" href="#" onclick="goPage(${i})">${i}</a></li>`;
  if (end < pages) html += `${end < pages - 1 ? '<li class="page-item disabled"><span class="page-link">…</span></li>' : ''}<li class="page-item"><a class="page-link" href="#" onclick="goPage(${pages})">${pages}</a></li>`;

  html += `<li class="page-item ${page === pages ? 'disabled' : ''}"><a class="page-link" href="#" onclick="goPage(${page + 1})">›</a></li></ul></nav>`;
  container.innerHTML = html;
}

function goPage(p) { currentPage = p; loadStudents(); return false; }

function debounceSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { currentPage = 1; loadStudents(); }, 400);
}

function resetFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('deptFilter').value = '';
  document.getElementById('semFilter').value = '';
  currentPage = 1;
  loadStudents();
}

// ─── VIEW ─────────────────────────────────────────────────────────────────────
async function viewStudent(id) {
  const modal = new bootstrap.Modal(document.getElementById('viewModal'));
  document.getElementById('viewModalBody').innerHTML = '<div class="text-center py-4"><div class="spinner-border"></div></div>';
  modal.show();

  try {
    const res = await fetch('/admin/api/students/' + id);
    const { data } = await res.json();
    document.getElementById('viewModalBody').innerHTML = `
      <div class="row g-3">
        <div class="col-md-6">
          <h6 class="text-muted">Personal Info</h6>
          <p><strong>Name:</strong> ${data.first_name} ${data.last_name}</p>
          <p><strong>Roll No:</strong> ${data.roll_number}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Phone:</strong> ${data.phone || '—'}</p>
          <p><strong>DOB:</strong> ${data.date_of_birth ? new Date(data.date_of_birth).toLocaleDateString() : '—'}</p>
          <p><strong>Gender:</strong> ${data.gender || '—'}</p>
          <p><strong>Blood Group:</strong> ${data.blood_group || '—'}</p>
        </div>
        <div class="col-md-6">
          <h6 class="text-muted">Academic Info</h6>
          <p><strong>Department:</strong> ${data.department || '—'}</p>
          <p><strong>Semester:</strong> ${data.semester || '—'}</p>
          <p><strong>Enrollment Date:</strong> ${data.enrollment_date ? new Date(data.enrollment_date).toLocaleDateString() : '—'}</p>
          <p><strong>Username:</strong> ${data.username}</p>
          <p><strong>Status:</strong> <span class="badge ${data.is_active ? 'bg-success' : 'bg-secondary'}">${data.is_active ? 'Active' : 'Inactive'}</span></p>
          <p><strong>Last Login:</strong> ${data.last_login ? new Date(data.last_login).toLocaleString() : 'Never'}</p>
        </div>
        ${data.enrollments && data.enrollments.length > 0 ? `
        <div class="col-12">
          <h6 class="text-muted">Enrolled Courses (${data.enrollments.length})</h6>
          <div class="table-responsive"><table class="table table-sm">
            <thead><tr><th>Code</th><th>Course</th><th>Credits</th><th>Status</th></tr></thead>
            <tbody>${data.enrollments.map(e => `<tr><td>${e.course_code}</td><td>${e.course_name}</td><td>${e.credits}</td><td><span class="badge bg-${e.status === 'active' ? 'success' : 'secondary'}">${e.status}</span></td></tr>`).join('')}</tbody>
          </table></div>
        </div>` : ''}
      </div>`;
  } catch (e) {
    document.getElementById('viewModalBody').innerHTML = '<p class="text-danger">Error loading student details</p>';
  }
}

// ─── ADD / EDIT ───────────────────────────────────────────────────────────────
function openAddModal() {
  document.getElementById('modalTitle').textContent = 'Add Student';
  document.getElementById('studentForm').reset();
  document.getElementById('studentId').value = '';
  document.getElementById('username').disabled = false;
  document.getElementById('password').required = true;
  document.getElementById('rollNumber').disabled = false;
  document.getElementById('formError').classList.add('d-none');
  new bootstrap.Modal(document.getElementById('studentModal')).show();
}

async function editStudent(id) {
  try {
    const res = await fetch('/admin/api/students/' + id);
    const { data } = await res.json();

    document.getElementById('modalTitle').textContent = 'Edit Student';
    document.getElementById('studentId').value = id;
    document.getElementById('username').value = data.username;
    document.getElementById('username').disabled = true;
    document.getElementById('password').required = false;
    document.getElementById('password').placeholder = 'Leave blank to keep current';
    document.getElementById('firstName').value = data.first_name;
    document.getElementById('lastName').value = data.last_name;
    document.getElementById('email').value = data.email;
    document.getElementById('phone').value = data.phone || '';
    document.getElementById('dob').value = data.date_of_birth ? data.date_of_birth.split('T')[0] : '';
    document.getElementById('department').value = data.department || '';
    document.getElementById('semester').value = data.semester || '';
    document.getElementById('enrollmentDate').value = data.enrollment_date ? data.enrollment_date.split('T')[0] : '';
    document.getElementById('formError').classList.add('d-none');

    new bootstrap.Modal(document.getElementById('studentModal')).show();
  } catch (e) {
    alert('Error loading student data');
  }
}

async function saveStudent() {
  const id = document.getElementById('studentId').value;
  const isEdit = !!id;
  const btn = document.getElementById('saveBtn');
  const errDiv = document.getElementById('formError');
  errDiv.classList.add('d-none');

  const payload = {
    username: document.getElementById('username').value,
    password: document.getElementById('password').value,
    first_name: document.getElementById('firstName').value,
    last_name: document.getElementById('lastName').value,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value,
    date_of_birth: document.getElementById('dob').value,
    enrollment_date: document.getElementById('enrollmentDate').value,
    department: document.getElementById('department').value,
    semester: document.getElementById('semester').value
  };

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Saving...';

  try {
    const url = isEdit ? '/admin/api/students/' + id : '/admin/api/students';
    const method = isEdit ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();

    if (!res.ok || !data.success) {
      const msg = data.errors ? data.errors.map(e => e.message).join(', ') : (data.message || 'Error saving student');
      errDiv.textContent = msg;
      errDiv.classList.remove('d-none');
      return;
    }

    bootstrap.Modal.getInstance(document.getElementById('studentModal')).hide();
    showToast(isEdit ? 'Student updated successfully' : 'Student created successfully', 'success');
    loadStudents();
    loadStats();
  } catch (e) {
    errDiv.textContent = 'Network error. Please try again.';
    errDiv.classList.remove('d-none');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Save Student';
  }
}

// ─── TOGGLE STATUS ────────────────────────────────────────────────────────────
async function toggleStatus(id, currentStatus) {
  const action = currentStatus ? 'deactivate' : 'activate';
  if (!confirm(`Are you sure you want to ${action} this student?`)) return;

  try {
    const res = await fetch('/admin/api/students/' + id + '/toggle-status', { method: 'PATCH' });
    const data = await res.json();
    if (data.success) { showToast(`Student ${action}d successfully`, 'success'); loadStudents(); }
    else alert(data.message || 'Error updating status');
  } catch (e) { alert('Network error'); }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
async function deleteStudent(id, name) {
  if (!confirm(`Delete student "${name}"?\n\nThis will deactivate their account. This action cannot be undone.`)) return;

  try {
    const res = await fetch('/admin/api/students/' + id, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { showToast('Student deleted successfully', 'success'); loadStudents(); loadStats(); }
    else alert(data.message || 'Error deleting student');
  } catch (e) { alert('Network error'); }
}

// ─── EXPORT ───────────────────────────────────────────────────────────────────
function exportStudents() {
  const dept = document.getElementById('deptFilter').value;
  const sem = document.getElementById('semFilter').value;
  const params = new URLSearchParams({ department: dept, semester: sem });
  window.location.href = '/admin/api/students/export?' + params;
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `alert alert-${type === 'success' ? 'success' : 'danger'} position-fixed`;
  toast.style.cssText = 'top:20px;right:20px;z-index:9999;min-width:300px;box-shadow:0 4px 12px rgba(0,0,0,0.15)';
  toast.innerHTML = `<i class="bi bi-${type === 'success' ? 'check-circle' : 'x-circle'} me-2"></i>${message}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
loadStudents();
loadStats();
