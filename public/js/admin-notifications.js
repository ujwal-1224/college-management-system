// ─── LOCAL DATA ───────────────────────────────────────────────────────────────
let notifList = [
  { notification_id:1, title:'Mid-term exam schedule released',    message:'Mid-term examinations begin from April 12. Check timetable for schedule.',          notification_type:'academic', target_role:'all',     priority:'high',   created_at:'2026-04-05T10:00:00Z' },
  { notification_id:2, title:'Fee payment deadline approaching',   message:'Hostel fee for April is due by April 10, 2026. Pay to avoid late charges.',          notification_type:'fee',      target_role:'student', priority:'urgent', created_at:'2026-04-04T09:00:00Z' },
  { notification_id:3, title:'New assignment uploaded',            message:'Dr. Anjali Sharma uploaded DBMS Assignment 3. Submission deadline: April 8.',         notification_type:'academic', target_role:'student', priority:'medium', created_at:'2026-04-03T14:00:00Z' },
  { notification_id:4, title:'Holiday notice – Dr. Ambedkar Jayanti', message:'College will remain closed on April 14 for Dr. Ambedkar Jayanti.',               notification_type:'general',  target_role:'all',     priority:'medium', created_at:'2026-04-02T08:00:00Z' },
  { notification_id:5, title:'Staff meeting scheduled',            message:'All faculty members are requested to attend the staff meeting on April 9 at 3 PM.',   notification_type:'general',  target_role:'staff',   priority:'high',   created_at:'2026-04-01T11:00:00Z' },
  { notification_id:6, title:'Result published – CS303 Quiz 2',   message:'CS303 Quiz 2 results have been published. Check your marks in the Grades section.',   notification_type:'academic', target_role:'student', priority:'low',    created_at:'2026-03-30T16:00:00Z' },
  { notification_id:7, title:'Parent-teacher meeting',            message:'Parent-teacher meeting scheduled for April 20. Parents are requested to attend.',      notification_type:'general',  target_role:'parent',  priority:'medium', created_at:'2026-03-28T10:00:00Z' },
];
let nextNotifId = 8;
let currentPage = 1;
let searchTimer = null;

const PRIORITY_BADGE = { low:'bg-secondary', medium:'bg-info text-dark', high:'bg-warning text-dark', urgent:'bg-danger' };
const TYPE_BADGE     = { general:'bg-secondary', academic:'bg-primary', fee:'bg-warning text-dark', exam:'bg-info text-dark', attendance:'bg-success', alert:'bg-danger' };

function getFiltered() {
  const q    = (document.getElementById('searchInput').value||'').toLowerCase();
  const role = document.getElementById('roleFilter').value;
  const type = document.getElementById('typeFilter').value;
  const pri  = document.getElementById('priorityFilter').value;
  return notifList.filter(n=>{
    if(q && !n.title.toLowerCase().includes(q) && !n.message.toLowerCase().includes(q)) return false;
    if(role && n.target_role!==role) return false;
    if(type && n.notification_type!==type) return false;
    if(pri  && n.priority!==pri) return false;
    return true;
  });
}

function loadNotifications() {
  const filtered = getFiltered();
  const limit = parseInt(document.getElementById('limitSelect').value)||10;
  const total = filtered.length, pages = Math.max(1,Math.ceil(total/limit));
  if(currentPage>pages) currentPage=pages;
  const slice = filtered.slice((currentPage-1)*limit, currentPage*limit);
  document.getElementById('resultCount').textContent=`${total} records`;
  updateStats();
  const tbody=document.getElementById('notificationsTableBody');
  if(!slice.length){tbody.innerHTML='<tr><td colspan="6" class="text-center py-4 text-muted">No notifications found</td></tr>';document.getElementById('paginationContainer').innerHTML='';return;}
  tbody.innerHTML=slice.map(n=>`
    <tr>
      <td><strong>${n.title}</strong></td>
      <td><span class="badge ${TYPE_BADGE[n.notification_type]||'bg-secondary'}">${n.notification_type||'—'}</span></td>
      <td>${n.target_role||'all'}</td>
      <td><span class="badge ${PRIORITY_BADGE[n.priority]||'bg-secondary'}">${n.priority||'—'}</span></td>
      <td>${n.created_at?new Date(n.created_at).toLocaleDateString():'—'}</td>
      <td>
        <button class="btn btn-sm btn-outline-warning me-1" onclick="editNotification(${n.notification_id})"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteNotification(${n.notification_id})"><i class="bi bi-trash"></i></button>
      </td>
    </tr>`).join('');
  renderPagination(currentPage, pages, total);
}

function updateStats() {
  document.getElementById('totalNotifications').textContent  = notifList.length;
  document.getElementById('unreadNotifications').textContent = notifList.length;
  document.getElementById('urgentNotifications').textContent = notifList.filter(n=>n.priority==='urgent').length;
  document.getElementById('broadcastNotifications').textContent = notifList.filter(n=>n.target_role==='all').length;
}
function loadStats() { updateStats(); }

function renderPagination(page, pages, total) {
  const c=document.getElementById('paginationContainer');
  if(pages<=1){c.innerHTML='';return;}
  let h=`<small class="text-muted">Page ${page} of ${pages} (${total} total)</small><nav><ul class="pagination pagination-sm mb-0">`;
  h+=`<li class="page-item ${page===1?'disabled':''}"><a class="page-link" href="#" onclick="return goPage(${page-1})">‹</a></li>`;
  for(let i=1;i<=pages;i++) h+=`<li class="page-item ${i===page?'active':''}"><a class="page-link" href="#" onclick="return goPage(${i})">${i}</a></li>`;
  h+=`<li class="page-item ${page===pages?'disabled':''}"><a class="page-link" href="#" onclick="return goPage(${page+1})">›</a></li></ul></nav>`;
  c.innerHTML=h;
}
function goPage(p){currentPage=p;loadNotifications();return false;}
function debounceSearch(){clearTimeout(searchTimer);searchTimer=setTimeout(()=>{currentPage=1;loadNotifications();},300);}
function resetFilters(){document.getElementById('searchInput').value='';document.getElementById('roleFilter').value='';document.getElementById('typeFilter').value='';document.getElementById('priorityFilter').value='';currentPage=1;loadNotifications();}

function openAddModal() {
  document.getElementById('modalTitle').textContent='Add Notification';
  document.getElementById('notificationForm').reset();
  document.getElementById('notificationId').value='';
  document.getElementById('formError').classList.add('d-none');
  new bootstrap.Modal(document.getElementById('notificationModal')).show();
}

function editNotification(id) {
  const n=notifList.find(x=>x.notification_id===id); if(!n) return;
  document.getElementById('modalTitle').textContent='Edit Notification';
  document.getElementById('notificationId').value=id;
  document.getElementById('notifTitle').value=n.title;
  document.getElementById('notifMessage').value=n.message;
  document.getElementById('notifType').value=n.notification_type;
  document.getElementById('notifTargetRole').value=n.target_role;
  document.getElementById('notifPriority').value=n.priority;
  document.getElementById('formError').classList.add('d-none');
  new bootstrap.Modal(document.getElementById('notificationModal')).show();
}

function saveNotification() {
  const id=document.getElementById('notificationId').value;
  const title=document.getElementById('notifTitle').value.trim();
  const message=document.getElementById('notifMessage').value.trim();
  const type=document.getElementById('notifType').value;
  const role=document.getElementById('notifTargetRole').value;
  const priority=document.getElementById('notifPriority').value;
  const errDiv=document.getElementById('formError');
  if(!title||!message){errDiv.textContent='Title and message are required.';errDiv.classList.remove('d-none');return;}
  errDiv.classList.add('d-none');
  if(id){
    const n=notifList.find(x=>x.notification_id===parseInt(id));
    if(n){n.title=title;n.message=message;n.notification_type=type;n.target_role=role;n.priority=priority;}
    showToast('Notification updated','success');
  } else {
    notifList.unshift({notification_id:nextNotifId++,title,message,notification_type:type,target_role:role,priority,created_at:new Date().toISOString()});
    showToast('Notification created','success');
  }
  bootstrap.Modal.getInstance(document.getElementById('notificationModal')).hide();
  loadNotifications();
}

function deleteNotification(id) {
  const n=notifList.find(x=>x.notification_id===id); if(!n) return;
  showConfirm(`Delete notification "${n.title}"?`,()=>{notifList=notifList.filter(x=>x.notification_id!==id);loadNotifications();showToast('Notification deleted','success');});
}

function openBroadcastModal() {
  document.getElementById('broadcastForm').reset();
  document.getElementById('bcFormError').classList.add('d-none');
  new bootstrap.Modal(document.getElementById('broadcastModal')).show();
}

function sendBroadcast() {
  const title=document.getElementById('bcTitle').value.trim();
  const message=document.getElementById('bcMessage').value.trim();
  const role=document.getElementById('bcTargetRole').value;
  const priority=document.getElementById('bcPriority').value;
  const errDiv=document.getElementById('bcFormError');
  if(!title||!message){errDiv.textContent='Title and message are required.';errDiv.classList.remove('d-none');return;}
  errDiv.classList.add('d-none');
  notifList.unshift({notification_id:nextNotifId++,title,message,notification_type:'general',target_role:role||'all',priority,created_at:new Date().toISOString()});
  bootstrap.Modal.getInstance(document.getElementById('broadcastModal')).hide();
  showToast('Broadcast sent successfully','success');
  loadNotifications();
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

loadNotifications();
