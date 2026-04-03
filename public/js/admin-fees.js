let activeTab = 'structures';
let fsCurrentPage = 1;
let payCurrentPage = 1;
let fsSearchTimer = null;
let paySearchTimer = null;

// ─── TAB SWITCHING ────────────────────────────────────────────────────────────
function switchTab(tab) {
  activeTab = tab;
  ['structures', 'payments', 'defaulters', 'reports'].forEach(t => {
    document.getElementById('tab-' + t).classList.toggle('d-none', t !== tab);
  });

  // Update nav-link active state
  document.querySelectorAll('#feeTabs .nav-link').forEach((link, i) => {
    const tabs = ['structures', 'payments', 'defaulters', 'reports'];
    link.classList.toggle('active', tabs[i] === tab);
  });

  if (tab === 'structures') loadFeeStructures();
  else if (tab === 'payments') loadPayments();
  else if (tab === 'defaulters') loadDefaulters();
  else if (tab === 'reports') loadReports();

  return false;
}

// ─── FEE STRUCTURES ───────────────────────────────────────────────────────────
async function loadFeeStructures() {
  const search = document.getElementById('fsSearch').value;
  const semester = document.getElementById('fsSemFilter').value;
  const academic_year = document.getElementById('fsYearFilter').value;

  const params = new URLSearchParams({ page: fsCurrentPage, limit: 10, search, semester, academic_year });
  const tbody = document.getElementById('feeStructuresBody');
  tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4"><div class="spinner-border spinner-border-sm"></div> Loading...</td></tr>';

  try {
    const res = await fetch('/admin/api/fee-structures?' + params);
    const { data, pagination } = await res.json();

    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No fee structures found</td></tr>';
      document.getElementById('fsPaginationContainer').innerHTML = '';
      return;
    }

    tbody.innerHTML = data.map(f => `
      <tr>
        <td>${f.student_name || '—'}</td>
        <td>${f.roll_number || '—'}</td>
        <td>Sem ${f.semester}</td>
        <td>${f.academic_year}</td>
        <td><strong>₹${Number(f.total_fee || 0).toLocaleString()}</strong></td>
        <td>${f.due_date ? new Date(f.due_date).toLocaleDateString() : '—'}</td>
        <td>
          <button class="btn btn-sm btn-outline-warning me-1" onclick="editFeeStructure(${f.fee_structure_id})" title="Edit"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteFeeStructure(${f.fee_structure_id})" title="Delete"><i class="bi bi-trash"></i></button>
        </td>
      </tr>`).join('');

    renderFsPagination(pagination);
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-danger">Error loading fee structures</td></tr>';
  }
}

function renderFsPagination({ page, pages, total }) {
  const container = document.getElementById('fsPaginationContainer');
  if (!pages || pages <= 1) { container.innerHTML = ''; return; }

  let html = `<small class="text-muted">Page ${page} of ${pages} (${total} total)</small><nav><ul class="pagination pagination-sm mb-0">`;
  html += `<li class="page-item ${page === 1 ? 'disabled' : ''}"><a class="page-link" href="#" onclick="fsPaginate(${page - 1})">‹</a></li>`;
  for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) {
    html += `<li class="page-item ${i === page ? 'active' : ''}"><a class="page-link" href="#" onclick="fsPaginate(${i})">${i}</a></li>`;
  }
  html += `<li class="page-item ${page === pages ? 'disabled' : ''}"><a class="page-link" href="#" onclick="fsPaginate(${page + 1})">›</a></li></ul></nav>`;
  container.innerHTML = html;
}

function fsPaginate(p) { fsCurrentPage = p; loadFeeStructures(); return false; }

// ─── PAYMENTS ─────────────────────────────────────────────────────────────────
async function loadPayments() {
  const search = document.getElementById('paySearch').value;
  const status = document.getElementById('payStatusFilter').value;
  const semester = document.getElementById('paySemFilter').value;

  const params = new URLSearchParams({ page: payCurrentPage, limit: 10, search, status, semester });
  const tbody = document.getElementById('paymentsBody');
  tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4"><div class="spinner-border spinner-border-sm"></div> Loading...</td></tr>';

  try {
    const res = await fetch('/admin/api/payments?' + params);
    const { data, pagination } = await res.json();

    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">No payments found</td></tr>';
      document.getElementById('payPaginationContainer').innerHTML = '';
      return;
    }

    const statusBadge = { completed: 'bg-success', pending: 'bg-warning text-dark', failed: 'bg-danger' };

    tbody.innerHTML = data.map(p => `
      <tr>
        <td>${p.payment_date ? new Date(p.payment_date).toLocaleDateString() : '—'}</td>
        <td>${p.student_name || '—'}<br><small class="text-muted">${p.roll_number || ''}</small></td>
        <td><strong>₹${Number(p.amount || 0).toLocaleString()}</strong></td>
        <td>${p.payment_method || '—'}</td>
        <td>${p.receipt_number || '—'}</td>
        <td><span class="badge ${statusBadge[p.status] || 'bg-secondary'}">${p.status || '—'}</span></td>
      </tr>`).join('');

    renderPayPagination(pagination);
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-danger">Error loading payments</td></tr>';
  }
}

function renderPayPagination({ page, pages, total }) {
  const container = document.getElementById('payPaginationContainer');
  if (!pages || pages <= 1) { container.innerHTML = ''; return; }

  let html = `<small class="text-muted">Page ${page} of ${pages} (${total} total)</small><nav><ul class="pagination pagination-sm mb-0">`;
  html += `<li class="page-item ${page === 1 ? 'disabled' : ''}"><a class="page-link" href="#" onclick="payPaginate(${page - 1})">‹</a></li>`;
  for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) {
    html += `<li class="page-item ${i === page ? 'active' : ''}"><a class="page-link" href="#" onclick="payPaginate(${i})">${i}</a></li>`;
  }
  html += `<li class="page-item ${page === pages ? 'disabled' : ''}"><a class="page-link" href="#" onclick="payPaginate(${page + 1})">›</a></li></ul></nav>`;
  container.innerHTML = html;
}

function payPaginate(p) { payCurrentPage = p; loadPayments(); return false; }

// ─── DEFAULTERS ───────────────────────────────────────────────────────────────
async function loadDefaulters() {
  const department = document.getElementById('defDeptFilter').value;
  const semester = document.getElementById('defSemFilter').value;

  const params = new URLSearchParams({ department, semester });
  const tbody = document.getElementById('defaultersBody');
  tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4"><div class="spinner-border spinner-border-sm"></div> Loading...</td></tr>';

  try {
    const res = await fetch('/admin/api/fee-defaulters?' + params);
    const { data } = await res.json();

    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted">No defaulters found</td></tr>';
      return;
    }

    tbody.innerHTML = data.map(d => `
      <tr>
        <td>${d.roll_number || '—'}</td>
        <td>${d.student_name || '—'}</td>
        <td>${d.department || '—'}</td>
        <td>₹${Number(d.total_due || 0).toLocaleString()}</td>
        <td>₹${Number(d.paid_amount || 0).toLocaleString()}</td>
        <td class="text-danger"><strong>₹${Number(d.pending_amount || 0).toLocaleString()}</strong></td>
        <td><span class="badge ${d.overdue_days > 30 ? 'bg-danger' : 'bg-warning text-dark'}">${d.overdue_days || 0} days</span></td>
        <td>${d.phone || '—'}</td>
      </tr>`).join('');
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-danger">Error loading defaulters</td></tr>';
  }
}

function exportDefaulters() {
  const dept = document.getElementById('defDeptFilter').value;
  const sem = document.getElementById('defSemFilter').value;
  window.location.href = '/admin/api/fee-defaulters/export?' + new URLSearchParams({ department: dept, semester: sem });
}

// ─── REPORTS ──────────────────────────────────────────────────────────────────
async function loadReports() {
  try {
    const res = await fetch('/admin/api/fee-reports/summary');
    const { data } = await res.json();

    document.getElementById('rptTotalCollected').textContent = `₹${Number(data.total_collected || 0).toLocaleString()}`;
    document.getElementById('rptTransactions').textContent = data.total_transactions || 0;
    document.getElementById('rptAvgPayment').textContent = `₹${Number(data.avg_payment || 0).toLocaleString()}`;

    const tbody = document.getElementById('rptMethodBody');
    if (data.by_method && data.by_method.length > 0) {
      const total = data.by_method.reduce((sum, m) => sum + Number(m.total_amount || 0), 0);
      tbody.innerHTML = data.by_method.map(m => `
        <tr>
          <td>${m.payment_method || '—'}</td>
          <td>${m.transaction_count || 0}</td>
          <td>₹${Number(m.total_amount || 0).toLocaleString()}</td>
          <td>${total > 0 ? ((Number(m.total_amount) / total) * 100).toFixed(1) : 0}%</td>
        </tr>`).join('');
    } else {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No data available</td></tr>';
    }
  } catch (e) {
    showToast('Error loading reports', 'error');
  }
}

// ─── FEE STRUCTURE MODAL ──────────────────────────────────────────────────────
function openFeeStructureModal() {
  document.getElementById('fsModalTitle').textContent = 'Add Fee Structure';
  document.getElementById('feeStructureForm').reset();
  document.getElementById('fsId').value = '';
  document.getElementById('fsFormError').classList.add('d-none');
  new bootstrap.Modal(document.getElementById('feeStructureModal')).show();
}

async function editFeeStructure(id) {
  try {
    const res = await fetch('/admin/api/fee-structures/' + id);
    const { data } = await res.json();

    document.getElementById('fsModalTitle').textContent = 'Edit Fee Structure';
    document.getElementById('fsId').value = id;
    document.getElementById('fsStudentId').value = data.student_id;
    document.getElementById('fsSemester').value = data.semester;
    document.getElementById('fsAcademicYear').value = data.academic_year;
    document.getElementById('fsTuitionFee').value = data.tuition_fee || 0;
    document.getElementById('fsHostelFee').value = data.hostel_fee || 0;
    document.getElementById('fsLibraryFee').value = data.library_fee || 0;
    document.getElementById('fsLabFee').value = data.lab_fee || 0;
    document.getElementById('fsSportsFee').value = data.sports_fee || 0;
    document.getElementById('fsOtherFee').value = data.other_fee || 0;
    document.getElementById('fsDueDate').value = data.due_date ? data.due_date.split('T')[0] : '';
    document.getElementById('fsFormError').classList.add('d-none');

    new bootstrap.Modal(document.getElementById('feeStructureModal')).show();
  } catch (e) {
    showToast('Error loading fee structure', 'error');
  }
}

async function saveFeeStructure() {
  const id = document.getElementById('fsId').value;
  const isEdit = !!id;
  const btn = document.getElementById('fsSaveBtn');
  const errDiv = document.getElementById('fsFormError');
  errDiv.classList.add('d-none');

  const payload = {
    student_id: document.getElementById('fsStudentId').value,
    semester: document.getElementById('fsSemester').value,
    academic_year: document.getElementById('fsAcademicYear').value,
    tuition_fee: parseFloat(document.getElementById('fsTuitionFee').value) || 0,
    hostel_fee: parseFloat(document.getElementById('fsHostelFee').value) || 0,
    library_fee: parseFloat(document.getElementById('fsLibraryFee').value) || 0,
    lab_fee: parseFloat(document.getElementById('fsLabFee').value) || 0,
    sports_fee: parseFloat(document.getElementById('fsSportsFee').value) || 0,
    other_fee: parseFloat(document.getElementById('fsOtherFee').value) || 0,
    due_date: document.getElementById('fsDueDate').value
  };

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Saving...';

  try {
    const url = isEdit ? '/admin/api/fee-structures/' + id : '/admin/api/fee-structures';
    const method = isEdit ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();

    if (!res.ok || !data.success) {
      const msg = data.errors ? data.errors.map(e => e.message).join(', ') : (data.message || 'Error saving fee structure');
      errDiv.textContent = msg;
      errDiv.classList.remove('d-none');
      return;
    }

    bootstrap.Modal.getInstance(document.getElementById('feeStructureModal')).hide();
    showToast(isEdit ? 'Fee structure updated' : 'Fee structure created', 'success');
    loadFeeStructures();
  } catch (e) {
    errDiv.textContent = 'Network error. Please try again.';
    errDiv.classList.remove('d-none');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Save';
  }
}

async function deleteFeeStructure(id) {
  if (!confirm('Delete this fee structure? This action cannot be undone.')) return;

  try {
    const res = await fetch('/admin/api/fee-structures/' + id, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { showToast('Fee structure deleted', 'success'); loadFeeStructures(); }
    else showToast(data.message || 'Error deleting fee structure', 'error');
  } catch (e) { showToast('Network error', 'error'); }
}

// ─── DEBOUNCE ─────────────────────────────────────────────────────────────────
function debounceSearch(tab) {
  if (tab === 'structures') {
    clearTimeout(fsSearchTimer);
    fsSearchTimer = setTimeout(() => { fsCurrentPage = 1; loadFeeStructures(); }, 400);
  } else if (tab === 'payments') {
    clearTimeout(paySearchTimer);
    paySearchTimer = setTimeout(() => { payCurrentPage = 1; loadPayments(); }, 400);
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
loadFeeStructures();
