// ─── LOCAL DATA ───────────────────────────────────────────────────────────────
let timetableData = [
  { timetable_id:1,  day_of_week:'Monday',    start_time:'09:00', end_time:'10:00', course_id:1, course_code:'CS301', course_name:'Data Structures',   room_number:'A101', staff_name:'Dr. Saubhagya Barpanda', semester:5 },
  { timetable_id:2,  day_of_week:'Monday',    start_time:'10:00', end_time:'11:00', course_id:2, course_code:'CS302', course_name:'Operating Systems', room_number:'B202', staff_name:'Dr. Ramesh Kumar',        semester:5 },
  { timetable_id:3,  day_of_week:'Monday',    start_time:'11:15', end_time:'12:15', course_id:3, course_code:'CS303', course_name:'DBMS',              room_number:'A103', staff_name:'Dr. Anjali Sharma',       semester:5 },
  { timetable_id:4,  day_of_week:'Tuesday',   start_time:'09:00', end_time:'10:00', course_id:4, course_code:'CS304', course_name:'Computer Networks', room_number:'C301', staff_name:'Prof. Vivek Reddy',       semester:5 },
  { timetable_id:5,  day_of_week:'Tuesday',   start_time:'10:00', end_time:'11:00', course_id:5, course_code:'CS305', course_name:'Software Engg.',    room_number:'A102', staff_name:'Dr. Kiran Rao',           semester:5 },
  { timetable_id:6,  day_of_week:'Tuesday',   start_time:'14:00', end_time:'16:00', course_id:6, course_code:'CS306', course_name:'Web Tech Lab',      room_number:'Lab-1',staff_name:'Prof. Priya Nair',        semester:5 },
  { timetable_id:7,  day_of_week:'Wednesday', start_time:'09:00', end_time:'10:00', course_id:1, course_code:'CS301', course_name:'Data Structures',   room_number:'A101', staff_name:'Dr. Saubhagya Barpanda', semester:5 },
  { timetable_id:8,  day_of_week:'Wednesday', start_time:'11:15', end_time:'12:15', course_id:3, course_code:'CS303', course_name:'DBMS',              room_number:'A103', staff_name:'Dr. Anjali Sharma',       semester:5 },
  { timetable_id:9,  day_of_week:'Thursday',  start_time:'09:00', end_time:'10:00', course_id:2, course_code:'CS302', course_name:'Operating Systems', room_number:'B202', staff_name:'Dr. Ramesh Kumar',        semester:5 },
  { timetable_id:10, day_of_week:'Thursday',  start_time:'10:00', end_time:'11:00', course_id:4, course_code:'CS304', course_name:'Computer Networks', room_number:'C301', staff_name:'Prof. Vivek Reddy',       semester:5 },
  { timetable_id:11, day_of_week:'Friday',    start_time:'09:00', end_time:'10:00', course_id:5, course_code:'CS305', course_name:'Software Engg.',    room_number:'A102', staff_name:'Dr. Kiran Rao',           semester:5 },
  { timetable_id:12, day_of_week:'Friday',    start_time:'10:00', end_time:'11:00', course_id:6, course_code:'CS306', course_name:'Web Technologies',  room_number:'B101', staff_name:'Prof. Priya Nair',        semester:5 },
];
let nextTTId = 13;
let currentView = 'grid';
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function getFiltered() {
  const course = document.getElementById('courseFilter').value;
  const day    = document.getElementById('dayFilter').value;
  const sem    = document.getElementById('semFilter').value;
  return timetableData.filter(e => {
    if (course && String(e.course_id) !== course) return false;
    if (day    && e.day_of_week !== day) return false;
    if (sem    && String(e.semester) !== sem) return false;
    return true;
  });
}

function loadTimetable() {
  const data = getFiltered();
  if (currentView === 'grid') renderGridView(data);
  else renderListView(data);
}

function loadCoursesList() {
  // Populate course filter dropdown from local data
  const courses = [...new Map(timetableData.map(e=>[e.course_id,{course_id:e.course_id,course_code:e.course_code,course_name:e.course_name}])).values()];
  ['courseFilter','courseId'].forEach(selId => {
    const sel = document.getElementById(selId); if(!sel) return;
    const isFilter = selId==='courseFilter';
    sel.innerHTML = isFilter?'<option value="">All Courses</option>':'<option value="">Select Course</option>';
    courses.forEach(c=>{const o=document.createElement('option');o.value=c.course_id;o.textContent=`${c.course_code} - ${c.course_name}`;sel.appendChild(o);});
  });
}

function renderGridView(data) {
  const container = document.getElementById('gridContainer');
  if (!data.length) { container.innerHTML='<div class="text-center py-4 text-muted">No timetable entries found</div>'; return; }
  const byDay = {}; DAYS.forEach(d=>{byDay[d]=[];});
  data.forEach(e=>{ if(byDay[e.day_of_week]) byDay[e.day_of_week].push(e); });
  const timeSlots = [...new Set(data.map(e=>e.start_time))].sort();
  let html='<div class="table-responsive"><table class="table-enterprise"><thead><tr><th>Time</th>';
  DAYS.forEach(d=>{html+=`<th>${d}</th>`;});
  html+='</tr></thead><tbody>';
  timeSlots.forEach(slot=>{
    html+=`<tr><td><strong>${formatTime(slot)}</strong></td>`;
    DAYS.forEach(day=>{
      const entries=byDay[day].filter(e=>e.start_time===slot);
      if(entries.length){
        html+=`<td>${entries.map(e=>`<div class="p-1 mb-1 rounded" style="background:#e0e7ff;font-size:0.8rem"><strong>${e.course_code}</strong><br><span class="text-muted">${e.room_number||'—'}</span><div class="mt-1"><button class="btn btn-outline-warning me-1" style="font-size:0.7rem;padding:1px 6px" onclick="editEntry(${e.timetable_id})"><i class="bi bi-pencil"></i></button><button class="btn btn-outline-danger" style="font-size:0.7rem;padding:1px 6px" onclick="deleteEntry(${e.timetable_id})"><i class="bi bi-trash"></i></button></div></div>`).join('')}</td>`;
      } else { html+='<td class="text-muted" style="font-size:0.8rem">—</td>'; }
    });
    html+='</tr>';
  });
  html+='</tbody></table></div>';
  container.innerHTML=html;
}

function renderListView(data) {
  const tbody=document.getElementById('listTableBody');
  if(!data.length){tbody.innerHTML='<tr><td colspan="7" class="text-center py-4 text-muted">No entries found</td></tr>';return;}
  tbody.innerHTML=data.map(e=>`
    <tr>
      <td>${e.day_of_week}</td>
      <td>${formatTime(e.start_time)} – ${formatTime(e.end_time)}</td>
      <td><strong>${e.course_code}</strong> ${e.course_name}</td>
      <td>${e.room_number||'—'}</td>
      <td>${e.staff_name||'—'}</td>
      <td>Sem ${e.semester}</td>
      <td>
        <button class="btn btn-sm btn-outline-warning me-1" onclick="editEntry(${e.timetable_id})"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteEntry(${e.timetable_id})"><i class="bi bi-trash"></i></button>
      </td>
    </tr>`).join('');
}

function formatTime(t) {
  if(!t) return '—';
  const [h,m]=t.split(':'); const hour=parseInt(h); const ampm=hour>=12?'PM':'AM';
  return `${hour%12||12}:${m} ${ampm}`;
}

function switchView(view) {
  currentView=view;
  document.getElementById('gridView').classList.toggle('d-none',view!=='grid');
  document.getElementById('listView').classList.toggle('d-none',view!=='list');
  document.getElementById('btnGrid').classList.toggle('active',view==='grid');
  document.getElementById('btnList').classList.toggle('active',view==='list');
  loadTimetable();
}

function resetFilters(){document.getElementById('courseFilter').value='';document.getElementById('dayFilter').value='';document.getElementById('semFilter').value='';loadTimetable();}

function openAddModal() {
  document.getElementById('modalTitle').textContent='Add Timetable Entry';
  document.getElementById('timetableForm').reset();
  document.getElementById('entryId').value='';
  document.getElementById('formError').classList.add('d-none');
  new bootstrap.Modal(document.getElementById('timetableModal')).show();
}

function editEntry(id) {
  const e=timetableData.find(x=>x.timetable_id===id); if(!e) return;
  document.getElementById('modalTitle').textContent='Edit Timetable Entry';
  document.getElementById('entryId').value=id;
  document.getElementById('courseId').value=e.course_id;
  document.getElementById('dayOfWeek').value=e.day_of_week;
  document.getElementById('startTime').value=e.start_time;
  document.getElementById('endTime').value=e.end_time;
  document.getElementById('roomNumber').value=e.room_number||'';
  document.getElementById('semester').value=e.semester;
  document.getElementById('formError').classList.add('d-none');
  new bootstrap.Modal(document.getElementById('timetableModal')).show();
}

function saveEntry() {
  const id=document.getElementById('entryId').value;
  const courseId=parseInt(document.getElementById('courseId').value);
  const day=document.getElementById('dayOfWeek').value;
  const start=document.getElementById('startTime').value;
  const end=document.getElementById('endTime').value;
  const room=document.getElementById('roomNumber').value.trim();
  const sem=parseInt(document.getElementById('semester').value)||5;
  const errDiv=document.getElementById('formError');
  if(!courseId||!day||!start||!end){errDiv.textContent='Please fill all required fields.';errDiv.classList.remove('d-none');return;}
  errDiv.classList.add('d-none');
  // Find course info
  const courseRef=timetableData.find(x=>x.course_id===courseId)||{course_code:'—',course_name:'—',staff_name:'—'};
  if(id){
    const e=timetableData.find(x=>x.timetable_id===parseInt(id));
    if(e){e.course_id=courseId;e.course_code=courseRef.course_code;e.course_name=courseRef.course_name;e.staff_name=courseRef.staff_name;e.day_of_week=day;e.start_time=start;e.end_time=end;e.room_number=room;e.semester=sem;}
    showToast('Entry updated successfully','success');
  } else {
    timetableData.push({timetable_id:nextTTId++,course_id:courseId,course_code:courseRef.course_code,course_name:courseRef.course_name,staff_name:courseRef.staff_name,day_of_week:day,start_time:start,end_time:end,room_number:room,semester:sem});
    showToast('Entry added successfully','success');
  }
  bootstrap.Modal.getInstance(document.getElementById('timetableModal')).hide();
  loadTimetable();
}

function deleteEntry(id) {
  showConfirm('Delete this timetable entry?',()=>{timetableData=timetableData.filter(x=>x.timetable_id!==id);loadTimetable();showToast('Entry deleted','success');});
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

loadCoursesList();
loadTimetable();
