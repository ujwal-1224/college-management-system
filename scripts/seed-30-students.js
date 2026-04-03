/**
 * Seed 30 Indian students into MySQL
 * Run: node scripts/seed-30-students.js
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const students = [
  ['Aarav',     'Reddy',      'aarav.reddy',     'aarav.reddy@college.edu',     '9876500001', 'Male',   'A+', 'Computer Science',      1, '2024-08-01', 'Hyderabad',  'Telangana'],
  ['Vihaan',    'Sharma',     'vihaan.sharma',   'vihaan.sharma@college.edu',   '9876500002', 'Male',   'B+', 'Electronics',           2, '2023-08-01', 'Delhi',      'Delhi'],
  ['Aditya',    'Verma',      'aditya.verma',    'aditya.verma@college.edu',    '9876500003', 'Male',   'O+', 'Mechanical',            3, '2022-08-01', 'Lucknow',    'Uttar Pradesh'],
  ['Arjun',     'Patel',      'arjun.patel',     'arjun.patel@college.edu',     '9876500004', 'Male',   'B-', 'Civil',                 4, '2021-08-01', 'Ahmedabad',  'Gujarat'],
  ['Sai',       'Kiran',      'sai.kiran',       'sai.kiran@college.edu',       '9876500005', 'Male',   'A+', 'Information Technology', 2, '2023-08-01', 'Vijayawada', 'Andhra Pradesh'],
  ['Rohit',     'Kumar',      'rohit.kumar',     'rohit.kumar@college.edu',     '9876500006', 'Male',   'O+', 'Computer Science',      3, '2022-08-01', 'Patna',      'Bihar'],
  ['Karthik',   'Nair',       'karthik.nair',    'karthik.nair@college.edu',    '9876500007', 'Male',   'A-', 'Electronics',           1, '2024-08-01', 'Kochi',      'Kerala'],
  ['Manish',    'Gupta',      'manish.gupta',    'manish.gupta@college.edu',    '9876500008', 'Male',   'B+', 'Mechanical',            4, '2021-08-01', 'Kanpur',     'Uttar Pradesh'],
  ['Rahul',     'Singh',      'rahul.singh',     'rahul.singh@college.edu',     '9876500009', 'Male',   'O-', 'Civil',                 2, '2023-08-01', 'Jaipur',     'Rajasthan'],
  ['Vishal',    'Yadav',      'vishal.yadav',    'vishal.yadav@college.edu',    '9876500010', 'Male',   'A+', 'Information Technology', 1, '2024-08-01', 'Agra',       'Uttar Pradesh'],
  ['Sandeep',   'Reddy',      'sandeep.reddy',   'sandeep.reddy@college.edu',   '9876500011', 'Male',   'B+', 'Computer Science',      2, '2023-08-01', 'Hyderabad',  'Telangana'],
  ['Ankit',     'Jain',       'ankit.jain',      'ankit.jain@college.edu',      '9876500012', 'Male',   'O+', 'Electronics',           3, '2022-08-01', 'Indore',     'Madhya Pradesh'],
  ['Nikhil',    'Bansal',     'nikhil.bansal',   'nikhil.bansal@college.edu',   '9876500013', 'Male',   'A+', 'Mechanical',            1, '2024-08-01', 'Ludhiana',   'Punjab'],
  ['Deepak',    'Mishra',     'deepak.mishra',   'deepak.mishra@college.edu',   '9876500014', 'Male',   'B-', 'Civil',                 4, '2021-08-01', 'Varanasi',   'Uttar Pradesh'],
  ['Harsha',    'Vardhan',    'harsha.vardhan',  'harsha.vardhan@college.edu',  '9876500015', 'Male',   'O+', 'Information Technology', 3, '2022-08-01', 'Bangalore',  'Karnataka'],
  ['Priya',     'Sharma',     'priya.sharma',    'priya.sharma@college.edu',    '9876500016', 'Female', 'A+', 'Computer Science',      1, '2024-08-01', 'Mumbai',     'Maharashtra'],
  ['Sneha',     'Patel',      'sneha.patel',     'sneha.patel@college.edu',     '9876500017', 'Female', 'B+', 'Electronics',           2, '2023-08-01', 'Surat',      'Gujarat'],
  ['Divya',     'Nair',       'divya.nair',      'divya.nair@college.edu',      '9876500018', 'Female', 'O+', 'Mechanical',            3, '2022-08-01', 'Thiruvananthapuram', 'Kerala'],
  ['Kavya',     'Reddy',      'kavya.reddy',     'kavya.reddy@college.edu',     '9876500019', 'Female', 'A-', 'Civil',                 1, '2024-08-01', 'Hyderabad',  'Telangana'],
  ['Pooja',     'Singh',      'pooja.singh',     'pooja.singh@college.edu',     '9876500020', 'Female', 'B+', 'Information Technology', 4, '2021-08-01', 'Chandigarh', 'Punjab'],
  ['Tejas',     'Kulkarni',   'tejas.kulkarni',  'tejas.kulkarni@college.edu',  '9876500021', 'Male',   'O+', 'Computer Science',      2, '2023-08-01', 'Pune',       'Maharashtra'],
  ['Ramesh',    'Iyer',       'ramesh.iyer',     'ramesh.iyer@college.edu',     '9876500022', 'Male',   'A+', 'Electronics',           3, '2022-08-01', 'Chennai',    'Tamil Nadu'],
  ['Sunil',     'Joshi',      'sunil.joshi',     'sunil.joshi@college.edu',     '9876500023', 'Male',   'B+', 'Mechanical',            4, '2021-08-01', 'Nashik',     'Maharashtra'],
  ['Mahesh',    'Babu',       'mahesh.babu',     'mahesh.babu@college.edu',     '9876500024', 'Male',   'O-', 'Civil',                 2, '2023-08-01', 'Vijayawada', 'Andhra Pradesh'],
  ['Kiran',     'Kumar',      'kiran.kumar',     'kiran.kumar@college.edu',     '9876500025', 'Male',   'A+', 'Information Technology', 1, '2024-08-01', 'Mysore',     'Karnataka'],
  ['Naresh',    'Reddy',      'naresh.reddy',    'naresh.reddy@college.edu',    '9876500026', 'Male',   'B+', 'Computer Science',      3, '2022-08-01', 'Warangal',   'Telangana'],
  ['Lokesh',    'Sharma',     'lokesh.sharma',   'lokesh.sharma@college.edu',   '9876500027', 'Male',   'O+', 'Electronics',           2, '2023-08-01', 'Jaipur',     'Rajasthan'],
  ['Venkatesh', 'Rao',        'venkatesh.rao',   'venkatesh.rao@college.edu',   '9876500028', 'Male',   'A+', 'Mechanical',            1, '2024-08-01', 'Visakhapatnam', 'Andhra Pradesh'],
  ['Suresh',    'Patel',      'suresh.patel',    'suresh.patel@college.edu',    '9876500029', 'Male',   'B-', 'Civil',                 4, '2021-08-01', 'Vadodara',   'Gujarat'],
  ['Pavan',     'Kumar',      'pavan.kumar',     'pavan.kumar@college.edu',     '9876500030', 'Male',   'O+', 'Information Technology', 2, '2023-08-01', 'Guntur',     'Andhra Pradesh'],
];

// Semester → roll number prefix map
const deptCode = {
  'Computer Science':      'CSE',
  'Electronics':           'ECE',
  'Mechanical':            'MECH',
  'Civil':                 'CIVIL',
  'Information Technology':'IT',
};

async function seed() {
  const connection = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'college_management',
  });

  console.log('✓ Connected to MySQL');

  const hashedPassword = await bcrypt.hash('Student@123', 10);
  let inserted = 0, skipped = 0;

  for (let i = 0; i < students.length; i++) {
    const [firstName, lastName, username, email, phone, gender, bloodGroup,
           department, semester, enrollmentDate, city, state] = students[i];

    const rollNumber = `${deptCode[department] || 'STU'}${String(2024 - semester + 1).slice(-2)}${String(i + 1).padStart(3, '0')}`;

    try {
      // Insert User
      const [userResult] = await connection.query(
        `INSERT INTO User (username, password, role) VALUES (?, ?, 'student')`,
        [username, hashedPassword]
      );
      const userId = userResult.insertId;

      // Insert Student (matches actual DB columns)
      await connection.query(
        `INSERT INTO Student
          (user_id, first_name, last_name, email, phone,
           date_of_birth, enrollment_date, department, semester)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, firstName, lastName, email, phone,
         '2002-06-15', enrollmentDate, department, semester]
      );

      inserted++;
      console.log(`  ✓ [${i + 1}/30] ${firstName} ${lastName} (${rollNumber})`);
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        skipped++;
        console.log(`  ⚠ [${i + 1}/30] Skipped (duplicate): ${username}`);
      } else {
        console.error(`  ✗ [${i + 1}/30] Error for ${username}:`, err.message);
      }
    }
  }

  await connection.end();
  console.log(`\n✓ Done — ${inserted} inserted, ${skipped} skipped`);
  console.log('✓ Login password for all students: Student@123');
}

seed().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
