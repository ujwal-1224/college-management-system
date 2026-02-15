let currentExamId = null;
let currentMaxMarks = 0;

// Load courses on page load
async function loadCourses() {
  try {
    const response = await fetch('/staff/api/courses');
    const courses = await response.json();
    
    const selects = [document.getElementById('courseSelect'), document.getElementById('examCourse')];
    
    if (courses.length === 0) {
      selects.forEach(select => {
        select.innerHTML = '<option value="">No courses assigned</option>';
      });
      return;
    }
    
    const options = '<option value="">Select a course</option>' +
      courses.map(course => 
        `<option value="${course.course_id}">${course.course_code} - ${course.course_name}</option>`
      ).join('');
    
    selects.forEach(select => {
      select.innerHTML = options;
    });
  } catch (error) {
    console.error('Error loading courses:', error);
  }
}

// Load exams when course is selected
document.getElementById('courseSelect').addEventListener('change', async (e) => {
  const courseId = e.target.value;
  const examSelect = document.getElementById('examSelect');
  
  if (!courseId) {
    examSelect.innerHTML = '<option value="">Select course first</option>';
    return;
  }
  
  try {
    const response = await fetch(`/staff/api/course-exams/${courseId}`);
    const exams = await response.json();
    
    if (exams.length === 0) {
      examSelect.innerHTML = '<option value="">No exams created for this course</option>';
      return;
    }
    
    examSelect.innerHTML = '<option value="">Select an exam</option>' +
      exams.map(exam => 
        `<option value="${exam.exam_id}" data-max-marks="${exam.max_marks}">${exam.exam_name} (${new Date(exam.exam_date).toLocaleDateString()}) - ${exam.max_marks} marks</option>`
      ).join('');
  } catch (error) {
    console.error('Error loading exams:', error);
  }
});

// Handle exam selection form
document.getElementById('examSelectForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const examSelect = document.getElementById('examSelect');
  const examId = examSelect.value;
  
  if (!examId) {
    alert('Please select an exam');
    return;
  }
  
  const selectedOption = examSelect.options[examSelect.selectedIndex];
  currentExamId = examId;
  currentMaxMarks = parseInt(selectedOption.dataset.maxMarks);
  
  await loadStudentsForGrading(examId);
});

// Load students for grading
async function loadStudentsForGrading(examId) {
  try {
    const courseId = document.getElementById('courseSelect').value;
    const response = await fetch(`/staff/api/course-students/${courseId}`);
    const students = await response.json();
    
    // Get existing grades
    const gradesResponse = await fetch(`/staff/api/exam-grades/${examId}`);
    const existingGrades = await gradesResponse.json();
    
    const examSelect = document.getElementById('examSelect');
    const selectedExam = examSelect.options[examSelect.selectedIndex].text;
    
    document.getElementById('selectedExam').textContent = selectedExam;
    document.getElementById('maxMarks').textContent = currentMaxMarks;
    
    const tbody = document.getElementById('studentsTable');
    
    if (students.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">No students enrolled</td></tr>';
      return;
    }
    
    tbody.innerHTML = students.map(student => {
      const existing = existingGrades.find(g => g.student_id === student.student_id);
      const marks = existing ? existing.marks_obtained : '';
      const grade = existing ? existing.grade : '';
      
      return `
        <tr>
          <td>${student.student_id}</td>
          <td>${student.first_name} ${student.last_name}</td>
          <td>${student.email}</td>
          <td>
            <input type="number" 
                   class="form-control form-control-sm marks-input" 
                   data-student-id="${student.student_id}"
                   min="0" 
                   max="${currentMaxMarks}" 
                   value="${marks}"
                   placeholder="0-${currentMaxMarks}">
          </td>
          <td>
            <input type="text" 
                   class="form-control form-control-sm grade-input" 
                   data-student-id="${student.student_id}"
                   value="${grade}"
                   placeholder="A, B, C..."
                   maxlength="2">
          </td>
        </tr>
      `;
    }).join('');
    
    document.getElementById('gradesCard').style.display = 'block';
    
    // Add auto-grade calculation
    document.querySelectorAll('.marks-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const marks = parseInt(e.target.value) || 0;
        const gradeInput = e.target.closest('tr').querySelector('.grade-input');
        gradeInput.value = calculateGrade(marks, currentMaxMarks);
      });
    });
    
    if (existingGrades.length > 0) {
      showAlert('Grades already exist for this exam. You can update them.', 'warning');
    }
  } catch (error) {
    console.error('Error loading students:', error);
    alert('Error loading students');
  }
}

// Calculate grade based on percentage
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

// Save grades
document.getElementById('gradesForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const grades = [];
  
  document.querySelectorAll('.marks-input').forEach(input => {
    const marks = parseInt(input.value);
    if (!isNaN(marks) && marks >= 0) {
      const studentId = parseInt(input.dataset.studentId);
      const gradeInput = input.closest('tr').querySelector('.grade-input');
      const grade = gradeInput.value.trim();
      
      if (marks > currentMaxMarks) {
        alert(`Marks for student ${studentId} exceed maximum marks (${currentMaxMarks})`);
        return;
      }
      
      grades.push({
        student_id: studentId,
        exam_id: parseInt(currentExamId),
        marks_obtained: marks,
        grade: grade || calculateGrade(marks, currentMaxMarks)
      });
    }
  });
  
  if (grades.length === 0) {
    alert('Please enter marks for at least one student');
    return;
  }
  
  try {
    const response = await fetch('/staff/api/save-grades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grades })
    });
    
    const result = await response.json();
    
    if (result.success) {
      showAlert('Grades saved successfully!', 'success');
      setTimeout(() => {
        location.reload();
      }, 2000);
    } else {
      showAlert('Error saving grades: ' + result.message, 'danger');
    }
  } catch (error) {
    console.error('Error saving grades:', error);
    showAlert('Error saving grades', 'danger');
  }
});

// Create new exam
document.getElementById('createExamForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const examData = {
    course_id: parseInt(document.getElementById('examCourse').value),
    exam_name: document.getElementById('examName').value,
    exam_date: document.getElementById('examDate').value,
    max_marks: parseInt(document.getElementById('examMaxMarks').value)
  };
  
  try {
    const response = await fetch('/staff/api/create-exam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(examData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert('Exam created successfully!');
      bootstrap.Modal.getInstance(document.getElementById('createExamModal')).hide();
      document.getElementById('createExamForm').reset();
      location.reload();
    } else {
      alert('Error creating exam: ' + result.message);
    }
  } catch (error) {
    console.error('Error creating exam:', error);
    alert('Error creating exam');
  }
});

function showAlert(message, type) {
  const alertDiv = document.getElementById('alertMessage');
  alertDiv.className = `alert alert-${type}`;
  alertDiv.textContent = message;
  alertDiv.classList.remove('d-none');
  
  setTimeout(() => {
    alertDiv.classList.add('d-none');
  }, 5000);
}

loadCourses();
