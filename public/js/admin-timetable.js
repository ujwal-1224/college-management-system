let timetableData = [];
let currentView = 'grid';
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ─── LOAD ─────────────────────────────────────────────────────────────────────
async function loadTimetable() {
  const course = document.getElementById('courseFilter').value;
  const day = document.getElementById('dayFilter').value;
  const semester = document.getElementById('semFilter').value;

  const params = new URLSearchParams({ course_id: course, day_of_week: day, semester });

  try {
    const res = await fetch('/admin/api/timetable?' + params);
    const { data } = await res.json();
    timetableData = data || [];

    if (currentView === 'grid') renderGridView(timetableData);
    else renderListView(timetableData);
  } catch (e) {
    showToast('Error loading timetable', 'error');
  }
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

// ─── GRID VIEW ────────────────────────────────────────────────────────────────
function renderGridView(data) {
  const container = document.getElementById('gridContainer');

  if (!data || data.length === 0) {
    container.innerHTML = '<div class="text-center py-4 text-muted">No timetable entries found</div>';
    return;
  }

  // Group by day
  const byDay = {};
  DAYS.forEach(d => { byDay[d] = []; });
  data.forEach(entry => {
    if (byDay[entry.day_of_week]) byDay[entry.day_of_week].push(entry);
  });

  // Collect all unique time slots
  const timeSlots = [...new Set(data.map(e => e.start_time))].sort();

  let html = '<table class="table-enterprise"><thead><tr><th>Time</th>';
  DAYS.forEach(d => { html += `<th>${d}</th>`; });
  html += '</tr></thead><tbody>';

  if (timeSlots.length === 0) {
    html += `<tr><td colspan="${DAYS.length + 1}" class="text-center py-4 text-muted">No entries</td></tr>`;
  } else {
    timeSlots.forEach(slot => {
      html += `<tr><td><strong>${formatTime(slot)}</strong></td>`;
      DAYS.forEach(day => {
        const entries = byDay[day].filter(e => e.start_time === slot);
        if (entries.length > 0) {
          html += `<td>${entries.map(e => `
            <div class="p-1 mb-1 rounded" style="background:#e0e7ff;font-size:0.8rem">
              <strong>${e.course_code || ''}</strong><br>
              <span class="text-muted">${e.room_number || '—'}</span>
              <div class="mt-1">
                <button class="btn btn-xs btn-outline-warning me-1" style="font-size:0.7rem;padding:1px 4px" onclick="editEntry(${e.timetable_id})"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-xs btn-outline-danger" style="font-size:0.7rem;padding:1px 4px" onclick="deleteEntry(${e.timetable_id})"><i class="bi bi-trash"></i></button>
              </div>
            </div>`).join('')}</td>`;
        } else {
          html += '<td class="text-muted" style="font-size:0.8rem">—</td>';
        }
      });
      html += '</tr>';
    });
  }

  html += '</tbody></table>';
  container.innerHTML = html;
}

// ─── LIST VIEW ────────────────────────────────────────────────────────────────
function renderListView(data) {
  const tbody = document.getElementById('listTableBody');

  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No timetable entries found</td></tr>';
    return;
  }

  tbody.innerHTML = data.map(e => `
    <tr>
      <td>${e.day_of_week}</td>
      <td>${formatTime(e.start_time)} – ${formatTime(e.end_time)}</td>
      <td><strong>${e.course_code || ''}</strong> ${e.course_name || ''}</td>
      <td>${e.room_number || '—'}</td>
      <td>${e.faculty_name || '—'}</td>
      <td>Sem ${e.semester}</td>
      <td>
        <button class="btn btn-sm btn-outline-warning me-1" onclick="editEntry(${e.timetable_id})"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteEntry(${e.timetable_id})"><i class="bi bi-trash"></i></button>
      </td>
    </tr>`).join('');
}

function formatTime(t) {
  if (!t) return '—';
  const [h, m] = t.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${m} ${ampm}`;
}

// ─── VIEW TOGGLE ──────────────────────────────────────────────────────────────
function switchView(view) {
  currentView = view;
  document.getElementById('gridView').classList.toggle('d-none', view !== 'grid');
  document.getElementById('listView').classList.toggle('d-none', view !== 'list');
  document.getElementById('btnGrid').classList.toggle('active', view === 'grid');
  document.getElementById('btnList').classList.toggle('active', view === 'list');

  if (view === 'grid') renderGridView(timetableData);
  else renderListView(timetableData);
}

function resetFilters() {
  document.getElementById('courseFilter').value = '';
  document.getElementById('dayFilter').value = '';
  document.getElementById('semFilter').value = '';
  loadTimetable();
}

// ─── ADD / EDIT ───────────────────────────────────────────────────────────────
function openAddModal() {
  document.getElementById('modalTitle').textContent = 'Add Timetable Entry';
  document.getElementById('timetableForm').reset();
  document.getElementById('entryId').value = '';
  document.getElementById('formError').classList.add('d-none');
  new bootstrap.Modal(document.getElementById('timetableModal')).show();
}

async function editEntry(id) {
  try {
    const entry = timetableData.find(e => e.timetable_id === id);
    if (!entry) { showToast('Entry not found', 'error'); return; }

    document.getElementById('modalTitle').textContent = 'Edit Timetable Entry';
    document.getElementById('entryId').value = id;
    document.getElementById('courseId').value = entry.course_id;
    document.getElementById('dayOfWeek').value = entry.day_of_week;
    document.getElementById('startTime').value = entry.start_time;
    document.getElementById('endTime').value = entry.end_time;
    document.getElementById('roomNumber').value = entry.room_number || '';
    document.getElementById('semester').value = entry.semester;
    document.getElementById('academicYear').value = entry.academic_year || '';
    document.getElementById('formError').classList.add('d-none');

    new bootstrap.Modal(document.getElementById('timetableModal')).show();
  } catch (e) {
    showToast('Error loading entry data', 'error');
  }
}

async function saveEntry() {
  const id = document.getElementById('entryId').value;
  const isEdit = !!id;
  const btn = document.getElementById('saveBtn');
  const errDiv = document.getElementById('formError');
  errDiv.classList.add('d-none');

  const payload = {
    course_id: document.getElementById('courseId').value,
    day_of_week: document.getElementById('dayOfWeek').value,
    start_time: document.getElementById('startTime').value,
    end_time: document.getElementById('endTime').value,
    room_number: document.getElementById('roomNumber').value,
    semester: document.getElementById('semester').value,
    academic_year: document.getElementById('academicYear').value
  };

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Saving...';

  try {
    const url = isEdit ? '/admin/api/timetable/' + id : '/admin/api/timetable';
    const method = isEdit ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();

    if (!res.ok || !data.success) {
      const msg = data.errors ? data.errors.map(e => e.message).join(', ') : (data.message || 'Error saving entry');
      errDiv.textContent = msg;
      errDiv.classList.remove('d-none');
      return;
    }

    bootstrap.Modal.getInstance(document.getElementById('timetableModal')).hide();
    showToast(isEdit ? 'Entry updated successfully' : 'Entry added successfully', 'success');
    loadTimetable();
  } catch (e) {
    errDiv.textContent = 'Network error. Please try again.';
    errDiv.classList.remove('d-none');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Save Entry';
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
async function deleteEntry(id) {
  if (!confirm('Delete this timetable entry?')) return;

  try {
    const res = await fetch('/admin/api/timetable/' + id, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { showToast('Entry deleted successfully', 'success'); loadTimetable(); }
    else showToast(data.message || 'Error deleting entry', 'error');
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
loadCoursesList().then(() => loadTimetable());
