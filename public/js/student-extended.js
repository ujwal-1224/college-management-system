// Global state
let currentSection = 'overview';
let studentData = {};
let feeData = {};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
  loadAllData();
  setupEventListeners();
  
  // Set initial active state
  updateNavbarActive('overview');
});

// Load all data
async function loadAllData() {
  await loadProfile();
  await loadAcademicProgress();
  await loadAttendance();
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
    
    document.getElementById('cgpa').textContent = data.cgpa || '0.00';
  } catch (error) {
    console.error('Error loading academic progress:', error);
  }
}

// Load Attendance
async function loadAttendance() {
  try {
    const response = await fetch('/student/api/attendance');
    const data = await response.json();
    
    const tbody = document.getElementById('attendanceTable');
    
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" class="text-center">No attendance records found</td></tr>';
      return;
    }
    
    tbody.innerHTML = data.map(record => `
      <tr>
        <td>${new Date(record.attendance_date).toLocaleDateString()}</td>
        <td>${record.course_name} (${record.course_code})</td>
        <td><span class="badge-modern badge-${record.status === 'present' ? 'success' : (record.status === 'late' ? 'warning' : 'danger')}">${record.status === 'present' ? '✓ Present' : (record.status === 'late' ? '⏰ Late' : '✗ Absent')}</span></td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error loading attendance:', error);
  }
}

// Load Results
async function loadResults() {
  try {
    const response = await fetch('/student/api/results');
    const data = await response.json();
    
    const tbody = document.getElementById('resultsTable');
    
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">No results found</td></tr>';
      return;
    }
    
    tbody.innerHTML = data.map(result => `
      <tr>
        <td>${new Date(result.exam_date).toLocaleDateString()}</td>
        <td>${result.course_code}</td>
        <td>${result.exam_name}</td>
        <td>${result.marks_obtained}/${result.max_marks}</td>
        <td><span class="badge-modern badge-${getGradeBadge(result.grade)}">${result.grade}</span></td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error loading results:', error);
  }
}

// Load Courses
async function loadCourses() {
  try {
    const response = await fetch('/student/api/courses');
    const data = await response.json();
    
    const tbody = document.getElementById('coursesTable');
    
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">No courses found</td></tr>';
      return;
    }
    
    tbody.innerHTML = data.map(course => `
      <tr>
        <td>${course.course_code}</td>
        <td>${course.course_name}</td>
        <td>${course.credits}</td>
        <td>${course.faculty_name || 'TBA'}</td>
        <td><span class="badge-enterprise badge-enterprise-success">${course.status}</span></td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error loading courses:', error);
  }
}

// Load Timetable
async function loadTimetable() {
  try {
    const response = await fetch('/student/api/timetable');
    const data = await response.json();
    
    const container = document.getElementById('timetableContainer');
    
    if (data.length === 0) {
      container.innerHTML = '<p class="text-center">No timetable available</p>';
      return;
    }
    
    // Group by day
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const grouped = {};
    days.forEach(day => grouped[day] = []);
    
    data.forEach(slot => {
      grouped[slot.day_of_week].push(slot);
    });
    
    let html = '';
    days.forEach(day => {
      if (grouped[day].length > 0) {
        html += `<h5 class="mt-3">${day}</h5>`;
        grouped[day].forEach(slot => {
          html += `
            <div class="timetable-slot">
              <div class="row">
                <div class="col-md-3">
                  <strong>${slot.start_time.substring(0, 5)} - ${slot.end_time.substring(0, 5)}</strong>
                </div>
                <div class="col-md-4">
                  <strong>${slot.course_code}</strong> - ${slot.course_name}
                </div>
                <div class="col-md-3">
                  <i class="bi bi-person"></i> ${slot.faculty_name || 'TBA'}
                </div>
                <div class="col-md-2">
                  <i class="bi bi-geo-alt"></i> ${slot.room_number || 'TBA'}
                </div>
              </div>
            </div>
          `;
        });
      }
    });
    
    container.innerHTML = html;
  } catch (error) {
    console.error('Error loading timetable:', error);
  }
}

// Load Fees
async function loadFees() {
  try {
    const response = await fetch('/student/api/fees');
    feeData = await response.json();
    
    document.getElementById('totalFee').textContent = `₹${feeData.total_fee || 0}`;
    document.getElementById('paidAmount').textContent = `₹${feeData.paid_amount || 0}`;
    document.getElementById('pendingAmount').textContent = `₹${feeData.pending_dues || 0}`;
    document.getElementById('pendingDues').textContent = `₹${feeData.pending_dues || 0}`;
    
    // Fee breakdown
    document.getElementById('tuitionFee').textContent = `₹${feeData.tuition_fee || 0}`;
    document.getElementById('hostelFee').textContent = `₹${feeData.hostel_fee || 0}`;
    document.getElementById('libraryFee').textContent = `₹${feeData.library_fee || 0}`;
    document.getElementById('labFee').textContent = `₹${feeData.lab_fee || 0}`;
    document.getElementById('otherFee').textContent = `₹${feeData.other_fee || 0}`;
    document.getElementById('totalFeeBreakdown').textContent = `₹${feeData.total_fee || 0}`;
    
    await loadPaymentHistory();
  } catch (error) {
    console.error('Error loading fees:', error);
  }
}

// Load Payment History
async function loadPaymentHistory() {
  try {
    const response = await fetch('/student/api/payment-history');
    const data = await response.json();
    
    const tbody = document.getElementById('paymentHistoryTable');
    
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">No payment history</td></tr>';
      return;
    }
    
    tbody.innerHTML = data.map(payment => `
      <tr>
        <td>${new Date(payment.payment_date).toLocaleDateString()}</td>
        <td>${payment.description || 'Fee Payment'}</td>
        <td>₹${payment.amount}</td>
        <td>${payment.payment_method}</td>
        <td>
          <button class="btn-enterprise btn-enterprise-primary" style="font-size: 0.875rem; padding: 0.375rem 0.75rem;" onclick="viewReceipt('${payment.receipt_number}', '${payment.transaction_id}', '${payment.amount}', '${payment.payment_date}', '${payment.description}')">
            <i class="bi bi-receipt"></i> View
          </button>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error loading payment history:', error);
  }
}

// Load Hostel Info
async function loadHostelInfo() {
  try {
    const response = await fetch('/student/api/hostel');
    const data = await response.json();
    
    if (data.hostel_name) {
      document.getElementById('hostelRoom').textContent = data.room_number || 'N/A';
      document.getElementById('hostelName').textContent = data.hostel_name || 'N/A';
      document.getElementById('roomNumber').textContent = data.room_number || 'N/A';
      document.getElementById('allocationDate').textContent = data.allocation_date ? new Date(data.allocation_date).toLocaleDateString() : 'N/A';
      document.getElementById('hostelFeeInfo').textContent = data.hostel_fee ? `₹${data.hostel_fee}` : 'N/A';
    } else {
      document.getElementById('hostelRoom').textContent = 'Not Allocated';
      document.getElementById('hostelName').textContent = 'Not Allocated';
      document.getElementById('roomNumber').textContent = 'N/A';
      document.getElementById('allocationDate').textContent = 'N/A';
      document.getElementById('hostelFeeInfo').textContent = 'N/A';
    }
  } catch (error) {
    console.error('Error loading hostel info:', error);
  }
}

// Load Notifications
async function loadNotifications() {
  try {
    const response = await fetch('/student/api/notifications');
    const data = await response.json();
    
    const unreadCount = data.filter(n => !n.is_read).length;
    const badge = document.getElementById('notificationBadge');
    
    if (unreadCount > 0) {
      badge.textContent = unreadCount;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
    
    const container = document.getElementById('notificationsContainer');
    
    if (data.length === 0) {
      container.innerHTML = '<p class="text-center">No notifications</p>';
      return;
    }
    
    container.innerHTML = data.map(notif => `
      <div class="alert ${notif.is_read ? 'alert-secondary' : 'alert-primary'} d-flex justify-content-between align-items-start">
        <div>
          <h6 class="alert-heading">${notif.title}</h6>
          <p class="mb-1">${notif.message}</p>
          <small class="text-muted">${new Date(notif.created_at).toLocaleString()}</small>
        </div>
        ${!notif.is_read ? `<button class="btn btn-sm btn-primary" onclick="markAsRead(${notif.notification_id})">Mark Read</button>` : ''}
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading notifications:', error);
  }
}

// Handle Payment
async function handlePayment(e) {
  e.preventDefault();
  
  const amount = document.getElementById('paymentAmount').value;
  const method = document.getElementById('paymentMethod').value;
  const description = document.getElementById('paymentDescription').value;
  
  try {
    const response = await fetch('/student/api/make-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, paymentMethod: method, description })
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('Payment successful!');
      viewReceipt(data.receiptNumber, data.transactionId, amount, new Date().toISOString(), description);
      await loadFees();
      document.getElementById('paymentForm').reset();
    } else {
      alert('Payment failed: ' + data.error);
    }
  } catch (error) {
    console.error('Error making payment:', error);
    alert('Payment failed');
  }
}

// View Receipt
function viewReceipt(receiptNumber, transactionId, amount, date, description) {
  const content = `
    <div class="text-center mb-3">
      <h4>Payment Receipt</h4>
      <p class="text-muted">College Management System</p>
    </div>
    <hr>
    <p><strong>Receipt Number:</strong> ${receiptNumber}</p>
    <p><strong>Transaction ID:</strong> ${transactionId}</p>
    <p><strong>Date:</strong> ${new Date(date).toLocaleDateString()}</p>
    <p><strong>Description:</strong> ${description || 'Fee Payment'}</p>
    <p><strong>Amount Paid:</strong> ₹${amount}</p>
    <p><strong>Student Name:</strong> ${studentData.first_name} ${studentData.last_name}</p>
    <p><strong>Student ID:</strong> ${studentData.student_id}</p>
    <hr>
    <p class="text-center text-muted">This is a computer-generated receipt</p>
  `;
  
  document.getElementById('receiptContent').innerHTML = content;
  new bootstrap.Modal(document.getElementById('receiptModal')).show();
}

// Download Receipt
function downloadReceipt() {
  const content = document.getElementById('receiptContent').innerHTML;
  const printWindow = window.open('', '', 'height=600,width=800');
  printWindow.document.write('<html><head><title>Receipt</title>');
  printWindow.document.write('<style>body{font-family:Arial;padding:20px;}</style>');
  printWindow.document.write('</head><body>');
  printWindow.document.write(content);
  printWindow.document.write('</body></html>');
  printWindow.document.close();
  printWindow.print();
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
  try {
    await fetch(`/student/api/notifications/${notificationId}/read`, {
      method: 'PUT'
    });
    await loadNotifications();
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

// Show Section
function showSection(section) {
  // Hide all sections
  ['overview', 'courses', 'timetable', 'fees', 'profile', 'notifications'].forEach(s => {
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
    'overview': 'nav-dashboard',
    'courses': 'nav-courses',
    'fees': 'nav-fees',
    'notifications': 'nav-notifications',
    'profile': 'nav-dashboard',
    'timetable': 'nav-courses'
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

// Helper function
function getGradeBadge(grade) {
  if (grade.includes('A')) return 'success';
  if (grade.includes('B')) return 'primary';
  if (grade.includes('C')) return 'info';
  if (grade.includes('D')) return 'warning';
  return 'danger';
}
