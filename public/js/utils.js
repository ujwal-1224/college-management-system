// ============================================
// UTILITY FUNCTIONS
// ============================================

// Toast Notifications
class ToastManager {
  constructor() {
    this.createContainer();
  }

  createContainer() {
    if (!document.getElementById('toast-container')) {
      const container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        max-width: 350px;
      `;
      document.body.appendChild(container);
    }
  }

  show(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    
    const icons = {
      success: '✓',
      error: '✗',
      warning: '⚠',
      info: 'ℹ'
    };

    const colors = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };

    toast.style.cssText = `
      background: white;
      border-left: 4px solid ${colors[type]};
      padding: 1rem 1.5rem;
      margin-bottom: 10px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      gap: 10px;
      animation: slideIn 0.3s ease;
    `;

    toast.innerHTML = `
      <span style="font-size: 1.5rem; color: ${colors[type]};">${icons[type]}</span>
      <span style="flex: 1; color: #1f2937;">${message}</span>
      <button onclick="this.parentElement.remove()" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #6b7280;">&times;</button>
    `;

    document.getElementById('toast-container').appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  success(message) {
    this.show(message, 'success');
  }

  error(message) {
    this.show(message, 'error');
  }

  warning(message) {
    this.show(message, 'warning');
  }

  info(message) {
    this.show(message, 'info');
  }
}

// Add toast animations to page
if (!document.getElementById('toast-styles')) {
  const style = document.createElement('style');
  style.id = 'toast-styles';
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

window.toast = new ToastManager();

// Loading Spinner
function showLoading(message = 'Loading...') {
  const existing = document.getElementById('loading-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'loading-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `;

  overlay.innerHTML = `
    <div style="background: white; padding: 2rem; border-radius: 12px; text-align: center;">
      <div class="spinner" style="border: 4px solid #f3f4f6; border-top: 4px solid #667eea; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
      <p style="color: #1f2937; margin: 0;">${message}</p>
    </div>
  `;

  document.body.appendChild(overlay);

  if (!document.getElementById('spinner-styles')) {
    const style = document.createElement('style');
    style.id = 'spinner-styles';
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
}

function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.remove();
}

// Confirmation Dialog
function confirm(message, onConfirm, onCancel) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `;

  overlay.innerHTML = `
    <div style="background: white; padding: 2rem; border-radius: 12px; max-width: 400px; width: 90%;">
      <h3 style="margin: 0 0 1rem 0; color: #1f2937;">Confirm Action</h3>
      <p style="color: #6b7280; margin: 0 0 1.5rem 0;">${message}</p>
      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button id="cancel-btn" class="btn-enterprise btn-enterprise-secondary">Cancel</button>
        <button id="confirm-btn" class="btn-enterprise btn-enterprise-danger">Confirm</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('confirm-btn').onclick = () => {
    overlay.remove();
    if (onConfirm) onConfirm();
  };

  document.getElementById('cancel-btn').onclick = () => {
    overlay.remove();
    if (onCancel) onCancel();
  };

  overlay.onclick = (e) => {
    if (e.target === overlay) {
      overlay.remove();
      if (onCancel) onCancel();
    }
  };
}

// Format Date
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Format Currency
function formatCurrency(amount) {
  return `₹${amount.toLocaleString('en-IN')}`;
}

// Calculate Attendance Percentage
function calculateAttendancePercentage(attendance) {
  if (attendance.length === 0) return 0;
  const present = attendance.filter(a => a.status === 'present').length;
  return ((present / attendance.length) * 100).toFixed(2);
}

// Grade to Points
function gradeToPoints(grade) {
  const points = { 'A+': 10, 'A': 9, 'B+': 8, 'B': 7, 'C': 6, 'D': 5, 'F': 0 };
  return points[grade] || 0;
}

// Calculate Grade from Marks
function calculateGrade(marks, maxMarks) {
  const percentage = (marks / maxMarks) * 100;
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
}

// Export to CSV
function exportToCSV(data, filename) {
  if (data.length === 0) {
    toast.warning('No data to export');
    return;
  }

  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const value = row[header];
      return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
    }).join(','))
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
  
  toast.success('CSV exported successfully!');
}

// Generate PDF (Simulation)
function generatePDF(title, content) {
  showLoading('Generating PDF...');
  
  setTimeout(() => {
    hideLoading();
    
    // Create a printable window
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #667eea; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #667eea; color: white; }
            .footer { margin-top: 30px; text-align: center; color: #666; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
          ${content}
          <div class="footer">
            <p>College Management System - Official Document</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    
    toast.success('PDF generated successfully!');
  }, 1000);
}

// Session Management
function getCurrentUser() {
  const user = sessionStorage.getItem('currentUser');
  return user ? JSON.parse(user) : null;
}

function setCurrentUser(user) {
  sessionStorage.setItem('currentUser', JSON.stringify(user));
}

function logout() {
  sessionStorage.removeItem('currentUser');
  window.location.href = '/login.html';
}

// Check Authentication
function checkAuth() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = '/login.html';
    return null;
  }
  return user;
}

// Debounce Function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Validate Email
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Validate Phone
function validatePhone(phone) {
  const re = /^[0-9]{10}$/;
  return re.test(phone);
}

// Generate Receipt Number
function generateReceiptNumber() {
  return 'RCP' + Date.now();
}

// Generate Transaction ID
function generateTransactionId() {
  return 'TXN' + Math.random().toString(36).substr(2, 9).toUpperCase();
}
