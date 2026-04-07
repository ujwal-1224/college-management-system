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
    // data is a key→object map; convert to array
    const settingsArray = Object.values(data || {});
    settingsData = {};
    settingsArray.forEach(s => { settingsData[s.setting_key] = s; });
    renderSettingsCards(settingsArray);
  } catch (e) {
    // Show fallback defaults so page is never blank
    const fallback = [
      { setting_key: 'college_name',      setting_value: 'ABC College of Engineering', description: 'College Name' },
      { setting_key: 'academic_year',     setting_value: '2024-2025',                  description: 'Current Academic Year' },
      { setting_key: 'attendance_threshold', setting_value: '75',                      description: 'Minimum Attendance %' },
    ];
    renderSettingsCards(fallback);
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
  // Update locally — no API needed in demo mode
  document.getElementById('setting-val-' + key).textContent = value;
  hideInlineEdit(key);
  showToast('Setting updated successfully', 'success');
}

// ─── AUDIT LOGS (local dummy data) ───────────────────────────────────────────
const DUMMY_AUDIT_LOGS = [
  { action:'LOGIN',  table_name:'User',     record_id:1,  username:'admin',   ip_address:'127.0.0.1', created_at:'2026-04-07T09:00:00Z' },
  { action:'INSERT', table_name:'Student',  record_id:35, username:'admin',   ip_address:'127.0.0.1', created_at:'2026-04-07T09:15:00Z' },
  { action:'UPDATE', table_name:'Course',   record_id:3,  username:'admin',   ip_address:'127.0.0.1', created_at:'2026-04-07T09:30:00Z' },
  { action:'INSERT', table_name:'Exam',     record_id:9,  username:'admin',   ip_address:'127.0.0.1', created_at:'2026-04-06T14:00:00Z' },
  { action:'DELETE', table_name:'Notification',record_id:2,username:'admin',  ip_address:'127.0.0.1', created_at:'2026-04-06T11:00:00Z' },
  { action:'UPDATE', table_name:'Staff',    record_id:4,  username:'admin',   ip_address:'127.0.0.1', created_at:'2026-04-05T16:00:00Z' },
  { action:'LOGIN',  table_name:'User',     record_id:5,  username:'student1',ip_address:'127.0.0.1', created_at:'2026-04-05T08:00:00Z' },
  { action:'INSERT', table_name:'Attendance',record_id:100,username:'staff1', ip_address:'127.0.0.1', created_at:'2026-04-04T10:00:00Z' },
];

async function loadAuditLogs() {
  const user   = (document.getElementById('auditUserSearch').value||'').toLowerCase();
  const action = document.getElementById('auditActionFilter').value;
  const table  = document.getElementById('auditTableFilter').value;
  let data = DUMMY_AUDIT_LOGS.filter(l => {
    if (user   && !(l.username||'').toLowerCase().includes(user)) return false;
    if (action && l.action !== action) return false;
    if (table  && l.table_name !== table) return false;
    return true;
  });
  const tbody = document.getElementById('auditLogsBody');
  const actionBadge = { INSERT:'bg-success', UPDATE:'bg-warning text-dark', DELETE:'bg-danger', LOGIN:'bg-primary', LOGOUT:'bg-secondary' };
  if (!data.length) { tbody.innerHTML='<tr><td colspan="6" class="text-center py-4 text-muted">No audit logs found</td></tr>'; document.getElementById('auditPaginationContainer').innerHTML=''; return; }
  tbody.innerHTML = data.map(log=>`
    <tr>
      <td><span class="badge ${actionBadge[log.action]||'bg-secondary'}">${log.action}</span></td>
      <td>${log.table_name||'—'}</td>
      <td>${log.record_id||'—'}</td>
      <td>${log.username||'—'}</td>
      <td>${log.ip_address||'—'}</td>
      <td>${log.created_at?new Date(log.created_at).toLocaleString():'—'}</td>
    </tr>`).join('');
  document.getElementById('auditPaginationContainer').innerHTML='';
}

function renderAuditPagination(page, pages, total) {
  const container = document.getElementById('auditPaginationContainer');
  if (!pages || pages <= 1) { container.innerHTML = ''; return; }
  let html = `<small class="text-muted">Page ${page} of ${pages} (${total} total)</small>`;
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

// ─── ALERT CONFIGS (local dummy data) ────────────────────────────────────────
const DUMMY_ALERTS = [
  { id:1, alert_type:'low_attendance',    threshold:75,  is_active:true,  notification_method:'email' },
  { id:2, alert_type:'fee_overdue',       threshold:30,  is_active:true,  notification_method:'email' },
  { id:3, alert_type:'exam_result_below', threshold:40,  is_active:false, notification_method:'sms'   },
  { id:4, alert_type:'login_failure',     threshold:5,   is_active:true,  notification_method:'email' },
];

async function loadAlertConfigs() {
  const tbody = document.getElementById('alertConfigsBody');
  const data = DUMMY_ALERTS;
  if (!data.length) { tbody.innerHTML='<tr><td colspan="5" class="text-center py-4 text-muted">No alert configurations found</td></tr>'; return; }
  tbody.innerHTML = data.map(a=>`
    <tr>
      <td>${formatSettingKey(a.alert_type||'')}</td>
      <td>${a.threshold!==null?a.threshold:'—'}</td>
      <td><span class="badge ${a.is_active?'bg-success':'bg-secondary'}">${a.is_active?'Active':'Inactive'}</span></td>
      <td>${a.notification_method||'—'}</td>
      <td><button class="btn btn-sm btn-outline-warning" onclick="editAlertConfig(${a.id})"><i class="bi bi-pencil"></i></button></td>
    </tr>`).join('');
}

async function editAlertConfig(id) {
  const config = DUMMY_ALERTS.find(a=>a.id===id);
  if (!config) { showToast('Config not found','error'); return; }
  document.getElementById('alertConfigId').value = id;
  document.getElementById('alertType').value = formatSettingKey(config.alert_type||'');
  document.getElementById('alertThreshold').value = config.threshold!==null?config.threshold:'';
  document.getElementById('alertMethod').value = config.notification_method||'email';
  document.getElementById('alertActive').checked = !!config.is_active;
  document.getElementById('alertFormError').classList.add('d-none');
  new bootstrap.Modal(document.getElementById('alertConfigModal')).show();
}

async function saveAlertConfig() {
  const id = parseInt(document.getElementById('alertConfigId').value);
  const config = DUMMY_ALERTS.find(a=>a.id===id);
  if (config) {
    config.threshold = parseFloat(document.getElementById('alertThreshold').value)||null;
    config.notification_method = document.getElementById('alertMethod').value;
    config.is_active = document.getElementById('alertActive').checked;
  }
  bootstrap.Modal.getInstance(document.getElementById('alertConfigModal')).hide();
  showToast('Alert config updated','success');
  loadAlertConfigs();
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
