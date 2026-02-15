// Load profile on page load
async function loadProfile() {
  try {
    const response = await fetch('/parent/api/profile');
    const data = await response.json();
    
    document.getElementById('parentName').textContent = 
      `${data.first_name || 'N/A'} ${data.last_name || ''}`;
    document.getElementById('fullName').textContent = 
      `${data.first_name || 'N/A'} ${data.last_name || ''}`;
    document.getElementById('email').textContent = data.email || 'N/A';
    document.getElementById('phone').textContent = data.phone || 'N/A';
    document.getElementById('occupation').textContent = data.occupation || 'N/A';
  } catch (error) {
    console.error('Error loading profile:', error);
  }
}

async function loadChildren() {
  try {
    const response = await fetch('/parent/api/children');
    const data = await response.json();
    
    const tbody = document.getElementById('childrenTable');
    document.getElementById('totalChildren').textContent = data.length;
    
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center">No children found</td></tr>';
      return;
    }
    
    tbody.innerHTML = data.map(child => `
      <tr>
        <td>${child.student_id}</td>
        <td>${child.first_name} ${child.last_name}</td>
        <td>${child.email}</td>
        <td>${child.department || 'N/A'}</td>
        <td>${child.semester || 'N/A'}</td>
        <td>${child.relationship}</td>
        <td>
          <button class="btn-enterprise btn-enterprise-primary" style="font-size: 0.875rem; padding: 0.375rem 0.75rem;" onclick="viewChildDetails(${child.student_id}, '${child.first_name} ${child.last_name}')">
            <i class="bi bi-eye"></i> View All
          </button>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error loading children:', error);
  }
}

async function viewChildDetails(studentId, studentName) {
  // Load all child information
  await viewAttendance(studentId, studentName);
  await viewResults(studentId, studentName);
  await viewFees(studentId, studentName);
  await viewPaymentHistory(studentId, studentName);
  
  // Show all cards
  document.getElementById('attendanceCard').style.display = 'block';
  document.getElementById('resultsCard').style.display = 'block';
  document.getElementById('feesCard').style.display = 'block';
  document.getElementById('paymentHistoryCard').style.display = 'block';
  
  // Scroll to attendance card
  document.getElementById('attendanceCard').scrollIntoView({ behavior: 'smooth' });
}

async function viewAttendance(studentId, name) {
  try {
    const response = await fetch(`/parent/api/child-attendance/${studentId}`);
    const data = await response.json();
    
    document.getElementById('selectedChildName').textContent = name;
    
    const tbody = document.getElementById('attendanceTable');
    
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" class="text-center">No attendance records found</td></tr>';
      return;
    }
    
    tbody.innerHTML = data.map(record => `
      <tr>
        <td>${new Date(record.attendance_date).toLocaleDateString()}</td>
        <td>${record.course_name} (${record.course_code})</td>
        <td><span class="badge-modern badge-${record.status === 'present' ? 'success' : 'danger'}">${record.status === 'present' ? '✓ Present' : '✗ Absent'}</span></td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error loading attendance:', error);
  }
}

async function viewResults(studentId, name) {
  try {
    const response = await fetch(`/parent/api/child-results/${studentId}`);
    const data = await response.json();
    
    document.getElementById('selectedChildNameResults').textContent = name;
    
    const tbody = document.getElementById('resultsTable');
    
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">No exam results found</td></tr>';
      return;
    }
    
    tbody.innerHTML = data.map(result => `
      <tr>
        <td>${result.exam_name}</td>
        <td>${result.course_name}</td>
        <td>${result.marks_obtained}</td>
        <td>${result.max_marks}</td>
        <td><span class="badge-modern badge-${getGradeBadge(result.grade)}">${result.grade || 'N/A'}</span></td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error loading results:', error);
  }
}

async function viewFees(studentId, name) {
  try {
    const response = await fetch(`/parent/api/child-fees/${studentId}`);
    const fees = await response.json();
    
    document.getElementById('selectedChildNameFees').textContent = name;
    
    if (!fees || !fees.totalFee) {
      document.getElementById('childTotalFee').textContent = '₹0';
      document.getElementById('childPaidAmount').textContent = '₹0';
      document.getElementById('childPendingDues').textContent = '₹0';
      document.getElementById('childTuitionFee').textContent = '₹0';
      document.getElementById('childHostelFee').textContent = '₹0';
      document.getElementById('childLibraryFee').textContent = '₹0';
      document.getElementById('childLabFee').textContent = '₹0';
      document.getElementById('childOtherFee').textContent = '₹0';
      document.getElementById('childTotalFeeBreakdown').textContent = '₹0';
      return;
    }
    
    document.getElementById('childTotalFee').textContent = `₹${fees.totalFee.toLocaleString()}`;
    document.getElementById('childPaidAmount').textContent = `₹${fees.paidAmount.toLocaleString()}`;
    document.getElementById('childPendingDues').textContent = `₹${fees.pendingDues.toLocaleString()}`;
    
    // Fee breakdown
    document.getElementById('childTuitionFee').textContent = `₹${fees.tuitionFee.toLocaleString()}`;
    document.getElementById('childHostelFee').textContent = `₹${fees.hostelFee.toLocaleString()}`;
    document.getElementById('childLibraryFee').textContent = `₹${fees.libraryFee.toLocaleString()}`;
    document.getElementById('childLabFee').textContent = `₹${fees.labFee.toLocaleString()}`;
    document.getElementById('childOtherFee').textContent = `₹${fees.otherFee.toLocaleString()}`;
    document.getElementById('childTotalFeeBreakdown').textContent = `₹${fees.totalFee.toLocaleString()}`;
  } catch (error) {
    console.error('Error loading fees:', error);
  }
}

async function viewPaymentHistory(studentId, name) {
  try {
    const response = await fetch(`/parent/api/child-payment-history/${studentId}`);
    const payments = await response.json();
    
    document.getElementById('selectedChildNamePayments').textContent = name;
    
    const tbody = document.getElementById('paymentHistoryTable');
    
    if (payments.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">No payment history found</td></tr>';
      return;
    }
    
    tbody.innerHTML = payments.map(payment => `
      <tr>
        <td>${new Date(payment.payment_date).toLocaleDateString()}</td>
        <td>${payment.description || 'Fee Payment'}</td>
        <td>₹${payment.amount.toLocaleString()}</td>
        <td>${payment.payment_method}</td>
        <td>
          <button class="btn-enterprise btn-enterprise-primary" style="font-size: 0.875rem; padding: 0.375rem 0.75rem;" onclick="viewReceipt('${payment.receipt_number}', '${payment.transaction_id}', ${payment.amount}, '${payment.payment_date}', '${payment.description || 'Fee Payment'}', '${name}')">
            <i class="bi bi-receipt"></i> View
          </button>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error loading payment history:', error);
  }
}

async function loadNotifications() {
  try {
    const response = await fetch('/parent/api/notifications');
    const notifications = await response.json();
    
    const unreadCount = notifications.filter(n => !n.is_read).length;
    const badge = document.getElementById('notificationCount');
    
    if (unreadCount > 0) {
      badge.textContent = unreadCount;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
    
    const container = document.getElementById('notificationsContainer');
    
    if (notifications.length === 0) {
      container.innerHTML = '<p class="text-center text-muted">No notifications</p>';
      return;
    }
    
    container.innerHTML = notifications.map(notif => `
      <div class="alert ${notif.is_read ? 'alert-secondary' : 'alert-primary'} d-flex justify-content-between align-items-start mb-2">
        <div style="flex: 1;">
          <h6 class="alert-heading mb-1">${notif.title}</h6>
          <p class="mb-1" style="font-size: 0.9rem;">${notif.message}</p>
          <small class="text-muted">${new Date(notif.created_at).toLocaleString()}</small>
        </div>
        ${!notif.is_read ? `<button class="btn btn-sm btn-primary ms-2" onclick="markNotificationAsRead(${notif.notification_id})">Mark Read</button>` : ''}
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading notifications:', error);
    document.getElementById('notificationsContainer').innerHTML = '<p class="text-center text-muted">Error loading notifications</p>';
  }
}

async function markNotificationAsRead(notificationId) {
  try {
    await fetch(`/parent/api/notifications/${notificationId}/read`, {
      method: 'PUT'
    });
    loadNotifications();
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

function viewReceipt(receiptNumber, transactionId, amount, date, description, studentName) {
  const content = `
    <div class="text-center mb-3">
      <h4>Payment Receipt</h4>
      <p class="text-muted">College Management System</p>
    </div>
    <hr>
    <p><strong>Receipt Number:</strong> ${receiptNumber}</p>
    <p><strong>Transaction ID:</strong> ${transactionId}</p>
    <p><strong>Date:</strong> ${new Date(date).toLocaleDateString()}</p>
    <p><strong>Student Name:</strong> ${studentName}</p>
    <p><strong>Description:</strong> ${description}</p>
    <p><strong>Amount Paid:</strong> ₹${amount.toLocaleString()}</p>
    <hr>
    <p class="text-center text-muted">This is a computer-generated receipt</p>
  `;
  
  // Create modal
  const modal = document.createElement('div');
  modal.className = 'modal fade';
  modal.innerHTML = `
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Payment Receipt</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <div style="border: 2px dashed #667eea; padding: 2rem; border-radius: 12px; background: #f9fafb;">
            ${content}
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-enterprise btn-enterprise-primary" onclick="printReceipt()">
            <i class="bi bi-printer"></i> Print
          </button>
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  const bsModal = new bootstrap.Modal(modal);
  bsModal.show();
  
  modal.addEventListener('hidden.bs.modal', () => {
    modal.remove();
  });
}

function printReceipt() {
  window.print();
}

function getGradeBadge(grade) {
  if (!grade) return 'secondary';
  if (grade.includes('A')) return 'success';
  if (grade.includes('B')) return 'primary';
  if (grade.includes('C')) return 'info';
  if (grade.includes('D')) return 'warning';
  return 'danger';
}

// Initialize on page load
loadProfile();
loadChildren();
loadNotifications();
