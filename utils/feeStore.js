// Shared in-memory fee store — single source of truth for student/parent sync
const store = {
  totalFee:    50000,
  paidAmount:  37591,
  pendingDues: 12409,
  tuitionFee:  25000,
  hostelFee:   18182,
  libraryFee:   2000,
  labFee:       5000,
  otherFee:        0,
  payments: [
    { payment_date: '2026-01-05', description: 'Tuition Fee - Sem 5', amount: 25000, payment_method: 'Online', status: 'paid', receipt_number: 'RCP001', transaction_id: 'TXN001' },
    { payment_date: '2026-01-05', description: 'Library Fee',          amount:  2000, payment_method: 'Online', status: 'paid', receipt_number: 'RCP002', transaction_id: 'TXN002' },
    { payment_date: '2026-01-05', description: 'Lab Fee',              amount:  5000, payment_method: 'UPI',    status: 'paid', receipt_number: 'RCP003', transaction_id: 'TXN003' },
    { payment_date: '2026-02-01', description: 'Sports Fee',           amount:  1500, payment_method: 'Cash',   status: 'paid', receipt_number: 'RCP004', transaction_id: 'TXN004' },
    { payment_date: '2026-03-01', description: 'Hostel Fee - Mar',     amount:  4091, payment_method: 'Online', status: 'paid', receipt_number: 'RCP005', transaction_id: 'TXN005' },
  ]
};

function getFees() {
  return { ...store, payments: [...store.payments] };
}

function addPayment(amount, method, description) {
  const numAmount = parseFloat(amount);
  store.paidAmount  += numAmount;
  store.pendingDues  = Math.max(0, store.totalFee - store.paidAmount);
  const receipt = 'RCP' + Date.now();
  const txn     = 'TXN' + Math.random().toString(36).substr(2,9).toUpperCase();
  store.payments.unshift({
    payment_date:   new Date().toISOString().split('T')[0],
    description:    description || 'Fee Payment',
    amount:         numAmount,
    payment_method: method || 'Online',
    status:         'paid',
    receipt_number: receipt,
    transaction_id: txn,
  });
  return { receipt_number: receipt, transaction_id: txn };
}

module.exports = { getFees, addPayment };
