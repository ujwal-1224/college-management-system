let currentPage = 1;
let searchTimer = null;

// ─── LOAD ─────────────────────────────────────────────────────────────────────
async function loadStaff() {
  const search = document.getElementById('searchInput').value;
  const department = document.getElementById('deptFilter').value;
  const limit = document.getElementById('limitSelect').value;

  const params = new URLSearchParams({ page: currentPage, limit, search, department });
  const tbody = document.getElementById('staffTableBody');
  tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4"><div class="spinner-border spinner-border-sm"></div> Loading...</td></tr>';

  try {
    const res = await fetch('/admin/api/staff?' + params);
    const { data, pagination } = await res.json();

    document.getElementById('resultCount').textContent = `${pagination.total} records`;

    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No staff found</td></tr>';
      document.getElementById('paginationContainer').innerHTML = '';
      return;
    }

    tbody.innerHTML = data.map(s => `
      <tr>
        <td><strong>${s.employee_id}</strong></td>
        <td>${s.first_name} ${s.last_name}</td>
        <td>${s.email}</td>
        <td>${s.department || '—'}</td>
        <td>${s.designation || '—'}</td>
        <td>
          <span class="badge ${s.is_active ? 'bg-success' : 'bg-secondary'}">
            ${s.is_active ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td>
          <button class="btn btn-sm btn-outline-primary me-1" onclick="viewStaff(${s.staff_id})" title="View"><i class="bi bi-eye"></i></button>
          <button class="btn btn-sm btn-outline-warning me-1" onclick="editStaff(${s.staff_id})" title="Edit"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-${s.is_active ? 'secondary' : 'success'} me-1" onclick="toggleStatus(${s.staff_id}, ${s.is_active})" title="${s.is_active ? 'Deactivate' : 'Activate'}">
            <i class="bi bi-${s.is_active ? 'pause-circle' : 'play-circle'}"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteStaff(${s.staff_id}, '${s.first_name} ${s.last_name}')" title="Delete"><i class="bi bi-trash"></i></button>
        </td>
      </tr>`).join('');

    renderPagination(pagination);
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-danger">Error loading staff</td></tr>';
  }
}

async function loadStats() {
  try {
    const res = await fetch('/admin/api/staff/stats/overview');
    const { data } = await res.json();
    document.getElementById('totalStaff').textContent = data.overview.total_staff;
    document.getElementById('activeStaff').textContent = data.overview.active_staff;
    document.getElementById('inactiveStaff').textContent = data.overview.inactive_staff;
    document.getElementById('totalDepts').textContent = data.overview.total_departments;
  } catch (e) {}
}

function renderPagination({ page, pages, total }) {
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

function goPage(p) { currentPage = p; loadStaff(); return false; }

function debounceSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { currentPage = 1; loadStaff(); }, 400);
}

function resetFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('deptFilter').value = '';
  currentPage = 1;
  loadStaff();
}

// ─── VIEW ─────────────────────────────────────────────────────────────────────
async function viewStaff(id) {
  const modal = new bootstrap.Modal(document.getElementById('viewStaffModal'));
  document.getElementById('viewStaffModalBody').innerHTML = '<div class="text-center py-4"><div class="spinner-border"></div></div>';
  modal.show();

  try {
    const res = await fetch('/admin/api/staff/' + id);
    const { data } = await res.json();
    document.getElementById('viewStaffModalBody').innerHTML = `
      <div class="row g-3">
        <div class="col-md-6">
          <h6 class="text-muted">Personal Info</h6>
          <p><strong>Name:</strong> ${data.first_name} ${data.last_name}</p>
          <p><strong>Employee ID:</strong> ${data.employee_id}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Phone:</strong> ${data.phone || '—'}</p>
          <p><strong>DOB:</strong> ${data.date_of_birth ? new Date(data.date_of_birth).toLocaleDateString() : '—'}</p>
          <p><strong>Gender:</strong> ${data.gender || '—'}</p>
        </div>
        <div class="col-md-6">
          <h6 class="text-muted">Professional Info</h6>
          <p><strong>Department:</strong> ${data.department || '—'}</p>
          <p><strong>Designation:</strong> ${data.designation || '—'}</p>
          <p><strong>Qualification:</strong> ${data.qualification || '—'}</p>
          <p><strong>Joining Date:</strong> ${data.joining_date ? new Date(data.joining_date).toLocaleDateString() : '—'}</p>
          <p><strong>Username:</strong> ${data.username}</p>
          <p><strong>Status:</strong> <span class="badge ${data.is_active ? 'bg-success' : 'bg-secondary'}">${data.is_active ? 'Active' : 'Inactive'}</span></p>
        </div>
      </div>`;
  } catch (e) {
    document.getElementById('viewStaffModalBody').innerHTML = '<p class="text-danger">Error loading staff details</p>';
  }
}

// ─── ADD / EDIT ───────────────────────────────────────────────────────────────
function openAddModal() {
  document.getElementById('modalTitle').textContent = 'Add Staff';
  document.getElementById('staffForm').reset();
  document.getElementById('staffId').value = '';
  document.getElementById('username').disabled = false;
  document.getElementById('password').required = true;
  document.getElementById('employeeId').disabled = false;
  document.getElementById('formError').classList.add('d-none');
  new bootstrap.Modal(document.getElementById('staffModal')).show();
}

async function editStaff(id) {
  try {
    const res = await fetch('/admin/api/staff/' + id);
    const { data } = await res.json();

    document.getElementById('modalTitle').textContent = 'Edit Staff';
    document.getElementById('staffId').value = id;
    document.getElementById('username').value = data.username;
    document.getElementById('username').disabled = true;
    document.getElementById('password').required = false;
    document.getElementById('password').placeholder = 'Leave blank to keep current';
    document.getElementById('employeeId').value = data.employee_id;
    document.getElementById('employeeId').disabled = true;
    document.getElementById('firstName').value = data.first_name;
    document.getElementById('lastName').value = data.last_name;
    document.getElementById('email').value = data.email;
    document.getElementById('phone').value = data.phone || '';
    document.getElementById('dateOfBirth').value = data.date_of_birth ? data.date_of_birth.split('T')[0] : '';
    document.getElementById('gender').value = data.gender || '';
    document.getElementById('department').value = data.department || '';
    document.getElementById('designation').value = data.designation || '';
    document.getElementById('qualification').value = data.qualification || '';
    document.getElementById('joiningDate').value = data.joining_date ? data.joining_date.split('T')[0] : '';
    document.getElementById('formError').classList.add('d-none');

    new bootstrap.Modal(document.getElementById('staffModal')).show();
  } catch (e) {
    showToast('Error loading staff data', 'error');
  }
}

async function saveStaff() {
  const id = document.getElementById('staffId').value;
  const isEdit = !!id;
  const btn = document.getElementById('saveBtn');
  const errDiv = document.getElementById('formError');
  errDiv.classList.add('d-none');

  const payload = {
    username: document.getElementById('username').value,
    password: document.getElementById('password').value,
    employee_id: document.getElementById('employeeId').value,
    first_name: document.getElementById('firstName').value,
    last_name: document.getElementById('lastName').value,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value,
    date_of_birth: document.getElementById('dateOfBirth').value,
    gender: document.getElementById('gender').value,
    department: document.getElementById('department').value,
    designation: document.getElementById('designation').value,
    qualification: document.getElementById('qualification').value,
    joining_date: document.getElementById('joiningDate').value
  };

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Saving...';

  try {
    const url = isEdit ? '/admin/api/staff/' + id : '/admin/api/staff';
    const method = isEdit ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();

    if (!res.ok || !data.success) {
      const msg = data.errors ? data.errors.map(e => e.message).join(', ') : (data.message || 'Error saving staff');
      errDiv.textContent = msg;
      errDiv.classList.remove('d-none');
      return;
    }

    bootstrap.Modal.getInstance(document.getElementById('staffModal')).hide();
    showToast(isEdit ? 'Staff updated successfully' : 'Staff created successfully', 'success');
    loadStaff();
    loadStats();
  } catch (e) {
    errDiv.textContent = 'Network error. Please try again.';
    errDiv.classList.remove('d-none');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Save Staff';
  }
}

// ─── TOGGLE STATUS ────────────────────────────────────────────────────────────
async function toggleStatus(id, currentStatus) {
  const action = currentStatus ? 'deactivate' : 'activate';
  if (!confirm(`Are you sure you want to ${action} this staff member?`)) return;

  try {
    const res = await fetch('/admin/api/staff/' + id + '/toggle-status', { method: 'PATCH' });
    const data = await res.json();
    if (data.success) { showToast(`Staff ${action}d successfully`, 'success'); loadStaff(); }
    else showToast(data.message || 'Error updating status', 'error');
  } catch (e) { showToast('Network error', 'error'); }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
async function deleteStaff(id, name) {
  if (!confirm(`Delete staff "${name}"?\n\nThis action cannot be undone.`)) return;

  try {
    const res = await fetch('/admin/api/staff/' + id, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { showToast('Staff deleted successfully', 'success'); loadStaff(); loadStats(); }
    else showToast(data.message || 'Error deleting staff', 'error');
  } catch (e) { showToast('Network error', 'error'); }
}

// ─── EXPORT ───────────────────────────────────────────────────────────────────
function exportStaff() {
  const dept = document.getElementById('deptFilter').value;
  window.location.href = '/admin/api/staff/export?' + new URLSearchParams({ department: dept });
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
loadStaff();
loadStats();
