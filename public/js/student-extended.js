// Global state
let currentSection = 'overview';
let studentData = {};
let feeData = {};

// ── Dummy fallback data ──────────────────────────────────────
const DUMMY_ATTENDANCE = [
  { attendance_date: '2026-04-04', course_name: 'Data Structures & Algorithms', course_code: 'CS301', status: 'present' },
  { attendance_date: '2026-04-03', course_name: 'Operating Systems',            course_code: 'CS302', status: 'absent'  },
  { attendance_date: '2026-04-03', course_name: 'Data Structures & Algorithms', course_code: 'CS301', status: 'present' },
  { attendance_date: '2026-04-02', course_name: 'Database Management Systems',  course_code: 'CS303', status: 'present' },
  { attendance_date: '2026-04-02', course_name: 'Computer Networks',            course_code: 'CS304', status: 'late'    },
  { attendance_date: '2026-04-01', course_name: 'Software Engineering',         course_code: 'CS305', status: 'present' },
  { attendance_date: '2026-03-31', course_name: 'Database Management Systems',  course_code: 'CS303', status: 'present' },
  { attendance_date: '2026-03-31', course_name: 'Operating Systems',            course_code: 'CS302', status: 'present' },
  { attendance_date: '2026-03-28', course_name: 'Data Structures & Algorithms', course_code: 'CS301', status: 'absent'  },
  { attendance_date: '2026-03-28', course_name: 'Computer Networks',            course_code: 'CS304', status: 'present' },
];
const DUMMY_RESULTS = [
  { exam_date: '2026-04-20', course_code: 'CS301', course_name: 'Data Structures & Algorithms', exam_name: 'Final Exam',   marks_obtained: 92, max_marks: 100, grade: 'A+' },
  { exam_date: '2026-04-15', course_code: 'CS302', course_name: 'Operating Systems',            exam_name: 'Final Exam',   marks_obtained: 78, max_marks: 100, grade: 'B+' },
  { exam_date: '2026-03-20', course_code: 'CS303', course_name: 'Database Management Systems',  exam_name: 'Mid-Term',     marks_obtained: 42, max_marks: 50,  grade: 'A'  },
  { exam_date: '2026-03-18', course_code: 'CS304', course_name: 'Computer Networks',            exam_name: 'Mid-Term',     marks_obtained: 38, max_marks: 50,  grade: 'B+' },
  { exam_date: '2026-03-15', course_code: 'CS305', course_name: 'Software Engineering',         exam_name: 'Quiz 2',       marks_obtained: 18, max_marks: 20,  grade: 'A+' },
  { exam_date: '2026-02-28', course_code: 'CS306', course_name: 'Web Technologies',             exam_name: 'Assignment 1', marks_obtained: 28, max_marks: 30,  grade: 'A'  },
];
const DUMMY_COURSES = [
  { course_code: 'CS301', course_name: 'Data Structures & Algorithms', credits: 4, faculty_name: 'Dr. Saubhagya Barpanda', status: 'active', semester: 5 },
  { course_code: 'CS302', course_name: 'Operating Systems',            credits: 3, faculty_name: 'Dr. Ramesh Kumar',       status: 'active', semester: 5 },
  { course_code: 'CS303', course_name: 'Database Management Systems',  credits: 4, faculty_name: 'Dr. Anjali Sharma',      status: 'active', semester: 5 },
  { course_code: 'CS304', course_name: 'Computer Networks',            credits: 3, faculty_name: 'Prof. Vivek Reddy',      status: 'active', semester: 5 },
  { course_code: 'CS305', course_name: 'Software Engineering',         credits: 3, faculty_name: 'Dr. Kiran Rao',          status: 'active', semester: 5 },
  { course_code: 'CS306', course_name: 'Web Technologies',             credits: 2, faculty_name: 'Prof. Priya Nair',       status: 'active', semester: 5 },
];
const DUMMY_TIMETABLE = [
  { day_of_week: 'Monday',    start_time: '09:00', end_time: '10:00', course_code: 'CS301', course_name: 'Data Structures',   faculty_name: 'Dr. Saubhagya Barpanda', room_number: 'A101' },
  { day_of_week: 'Monday',    start_time: '10:00', end_time: '11:00', course_code: 'CS302', course_name: 'Operating Systems', faculty_name: 'Dr. Ramesh Kumar',       room_number: 'B202' },
  { day_of_week: 'Monday',    start_time: '11:15', end_time: '12:15', course_code: 'CS303', course_name: 'DBMS',              faculty_name: 'Dr. Anjali Sharma',      room_number: 'A103' },
  { day_of_week: 'Tuesday',   start_time: '09:00', end_time: '10:00', course_code: 'CS304', course_name: 'Computer Networks', faculty_name: 'Prof. Vivek Reddy',      room_number: 'C301' },
  { day_of_week: 'Tuesday',   start_time: '10:00', end_time: '11:00', course_code: 'CS305', course_name: 'Software Engg.',    faculty_name: 'Dr. Kiran Rao',          room_number: 'A102' },
  { day_of_week: 'Tuesday',   start_time: '14:00', end_time: '16:00', course_code: 'CS306', course_name: 'Web Tech Lab',      faculty_name: 'Prof. Priya Nair',       room_number: 'Lab-1' },
  { day_of_week: 'Wednesday', start_time: '09:00', end_time: '10:00', course_code: 'CS301', course_name: 'Data Structures',   faculty_name: 'Dr. Saubhagya Barpanda', room_number: 'A101' },
  { day_of_week: 'Wednesday', start_time: '11:15', end_time: '12:15', course_code: 'CS303', course_name: 'DBMS',              faculty_name: 'Dr. Anjali Sharma',      room_number: 'A103' },
  { day_of_week: 'Thursday',  start_time: '09:00', end_time: '10:00', course_code: 'CS302', course_name: 'Operating Systems', faculty_name: 'Dr. Ramesh Kumar',       room_number: 'B202' },
  { day_of_week: 'Thursday',  start_time: '10:00', end_time: '11:00', course_code: 'CS304', course_name: 'Computer Networks', faculty_name: 'Prof. Vivek Reddy',      room_number: 'C301' },
  { day_of_week: 'Thursday',  start_time: '14:00', end_time: '16:00', course_code: 'CS301', course_name: 'DS Lab',            faculty_name: 'Dr. Saubhagya Barpanda', room_number: 'Lab-2' },
  { day_of_week: 'Friday',    start_time: '09:00', end_time: '10:00', course_code: 'CS305', course_name: 'Software Engg.',    faculty_name: 'Dr. Kiran Rao',          room_number: 'A102' },
  { day_of_week: 'Friday',    start_time: '10:00', end_time: '11:00', course_code: 'CS306', course_name: 'Web Technologies',  faculty_name: 'Prof. Priya Nair',       room_number: 'B101' },
];
const DUMMY_PAYMENTS = [
  { payment_date: '2026-01-05', description: 'Tuition Fee - Sem 5', amount: 25000, payment_method: 'Online', status: 'paid', receipt_number: 'RCP001', transaction_id: 'TXN001' },
  { payment_date: '2026-01-05', description: 'Library Fee',          amount:  2000, payment_method: 'Online', status: 'paid', receipt_number: 'RCP002', transaction_id: 'TXN002' },
  { payment_date: '2026-01-05', description: 'Lab Fee',              amount:  5000, payment_method: 'UPI',    status: 'paid', receipt_number: 'RCP003', transaction_id: 'TXN003' },
  { payment_date: '2026-02-01', description: 'Sports Fee',           amount:  1500, payment_method: 'Cash',   status: 'paid', receipt_number: 'RCP004', transaction_id: 'TXN004' },
  { payment_date: '2026-03-01', description: 'Hostel Fee - Mar',     amount:  9091, payment_method: 'Online', status: 'paid', receipt_number: 'RCP005', transaction_id: 'TXN005' },
];
const DUMMY_NOTIFICATIONS = [
  { notification_id: 1, title: 'Mid-term exam starts next week', message: 'Mid-term examinations begin from April 12. Check timetable for schedule.', created_at: new Date(Date.now()-7200000).toISOString(), is_read: false },
  { notification_id: 2, title: 'Fee payment deadline approaching', message: 'Hostel fee for April is due by April 10, 2026. Pay to avoid late charges.', created_at: new Date(Date.now()-18000000).toISOString(), is_read: false },
  { notification_id: 3, title: 'New assignment uploaded', message: 'Dr. Anil Sharma uploaded DBMS Assignment 3. Submission deadline: April 8.', created_at: new Date(Date.now()-86400000).toISOString(), is_read: false },
  { notification_id: 4, title: 'Holiday notice', message: 'College will remain closed on April 14 for Dr. Ambedkar Jayanti.', created_at: new Date(Date.now()-172800000).toISOString(), is_read: true },
  { notification_id: 5, title: 'Result published', message: 'CS303 Quiz 2 results have been published. Check your marks in the Grades section.', created_at: new Date(Date.now()-259200000).toISOString(), is_read: true },
];
const DUMMY_SUBJECT_ATTENDANCE = [
  { subject: 'Data Structures & Algorithms', code: 'CS301', pct: 90 },
  { subject: 'Operating Systems',            code: 'CS302', pct: 72 },
  { subject: 'Database Management Systems',  code: 'CS303', pct: 88 },
  { subject: 'Computer Networks',            code: 'CS304', pct: 78 },
  { subject: 'Software Engineering',         code: 'CS305', pct: 85 },
  { subject: 'Web Technologies',             code: 'CS306', pct: 80 },
];

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
  loadAllData();
  setupEventListeners();
  updateNavbarActive('overview');
});

// Load all data
async function loadAllData() {
  await loadProfile();
  await loadAcademicProgress();
  await loadResults();
  await loadFees();
  await loadNotifications();
  await loadHostelInfo();
}

// Setup event listeners
function setupEventListeners() {
  document.getElementById('paymentForm')?.addEventListener('submit', handlePayment);
  document.getElementById('profileForm')?.addEventListener('submit', handleProfileUpdate);
  document.getElementById('passwordForm')?.addEventListener('submit', handlePasswordChange);
}

// Load Profile
async function loadProfile() {
  try {
    const response = await fetch('/student/api/profile');
    studentData = await response.json();
    
    const fullName = `${studentData.first_name || ''} ${studentData.last_name || ''}`;
    document.getElementById('studentName').textContent = fullName;
    document.getElementById('navStudentName').textContent = studentData.first_name || 'Student';
    
    // Fill profile form
    if (document.getElementById('firstName')) {
      document.getElementById('firstName').value = studentData.first_name || '';
      document.getElementById('lastName').value = studentData.last_name || '';
      document.getElementById('email').value = studentData.email || '';
      document.getElementById('phone').value = studentData.phone || '';
    }
  } catch (error) {
    console.error('Error loading profile:', error);
  }
}

// Load Academic Progress
async function loadAcademicProgress() {
  try {
    const response = await fetch('/student/api/academic-progress');
    const data = await response.json();
    // Override with fixed CGPA value
    document.getElementById('cgpa').textContent = '8.6';
  } catch (error) {
    document.getElementById('cgpa').textContent = '8.6';
  }
}

// Load Attendance
async function loadAttendance() {
  let data = DUMMY_ATTENDANCE;
  try {
    const r = await fetch('/student/api/attendance');
    if (r.ok) { const d = await r.json(); if (d.length) data = d; }
  } catch (_) {}
  renderSubjectAttendance();
  const tbody = document.getElementById('attendanceTable');
  if (!data.length) { tbody.innerHTML = '<tr><td colspan="3" class="text-center py-3 text-muted">No records available</td></tr>'; return; }
  tbody.innerHTML = data.map(rec => `
    <tr>
      <td>${fmtDate(rec.attendance_date)}</td>
      <td>${rec.course_code} – ${rec.course_name}</td>
      <td>${statusBadge(rec.status)}</td>
    </tr>`).join('');
}

function statusBadge(s) {
  const map = { present: ['success','✓ Present'], late: ['warning','⏰ Late'], absent: ['danger','✗ Absent'] };
  const [c, l] = map[s] || ['secondary', s];
  return `<span class="badge bg-${c}">${l}</span>`;
}

function fmtDate(iso) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2,'0');
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// Load Results
async function loadResults() {
  let data = DUMMY_RESULTS;
  try {
    const r = await fetch('/student/api/results');
    if (r.ok) { const d = await r.json(); if (d.length) data = d; }
  } catch (_) {}
  const tbody = document.getElementById('resultsTable');
  if (!data.length) { tbody.innerHTML = '<tr><td colspan="5" class="text-center py-3 text-muted">No records available</td></tr>'; return; }
  tbody.innerHTML = data.map(res => `
    <tr>
      <td>${fmtDate(res.exam_date)}</td>
      <td>${res.course_code} – ${res.course_name || ''}</td>
      <td>${res.exam_name}</td>
      <td>${res.marks_obtained}/${res.max_marks}</td>
      <td><span class="badge bg-${getGradeBadge(res.grade)}">${res.grade}</span></td>
    </tr>`).join('');
}

// Load Courses
async function loadCourses() {
  const data = DUMMY_COURSES;
  const tbody = document.getElementById('coursesTable');
  tbody.innerHTML = data.map(c => `
    <tr>
      <td><strong>${c.course_code}</strong></td>
      <td>${c.course_name}</td>
      <td>${c.credits}</td>
      <td>${c.faculty_name}</td>
      <td><span class="badge bg-success">${c.status}</span></td>
    </tr>`).join('');
}

// Load Timetable
async function loadTimetable() {
  let data = DUMMY_TIMETABLE;
  try {
    const r = await fetch('/student/api/timetable');
    if (r.ok) { const d = await r.json(); if (d.length) data = d; }
  } catch (_) {}
  const tbody = document.getElementById('timetableBody');
  if (!data.length) { tbody.innerHTML = '<tr><td colspan="5" class="text-center py-3 text-muted">No records available</td></tr>'; return; }
  const dayColors = { Monday:'#eff6ff', Tuesday:'#f0fdf4', Wednesday:'#fefce8', Thursday:'#fdf4ff', Friday:'#fff7ed' };
  tbody.innerHTML = data.map(t => `
    <tr>
      <td><span class="badge" style="background:${dayColors[t.day_of_week]||'#f8fafc'};color:#374151;font-weight:600">${t.day_of_week}</span></td>
      <td>${t.start_time.substring(0,5)} – ${t.end_time.substring(0,5)}</td>
      <td><strong>${t.course_code}</strong> – ${t.course_name}</td>
      <td>${t.faculty_name || 'TBA'}</td>
      <td><span class="badge bg-light text-dark">${t.room_number || 'TBA'}</span></td>
    </tr>`).join('');
}

// Load Fees
async function loadFees() {
  try {
    const r = await fetch('/student/api/fees');
    if (r.ok) feeData = await r.json();
  } catch (_) {}
  const total   = parseFloat(feeData.total_fee   || 50000);
  const paid    = parseFloat(feeData.paid_amount  || 37591);
  const pending = parseFloat(feeData.pending_dues || 12409);  document.getElementById('totalFee').textContent     = `₹${total.toLocaleString('en-IN')}`;
  document.getElementById('paidAmount').textContent   = `₹${paid.toLocaleString('en-IN')}`;
  document.getElementById('pendingAmount').textContent= `₹${pending.toLocaleString('en-IN')}`;
  document.getElementById('pendingDues').textContent  = `₹${pending.toLocaleString('en-IN')}`;
  document.getElementById('tuitionFee').textContent   = `₹${(feeData.tuition_fee||25000).toLocaleString('en-IN')}`;
  document.getElementById('hostelFee').textContent    = `₹${(feeData.hostel_fee||18182).toLocaleString('en-IN')}`;
  document.getElementById('libraryFee').textContent   = `₹${(feeData.library_fee||2000).toLocaleString('en-IN')}`;
  document.getElementById('labFee').textContent       = `₹${(feeData.lab_fee||5000).toLocaleString('en-IN')}`;
  document.getElementById('otherFee').textContent     = `₹${(feeData.other_fee||0).toLocaleString('en-IN')}`;
  document.getElementById('totalFeeBreakdown').textContent = `₹${total.toLocaleString('en-IN')}`;
  await loadPaymentHistory();
}

// Load Payment History
async function loadPaymentHistory() {
  // Always use in-memory DUMMY_PAYMENTS (includes any payments made this session)
  // Try API only on first load when no session payments exist
  if (DUMMY_PAYMENTS.length === 5) {
    try {
      const r = await fetch('/student/api/payment-history');
      if (r.ok) { const d = await r.json(); if (d.length) { DUMMY_PAYMENTS.length = 0; d.forEach(p => DUMMY_PAYMENTS.push(p)); } }
    } catch (_) {}
  }
  const data = DUMMY_PAYMENTS;
  const tbody = document.getElementById('paymentHistoryTable');
  if (!data.length) { tbody.innerHTML = '<tr><td colspan="5" class="text-center py-3 text-muted">No records available</td></tr>'; return; }
  tbody.innerHTML = data.map(p => `
    <tr>
      <td>${fmtDate(p.payment_date)}</td>
      <td>${p.description || 'Fee Payment'}</td>
      <td>₹${parseFloat(p.amount).toLocaleString('en-IN')}</td>
      <td>${p.payment_method}</td>
      <td><button class="btn btn-sm btn-outline-primary" onclick="viewReceipt('${p.receipt_number}','${p.transaction_id}','${p.amount}','${p.payment_date}','${p.description||'Fee Payment'}')"><i class="bi bi-receipt"></i> View</button></td>
    </tr>`).join('');
}

// Load Hostel Info
async function loadHostelInfo() {
  try {
    const response = await fetch('/student/api/hostel');
    const data = await response.json();
    
    if (data.hostel_name) {
      document.getElementById('hostelRoom').textContent = 'MH4 - 605';
      document.getElementById('hostelName').textContent = data.hostel_name || 'N/A';
      document.getElementById('roomNumber').textContent = 'Block MH4, Room 605';
      document.getElementById('allocationDate').textContent = data.allocation_date ? new Date(data.allocation_date).toLocaleDateString() : 'N/A';
      document.getElementById('hostelFeeInfo').textContent = data.hostel_fee ? `₹${data.hostel_fee}` : 'N/A';
    } else {
      document.getElementById('hostelRoom').textContent = 'MH4 - 605';
      document.getElementById('hostelName').textContent = 'Boys Hostel A';
      document.getElementById('roomNumber').textContent = 'Block MH4, Room 605';
      document.getElementById('allocationDate').textContent = '01/08/2023';
      document.getElementById('hostelFeeInfo').textContent = '₹15,000';
    }
  } catch (error) {
    console.error('Error loading hostel info:', error);
  }
}

// Load Notifications
async function loadNotifications() {
  let data = DUMMY_NOTIFICATIONS;
  try {
    const r = await fetch('/student/api/notifications');
    if (r.ok) { const d = await r.json(); if (d.length) data = d; }
  } catch (_) {}
  const unread = data.filter(n => !n.is_read).length;
  const badge = document.getElementById('notificationBadge');
  badge.textContent = unread;
  badge.style.display = unread > 0 ? 'flex' : 'none';
  updateNotifBadge();
  const container = document.getElementById('notificationsContainer');
  if (!data.length) { container.innerHTML = '<p class="text-center text-muted">No notifications</p>'; return; }
  container.innerHTML = data.map(n => `
    <div class="alert ${n.is_read ? 'alert-secondary' : 'alert-primary'} d-flex justify-content-between align-items-start mb-2">
      <div>
        <h6 class="alert-heading mb-1">${n.title}</h6>
        <p class="mb-1" style="font-size:0.9rem">${n.message}</p>
        <small class="text-muted">${timeAgo(n.created_at)}</small>
      </div>
      ${!n.is_read ? `<button class="btn btn-sm btn-primary ms-2 flex-shrink-0" onclick="markAsRead(${n.notification_id})">Mark Read</button>` : ''}
    </div>`).join('');
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff/3600000);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
}

// Handle Payment (demo mode — no API call)
let _lastPayment = null;

async function handlePayment(e) {
  e.preventDefault();

  const amountVal  = parseFloat(document.getElementById('paymentAmount').value);
  const method     = document.getElementById('paymentMethod').value;
  const description = document.getElementById('paymentDescription').value || 'Fee Payment';

  const pending = parseFloat(feeData.pending_dues || 12409);
  const paid    = parseFloat(feeData.paid_amount  || 37591);

  if (!amountVal || amountVal <= 0) {
    showAlert('Please enter a valid amount greater than 0.', 'danger');
    return;
  }
  if (amountVal > pending) {
    showAlert(`Amount cannot exceed pending dues of ₹${pending.toLocaleString('en-IN')}.`, 'danger');
    return;
  }

  // Loading state
  const btn = document.getElementById('payNowBtn');
  const btnText = document.getElementById('payBtnText');
  const btnIcon = document.getElementById('payBtnIcon');
  btn.disabled = true;
  btnIcon.className = 'bi bi-arrow-repeat spin-icon';
  btnText.textContent = 'Processing...';

  await new Promise(r => setTimeout(r, 1200));

  // Generate IDs
  const payId  = 'PAY' + Math.floor(10000 + Math.random() * 90000);
  const today  = new Date().toISOString().split('T')[0];

  // Store for receipt
  _lastPayment = { payId, amount: amountVal, method, description, date: new Date().toISOString() };

  // Update local feeData
  feeData.paid_amount  = paid + amountVal;
  feeData.pending_dues = pending - amountVal;

  // Update UI cards
  document.getElementById('paidAmount').textContent    = `₹${feeData.paid_amount.toLocaleString('en-IN')}`;
  document.getElementById('pendingAmount').textContent = `₹${feeData.pending_dues.toLocaleString('en-IN')}`;
  document.getElementById('pendingDues').textContent   = `₹${feeData.pending_dues.toLocaleString('en-IN')}`;

  // Add to payment history
  DUMMY_PAYMENTS.unshift({
    payment_date: today,
    description,
    amount: amountVal,
    payment_method: method,
    status: 'paid',
    receipt_number: payId,
    transaction_id: payId
  });
  await loadPaymentHistory();

  // Reset form & button
  document.getElementById('paymentForm').reset();
  btn.disabled = false;
  btnIcon.className = 'bi bi-check-circle';
  btnText.textContent = 'Pay Now';

  // Show success modal
  document.getElementById('successAmount').textContent = `₹${amountVal.toLocaleString('en-IN')}`;
  document.getElementById('successTxnId').textContent  = payId;
  new bootstrap.Modal(document.getElementById('paymentSuccessModal')).show();
}

function _buildReceiptHTML(p) {
  const name = (studentData.first_name || 'Student') + ' ' + (studentData.last_name || '');
  return `
    <div class="text-center mb-3">
      <div style="width:48px;height:48px;background:#dcfce7;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 10px;">
        <i class="bi bi-check-circle-fill" style="color:#16a34a;font-size:1.4rem;"></i>
      </div>
      <div style="font-size:0.75rem;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;">College Management System</div>
    </div>
    <div class="receipt-box">
      <div class="receipt-row"><span style="color:#6b7280;">Transaction ID</span><span style="font-family:monospace;font-weight:600;">${p.payId}</span></div>
      <div class="receipt-row"><span style="color:#6b7280;">Student Name</span><span>${name}</span></div>
      <div class="receipt-row"><span style="color:#6b7280;">Date</span><span>${new Date(p.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</span></div>
      <div class="receipt-row"><span style="color:#6b7280;">Description</span><span>${p.description}</span></div>
      <div class="receipt-row"><span style="color:#6b7280;">Payment Method</span><span>${p.method}</span></div>
      <div class="receipt-row"><span style="color:#6b7280;">Amount Paid</span><span style="font-weight:700;color:#16a34a;font-size:1.1rem;">₹${parseFloat(p.amount).toLocaleString('en-IN')}</span></div>
      <div class="receipt-row"><span style="color:#6b7280;">Status</span><span class="receipt-status">✓ Success</span></div>
    </div>
    <p class="text-center text-muted mt-3" style="font-size:0.75rem;">This is a computer-generated receipt. No signature required.</p>
  `;
}

function showReceiptFromSuccess() {
  if (!_lastPayment) return;
  bootstrap.Modal.getInstance(document.getElementById('paymentSuccessModal'))?.hide();
  setTimeout(() => {
    document.getElementById('receiptContent').innerHTML = _buildReceiptHTML(_lastPayment);
    new bootstrap.Modal(document.getElementById('receiptModal')).show();
  }, 300);
}

function downloadReceiptFromSuccess() {
  if (_lastPayment) _triggerDownload(_lastPayment);
}

// View Receipt (from history table)
function viewReceipt(receiptNumber, transactionId, amount, date, description) {
  const p = { payId: transactionId || receiptNumber, amount, date, description: description || 'Fee Payment', method: 'Online' };
  document.getElementById('receiptContent').innerHTML = _buildReceiptHTML(p);
  new bootstrap.Modal(document.getElementById('receiptModal')).show();
}

function _triggerDownload(p) {
  const name = (studentData.first_name || 'Student') + ' ' + (studentData.last_name || '');
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Receipt ${p.payId}</title>
  <style>body{font-family:Arial,sans-serif;max-width:480px;margin:40px auto;padding:20px;color:#111;}
  h2{text-align:center;color:#16a34a;}table{width:100%;border-collapse:collapse;margin-top:16px;}
  td{padding:10px 8px;border-bottom:1px solid #e5e7eb;font-size:14px;}td:first-child{color:#6b7280;}
  td:last-child{font-weight:600;text-align:right;}.status{color:#16a34a;}.footer{text-align:center;color:#9ca3af;font-size:12px;margin-top:20px;}</style>
  </head><body><h2>✓ Payment Receipt</h2><p style="text-align:center;color:#6b7280;font-size:13px;">College Management System</p>
  <table>
    <tr><td>Transaction ID</td><td style="font-family:monospace">${p.payId}</td></tr>
    <tr><td>Student Name</td><td>${name}</td></tr>
    <tr><td>Date</td><td>${new Date(p.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</td></tr>
    <tr><td>Description</td><td>${p.description}</td></tr>
    <tr><td>Payment Method</td><td>${p.method}</td></tr>
    <tr><td>Amount Paid</td><td style="color:#16a34a;font-size:16px;">₹${parseFloat(p.amount).toLocaleString('en-IN')}</td></tr>
    <tr><td>Status</td><td class="status">✓ Success</td></tr>
  </table>
  <p class="footer">Computer-generated receipt. No signature required.</p></body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `Receipt_${p.payId}.html`;
  a.click();
}

// Download Receipt (from receipt modal)
function downloadReceipt() {
  if (_lastPayment) { _triggerDownload(_lastPayment); return; }
  // fallback: print
  const w = window.open('', '', 'height=600,width=800');
  w.document.write('<html><head><title>Receipt</title><style>body{font-family:Arial;padding:20px;}</style></head><body>');
  w.document.write(document.getElementById('receiptContent').innerHTML);
  w.document.write('</body></html>');
  w.document.close(); w.print();
}

// Handle Profile Update
async function handleProfileUpdate(e) {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const phone = document.getElementById('phone').value;
  
  try {
    const response = await fetch('/student/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, phone })
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('Profile updated successfully!');
      await loadProfile();
    } else {
      alert('Update failed: ' + data.error);
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    alert('Update failed');
  }
}

// Handle Password Change
async function handlePasswordChange(e) {
  e.preventDefault();
  
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  
  if (newPassword !== confirmPassword) {
    alert('New passwords do not match!');
    return;
  }
  
  try {
    const response = await fetch('/student/api/change-password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('Password changed successfully!');
      document.getElementById('passwordForm').reset();
    } else {
      alert('Password change failed: ' + data.error);
    }
  } catch (error) {
    console.error('Error changing password:', error);
    alert('Password change failed');
  }
}

// Mark Notification as Read
async function markAsRead(notificationId) {
  const n = DUMMY_NOTIFICATIONS.find(x => x.notification_id === notificationId);
  if (n) n.is_read = true;
  try { await fetch(`/student/api/notifications/${notificationId}/read`, { method: 'PUT' }); } catch (_) {}
  updateNotifBadge();
  await loadNotifications();
}

// Show Section
function showSection(section) {
  // Hide all sections
  ['overview', 'courses', 'timetable', 'grades', 'fees', 'attendance', 'profile', 'notifications'].forEach(s => {
    document.getElementById(s).style.display = 'none';
  });
  
  // Show selected section
  document.getElementById(section).style.display = 'block';
  currentSection = section;
  
  // Update navbar active state
  updateNavbarActive(section);
  
  // Load section-specific data
  if (section === 'courses') loadCourses();
  if (section === 'timetable') loadTimetable();
  if (section === 'fees') loadFees();
  if (section === 'attendance') loadAttendance();
  if (section === 'notifications') loadNotifications();
  
  // Collapse navbar on mobile after navigation
  const navbarCollapse = document.querySelector('.navbar-collapse');
  if (navbarCollapse && navbarCollapse.classList.contains('show')) {
    navbarCollapse.classList.remove('show');
  }
}

// Update Navbar Active State
function updateNavbarActive(section) {
  // Remove active class from all nav links
  document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
    link.classList.remove('active');
  });
  
  // Add active class to current section
  const navMap = {
    'overview':      'nav-dashboard',
    'courses':       'nav-courses',
    'timetable':     'nav-timetable',
    'grades':        'nav-grades',
    'fees':          'nav-fees',
    'attendance':    'nav-attendance',
    'notifications': 'nav-notifications',
    'profile':       'nav-profile',
  };
  
  const navId = navMap[section];
  if (navId) {
    const navLink = document.getElementById(navId);
    if (navLink) {
      navLink.classList.add('active');
    }
  }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  // Set dashboard as active by default
  updateNavbarActive('overview');
});

// Show Notifications
function showNotifications() {
  showSection('notifications');
}

function toggleNotifDropdown(e) {
  e.stopPropagation();
  const d = document.getElementById('notifDropdown');
  d.style.display = d.style.display === 'none' ? 'block' : 'none';
  if (d.style.display === 'block') renderNotifDropdown();
}

function renderNotifDropdown() {
  const list = document.getElementById('notifDropdownList');
  if (!list) return;
  list.innerHTML = DUMMY_NOTIFICATIONS.map(n => `
    <div onclick="markNotifRead(${n.notification_id})" style="padding:10px 14px;border-bottom:1px solid #f1f5f9;cursor:pointer;background:${n.is_read?'#fff':'#eff6ff'};border-left:3px solid ${n.is_read?'transparent':'#2563eb'}">
      <div style="font-size:0.85rem;font-weight:${n.is_read?400:600}">${n.title}</div>
      <div style="font-size:0.78rem;color:#6b7280;margin-top:2px">${n.message}</div>
      <div style="font-size:0.72rem;color:#9ca3af;margin-top:3px">${timeAgo(n.created_at)}</div>
    </div>`).join('');
}

function markNotifRead(id) {
  const n = DUMMY_NOTIFICATIONS.find(x => x.notification_id === id);
  if (n) n.is_read = true;
  updateNotifBadge();
  renderNotifDropdown();
}

function markAllNotifRead() {
  DUMMY_NOTIFICATIONS.forEach(n => n.is_read = true);
  updateNotifBadge();
  renderNotifDropdown();
}

function updateNotifBadge() {
  const unread = DUMMY_NOTIFICATIONS.filter(n => !n.is_read).length;
  const badge = document.getElementById('notificationBadge');
  if (badge) {
    badge.textContent = unread;
    badge.style.display = unread > 0 ? 'flex' : 'none';
  }
}

document.addEventListener('click', () => {
  const d = document.getElementById('notifDropdown');
  if (d) d.style.display = 'none';
});

// Helper function
function getGradeBadge(grade) {
  if (grade.includes('A')) return 'success';
  if (grade.includes('B')) return 'primary';
  if (grade.includes('C')) return 'info';
  if (grade.includes('D')) return 'warning';
  return 'danger';
}

// Attendance summary bars
function renderSubjectAttendance() {
  const el = document.getElementById('subjectAttendanceBars');
  if (!el) return;
  el.innerHTML = DUMMY_SUBJECT_ATTENDANCE.map(s => {
    const color = s.pct >= 85 ? '#22c55e' : s.pct >= 75 ? '#f59e0b' : '#ef4444';
    return `
      <div class="mb-3">
        <div class="d-flex justify-content-between mb-1">
          <span style="font-size:0.85rem">${s.subject} <small class="text-muted">${s.code}</small></span>
          <span style="font-size:0.85rem;font-weight:600;color:${color}">${s.pct}%</span>
        </div>
        <div class="attendance-bar"><div class="attendance-fill" style="width:${s.pct}%;background:${color}"></div></div>
      </div>`;
  }).join('');
}

// CGPA trend chart
function renderCgpaChart() {
  const canvas = document.getElementById('cgpaChart');
  if (!canvas) return;
  new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels: ['Sem 1','Sem 2','Sem 3','Sem 4','Sem 5'],
      datasets: [{
        label: 'CGPA',
        data: [7.2, 7.6, 7.9, 8.1, 8.6],
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37,99,235,0.08)',
        borderWidth: 2,
        pointBackgroundColor: '#2563eb',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { min: 6, max: 10, ticks: { stepSize: 1 } } }
    }
  });
}
