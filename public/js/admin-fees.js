// ─── LOCAL DATA ───────────────────────────────────────────────────────────────
let feeStructures = [
  { fee_structure_id:1, student_id:1, student_name:'Ujwal Kumar',    roll_number:'CS2022001', semester:5, academic_year:'2025-26', tuition_fee:25000, hostel_fee:18182, library_fee:2000, lab_fee:5000, sports_fee:1000, other_fee:0, due_date:'2026-01-31' },
  { fee_structure_id:2, student_id:2, student_name:'Srikar Reddy',   roll_number:'CS2023001', semester:3, academic_year:'2025-26', tuition_fee:25000, hostel_fee:18182, library_fee:2000, lab_fee:5000, sports_fee:1000, other_fee:0, due_date:'2026-01-31' },
  { fee_structure_id:3, student_id:3, student_name:'Sameer Khan',    roll_number:'CS2022002', semester:5, academic_year:'2025-26', tuition_fee:25000, hostel_fee:18182, library_fee:2000, lab_fee:5000, sports_fee:1000, other_fee:0, due_date:'2026-01-31' },
  { fee_structure_id:4, student_id:4, student_name:'Priya Sharma',   roll_number:'CS2023002', semester:3, academic_year:'2025-26', tuition_fee:25000, hostel_fee:18182, library_fee:2000, lab_fee:5000, sports_fee:1000, other_fee:0, due_date:'2026-01-31' },
  { fee_structure_id:5, student_id:5, student_name:'Rahul Verma',    roll_number:'CS2024001', semester:1, academic_year:'2025-26', tuition_fee:25000, hostel_fee:18182, library_fee:2000, lab_fee:5000, sports_fee:1000, other_fee:0, due_date:'2026-01-31' },
];
let payments = [
  { payment_id:1, student_name:'Ujwal Kumar',  roll_number:'CS2022001', amount:25000, payment_method:'Online',      receipt_number:'RCP001', status:'completed', payment_date:'2026-01-05' },
  { payment_id:2, student_name:'Ujwal Kumar',  roll_number:'CS2022001', amount:2000,  payment_method:'Online',      receipt_number:'RCP002', status:'completed', payment_date:'2026-01-05' },
  { payment_id:3, student_name:'Srikar Reddy', roll_number:'CS2023001', amount:25000, payment_method:'UPI',         receipt_number:'RCP003', status:'completed', payment_date:'2026-01-10' },
  { payment_id:4, student_name:'Sameer Khan',  roll_number:'CS2022002', amount:5000,  payment_method:'Net Banking', receipt_number:'RCP004', status:'completed', payment_date:'2026-01-12' },
  { payment_id:5, student_name:'Priya Sharma', roll_number:'CS2023002', amount:25000, payment_method:'Online',      receipt_number:'RCP005', status:'pending',   payment_date:'2026-01-15' },
];
let nextFsId = 6, nextPayId = 6;
let activeTab = 'structures';
let fsCurrentPage = 1, payCurrentPage = 1;
let fsSearchTimer = null, paySearchTimer = null;

// ─── TAB ──────────────────────────────────────────────────────────────────────
function switchTab(tab) {
  activeTab = tab;
  ['structures','payments','defaulters','reports'].forEach(t=>{
    document.getElementById('tab-'+t).classList.toggle('d-none',t!==tab);
  });
  document.querySelectorAll('#feeTabs .nav-link').forEach((link,i)=>{
    link.classList.toggle('active',['structures','payments','defaulters','reports'][i]===tab);
  });
  if(tab==='structures') loadFeeStructures();
  else if(tab==='payments') loadPayments();
  else if(tab==='defaulters') loadDefaulters();
  else if(tab==='reports') loadReports();
  return false;
}

// ─── FEE STRUCTURES ───────────────────────────────────────────────────────────
function loadFeeStructures() {
  const q   = (document.getElementById('fsSearch').value||'').toLowerCase();
  const sem = document.getElementById('fsSemFilter').value;
  let data  = feeStructures.filter(f=>{
    if(q && !f.student_name.toLowerCase().includes(q) && !f.roll_number.toLowerCase().includes(q)) return false;
    if(sem && String(f.semester)!==sem) return false;
    return true;
  });
  const tbody=document.getElementById('feeStructuresBody');
  if(!data.length){tbody.innerHTML='<tr><td colspan="7" class="text-center py-4 text-muted">No fee structures found</td></tr>';document.getElementById('fsPaginationContainer').innerHTML='';return;}
  tbody.innerHTML=data.map(f=>`
    <tr>
      <td>${f.student_name||'—'}</td>
      <td>${f.roll_number||'—'}</td>
      <td>Sem ${f.semester}</td>
      <td>${f.academic_year}</td>
      <td><strong>₹${(f.tuition_fee+f.hostel_fee+f.library_fee+f.lab_fee+f.sports_fee+f.other_fee).toLocaleString()}</strong></td>
      <td>${f.due_date?new Date(f.due_date).toLocaleDateString():'—'}</td>
      <td>
        <button class="btn btn-sm btn-outline-warning me-1" onclick="editFeeStructure(${f.fee_structure_id})"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteFeeStructure(${f.fee_structure_id})"><i class="bi bi-trash"></i></button>
      </td>
    </tr>`).join('');
  document.getElementById('fsPaginationContainer').innerHTML='';
}

function openFeeStructureModal() {
  document.getElementById('fsModalTitle').textContent='Add Fee Structure';
  document.getElementById('feeStructureForm').reset();
  document.getElementById('fsId').value='';
  document.getElementById('fsFormError').classList.add('d-none');
  new bootstrap.Modal(document.getElementById('feeStructureModal')).show();
}

function editFeeStructure(id) {
  const f=feeStructures.find(x=>x.fee_structure_id===id); if(!f) return;
  document.getElementById('fsModalTitle').textContent='Edit Fee Structure';
  document.getElementById('fsId').value=id;
  document.getElementById('fsStudentId').value=f.student_id;
  document.getElementById('fsSemester').value=f.semester;
  document.getElementById('fsAcademicYear').value=f.academic_year;
  document.getElementById('fsTuitionFee').value=f.tuition_fee||0;
  document.getElementById('fsHostelFee').value=f.hostel_fee||0;
  document.getElementById('fsLibraryFee').value=f.library_fee||0;
  document.getElementById('fsLabFee').value=f.lab_fee||0;
  document.getElementById('fsSportsFee').value=f.sports_fee||0;
  document.getElementById('fsOtherFee').value=f.other_fee||0;
  document.getElementById('fsDueDate').value=f.due_date||'';
  document.getElementById('fsFormError').classList.add('d-none');
  new bootstrap.Modal(document.getElementById('feeStructureModal')).show();
}

function saveFeeStructure() {
  const id=document.getElementById('fsId').value;
  const sem=parseInt(document.getElementById('fsSemester').value)||0;
  const year=document.getElementById('fsAcademicYear').value.trim();
  const errDiv=document.getElementById('fsFormError');
  if(!sem||!year){errDiv.textContent='Please fill required fields.';errDiv.classList.remove('d-none');return;}
  errDiv.classList.add('d-none');
  const vals={semester:sem,academic_year:year,tuition_fee:parseFloat(document.getElementById('fsTuitionFee').value)||0,hostel_fee:parseFloat(document.getElementById('fsHostelFee').value)||0,library_fee:parseFloat(document.getElementById('fsLibraryFee').value)||0,lab_fee:parseFloat(document.getElementById('fsLabFee').value)||0,sports_fee:parseFloat(document.getElementById('fsSportsFee').value)||0,other_fee:parseFloat(document.getElementById('fsOtherFee').value)||0,due_date:document.getElementById('fsDueDate').value};
  if(id){const f=feeStructures.find(x=>x.fee_structure_id===parseInt(id));if(f) Object.assign(f,vals);showToast('Fee structure updated','success');}
  else{feeStructures.unshift({fee_structure_id:nextFsId++,student_id:parseInt(document.getElementById('fsStudentId').value)||0,student_name:'New Student',roll_number:'—',...vals});showToast('Fee structure added','success');}
  bootstrap.Modal.getInstance(document.getElementById('feeStructureModal')).hide();
  loadFeeStructures();
}

function deleteFeeStructure(id) {
  showConfirm('Delete this fee structure?',()=>{feeStructures=feeStructures.filter(x=>x.fee_structure_id!==id);loadFeeStructures();showToast('Deleted','success');});
}

function debounceSearch(tab){
  if(tab==='structures'){clearTimeout(fsSearchTimer);fsSearchTimer=setTimeout(()=>loadFeeStructures(),300);}
  else if(tab==='payments'){clearTimeout(paySearchTimer);paySearchTimer=setTimeout(()=>loadPayments(),300);}
}

// ─── PAYMENTS ─────────────────────────────────────────────────────────────────
function loadPayments() {
  const q      = (document.getElementById('paySearch').value||'').toLowerCase();
  const status = document.getElementById('payStatusFilter').value;
  const sem    = document.getElementById('paySemFilter').value;
  let data = payments.filter(p=>{
    if(q && !p.student_name.toLowerCase().includes(q) && !p.roll_number.toLowerCase().includes(q)) return false;
    if(status && p.status!==status) return false;
    return true;
  });
  const statusBadge={completed:'bg-success',pending:'bg-warning text-dark',failed:'bg-danger'};
  const tbody=document.getElementById('paymentsBody');
  if(!data.length){tbody.innerHTML='<tr><td colspan="6" class="text-center py-4 text-muted">No payments found</td></tr>';document.getElementById('payPaginationContainer').innerHTML='';return;}
  tbody.innerHTML=data.map(p=>`
    <tr>
      <td>${p.payment_date?new Date(p.payment_date).toLocaleDateString():'—'}</td>
      <td>${p.student_name||'—'}<br><small class="text-muted">${p.roll_number||''}</small></td>
      <td><strong>₹${Number(p.amount||0).toLocaleString()}</strong></td>
      <td>${p.payment_method||'—'}</td>
      <td>${p.receipt_number||'—'}</td>
      <td><span class="badge ${statusBadge[p.status]||'bg-secondary'}">${p.status||'—'}</span></td>
    </tr>`).join('');
  document.getElementById('payPaginationContainer').innerHTML='';
}

// ─── DEFAULTERS ───────────────────────────────────────────────────────────────
function loadDefaulters() {
  const defaulters=[
    {roll_number:'CS2023002',student_name:'Priya Sharma',  department:'Computer Science',total_due:50000,paid_amount:0,    pending_amount:50000,overdue_days:45,phone:'9876543213'},
    {roll_number:'CS2024001',student_name:'Rahul Verma',   department:'Mechanical',      total_due:50000,paid_amount:10000,pending_amount:40000,overdue_days:30,phone:'9876543214'},
    {roll_number:'CS2022003',student_name:'Sneha Patil',   department:'Civil',           total_due:50000,paid_amount:25000,pending_amount:25000,overdue_days:60,phone:'9876543215'},
  ];
  const dept=document.getElementById('defDeptFilter').value;
  const sem=document.getElementById('defSemFilter').value;
  const data=defaulters.filter(d=>!dept||d.department===dept);
  const tbody=document.getElementById('defaultersBody');
  if(!data.length){tbody.innerHTML='<tr><td colspan="8" class="text-center py-4 text-muted">No defaulters found</td></tr>';return;}
  tbody.innerHTML=data.map(d=>`
    <tr>
      <td>${d.roll_number}</td>
      <td>${d.student_name}</td>
      <td>${d.department}</td>
      <td>₹${d.total_due.toLocaleString()}</td>
      <td>₹${d.paid_amount.toLocaleString()}</td>
      <td class="text-danger"><strong>₹${d.pending_amount.toLocaleString()}</strong></td>
      <td><span class="badge ${d.overdue_days>30?'bg-danger':'bg-warning text-dark'}">${d.overdue_days} days</span></td>
      <td>${d.phone}</td>
    </tr>`).join('');
}

function exportDefaulters(){showToast('Export feature coming soon','success');}

// ─── REPORTS ──────────────────────────────────────────────────────────────────
function loadReports() {
  const total=payments.filter(p=>p.status==='completed').reduce((s,p)=>s+p.amount,0);
  document.getElementById('rptTotalCollected').textContent=`₹${total.toLocaleString()}`;
  document.getElementById('rptTransactions').textContent=payments.filter(p=>p.status==='completed').length;
  document.getElementById('rptAvgPayment').textContent=`₹${payments.length?Math.round(total/payments.length).toLocaleString():0}`;
  const byMethod={};
  payments.forEach(p=>{if(!byMethod[p.payment_method])byMethod[p.payment_method]={count:0,total:0};byMethod[p.payment_method].count++;byMethod[p.payment_method].total+=p.amount;});
  const tbody=document.getElementById('rptMethodBody');
  const methods=Object.entries(byMethod);
  if(!methods.length){tbody.innerHTML='<tr><td colspan="4" class="text-center text-muted">No data</td></tr>';return;}
  tbody.innerHTML=methods.map(([m,v])=>`<tr><td>${m}</td><td>${v.count}</td><td>₹${v.total.toLocaleString()}</td><td>${total>0?((v.total/total)*100).toFixed(1):0}%</td></tr>`).join('');
}

function showConfirm(msg,onYes){
  const el=document.createElement('div');
  el.innerHTML=`<div style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9998;display:flex;align-items:center;justify-content:center;"><div style="background:#fff;border-radius:12px;padding:28px 32px;max-width:420px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.2);"><div style="font-size:2rem;text-align:center;margin-bottom:12px;">⚠️</div><p style="text-align:center;color:#374151;margin-bottom:20px;">${msg}</p><div style="display:flex;gap:10px;justify-content:center;"><button id="_cy" class="btn btn-danger px-4">Yes, Delete</button><button id="_cn" class="btn btn-outline-secondary px-4">Cancel</button></div></div></div>`;
  document.body.appendChild(el);
  el.querySelector('#_cy').onclick=()=>{el.remove();onYes();};
  el.querySelector('#_cn').onclick=()=>el.remove();
}

function showToast(msg,type='success'){
  const t=document.createElement('div');t.className=`alert alert-${type==='success'?'success':'danger'} position-fixed`;
  t.style.cssText='top:20px;right:20px;z-index:9999;min-width:280px;box-shadow:0 4px 12px rgba(0,0,0,0.15);';
  t.innerHTML=`<i class="bi bi-${type==='success'?'check-circle':'x-circle'} me-2"></i>${msg}`;
  document.body.appendChild(t);setTimeout(()=>t.remove(),3000);
}

loadFeeStructures();
