// ─── LOCAL DATA ───────────────────────────────────────────────────────────────
let coursesList = [
  { course_id:1,  course_code:'CS301', course_name:'Data Structures & Algorithms',  department:'Computer Science',    credits:4, semester:5, staff_name:'Dr. Saubhagya Barpanda', enrolled_students:34, is_active:true,  description:'Core data structures and algorithm design.' },
  { course_id:2,  course_code:'CS302', course_name:'Operating Systems',             department:'Computer Science',    credits:3, semester:5, staff_name:'Dr. Ramesh Kumar',        enrolled_students:34, is_active:true,  description:'Process management, memory, file systems.' },
  { course_id:3,  course_code:'CS303', course_name:'Database Management Systems',   department:'Computer Science',    credits:4, semester:5, staff_name:'Dr. Anjali Sharma',       enrolled_students:34, is_active:true,  description:'Relational databases, SQL, normalization.' },
  { course_id:4,  course_code:'CS304', course_name:'Computer Networks',             department:'Computer Science',    credits:3, semester:5, staff_name:'Prof. Vivek Reddy',       enrolled_students:34, is_active:true,  description:'Network protocols, TCP/IP, routing.' },
  { course_id:5,  course_code:'CS305', course_name:'Software Engineering',          department:'Computer Science',    credits:3, semester:5, staff_name:'Dr. Kiran Rao',           enrolled_students:34, is_active:true,  description:'SDLC, design patterns, testing.' },
  { course_id:6,  course_code:'CS306', course_name:'Web Technologies',              department:'Information Technology',credits:2,semester:5, staff_name:'Prof. Priya Nair',        enrolled_students:34, is_active:true,  description:'HTML, CSS, JavaScript, frameworks.' },
  { course_id:7,  course_code:'EC201', course_name:'Digital Electronics',           department:'Electronics',         credits:4, semester:3, staff_name:'Prof. Vivek Reddy',       enrolled_students:28, is_active:true,  description:'Logic gates, flip-flops, counters.' },
  { course_id:8,  course_code:'ME101', course_name:'Engineering Mechanics',         department:'Mechanical',          credits:3, semester:1, staff_name:'Dr. Kiran Rao',           enrolled_students:22, is_active:false, description:'Statics, dynamics, kinematics.' },
];
let nextCourseId = 9;
let currentPage = 1;
let searchTimer = null;

function getFiltered() {
  const q    = (document.getElementById('searchInput').value||'').toLowerCase();
  const dept = document.getElementById('deptFilter').value;
  const sem  = document.getElementById('semFilter').value;
  return coursesList.filter(c => {
    if (q && !c.course_name.toLowerCase().includes(q) && !c.course_code.toLowerCase().includes(q)) return false;
    if (dept && c.department !== dept) return false;
    if (sem  && String(c.semester) !== sem) return false;
    return true;
  });
}

function loadCourses() {
  const filtered = getFiltered();
  const limit = parseInt(document.getElementById('limitSelect').value)||10;
  const total = filtered.length, pages = Math.max(1,Math.ceil(total/limit));
  if (currentPage > pages) currentPage = pages;
  const slice = filtered.slice((currentPage-1)*limit, currentPage*limit);
  document.getElementById('resultCount').textContent = `${total} records`;
  updateStats();
  const tbody = document.getElementById('coursesTableBody');
  if (!slice.length) { tbody.innerHTML='<tr><td colspan="9" class="text-center py-4 text-muted">No courses found</td></tr>'; document.getElementById('paginationContainer').innerHTML=''; return; }
  tbody.innerHTML = slice.map(c=>`
    <tr>
      <td><strong>${c.course_code}</strong></td>
      <td>${c.course_name}</td>
      <td>${c.department||'—'}</td>
      <td>${c.credits}</td>
      <td>Sem ${c.semester}</td>
      <td>${c.staff_name||'—'}</td>
      <td>${c.enrolled_students||0}</td>
      <td><span class="badge ${c.is_active?'bg-success':'bg-secondary'}">${c.is_active?'Active':'Inactive'}</span></td>
      <td>
        <button class="btn btn-sm btn-outline-primary me-1" onclick="viewCourse(${c.course_id})"><i class="bi bi-eye"></i></button>
        <button class="btn btn-sm btn-outline-warning me-1" onclick="editCourse(${c.course_id})"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteCourse(${c.course_id})"><i class="bi bi-trash"></i></button>
      </td>
    </tr>`).join('');
  renderPagination(currentPage, pages, total);
}

function updateStats() {
  const active = coursesList.filter(c=>c.is_active).length;
  const enroll = coursesList.reduce((s,c)=>s+(c.enrolled_students||0),0);
  document.getElementById('totalCourses').textContent     = coursesList.length;
  document.getElementById('activeCourses').textContent    = active;
  document.getElementById('totalDepts').textContent       = new Set(coursesList.map(c=>c.department)).size;
  document.getElementById('totalEnrollments').textContent = enroll;
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
function goPage(p){currentPage=p;loadCourses();return false;}
function debounceSearch(){clearTimeout(searchTimer);searchTimer=setTimeout(()=>{currentPage=1;loadCourses();},300);}
function resetFilters(){document.getElementById('searchInput').value='';document.getElementById('deptFilter').value='';document.getElementById('semFilter').value='';currentPage=1;loadCourses();}

function viewCourse(id) {
  const c=coursesList.find(x=>x.course_id===id); if(!c) return;
  document.getElementById('viewCourseModalBody').innerHTML=`
    <div class="row g-3">
      <div class="col-md-6">
        <p><strong>Course Code:</strong> ${c.course_code}</p>
        <p><strong>Course Name:</strong> ${c.course_name}</p>
        <p><strong>Department:</strong> ${c.department||'—'}</p>
        <p><strong>Credits:</strong> ${c.credits}</p>
        <p><strong>Semester:</strong> ${c.semester}</p>
      </div>
      <div class="col-md-6">
        <p><strong>Faculty:</strong> ${c.staff_name||'—'}</p>
        <p><strong>Enrolled Students:</strong> ${c.enrolled_students||0}</p>
        <p><strong>Status:</strong> <span class="badge ${c.is_active?'bg-success':'bg-secondary'}">${c.is_active?'Active':'Inactive'}</span></p>
        ${c.description?`<p><strong>Description:</strong> ${c.description}</p>`:''}
      </div>
    </div>`;
  new bootstrap.Modal(document.getElementById('viewCourseModal')).show();
}

function openAddModal() {
  document.getElementById('modalTitle').textContent='Add Course';
  document.getElementById('courseForm').reset();
  document.getElementById('courseId').value='';
  document.getElementById('courseCode').disabled=false;
  document.getElementById('formError').classList.add('d-none');
  new bootstrap.Modal(document.getElementById('courseModal')).show();
}

function editCourse(id) {
  const c=coursesList.find(x=>x.course_id===id); if(!c) return;
  document.getElementById('modalTitle').textContent='Edit Course';
  document.getElementById('courseId').value=id;
  document.getElementById('courseCode').value=c.course_code;
  document.getElementById('courseCode').disabled=true;
  document.getElementById('courseName').value=c.course_name;
  document.getElementById('department').value=c.department||'';
  document.getElementById('credits').value=c.credits;
  document.getElementById('semester').value=c.semester;
  document.getElementById('description').value=c.description||'';
  document.getElementById('formError').classList.add('d-none');
  new bootstrap.Modal(document.getElementById('courseModal')).show();
}

function saveCourse() {
  const id=document.getElementById('courseId').value;
  const code=document.getElementById('courseCode').value.trim();
  const name=document.getElementById('courseName').value.trim();
  const dept=document.getElementById('department').value;
  const credits=parseInt(document.getElementById('credits').value)||0;
  const sem=parseInt(document.getElementById('semester').value)||0;
  const errDiv=document.getElementById('formError');
  if(!code||!name||!dept||!credits||!sem){errDiv.textContent='Please fill all required fields.';errDiv.classList.remove('d-none');return;}
  errDiv.classList.add('d-none');
  if(id){
    const c=coursesList.find(x=>x.course_id===parseInt(id));
    if(c){c.course_name=name;c.department=dept;c.credits=credits;c.semester=sem;c.description=document.getElementById('description').value.trim();}
    showToast('Course updated successfully','success');
  } else {
    coursesList.unshift({course_id:nextCourseId++,course_code:code,course_name:name,department:dept,credits,semester:sem,staff_name:'—',enrolled_students:0,is_active:true,description:document.getElementById('description').value.trim()});
    showToast('Course added successfully','success');
  }
  bootstrap.Modal.getInstance(document.getElementById('courseModal')).hide();
  loadCourses();
}

function deleteCourse(id) {
  const c=coursesList.find(x=>x.course_id===id); if(!c) return;
  showConfirm(`Delete course "${c.course_name}"?`,()=>{coursesList=coursesList.filter(x=>x.course_id!==id);loadCourses();showToast('Course deleted successfully','success');});
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

loadCourses();
