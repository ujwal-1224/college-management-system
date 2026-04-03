let currentPage = 1;
let searchTimer = null;

// ─── LOAD ─────────────────────────────────────────────────────────────────────
async function loadCourses() {
  const search = document.getElementById('searchInput').value;
  const department = document.getElementById('deptFilter').value;
  const semester = document.getElementById('semFilter').value;
  const limit = document.getElementById('limitSelect').value;

  const params = new URLSearchParams({ page: currentPage, limit, search, department, semester });
  const tbody = document.getElementById('coursesTableBody');
  tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4"><div class="spinner-border spinner-border-sm"></div> Loading...</td></tr>';

  try {
    const res = await fetch('/admin/api/courses?' + params);
    const { data, pagination } = await res.json();

    document.getElementById('resultCount').textContent = `${pagination.total} records`;

    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-muted">No courses found</td></tr>';
      document.getElementById('paginationContainer').innerHTML = '';
      return;
    }

    tbody.innerHTML = data.map(c => `
      <tr>
        <td><strong>${c.course_code}</strong></td>
        <td>${c.course_name}</td>
        <td>${c.department || '—'}</td>
        <td>${c.credits}</td>
        <td>Sem ${c.semester}</td>
        <td>${c.faculty_name || '—'}</td>
        <td>${c.enrolled_count || 0}</td>
        <td>
          <span class="badge ${c.is_active ? 'bg-success' : 'bg-secondary'}">
            ${c.is_active ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td>
          <button class="btn btn-sm btn-outline-primary me-1" onclick="viewCourse(${c.course_id})" title="View"><i class="bi bi-eye"></i></button>
          <button class="btn btn-sm btn-outline-warning me-1" onclick="editCourse(${c.course_id})" title="Edit"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteCourse(${c.course_id}, '${c.course_name.replace(/'/g, "\\'")}')" title="Delete"><i class="bi bi-trash"></i></button>
        </td>
      </tr>`).join('');

    renderPagination(pagination);
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-danger">Error loading courses</td></tr>';
  }
}

async function loadStats() {
  try {
    const res = await fetch('/admin/api/courses/stats/overview');
    const { data } = await res.json();
    document.getElementById('totalCourses').textContent = data.overview.total_courses;
    document.getElementById('activeCourses').textContent = data.overview.active_courses;
    document.getElementById('totalDepts').textContent = data.overview.total_departments;
    document.getElementById('totalEnrollments').textContent = data.overview.total_enrollments;
  } catch (e) {}
}

async function loadStaffList() {
  try {
    const res = await fetch('/admin/api/staff?limit=100');
    const { data } = await res.json();
    const selects = document.querySelectorAll('#staffId');
    selects.forEach(sel => {
      const current = sel.value;
      sel.innerHTML = '<option value="">Select Faculty (optional)</option>';
      (data || []).forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.staff_id;
        opt.textContent = `${s.first_name} ${s.last_name} (${s.department || 'N/A'})`;
        sel.appendChild(opt);
      });
      if (current) sel.value = current;
    });
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

function goPage(p) { currentPage = p; loadCourses(); return false; }

function debounceSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { currentPage = 1; loadCourses(); }, 400);
}

function resetFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('deptFilter').value = '';
  document.getElementById('semFilter').value = '';
  currentPage = 1;
  loadCourses();
}

// ─── VIEW ─────────────────────────────────────────────────────────────────────
async function viewCourse(id) {
  const modal = new bootstrap.Modal(document.getElementById('viewCourseModal'));
  document.getElementById('viewCourseModalBody').innerHTML = '<div class="text-center py-4"><div class="spinner-border"></div></div>';
  modal.show();

  try {
    const res = await fetch('/admin/api/courses/' + id);
    const { data } = await res.json();
    document.getElementById('viewCourseModalBody').innerHTML = `
      <div class="row g-3">
        <div class="col-md-6">
          <p><strong>Course Code:</strong> ${data.course_code}</p>
          <p><strong>Course Name:</strong> ${data.course_name}</p>
          <p><strong>Department:</strong> ${data.department || '—'}</p>
          <p><strong>Credits:</strong> ${data.credits}</p>
          <p><strong>Semester:</strong> ${data.semester}</p>
        </div>
        <div class="col-md-6">
          <p><strong>Faculty:</strong> ${data.faculty_name || '—'}</p>
          <p><strong>Enrolled:</strong> ${data.enrolled_count || 0}</p>
          <p><strong>Status:</strong> <span class="badge ${data.is_active ? 'bg-success' : 'bg-secondary'}">${data.is_active ? 'Active' : 'Inactive'}</span></p>
        </div>
        ${data.description ? `<div class="col-12"><p><strong>Description:</strong> ${data.description}</p></div>` : ''}
      </div>`;
  } catch (e) {
    document.getElementById('viewCourseModalBody').innerHTML = '<p class="text-danger">Error loading course details</p>';
  }
}

// ─── ADD / EDIT ───────────────────────────────────────────────────────────────
function openAddModal() {
  document.getElementById('modalTitle').textContent = 'Add Course';
  document.getElementById('courseForm').reset();
  document.getElementById('courseId').value = '';
  document.getElementById('courseCode').disabled = false;
  document.getElementById('formError').classList.add('d-none');
  loadStaffList();
  new bootstrap.Modal(document.getElementById('courseModal')).show();
}

async function editCourse(id) {
  try {
    const res = await fetch('/admin/api/courses/' + id);
    const { data } = await res.json();

    document.getElementById('modalTitle').textContent = 'Edit Course';
    document.getElementById('courseId').value = id;
    document.getElementById('courseCode').value = data.course_code;
    document.getElementById('courseCode').disabled = true;
    document.getElementById('courseName').value = data.course_name;
    document.getElementById('department').value = data.department || '';
    document.getElementById('credits').value = data.credits;
    document.getElementById('semester').value = data.semester;
    document.getElementById('description').value = data.description || '';
    document.getElementById('formError').classList.add('d-none');

    await loadStaffList();
    document.getElementById('staffId').value = data.staff_id || '';

    new bootstrap.Modal(document.getElementById('courseModal')).show();
  } catch (e) {
    showToast('Error loading course data', 'error');
  }
}

async function saveCourse() {
  const id = document.getElementById('courseId').value;
  const isEdit = !!id;
  const btn = document.getElementById('saveBtn');
  const errDiv = document.getElementById('formError');
  errDiv.classList.add('d-none');

  const payload = {
    course_code: document.getElementById('courseCode').value,
    course_name: document.getElementById('courseName').value,
    department: document.getElementById('department').value,
    credits: parseInt(document.getElementById('credits').value),
    semester: parseInt(document.getElementById('semester').value),
    description: document.getElementById('description').value,
    staff_id: document.getElementById('staffId').value || null
  };

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Saving...';

  try {
    const url = isEdit ? '/admin/api/courses/' + id : '/admin/api/courses';
    const method = isEdit ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();

    if (!res.ok || !data.success) {
      const msg = data.errors ? data.errors.map(e => e.message).join(', ') : (data.message || 'Error saving course');
      errDiv.textContent = msg;
      errDiv.classList.remove('d-none');
      return;
    }

    bootstrap.Modal.getInstance(document.getElementById('courseModal')).hide();
    showToast(isEdit ? 'Course updated successfully' : 'Course created successfully', 'success');
    loadCourses();
    loadStats();
  } catch (e) {
    errDiv.textContent = 'Network error. Please try again.';
    errDiv.classList.remove('d-none');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Save Course';
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
async function deleteCourse(id, name) {
  if (!confirm(`Delete course "${name}"?\n\nThis action cannot be undone.`)) return;

  try {
    const res = await fetch('/admin/api/courses/' + id, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { showToast('Course deleted successfully', 'success'); loadCourses(); loadStats(); }
    else showToast(data.message || 'Error deleting course', 'error');
  } catch (e) { showToast('Network error', 'error'); }
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
loadCourses();
loadStats();
