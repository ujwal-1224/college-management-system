let currentPage = 1;
let searchTimer = null;
let activeExamId = null;

// ─── LOAD ─────────────────────────────────────────────────────────────────────
async function loadExams() {
  const search = document.getElementById('searchInput').value;
  const course_id = document.getElementById('courseFilter').value;
  const exam_type = document.getElementById('typeFilter').value;
  const limit = document.getElementById('limitSelect').value;

  const params = new URLSearchParams({ page: currentPage, limit, search, course_id, exam_type });
  const tbody = document.getElementById('examsTableBody');
  tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4"><div class="spinner-border spinner-border-sm"></div> Loading...</td></tr>';

  try {
    const res = await fetch('/admin/api/exams?' + params);
    const { data, pagination } = await res.json();

    document.getElementById('resultCount').textContent = `${pagination.total} records`;

    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No exams found</td></tr>';
      document.getElementById('paginationContainer').innerHTML = '';
      return;
    }

    const typeLabels = { mid_term: 'Mid Term', final: 'Final', quiz: 'Quiz', assignment: 'Assignment', practical: 'Practical' };
    const typeBadge = { mid_term: 'bg-primary', final: 'bg-danger', quiz: 'bg-info', assignment: 'bg-warning text-dark', practical: 'bg-success' };

    tbody.innerHTML = data.map(e => `
      <tr>
        <td><strong>${e.exam_name}</strong></td>
        <td>${e.course_code ? `<span class="badge bg-secondary">${e.course_code}</span> ` : ''}${e.course_name || '—'}</td>
        <td><span class="badge ${typeBadge[e.exam_type] || 'bg-secondary'}">${typeLabels[e.exam_type] || e.exam_type}</span></td>
        <td>${e.exam_date ? new Date(e.exam_date).toLocaleDateString() : '—'}</td>
        <td>${e.max_marks}</td>
        <td>${e.submission_count || 0}</td>
        <td>
          <button class="btn btn-sm btn-outline-info me-1" onclick="viewResults(${e.exam_id})" title="Results"><i class="bi bi-bar-chart"></i></button>
          <button class="btn btn-sm btn-outline-warning me-1" onclick="editExam(${e.exam_id})" title="Edit"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-success me-1" onclick="publishResults(${e.exam_id})" title="Publish"><i class="bi bi-send"></i></button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteExam(${e.exam_id}, '${e.exam_name.replace(/'/g, "\\'")}')" title="Delete"><i class="bi bi-trash"></i></button>
        </td>
      </tr>`).join('');

    renderPagination(pagination);
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-danger">Error loading exams</td></tr>';
  }
}

async function loadStats() {
  try {
    const res = await fetch('/admin/api/exams/stats/overview');
    const { data } = await res.json();
    document.getElementById('totalExams').textContent = data.overview.total_exams;
    document.getElementById('thisMonthExams').textContent = data.overview.this_month;
    document.getElementById('publishedResults').textContent = data.overview.published_results;
    document.getElementById('pendingResults').textContent = data.overview.pending_results;
  } catch (e) {}
}

async function loadCoursesList() {
  try {
    const res = await fetch('/admin/api/all-courses');
    const { data } = await res.json();
    const selects = document.querySelectorAll('#courseFilter, #courseId');
    selects.forEach(sel => {
      const current = sel.value;
      const isFilter = sel.id === 'courseFilter';
      sel.innerHTML = isFilter ? '<option value="">All Courses</option>' : '<option value="">Select Course</option>';
      (data || []).forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.course_id;
        opt.textContent = `${c.course_code} - ${c.course_name}`;
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

function goPage(p) { currentPage = p; loadExams(); return false; }

function debounceSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { currentPage = 1; loadExams(); }, 400);
}

function resetFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('courseFilter').value = '';
  document.getElementById('typeFilter').value = '';
  currentPage = 1;
  loadExams();
}

// ─── ADD / EDIT ───────────────────────────────────────────────────────────────
function openAddModal() {
  document.getElementById('modalTitle').textContent = 'Add Exam';
  document.getElementById('examForm').reset();
  document.getElementById('examId').value = '';
  document.getElementById('formError').classList.add('d-none');
  new bootstrap.Modal(document.getElementById('examModal')).show();
}

async function editExam(id) {
  try {
    const res = await fetch('/admin/api/exams/' + id);
    const { data } = await res.json();

    document.getElementById('modalTitle').textContent = 'Edit Exam';
    document.getElementById('examId').value = id;
    document.getElementById('courseId').value = data.course_id;
    document.getElementById('examName').value = data.exam_name;
    document.getElementById('examType').value = data.exam_type;
    document.getElementById('examDate').value = data.exam_date ? data.exam_date.split('T')[0] : '';
    document.getElementById('maxMarks').value = data.max_marks;
    document.getElementById('durationMinutes').value = data.duration_minutes || '';
    document.getElementById('description').value = data.description || '';
    document.getElementById('formError').classList.add('d-none');

    new bootstrap.Modal(document.getElementById('examModal')).show();
  } catch (e) {
    showToast('Error loading exam data', 'error');
  }
}

async function saveExam() {
  const id = document.getElementById('examId').value;
  const isEdit = !!id;
  const btn = document.getElementById('saveBtn');
  const errDiv = document.getElementById('formError');
  errDiv.classList.add('d-none');

  const payload = {
    course_id: document.getElementById('courseId').value,
    exam_name: document.getElementById('examName').value,
    exam_type: document.getElementById('examType').value,
    exam_date: document.getElementById('examDate').value,
    max_marks: parseInt(document.getElementById('maxMarks').value),
    duration_minutes: parseInt(document.getElementById('durationMinutes').value) || null,
    description: document.getElementById('description').value
  };

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Saving...';

  try {
    const url = isEdit ? '/admin/api/exams/' + id : '/admin/api/exams';
    const method = isEdit ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();

    if (!res.ok || !data.success) {
      const msg = data.errors ? data.errors.map(e => e.message).join(', ') : (data.message || 'Error saving exam');
      errDiv.textContent = msg;
      errDiv.classList.remove('d-none');
      return;
    }

    bootstrap.Modal.getInstance(document.getElementById('examModal')).hide();
    showToast(isEdit ? 'Exam updated successfully' : 'Exam created successfully', 'success');
    loadExams();
    loadStats();
  } catch (e) {
    errDiv.textContent = 'Network error. Please try again.';
    errDiv.classList.remove('d-none');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Save Exam';
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
async function deleteExam(id, name) {
  if (!confirm(`Delete exam "${name}"?\n\nThis action cannot be undone.`)) return;

  try {
    const res = await fetch('/admin/api/exams/' + id, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { showToast('Exam deleted successfully', 'success'); loadExams(); loadStats(); }
    else showToast(data.message || 'Error deleting exam', 'error');
  } catch (e) { showToast('Network error', 'error'); }
}

// ─── RESULTS ─────────────────────────────────────────────────────────────────
async function viewResults(examId) {
  activeExamId = examId;
  const modal = new bootstrap.Modal(document.getElementById('resultsModal'));
  document.getElementById('resultsTableContainer').innerHTML = '<div class="text-center py-4"><div class="spinner-border spinner-border-sm"></div> Loading students...</div>';
  modal.show();
  await loadExamStudents(examId);
}

async function loadExamStudents(examId) {
  try {
    const res = await fetch(`/admin/api/exams/${examId}/students`);
    const { data } = await res.json();

    if (!data || data.length === 0) {
      document.getElementById('resultsTableContainer').innerHTML = '<p class="text-muted text-center py-4">No students enrolled in this exam\'s course</p>';
      return;
    }

    let html = `
      <div class="table-responsive">
        <table class="table table-sm table-bordered">
          <thead class="table-light">
            <tr><th>Roll No</th><th>Student Name</th><th>Marks Obtained</th><th>Remarks</th></tr>
          </thead>
          <tbody>`;

    data.forEach(s => {
      html += `
        <tr>
          <td>${s.roll_number}</td>
          <td>${s.first_name} ${s.last_name}</td>
          <td><input type="number" class="form-control form-control-sm" id="marks_${s.student_id}" value="${s.marks_obtained !== null ? s.marks_obtained : ''}" min="0" placeholder="—" style="width:90px"></td>
          <td><input type="text" class="form-control form-control-sm" id="remarks_${s.student_id}" value="${s.remarks || ''}" placeholder="Optional"></td>
        </tr>`;
    });

    html += '</tbody></table></div>';
    document.getElementById('resultsTableContainer').innerHTML = html;

    document.getElementById('saveResultsBtn').onclick = () => saveResults(examId, data);
  } catch (e) {
    document.getElementById('resultsTableContainer').innerHTML = '<p class="text-danger">Error loading students</p>';
  }
}

async function saveResults(examId, students) {
  const btn = document.getElementById('saveResultsBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Saving...';

  const results = students.map(s => ({
    student_id: s.student_id,
    marks_obtained: parseFloat(document.getElementById('marks_' + s.student_id).value) || null,
    remarks: document.getElementById('remarks_' + s.student_id).value
  })).filter(r => r.marks_obtained !== null);

  try {
    const res = await fetch(`/admin/api/exams/${examId}/results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ results })
    });
    const data = await res.json();
    if (data.success) { showToast('Results saved successfully', 'success'); }
    else showToast(data.message || 'Error saving results', 'error');
  } catch (e) {
    showToast('Network error', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Save Results';
  }
}

async function publishResults(examId) {
  if (!confirm('Publish results for this exam? Students will be able to see their marks.')) return;

  try {
    const res = await fetch(`/admin/api/exams/${examId}/publish`, { method: 'PATCH' });
    const data = await res.json();
    if (data.success) { showToast('Results published successfully', 'success'); loadExams(); loadStats(); }
    else showToast(data.message || 'Error publishing results', 'error');
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
loadCoursesList().then(() => { loadExams(); loadStats(); });
