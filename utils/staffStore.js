// Shared staff/faculty data — single source of truth for admin + student modules
const STAFF = [
  { staff_id: 1, employee_id: 'EMP001', first_name: 'Saubhagya', last_name: 'Barpanda', email: 'saubhagya@college.edu', department: 'Computer Science', designation: 'Professor',           qualification: 'Ph.D', joining_date: '2015-07-01', status: 'active' },
  { staff_id: 2, employee_id: 'EMP002', first_name: 'Ramesh',    last_name: 'Kumar',     email: 'ramesh@college.edu',    department: 'Computer Science', designation: 'Associate Professor', qualification: 'Ph.D', joining_date: '2017-08-01', status: 'active' },
  { staff_id: 3, employee_id: 'EMP003', first_name: 'Anjali',    last_name: 'Sharma',    email: 'anjali@college.edu',    department: 'Computer Science', designation: 'Associate Professor', qualification: 'Ph.D', joining_date: '2018-06-15', status: 'active' },
  { staff_id: 4, employee_id: 'EMP004', first_name: 'Vivek',     last_name: 'Reddy',     email: 'vivek.r@college.edu',   department: 'Computer Science', designation: 'Assistant Professor', qualification: 'M.Tech', joining_date: '2019-07-01', status: 'active' },
  { staff_id: 5, employee_id: 'EMP005', first_name: 'Kiran',     last_name: 'Rao',       email: 'kiran@college.edu',     department: 'Computer Science', designation: 'Associate Professor', qualification: 'Ph.D', joining_date: '2016-09-01', status: 'active' },
  { staff_id: 6, employee_id: 'EMP006', first_name: 'Priya',     last_name: 'Nair',      email: 'priya.n@college.edu',   department: 'Computer Science', designation: 'Assistant Professor', qualification: 'M.Tech', joining_date: '2020-07-15', status: 'active' },
];

module.exports = { STAFF };
