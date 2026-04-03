let activeTab = 'system';
let auditCurrentPage = 1;
let auditTimer = null;
let settingsData = {};

// ─── TAB SWITCHING ────────────────────────────────────────────────────────────
function switchTab(tab) {
  activeTab = tab;
  ['system', 'audit', 'alerts'].forEach(t => {
    document.getElementById('tab-' + t).classList.toggle('d-none', t !== tab);
  });

  document.querySelectorAll('#settingsTabs .nav-link').forEach((link, i) => {
    const tabs = ['system', 'audit', 'alerts'];
    link.classList.toggle('active', tabs[i] === tab);
  });

  if (tab === 'system') loadSettings();
  else if (tab === 'audit') loadAuditLogs();
  else if (tab === 'alerts') loadAlertConfigs();

  return false;
}

// ─── SYSTEM SETTINGS ─────────────────────────────────────────────────────────
async function loadSettings() {
  const container = document.getElementById('settingsContainer');
  container.innerHTML = '<div class="text-center py-4"><div class="spinner-border spinner-border-sm"></div> Loading settings...</div>';

  try {
    const res = await fetch('/admin/api/settings');
    const { data } = await res.json();
    settingsData = {};
    (data || []).forEach(s => { settingsData[s.setting_key] = s; });
    renderSettingsCards(data || []);
  } catch (e) {
    container.innerHTML = '<p class="text-danger">Error loading settings</p>';
  }
}

function renderSettingsCards(settings) {
  const groups = {
    General: ['college_name', 'academic_year'],
    Security: ['max_login_attempts', 'session_timeout'],
    Notifications: ['enable_email_notifications', 'enable_sms_notifications'],
    Academic: ['attendance_threshold']
  };

  const groupIcons = { General: 'building', Security: 'shield-lock', Notifications: 'bell', Academic: 'book' };

  let html = '<div class="row g-4">';

  Object.entries(groups).forEach(([groupName, keys]) => {
    const groupSettings = settings.filter(s => keys.includes(s.setting_key));
    if (groupSettings.length === 0) return;

    html += `
      <div class="col-md-6">
        <div class="card-enterprise h-100">
          <div class="card-enterprise-header">
            <i class="bi bi-${groupIcons[groupName] || 'gear'} me-2"></i>${groupName}
          </div>
          <div class="card-body">`;

    groupSettings.forEach(s => {
      html += `
        <div class="d-flex justify-content-between align-items-center py-2 border-bottom" id="setting-row-${s.setting_key}">
          <div>
            <div class="fw-semibold">${formatSettingKey(s.setting_key)}</div>
            <div class="text-muted small">${s.description || ''}</div>
          </div>
          <div class="d-flex align-items-center gap-2">
            <span class="badge bg-light text-dark border" id="setting-val-${s.setting_key}">${s.setting_value}</span>
            <button class="btn btn-sm btn-outline-primary" onclick="showInlineEdit('${s.setting_key}', '${s.setting_value.replace(/'/g, "\\'")}')">
              <i class="bi bi-pencil"></i>
            </button>
          </div>
        </div>
        <div class="d-none py-2 border-bottom" id="setting-edit-${s.setting_key}">
          <div class="d-flex gap-2 align-items-center">
            <input type="text" class="form-control form-control-sm" id="setting-input-${s.setting_key}" value="${s.setting_value}">
            <button class="btn btn-sm btn-success" onclick="updateSetting('${s.setting_key}')"><i class="bi bi-check"></i></button>
            <button class="btn btn-sm btn-secondary" onclick="hideInlineEdit('${s.setting_key}')"><i class="bi bi-x"></i></button>
          </div>
        </div>`;
    });

    html += '</div></div></div>';
  });

  html += '</div>';
  document.getElementById('settingsContainer').innerHTML = html;
}

function formatSettingKey(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function showInlineEdit(key, value) {
  document.getElementById('setting-row-' + key).classList.add('d-none');
  document.getElementById('setting-edit-' + key).classList.remove('d-none');
  document.getElementById('setting-input-' + key).focus();
}

function hideInlineEdit(key) {
  document.getElementById('setting-row-' + key).classList.remove('d-none');
  document.getElementById('setting-edit-' + key).classList.add('d-none');
}

async function updateSetting(key) {
  const value = document.getElementById('setting-input-' + key).value;

  try {
    const res = await fetch('/admin/api/settings/' + key, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ setting_value: value })
    });
    const data = await res.json();

    if (data.success) {
      document.getElementById('setting-val-' + key).textContent = value;
      hideInlineEdit(key);
      showToast('Setting updated successfully', 'success');
    } else {
      showToast(data.message || 'Error updating setting', 'error');
    }
  } catch (e) {
    showToast('Network error', 'error');
  }
}

// ─── AUDIT LOGS ───────────────────────────────────────────────────────────────
async function loadAuditLogs() {
  const user = document.getElementById('auditUserSearch').value;
  const action = document.getElementById('auditActionFilter').value;
  const table_name = document.getElementById('auditTableFilter').value;
  const start_date = document.getElementById('auditStartDate').value;
  const end_date = document.getElementById('auditEndDate').value;

  const params = new URLSearchParams({ page: auditCurrentPage, limit: 20, user, action, table_name, start_date, end_date });
  const tbody = document.getElementById('auditLogsBody');
  tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4"><div class="spinner-border spinner-border-sm"></div> Loading...</td></tr>';

  try {
    const res = await fetch('/admin/api/audit-logs?' + params);
    const { data, pagination } = await res.json();

    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">No audit logs found</td></tr>';
      document.getElementById('auditPaginationContainer').innerHTML = '';
      return;
    }

    const actionBadge = { INSERT: 'bg-success', UPDATE: 'bg-warning text-dark', DELETE: 'bg-danger', LOGIN: 'bg-primary', LOGOUT: 'bg-secondary' };

    tbody.innerHTML = data.map(log => `
      <tr>
        <td><span class="badge ${actionBadge[log.action] || 'bg-secondary'}">${log.action}</span></td>
        <td>${log.table_name || '—'}</td>
        <td>${log.record_id || '—'}</td>
        <td>${log.username || log.user_id || '—'}</td>
        <td>${log.ip_address || '—'}</td>
        <td>${log.created_at ? new Date(log.created_at).toLocaleString() : '—'}</td>
      </tr>`).join('');

    renderAuditPagination(pagination);
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-danger">Error loading audit logs</td></tr>';
  }
}

function renderAuditPagination({ page, pages, total }) {
  const container = document.getElementById('auditPaginationContainer');
  if (!pages || pages <= 1) { container.innerHTML = ''; return; }

  let html = `<small class="text-muted">Page ${page} of ${pages} (${total} total)</small><nav><ul class="pagination pagination-sm mb-0">`;
  html += `<li class="page-item ${page === 1 ? 'disabled' : ''}"><a class="page-link" href="#" onclick="auditPaginate(${page - 1})">‹</a></li>`;
  for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) {
    html += `<li class="page-item ${i === page ? 'active' : ''}"><a class="page-link" href="#" onclick="auditPaginate(${i})">${i}</a></li>`;
  }
  html += `<li class="page-item ${page === pages ? 'disabled' : ''}"><a class="page-link" href="#" onclick="auditPaginate(${page + 1})">›</a></li></ul></nav>`;
  container.innerHTML = html;
}

function auditPaginate(p) { auditCurrentPage = p; loadAuditLogs(); return false; }

function debounceAudit() {
  clearTimeout(auditTimer);
  auditTimer = setTimeout(() => { auditCurrentPage = 1; loadAuditLogs(); }, 400);
}

function resetAuditFilters() {
  document.getElementById('auditUserSearch').value = '';
  document.getElementById('auditActionFilter').value = '';
  document.getElementById('auditTableFilter').value = '';
  document.getElementById('auditStartDate').value = '';
  document.getElementById('auditEndDate').value = '';
  auditCurrentPage = 1;
  loadAuditLogs();
}

// ─── ALERT CONFIGS ────────────────────────────────────────────────────────────
async function loadAlertConfigs() {
  const tbody = document.getElementById('alertConfigsBody');
  tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4"><div class="spinner-border spinner-border-sm"></div> Loading...</td></tr>';

  try {
    const res = await fetch('/admin/api/alert-configs');
    const { data } = await res.json();

    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">No alert configurations found</td></tr>';
      return;
    }

    tbody.innerHTML = data.map(a => `
      <tr>
        <td>${formatSettingKey(a.alert_type || a.type || '')}</td>
        <td>${a.threshold !== null ? a.threshold : '—'}</td>
        <td><span class="badge ${a.is_active ? 'bg-success' : 'bg-secondary'}">${a.is_active ? 'Active' : 'Inactive'}</span></td>
        <td>${a.notification_method || a.method || '—'}</td>
        <td>
          <button class="btn btn-sm btn-outline-warning" onclick="editAlertConfig(${a.id || a.alert_config_id})"><i class="bi bi-pencil"></i></button>
        </td>
      </tr>`).join('');
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-danger">Error loading alert configurations</td></tr>';
  }
}

async function editAlertConfig(id) {
  try {
    const res = await fetch('/admin/api/alert-configs');
    const { data } = await res.json();
    const config = data.find(a => (a.id || a.alert_config_id) === id);
    if (!config) { showToast('Config not found', 'error'); return; }

    document.getElementById('alertConfigId').value = id;
    document.getElementById('alertType').value = formatSettingKey(config.alert_type || config.type || '');
    document.getElementById('alertThreshold').value = config.threshold !== null ? config.threshold : '';
    document.getElementById('alertMethod').value = config.notification_method || config.method || 'email';
    document.getElementById('alertActive').checked = !!config.is_active;
    document.getElementById('alertFormError').classList.add('d-none');

    new bootstrap.Modal(document.getElementById('alertConfigModal')).show();
  } catch (e) {
    showToast('Error loading config', 'error');
  }
}

async function saveAlertConfig() {
  const id = document.getElementById('alertConfigId').value;
  const btn = document.getElementById('alertSaveBtn');
  const errDiv = document.getElementById('alertFormError');
  errDiv.classList.add('d-none');

  const payload = {
    threshold: parseFloat(document.getElementById('alertThreshold').value) || null,
    notification_method: document.getElementById('alertMethod').value,
    is_active: document.getElementById('alertActive').checked
  };

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Saving...';

  try {
    const res = await fetch('/admin/api/alert-configs/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      errDiv.textContent = data.message || 'Error saving config';
      errDiv.classList.remove('d-none');
      return;
    }

    bootstrap.Modal.getInstance(document.getElementById('alertConfigModal')).hide();
    showToast('Alert config updated', 'success');
    loadAlertConfigs();
  } catch (e) {
    errDiv.textContent = 'Network error. Please try again.';
    errDiv.classList.remove('d-none');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Save';
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
loadSettings();
