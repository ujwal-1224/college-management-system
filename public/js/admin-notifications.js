let currentPage = 1;
let searchTimer = null;

// ─── LOAD ─────────────────────────────────────────────────────────────────────
async function loadNotifications() {
  const search = document.getElementById('searchInput').value;
  const target_role = document.getElementById('roleFilter').value;
  const notification_type = document.getElementById('typeFilter').value;
  const priority = document.getElementById('priorityFilter').value;
  const limit = document.getElementById('limitSelect').value;

  const params = new URLSearchParams({ page: currentPage, limit, search, target_role, notification_type, priority });
  const tbody = document.getElementById('notificationsTableBody');
  tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4"><div class="spinner-border spinner-border-sm"></div> Loading...</td></tr>';

  try {
    const res = await fetch('/admin/api/notifications?' + params);
    const { data, pagination } = await res.json();

    document.getElementById('resultCount').textContent = `${pagination.total} records`;

    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">No notifications found</td></tr>';
      document.getElementById('paginationContainer').innerHTML = '';
      return;
    }

    const priorityBadge = { low: 'bg-secondary', medium: 'bg-info text-dark', high: 'bg-warning text-dark', urgent: 'bg-danger' };
    const typeBadge = { general: 'bg-secondary', academic: 'bg-primary', fee: 'bg-warning text-dark', exam: 'bg-info text-dark', attendance: 'bg-success', alert: 'bg-danger' };

    tbody.innerHTML = data.map(n => `
      <tr>
        <td><strong>${n.title}</strong></td>
        <td><span class="badge ${typeBadge[n.notification_type] || 'bg-secondary'}">${n.notification_type || '—'}</span></td>
        <td>${n.target_role || 'all'}</td>
        <td><span class="badge ${priorityBadge[n.priority] || 'bg-secondary'}">${n.priority || '—'}</span></td>
        <td>${n.created_at ? new Date(n.created_at).toLocaleDateString() : '—'}</td>
        <td>
          <button class="btn btn-sm btn-outline-warning me-1" onclick="editNotification(${n.notification_id})" title="Edit"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteNotification(${n.notification_id}, '${n.title.replace(/'/g, "\\'")}')" title="Delete"><i class="bi bi-trash"></i></button>
        </td>
      </tr>`).join('');

    renderPagination(pagination);
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-danger">Error loading notifications</td></tr>';
  }
}

async function loadStats() {
  try {
    const res = await fetch('/admin/api/notifications/stats/overview');
    const { data } = await res.json();
    document.getElementById('totalNotifications').textContent = data.overview.total;
    document.getElementById('unreadNotifications').textContent = data.overview.unread;
    document.getElementById('urgentNotifications').textContent = data.overview.urgent;
    document.getElementById('broadcastNotifications').textContent = data.overview.broadcast;
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

function goPage(p) { currentPage = p; loadNotifications(); return false; }

function debounceSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { currentPage = 1; loadNotifications(); }, 400);
}

function resetFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('roleFilter').value = '';
  document.getElementById('typeFilter').value = '';
  document.getElementById('priorityFilter').value = '';
  currentPage = 1;
  loadNotifications();
}

// ─── ADD / EDIT ───────────────────────────────────────────────────────────────
function openAddModal() {
  document.getElementById('modalTitle').textContent = 'Add Notification';
  document.getElementById('notificationForm').reset();
  document.getElementById('notificationId').value = '';
  document.getElementById('formError').classList.add('d-none');
  new bootstrap.Modal(document.getElementById('notificationModal')).show();
}

async function editNotification(id) {
  try {
    const res = await fetch('/admin/api/notifications/' + id);
    const { data } = await res.json();

    document.getElementById('modalTitle').textContent = 'Edit Notification';
    document.getElementById('notificationId').value = id;
    document.getElementById('notifTitle').value = data.title;
    document.getElementById('notifMessage').value = data.message;
    document.getElementById('notifType').value = data.notification_type;
    document.getElementById('notifTargetRole').value = data.target_role;
    document.getElementById('notifPriority').value = data.priority;
    document.getElementById('notifExpiresAt').value = data.expires_at ? data.expires_at.slice(0, 16) : '';
    document.getElementById('formError').classList.add('d-none');

    new bootstrap.Modal(document.getElementById('notificationModal')).show();
  } catch (e) {
    showToast('Error loading notification data', 'error');
  }
}

async function saveNotification() {
  const id = document.getElementById('notificationId').value;
  const isEdit = !!id;
  const btn = document.getElementById('saveBtn');
  const errDiv = document.getElementById('formError');
  errDiv.classList.add('d-none');

  const payload = {
    title: document.getElementById('notifTitle').value,
    message: document.getElementById('notifMessage').value,
    notification_type: document.getElementById('notifType').value,
    target_role: document.getElementById('notifTargetRole').value,
    priority: document.getElementById('notifPriority').value,
    expires_at: document.getElementById('notifExpiresAt').value || null
  };

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Saving...';

  try {
    const url = isEdit ? '/admin/api/notifications/' + id : '/admin/api/notifications';
    const method = isEdit ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();

    if (!res.ok || !data.success) {
      const msg = data.errors ? data.errors.map(e => e.message).join(', ') : (data.message || 'Error saving notification');
      errDiv.textContent = msg;
      errDiv.classList.remove('d-none');
      return;
    }

    bootstrap.Modal.getInstance(document.getElementById('notificationModal')).hide();
    showToast(isEdit ? 'Notification updated' : 'Notification created', 'success');
    loadNotifications();
    loadStats();
  } catch (e) {
    errDiv.textContent = 'Network error. Please try again.';
    errDiv.classList.remove('d-none');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Save Notification';
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
async function deleteNotification(id, title) {
  if (!confirm(`Delete notification "${title}"?`)) return;

  try {
    const res = await fetch('/admin/api/notifications/' + id, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { showToast('Notification deleted', 'success'); loadNotifications(); loadStats(); }
    else showToast(data.message || 'Error deleting notification', 'error');
  } catch (e) { showToast('Network error', 'error'); }
}

// ─── BROADCAST ────────────────────────────────────────────────────────────────
function openBroadcastModal() {
  document.getElementById('broadcastForm').reset();
  document.getElementById('bcFormError').classList.add('d-none');
  new bootstrap.Modal(document.getElementById('broadcastModal')).show();
}

async function sendBroadcast() {
  const btn = document.getElementById('bcSendBtn');
  const errDiv = document.getElementById('bcFormError');
  errDiv.classList.add('d-none');

  const payload = {
    title: document.getElementById('bcTitle').value,
    message: document.getElementById('bcMessage').value,
    target_role: document.getElementById('bcTargetRole').value,
    priority: document.getElementById('bcPriority').value
  };

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Sending...';

  try {
    const res = await fetch('/admin/api/notifications/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      const msg = data.message || 'Error sending broadcast';
      errDiv.textContent = msg;
      errDiv.classList.remove('d-none');
      return;
    }

    bootstrap.Modal.getInstance(document.getElementById('broadcastModal')).hide();
    showToast('Broadcast sent successfully', 'success');
    loadNotifications();
    loadStats();
  } catch (e) {
    errDiv.textContent = 'Network error. Please try again.';
    errDiv.classList.remove('d-none');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-broadcast me-1"></i>Send Broadcast';
  }
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
loadNotifications();
loadStats();
