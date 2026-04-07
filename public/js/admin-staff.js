// ─── LOCAL DATA ───────────────────────────────────────────────────────────────
let staffList = [
  { staff_id:1,  employee_id:'EMP001', first_name:'Dr. Saubhagya', last_name:'Barpanda', email:'saubhagya@college.edu', phone:'9876500001', department:'Computer Science',    designation:'Professor',        qualification:'Ph.D',  joining_date:'2018-07-01', gender:'Male',   is_active:true  },
  { staff_id:2,  employee_id:'EMP002', first_name:'Dr. Ramesh',    last_name:'Kumar',     email:'ramesh@college.edu',    phone:'9876500002', department:'Computer Science',    designation:'Associate Professor',qualification:'Ph.D', joining_date:'2019-08-01', gender:'Male',   is_active:true  },
  { staff_id:3,  employee_id:'EMP003', first_name:'Dr. Anjali',    last_name:'Sharma',    email:'anjali@college.edu',    phone:'9876500003', department:'Computer Science',    designation:'Assistant Professor',qualification:'M.Tech',joining_date:'2020-01-01',gender:'Female', is_active:true  },
  { staff_id:4,  employee_id:'EMP004', first_name:'Prof. Vivek',   last_name:'Reddy',     email:'vivek@college.edu',     phone:'9876500004', department:'Electronics',         designation:'Assistant Professor',qualification:'M.E',  joining_date:'2021-06-01', gender:'Male',   is_active:true  },
  { staff_id:5,  employee_id:'EMP005', first_name:'Dr. Kiran',     last_name:'Rao',       email:'kiran@college.edu',     phone:'9876500005', department:'Mechanical',          designation:'Professor',        qualification:'Ph.D',  joining_date:'2017-03-01', gender:'Male',   is_active:true  },
  { staff_id:6,  employee_id:'EMP006', first_name:'Prof. Priya',   last_name:'Nair',      email:'priya.nair@college.edu',phone:'9876500006', department:'Information Technology',designation:'Lecturer',       qualification:'M.Tech',joining_date:'2022-08-01', gender:'Female', is_active:true  },
  { staff_id:7,  employee_id:'EMP007', first_name:'Dr. Suresh',    last_name:'Babu',      email:'suresh.b@college.edu',  phone:'9876500007', department:'Mathematics',         designation:'Associate Professor',qualification:'Ph.D',joining_date:'2016-01-01', gender:'Male',   is_active:false },
];
let nextStaffId = 8;
let currentPage = 1;
let searchTimer = null;

function getFiltered() {
  const q    = (document.getElementById('searchInput').value||'').toLowerCase();
  const dept = document.getElementById('deptFilter').value;
  return staffList.filter(s => {
    const name = `${s.first_name} ${s.last_name}`.toLowerCase();
    if (q && !name.includes(q) && !s.email.toLowerCase().includes(q) && !s.employee_id.toLowerCase().includes(q)) return false;
    if (dept && s.department !== dept) return false;
    return true;
  });
}

function loadStaff() {
  const filtered = getFiltered();
  const limit = parseInt(document.getElementById('limitSelect').value)||10;
  const total = filtered.length, pages = Math.max(1,Math.ceil(total/limit));
  if (currentPage > pages) currentPage = pages;
  const slice = filtered.slice((currentPage-1)*limit, currentPage*limit);
  document.getElementById('resultCount').textContent = `${total} records`;
  updateStats();
  const tbody = document.getElementById('staffTableBody');
  if (!slice.length) { tbody.innerHTML='<tr><td colspan="7" class="text-center py-4 text-muted">No staff found</td></tr>'; document.getElementById('paginationContainer').innerHTML=''; return; }
  tbody.innerHTML = slice.map(s=>`
    <tr id="srow-${s.staff_id}">
      <td><strong>${s.employee_id}</strong></td>
      <td>${s.first_name} ${s.last_name}</td>
      <td>${s.email}</td>
      <td>${s.department||'—'}</td>
      <td>${s.designation||'—'}</td>
      <td><span class="badge ${s.is_active?'bg-success':'bg-secondary'}" id="sbadge-${s.staff_id}">${s.is_active?'Active':'Inactive'}</span></td>
      <td>
        <button class="btn btn-sm btn-outline-primary me-1" onclick="viewStaff(${s.staff_id})"><i class="bi bi-eye"></i></button>
        <button class="btn btn-sm btn-outline-warning me-1" onclick="editStaff(${s.staff_id})"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-sm btn-outline-${s.is_active?'secondary':'success'} me-1" id="stogBtn-${s.staff_id}" onclick="toggleStatus(${s.staff_id})"><i class="bi bi-${s.is_active?'pause-circle':'play-circle'}" id="stogIcon-${s.staff_id}"></i></button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteStaff(${s.staff_id})"><i class="bi bi-trash"></i></button>
      </td>
    </tr>`).join('');
  renderPagination(currentPage, pages, total);
}

function updateStats() {
  const active = staffList.filter(s=>s.is_active).length;
  document.getElementById('totalStaff').textContent    = staffList.length;
  document.getElementById('activeStaff').textContent   = active;
  document.getElementById('inactiveStaff').textContent = staffList.length - active;
  document.getElementById('totalDepts').textContent    = new Set(staffList.map(s=>s.department)).size;
}
function loadStats() { updateStats(); }

function renderPagination(page, pages, total) {
  const c = document.getElementById('paginationContainer');
  if (pages<=1){c.innerHTML='';return;}
  let h=`<small class="text-muted">Page ${page} of ${pages} (${total} total)</small><nav><ul class="pagination pagination-sm mb-0">`;
  h+=`<li class="page-item ${page===1?'disabled':''}"><a class="page-link" href="#" onclick="return goPage(${page-1})">‹</a></li>`;
  for(let i=1;i<=pages;i++) h+=`<li class="page-item ${i===page?'active':''}"><a class="page-link" href="#" onclick="return goPage(${i})">${i}</a></li>`;
  h+=`<li class="page-item ${page===pages?'disabled':''}"><a class="page-link" href="#" onclick="return goPage(${page+1})">›</a></li></ul></nav>`;
  c.innerHTML=h;
}
function goPage(p){currentPage=p;loadStaff();return false;}
function debounceSearch(){clearTimeout(searchTimer);searchTimer=setTimeout(()=>{currentPage=1;loadStaff();},300);}
function resetFilters(){document.getElementById('searchInput').value='';document.getElementById('deptFilter').value='';currentPage=1;loadStaff();}

function viewStaff(id) {
  const s = staffList.find(x=>x.staff_id===id); if(!s) return;
  document.getElementById('viewStaffModalBody').innerHTML=`
    <div class="row g-3">
      <div class="col-md-6">
        <h6 class="text-muted border-bottom pb-1">Personal Info</h6>
        <p><strong>Name:</strong> ${s.first_name} ${s.last_name}</p>
        <p><strong>Employee ID:</strong> ${s.employee_id}</p>
        <p><strong>Email:</strong> ${s.email}</p>
        <p><strong>Phone:</strong> ${s.phone||'—'}</p>
        <p><strong>Gender:</strong> ${s.gender||'—'}</p>
      </div>
      <div class="col-md-6">
        <h6 class="text-muted border-bottom pb-1">Professional Info</h6>
        <p><strong>Department:</strong> ${s.department||'—'}</p>
        <p><strong>Designation:</strong> ${s.designation||'—'}</p>
        <p><strong>Qualification:</strong> ${s.qualification||'—'}</p>
        <p><strong>Joining Date:</strong> ${s.joining_date||'—'}</p>
        <p><strong>Status:</strong> <span class="badge ${s.is_active?'bg-success':'bg-secondary'}">${s.is_active?'Active':'Inactive'}</span></p>
      </div>
    </div>`;
  new bootstrap.Modal(document.getElementById('viewStaffModal')).show();
}

function openAddModal() {
  document.getElementById('modalTitle').textContent='Add Staff';
  document.getElementById('staffForm').reset();
  document.getElementById('staffId').value='';
  document.getElementById('username').disabled=false;
  document.getElementById('formError').classList.add('d-none');
  new bootstrap.Modal(document.getElementById('staffModal')).show();
}

function editStaff(id) {
  const s = staffList.find(x=>x.staff_id===id); if(!s) return;
  document.getElementById('modalTitle').textContent='Edit Staff';
  document.getElementById('staffId').value=id;
  document.getElementById('username').value=`staff${id}`;
  document.getElementById('username').disabled=true;
  document.getElementById('password').required=false;
  document.getElementById('password').placeholder='Leave blank to keep current';
  document.getElementById('employeeId').value=s.employee_id;
  document.getElementById('employeeId').disabled=true;
  document.getElementById('firstName').value=s.first_name;
  document.getElementById('lastName').value=s.last_name;
  document.getElementById('email').value=s.email;
  document.getElementById('phone').value=s.phone||'';
  document.getElementById('gender').value=s.gender||'';
  document.getElementById('department').value=s.department||'';
  document.getElementById('designation').value=s.designation||'';
  document.getElementById('qualification').value=s.qualification||'';
  document.getElementById('joiningDate').value=s.joining_date||'';
  document.getElementById('formError').classList.add('d-none');
  new bootstrap.Modal(document.getElementById('staffModal')).show();
}

function saveStaff() {
  const id=document.getElementById('staffId').value;
  const fn=document.getElementById('firstName').value.trim();
  const ln=document.getElementById('lastName').value.trim();
  const em=document.getElementById('email').value.trim();
  const dept=document.getElementById('department').value;
  const desig=document.getElementById('designation').value.trim();
  const errDiv=document.getElementById('formError');
  if(!fn||!ln||!em||!dept){errDiv.textContent='Please fill required fields.';errDiv.classList.remove('d-none');return;}
  errDiv.classList.add('d-none');
  if(id){
    const s=staffList.find(x=>x.staff_id===parseInt(id));
    if(s){s.first_name=fn;s.last_name=ln;s.email=em;s.phone=document.getElementById('phone').value.trim();s.gender=document.getElementById('gender').value;s.department=dept;s.designation=desig;s.qualification=document.getElementById('qualification').value.trim();s.joining_date=document.getElementById('joiningDate').value;}
    showToast('Staff updated successfully','success');
  } else {
    staffList.unshift({staff_id:nextStaffId++,employee_id:'EMP'+String(nextStaffId).padStart(3,'0'),first_name:fn,last_name:ln,email:em,phone:document.getElementById('phone').value.trim(),gender:document.getElementById('gender').value,department:dept,designation:desig,qualification:document.getElementById('qualification').value.trim(),joining_date:document.getElementById('joiningDate').value,is_active:true});
    showToast('Staff added successfully','success');
  }
  bootstrap.Modal.getInstance(document.getElementById('staffModal')).hide();
  loadStaff();
}

function toggleStatus(id) {
  const s=staffList.find(x=>x.staff_id===id); if(!s) return;
  const action=s.is_active?'deactivate':'activate';
  if(!confirm(`Are you sure you want to ${action} this staff member?`)) return;
  s.is_active=!s.is_active;
  const badge=document.getElementById(`sbadge-${id}`);
  const btn=document.getElementById(`stogBtn-${id}`);
  const icon=document.getElementById(`stogIcon-${id}`);
  if(badge){badge.className=`badge ${s.is_active?'bg-success':'bg-secondary'}`;badge.textContent=s.is_active?'Active':'Inactive';}
  if(btn) btn.className=`btn btn-sm btn-outline-${s.is_active?'secondary':'success'} me-1`;
  if(icon) icon.className=`bi bi-${s.is_active?'pause-circle':'play-circle'}`;
  updateStats();
  showToast(`Staff ${action}d successfully`,'success');
}

function deleteStaff(id) {
  const s=staffList.find(x=>x.staff_id===id); if(!s) return;
  showConfirm(`Delete "${s.first_name} ${s.last_name}"?`,()=>{staffList=staffList.filter(x=>x.staff_id!==id);loadStaff();showToast('Staff deleted successfully','success');});
}

function exportStaff() {
  const rows=[['ID','Employee ID','First Name','Last Name','Email','Department','Designation','Status']];
  staffList.forEach(s=>rows.push([s.staff_id,s.employee_id,s.first_name,s.last_name,s.email,s.department||'',s.designation||'',s.is_active?'Active':'Inactive']));
  const blob=new Blob([rows.map(r=>r.join(',')).join('\n')],{type:'text/csv'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='staff.csv';a.click();
}

function showConfirm(msg,onYes){
  const el=document.createElement('div');
  el.innerHTML=`<div style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9998;display:flex;align-items:center;justify-content:center;"><div style="background:#fff;border-radius:12px;padding:28px 32px;max-width:420px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.2);"><div style="font-size:2rem;text-align:center;margin-bottom:12px;">⚠️</div><p style="text-align:center;color:#374151;margin-bottom:20px;">${msg}</p><div style="display:flex;gap:10px;justify-content:center;"><button id="_cy" class="btn btn-danger px-4">Yes, Delete</button><button id="_cn" class="btn btn-outline-secondary px-4">Cancel</button></div></div></div>`;
  document.body.appendChild(el);
  el.querySelector('#_cy').onclick=()=>{el.remove();onYes();};
  el.querySelector('#_cn').onclick=()=>el.remove();
}

function showToast(msg,type='success'){
  const t=document.createElement('div');
  t.className=`alert alert-${type==='success'?'success':'danger'} position-fixed`;
  t.style.cssText='top:20px;right:20px;z-index:9999;min-width:280px;box-shadow:0 4px 12px rgba(0,0,0,0.15);';
  t.innerHTML=`<i class="bi bi-${type==='success'?'check-circle':'x-circle'} me-2"></i>${msg}`;
  document.body.appendChild(t);setTimeout(()=>t.remove(),3000);
}

loadStaff();
