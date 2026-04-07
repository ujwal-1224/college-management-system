// ── Shared data ──────────────────────────────────────────────
const COURSES = [
  { id: '101', code: 'CS101',   name: 'Introduction to Programming' },
  { id: '102', code: 'CS201',   name: 'Data Structures'             },
  { id: '103', code: 'CS301',   name: 'Database Management Systems' },
  { id: '104', code: 'MATH201', name: 'Discrete Mathematics'        },
];

const EXAMS = [
  { id: 'midterm', name: 'Mid-Term Exam', max: 50  },
  { id: 'final',   name: 'Final Exam',    max: 100 },
];

const STUDENTS = [
  { roll: 'CS2021001', name: 'Ujwal Kumar'      },
  { roll: 'CS2021002', name: 'Srikar Reddy'     },
  { roll: 'CS2021003', name: 'Sameer Khan'      },
  { roll: 'CS2021004', name: 'Rahul Verma'      },
  { roll: 'CS2021005', name: 'Priya Sharma'     },
  { roll: 'CS2021006', name: 'Sneha Patil'      },
  { roll: 'CS2021007', name: 'Arjun Nair'       },
  { roll: 'CS2021008', name: 'Karthik Rao'      },
  { roll: 'CS2021009', name: 'Ananya Gupta'     },
  { roll: 'CS2021010', name: 'Rohit Singh'      },
  { roll: 'CS2021011', name: 'Deepak Mishra'    },
  { roll: 'CS2021012', name: 'Aditya Verma'     },
  { roll: 'CS2021013', name: 'Neha Joshi'       },
  { roll: 'CS2021014', name: 'Pooja Mehta'      },
  { roll: 'CS2021015', name: 'Vivek Reddy'      },
  { roll: 'CS2021016', name: 'Meera Iyer'       },
  { roll: 'CS2021017', name: 'Suresh Babu'      },
  { roll: 'CS2021018', name: 'Kavya Nair'       },
  { roll: 'CS2021019', name: 'Harish Pillai'    },
  { roll: 'CS2021020', name: 'Divya Krishnan'   },
  { roll: 'CS2021021', name: 'Nikhil Tiwari'    },
  { roll: 'CS2021022', name: 'Swathi Rao'       },
  { roll: 'CS2021023', name: 'Pranav Desai'     },
  { roll: 'CS2021024', name: 'Lakshmi Venkat'   },
  { roll: 'CS2021025', name: 'Akash Pandey'     },
  { roll: 'CS2021026', name: 'Riya Shah'        },
  { roll: 'CS2021027', name: 'Manish Dubey'     },
  { roll: 'CS2021028', name: 'Tanvi Kulkarni'   },
  { roll: 'CS2021029', name: 'Gaurav Saxena'    },
  { roll: 'CS2021030', name: 'Ishaan Bose'      },
  { roll: 'CS2021031', name: 'Shruti Agarwal'   },
  { roll: 'CS2021032', name: 'Varun Malhotra'   },
  { roll: 'CS2021033', name: 'Nandini Choudhary'},
  { roll: 'CS2021034', name: 'Soubhagya Panda'  },
];

// Seeded pseudo-random for consistent results
function seededRand(seed) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function calcGrade(marks, max) {
  const pct = (marks / max) * 100;
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C';
  if (pct >= 40) return 'D';
  return 'F';
}

function gradeBadge(g) {
  if (g === 'A+' || g === 'A') return 'success';
  if (g === 'B+' || g === 'B') return 'primary';
  if (g === 'C') return 'info';
  if (g === 'D') return 'warning';
  return 'danger';
}

// Pre-generate all results (seeded so they're stable)
const ALL_RESULTS = [];
let seed = 0;
COURSES.forEach(course => {
  EXAMS.forEach(exam => {
    STUDENTS.forEach(student => {
      const min = exam.id === 'midterm' ? 20 : 40;
      const range = exam.max - min;
      const marks = min + Math.floor(seededRand(seed++) * range);
      ALL_RESULTS.push({
        roll:    student.roll,
        name:    student.name,
        courseId: course.id,
        course:  `${course.code} – ${course.name}`,
        examId:  exam.id,
        exam:    exam.name,
        marks,
        max:     exam.max,
        grade:   calcGrade(marks, exam.max),
      });
    });
  });
});

function displayResults(records) {
  if (!records.length) {
    document.getElementById('avgMarks').textContent    = '0';
    document.getElementById('highestMarks').textContent = '0';
    document.getElementById('lowestMarks').textContent  = '0';
    document.getElementById('passRate').textContent     = '0%';
    document.getElementById('resultsTable').innerHTML =
      '<tr><td colspan="6" class="text-center py-3 text-muted">No records available</td></tr>';
    return;
  }

  const marksArr = records.map(r => r.marks);
  const avg      = (marksArr.reduce((a,b) => a+b, 0) / marksArr.length).toFixed(1);
  const highest  = Math.max(...marksArr);
  const lowest   = Math.min(...marksArr);
  const passed   = records.filter(r => r.grade !== 'F').length;
  const passRate = ((passed / records.length) * 100).toFixed(1);

  document.getElementById('avgMarks').textContent     = avg;
  document.getElementById('highestMarks').textContent = highest;
  document.getElementById('lowestMarks').textContent  = lowest;
  document.getElementById('passRate').textContent     = passRate + '%';

  document.getElementById('resultsTable').innerHTML = records.map(r => `
    <tr>
      <td>${r.roll}</td>
      <td>${r.name}</td>
      <td>${r.course}</td>
      <td>${r.exam}</td>
      <td>${r.marks}/${r.max}</td>
      <td><span class="badge bg-${gradeBadge(r.grade)}">${r.grade}</span></td>
    </tr>`).join('');
}

function generateReport() {
  const courseFilter = document.getElementById('courseFilter').value;
  const examFilter   = document.getElementById('examFilter').value;

  let filtered = ALL_RESULTS;
  if (courseFilter) filtered = filtered.filter(r => r.courseId === courseFilter);
  if (examFilter)   filtered = filtered.filter(r => r.examId   === examFilter);

  displayResults(filtered);
}

// Generate on submit
document.getElementById('filterForm').addEventListener('submit', (e) => {
  e.preventDefault();
  generateReport();
});

// Auto-generate on load
generateReport();
