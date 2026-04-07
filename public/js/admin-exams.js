// ─── LOCAL DATA ───────────────────────────────────────────────────────────────
let examsList = [
  { exam_id:1, course_id:1, course_code:'CS301', course_name:'Data Structures & Algorithms', exam_name:'Mid-Term Exam',  exam_type:'mid_term',   exam_date:'2026-03-15', max_marks:50,  duration_minutes:90,  submission_count:34, description:'' },
  { exam_id:2, course_id:1, course_code:'CS301', course_name:'Data Structures & Algorithms', exam_name:'Final Exam',     exam_type:'final',      exam_date:'2026-04-20', max_marks:100, duration_minutes:180, submission_count:34, description:'' },
  { exam_id:3, course_id:2, course_code:'CS302', course_name:'Operating Systems',            exam_name:'Mid-Term Exam',  exam_type:'mid_term',   exam_date:'2026-03-15', max_marks:50,  duration_minutes:90,  submission_count:34, description:'' },
  { exam_id:4, course_id:2, course_code:'CS302', course_name:'Operating Systems',            exam_name:'Final Exam',     exam_type:'final',      exam_date:'2026-04-20', max_marks:100, duration_minutes:180, submission_count:34, description:'' },
  { exam_id:5, course_id:3, course_code:'CS303', course_name:'Database Management Systems',  exam_name:'Quiz 1',         exam_type:'quiz',       exam_date:'2026-02-10', max_marks:20,  duration_minutes:30,  submission_count:34, description:'' },
  { exam_id:6, course_id:3, course_code:'CS303', course_name:'Database Management Systems',  exam_name:'Mid-Term Exam',  exam_type:'mid_term',   exam_date:'2026-03-18', max_marks:50,  duration_minutes:90,  submission_count:34, description:'' },
  { exam_id:7, course_id:4, course_code:'CS304', course_name:'Computer Networks',            exam_name:'Assignment 1',   exam_type:'assignment', exam_date:'2026-02-20', max_marks:30,  duration_minutes:null,submission_count:34, description:'' },
  { exam_id:8, course_id:5, course_code:'CS305', course_name:'Software Engineering',         exam_name:'Quiz 2',         exam_type:'quiz',       exam_date:'2026-03-15', max_marks:20,  duration_minutes:30,  submission_count:34, description:'' },
];
let nextExamId = 9;
let currentPage = 1;
let searchTimer = null;

const TYPE_LABELS = { mid_term:'Mid Term', final:'Final', quiz:'Quiz', assignment:'Assignment', practical:'Practical' };
const TYPE_BADGE  = { mid_term:'bg-primary', final:'bg-danger', quiz:'bg-info', assignment:'bg-warning text-dark', practical:'bg-success' };

function getFiltered() {
  const q      = (document.getElementById('searchInput').value||'').toLowerCase();
  const course = document.getElementById('courseFilter').value;
  const type   = document.getElementById('typeFilter').value;
  return examsList.filter(e => {
    if (q && !e.exam_name.toLowerCase().includes(q) && !e.course_name.toLowerCase().includes(q)) return false;
    if (course && String(e.course_id) !== course) return false;
    if (type   && e.exam_type !== type) return false;
    return true;
  });
}

function loadExams() {
  const filtered = getFiltered();
  const limit = parseInt(document.getElementById('limitSelect').value)||10;
  const total = filtered.length, pages = Math.max(1,Math.ceil(total/limit));
  if (currentPage > pages) currentPage = pages;
  const slice = filtered.slice((currentPage-1)*limit, currentPage*limit);
  document.getElementById('resultCount').textContent = `${total} records`;
  updateStats();
  const tbody = document.getElementById('examsTableBody');
  if (!slice.length) { tbody.innerHTML='<tr><td colspan="7" class="text-center py-4 text-muted">No exams found</td></tr>'; document.getElementById('paginationContainer').innerHTML=''; return; }
  tbody.innerHTML = slice.map(e=>`
    <tr>
      <td><strong>${e.exam_name}</strong></td>
      <td>${e.course_code?`<span class="badge bg-secondary">${e.course_code}</span> `:''}${e.course_name||'—'}</td>
      <td><span class="badge ${TYPE_BADGE[e.exam_type]||'bg-secondary'}">${TYPE_LABELS[e.exam_type]||e.exam_type}</span></td>
      <td>${e.exam_date?new Date(e.exam_date).toLocaleDateString():'—'}</td>
      <td>${e.max_marks}</td>
      <td>${e.submission_count||0}</td>
      <td>
        <button class="btn btn-sm btn-outline-info me-1"    onclick="viewResults(${e.exam_id})"   title="Results"><i class="bi bi-bar-chart"></i></button>
        <button class="btn btn-sm btn-outline-warning me-1" onclick="editExam(${e.exam_id})"      title="Edit"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-sm btn-outline-success me-1" onclick="publishResults(${e.exam_id})" title="Publish"><i class="bi bi-send"></i></button>
        <button class="btn btn-sm btn-outline-danger"       onclick="deleteExam(${e.exam_id})"    title="Delete"><i class="bi bi-trash"></i></button>
      </td>
    </tr>`).join('');
  renderPagination(currentPage, pages, total);
}

function updateStats() {
  const now = new Date();
  const thisMonth = examsList.filter(e=>{ const d=new Date(e.exam_date); return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear(); }).length;
  document.getElementById('totalExams').textContent       = examsList.length;
  document.getElementById('thisMonthExams').textContent   = thisMonth;
  document.getElementById('publishedResults').textContent = examsList.filter(e=>e.published).length;
  document.getElementById('pendingResults').textContent   = examsList.filter(e=>!e.published).length;
}
function loadStats() { updateStats(); }

function loadCoursesList() {
  const courses=[...new Map(examsList.map(e=>[e.course_id,{course_id:e.course_id,course_code:e.course_code,course_name:e.course_name}])).values()];
  ['courseFilter','courseId'].forEach(selId=>{
    const sel=document.getElementById(selId); if(!sel) return;
    const isFilter=selId==='courseFilter';
    sel.innerHTML=isFilter?'<option value="">All Courses</option>':'<option value="">Select Course</option>';
    courses.forEach(c=>{const o=document.createElement('option');o.value=c.course_id;o.textContent=`${c.course_code} - ${c.course_name}`;sel.appendChild(o);});
  });
}

function renderPagination(page, pages, total) {
  const c=document.getElementById('paginationContainer');
  if(pages<=1){c.innerHTML='';return;}
  let h=`<small class="text-muted">Page ${page} of ${pages} (${total} total)</small><nav><ul class="pagination pagination-sm mb-0">`;
  h+=`<li class="page-item ${page===1?'disabled':''}"><a class="page-link" href="#" onclick="return goPage(${page-1})">‹</a></li>`;
  for(let i=1;i<=pages;i++) h+=`<li class="page-item ${i===page?'active':''}"><a class="page-link" href="#" onclick="return goPage(${i})">${i}</a></li>`;
  h+=`<li class="page-item ${page===pages?'disabled':''}"><a class="page-link" href="#" onclick="return goPage(${page+1})">›</a></li></ul></nav>`;
  c.innerHTML=h;
}
function goPage(p){currentPage=p;loadExams();return false;}
function debounceSearch(){clearTimeout(searchTimer);searchTimer=setTimeout(()=>{currentPage=1;loadExams();},300);}
function resetFilters(){document.getElementById('searchInput').value='';document.getElementById('courseFilter').value='';document.getElementById('typeFilter').value='';currentPage=1;loadExams();}

function openAddModal() {
  document.getElementById('modalTitle').textContent='Add Exam';
  document.getElementById('examForm').reset();
  document.getElementById('examId').value='';
  document.getElementById('formError').classList.add('d-none');
  new bootstrap.Modal(document.getElementById('examModal')).show();
}

function editExam(id) {
  const e=examsList.find(x=>x.exam_id===id); if(!e) return;
  document.getElementById('modalTitle').textContent='Edit Exam';
  document.getElementById('examId').value=id;
  document.getElementById('courseId').value=e.course_id;
  document.getElementById('examName').value=e.exam_name;
  document.getElementById('examType').value=e.exam_type;
  document.getElementById('examDate').value=e.exam_date||'';
  document.getElementById('maxMarks').value=e.max_marks;
  document.getElementById('durationMinutes').value=e.duration_minutes||'';
  document.getElementById('description').value=e.description||'';
  document.getElementById('formError').classList.add('d-none');
  new bootstrap.Modal(document.getElementById('examModal')).show();
}

function saveExam() {
  const id=document.getElementById('examId').value;
  const courseId=parseInt(document.getElementById('courseId').value);
  const name=document.getElementById('examName').value.trim();
  const type=document.getElementById('examType').value;
  const date=document.getElementById('examDate').value;
  const marks=parseInt(document.getElementById('maxMarks').value)||0;
  const errDiv=document.getElementById('formError');
  if(!courseId||!name||!type||!date||!marks){errDiv.textContent='Please fill all required fields.';errDiv.classList.remove('d-none');return;}
  errDiv.classList.add('d-none');
  const courseRef=examsList.find(x=>x.course_id===courseId)||{course_code:'—',course_name:'—'};
  if(id){
    const e=examsList.find(x=>x.exam_id===parseInt(id));
    if(e){e.course_id=courseId;e.course_code=courseRef.course_code;e.course_name=courseRef.course_name;e.exam_name=name;e.exam_type=type;e.exam_date=date;e.max_marks=marks;e.duration_minutes=parseInt(document.getElementById('durationMinutes').value)||null;e.description=document.getElementById('description').value.trim();}
    showToast('Exam updated successfully','success');
  } else {
    examsList.unshift({exam_id:nextExamId++,course_id:courseId,course_code:courseRef.course_code,course_name:courseRef.course_name,exam_name:name,exam_type:type,exam_date:date,max_marks:marks,duration_minutes:parseInt(document.getElementById('durationMinutes').value)||null,submission_count:0,description:document.getElementById('description').value.trim(),published:false});
    showToast('Exam added successfully','success');
  }
  bootstrap.Modal.getInstance(document.getElementById('examModal')).hide();
  loadExams();
}

function deleteExam(id) {
  const e=examsList.find(x=>x.exam_id===id); if(!e) return;
  showConfirm(`Delete exam "${e.exam_name}"?`,()=>{examsList=examsList.filter(x=>x.exam_id!==id);loadExams();showToast('Exam deleted','success');});
}

function viewResults(examId) {
  const e=examsList.find(x=>x.exam_id===examId); if(!e) return;
  const dummyStudents=[
    {student_id:1,roll_number:'CS2022001',first_name:'Ujwal',   last_name:'Kumar',  marks:42},
    {student_id:2,roll_number:'CS2023001',first_name:'Srikar',  last_name:'Reddy',  marks:38},
    {student_id:3,roll_number:'CS2022002',first_name:'Sameer',  last_name:'Khan',   marks:45},
    {student_id:4,roll_number:'CS2023002',first_name:'Priya',   last_name:'Sharma', marks:47},
    {student_id:5,roll_number:'CS2024001',first_name:'Rahul',   last_name:'Verma',  marks:35},
  ];
  let html=`<div class="table-responsive"><table class="table table-sm table-bordered"><thead class="table-light"><tr><th>Roll No</th><th>Student Name</th><th>Marks (/${e.max_marks})</th><th>Remarks</th></tr></thead><tbody>`;
  dummyStudents.forEach(s=>{html+=`<tr><td>${s.roll_number}</td><td>${s.first_name} ${s.last_name}</td><td><input type="number" class="form-control form-control-sm" id="marks_${s.student_id}" value="${s.marks}" min="0" max="${e.max_marks}" style="width:90px"></td><td><input type="text" class="form-control form-control-sm" id="remarks_${s.student_id}" placeholder="Optional"></td></tr>`;});
  html+='</tbody></table></div>';
  document.getElementById('resultsTableContainer').innerHTML=html;
  document.getElementById('saveResultsBtn').onclick=()=>{showToast('Results saved successfully','success');bootstrap.Modal.getInstance(document.getElementById('resultsModal')).hide();};
  new bootstrap.Modal(document.getElementById('resultsModal')).show();
}

function publishResults(examId) {
  const e=examsList.find(x=>x.exam_id===examId); if(!e) return;
  if(!confirm('Publish results for this exam? Students will be able to see their marks.')) return;
  e.published=true;
  updateStats();
  showToast('Results published successfully','success');
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
loadExams();
