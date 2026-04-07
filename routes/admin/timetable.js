const express = require('express');
const router = express.Router();
const { catchAsync, AppError } = require('../../middleware/errorHandler');
const { validateTimetable, validateId } = require('../../middleware/validation');
const { auditLog } = require('../../middleware/logger');
const db = require('../../config/database');

// Fixed timetable data — each subject 4 times/week
const FIXED_TIMETABLE = [
  { timetable_id:  1, course_id: 101, course_code: 'CS101', course_name: 'Introduction to Programming', day_of_week: 'Monday',    start_time: '09:00:00', end_time: '10:30:00', room_number: 'Room 101', semester: 1, academic_year: '2025-26', staff_name: 'Dr. Saubhagya Barpanda' },
  { timetable_id:  2, course_id: 102, course_code: 'CS201', course_name: 'Data Structures',             day_of_week: 'Monday',    start_time: '11:00:00', end_time: '12:30:00', room_number: 'Room 202', semester: 3, academic_year: '2025-26', staff_name: 'Dr. Saubhagya Barpanda' },
  { timetable_id:  3, course_id: 103, course_code: 'CS301', course_name: 'Database Management Systems', day_of_week: 'Tuesday',   start_time: '09:00:00', end_time: '10:30:00', room_number: 'Lab 1',    semester: 5, academic_year: '2025-26', staff_name: 'Dr. Saubhagya Barpanda' },
  { timetable_id:  4, course_id: 104, course_code: 'MATH201', course_name: 'Discrete Mathematics',     day_of_week: 'Tuesday',   start_time: '14:00:00', end_time: '15:30:00', room_number: 'Room 203', semester: 3, academic_year: '2025-26', staff_name: 'Dr. Saubhagya Barpanda' },
  { timetable_id:  5, course_id: 101, course_code: 'CS101', course_name: 'Introduction to Programming', day_of_week: 'Wednesday', start_time: '09:00:00', end_time: '10:30:00', room_number: 'Room 101', semester: 1, academic_year: '2025-26', staff_name: 'Dr. Saubhagya Barpanda' },
  { timetable_id:  6, course_id: 102, course_code: 'CS201', course_name: 'Data Structures',             day_of_week: 'Wednesday', start_time: '11:00:00', end_time: '12:30:00', room_number: 'Room 202', semester: 3, academic_year: '2025-26', staff_name: 'Dr. Saubhagya Barpanda' },
  { timetable_id:  7, course_id: 103, course_code: 'CS301', course_name: 'Database Management Systems', day_of_week: 'Thursday',  start_time: '09:00:00', end_time: '10:30:00', room_number: 'Lab 1',    semester: 5, academic_year: '2025-26', staff_name: 'Dr. Saubhagya Barpanda' },
  { timetable_id:  8, course_id: 104, course_code: 'MATH201', course_name: 'Discrete Mathematics',     day_of_week: 'Thursday',  start_time: '14:00:00', end_time: '15:30:00', room_number: 'Room 203', semester: 3, academic_year: '2025-26', staff_name: 'Dr. Saubhagya Barpanda' },
  { timetable_id:  9, course_id: 101, course_code: 'CS101', course_name: 'Introduction to Programming', day_of_week: 'Friday',    start_time: '09:00:00', end_time: '10:30:00', room_number: 'Room 101', semester: 1, academic_year: '2025-26', staff_name: 'Dr. Saubhagya Barpanda' },
  { timetable_id: 10, course_id: 102, course_code: 'CS201', course_name: 'Data Structures',             day_of_week: 'Friday',    start_time: '11:00:00', end_time: '12:30:00', room_number: 'Room 202', semester: 3, academic_year: '2025-26', staff_name: 'Dr. Saubhagya Barpanda' },
  { timetable_id: 11, course_id: 103, course_code: 'CS301', course_name: 'Database Management Systems', day_of_week: 'Saturday',  start_time: '09:00:00', end_time: '10:30:00', room_number: 'Lab 1',    semester: 5, academic_year: '2025-26', staff_name: 'Dr. Saubhagya Barpanda' },
  { timetable_id: 12, course_id: 104, course_code: 'MATH201', course_name: 'Discrete Mathematics',     day_of_week: 'Saturday',  start_time: '14:00:00', end_time: '15:30:00', room_number: 'Room 203', semester: 3, academic_year: '2025-26', staff_name: 'Dr. Saubhagya Barpanda' },
];

const DAY_ORDER = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

// Get all timetable entries
router.get('/api/timetable', catchAsync(async (req, res) => {
  const { course_id, day_of_week, semester } = req.query;
  let data = [...FIXED_TIMETABLE];
  if (course_id)   data = data.filter(e => e.course_id === parseInt(course_id));
  if (day_of_week) data = data.filter(e => e.day_of_week === day_of_week);
  if (semester)    data = data.filter(e => e.semester === parseInt(semester));
  data.sort((a,b) => DAY_ORDER.indexOf(a.day_of_week) - DAY_ORDER.indexOf(b.day_of_week) || a.start_time.localeCompare(b.start_time));
  res.json({ success: true, data });
}));

// Get single timetable entry
router.get('/api/timetable/:id', validateId, catchAsync(async (req, res) => {
  const [entries] = await db.query(`
    SELECT t.*, c.course_code, c.course_name, c.department,
           CONCAT(s.first_name, ' ', s.last_name) as staff_name
    FROM Timetable t
    JOIN Course c ON t.course_id = c.course_id
    LEFT JOIN Staff s ON c.staff_id = s.staff_id
    WHERE t.timetable_id = ?
  `, [req.params.id]);

  if (entries.length === 0) throw new AppError('Timetable entry not found', 404);
  res.json({ success: true, data: entries[0] });
}));

// Create timetable entry
router.post('/api/timetable', validateTimetable, catchAsync(async (req, res) => {
  const { course_id, day_of_week, start_time, end_time, room_number, semester, academic_year } = req.body;

  // Validate end_time > start_time
  if (start_time >= end_time) throw new AppError('End time must be after start time', 400);

  // Check course exists
  const [course] = await db.query('SELECT course_id FROM Course WHERE course_id = ? AND deleted_at IS NULL', [course_id]);
  if (course.length === 0) throw new AppError('Course not found', 404);

  // Check for room conflicts
  const [roomConflict] = await db.query(`
    SELECT t.timetable_id FROM Timetable t
    WHERE t.room_number = ? AND t.day_of_week = ? AND t.is_active = TRUE
      AND t.course_id != ?
      AND ((t.start_time < ? AND t.end_time > ?) OR (t.start_time < ? AND t.end_time > ?) OR (t.start_time >= ? AND t.end_time <= ?))
  `, [room_number, day_of_week, course_id, end_time, start_time, end_time, start_time, start_time, end_time]);

  if (roomConflict.length > 0) throw new AppError(`Room ${room_number} is already booked at this time`, 409);

  // Check for course conflicts (same course, same day, overlapping time)
  const [courseConflict] = await db.query(`
    SELECT t.timetable_id FROM Timetable t
    WHERE t.course_id = ? AND t.day_of_week = ? AND t.is_active = TRUE
      AND ((t.start_time < ? AND t.end_time > ?) OR (t.start_time < ? AND t.end_time > ?) OR (t.start_time >= ? AND t.end_time <= ?))
  `, [course_id, day_of_week, end_time, start_time, end_time, start_time, start_time, end_time]);

  if (courseConflict.length > 0) throw new AppError('This course already has a class at this time', 409);

  const [result] = await db.query(
    `INSERT INTO Timetable (course_id, day_of_week, start_time, end_time, room_number, semester, academic_year)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [course_id, day_of_week, start_time, end_time, room_number, semester, academic_year]
  );

  await auditLog('CREATE', 'Timetable', result.insertId, req.session.userId, null,
    { course_id, day_of_week, start_time, end_time, room_number }, req);

  res.status(201).json({ success: true, message: 'Timetable entry created', data: { timetable_id: result.insertId } });
}));

// Update timetable entry
router.put('/api/timetable/:id', validateId, catchAsync(async (req, res) => {
  const { id } = req.params;
  const { course_id, day_of_week, start_time, end_time, room_number, semester, academic_year, is_active } = req.body;

  const [existing] = await db.query('SELECT * FROM Timetable WHERE timetable_id = ?', [id]);
  if (existing.length === 0) throw new AppError('Timetable entry not found', 404);

  if (start_time && end_time && start_time >= end_time) throw new AppError('End time must be after start time', 400);

  await db.query(
    `UPDATE Timetable SET course_id=?, day_of_week=?, start_time=?, end_time=?,
     room_number=?, semester=?, academic_year=?, is_active=? WHERE timetable_id=?`,
    [course_id, day_of_week, start_time, end_time, room_number, semester, academic_year, is_active ?? true, id]
  );

  await auditLog('UPDATE', 'Timetable', id, req.session.userId, existing[0],
    { course_id, day_of_week, start_time, end_time, room_number }, req);

  res.json({ success: true, message: 'Timetable entry updated' });
}));

// Delete timetable entry
router.delete('/api/timetable/:id', validateId, catchAsync(async (req, res) => {
  const [existing] = await db.query('SELECT * FROM Timetable WHERE timetable_id = ?', [req.params.id]);
  if (existing.length === 0) throw new AppError('Timetable entry not found', 404);

  await db.query('UPDATE Timetable SET is_active = FALSE WHERE timetable_id = ?', [req.params.id]);
  await auditLog('DELETE', 'Timetable', req.params.id, req.session.userId, existing[0], null, req);

  res.json({ success: true, message: 'Timetable entry deleted' });
}));

// Check conflicts for a proposed slot
router.post('/api/timetable/check-conflicts', catchAsync(async (req, res) => {
  const { course_id, day_of_week, start_time, end_time, room_number, exclude_id } = req.body;

  const conflicts = [];

  if (room_number) {
    let q = `SELECT t.timetable_id, t.room_number, t.day_of_week, t.start_time, t.end_time,
                    c.course_code, c.course_name
             FROM Timetable t JOIN Course c ON t.course_id = c.course_id
             WHERE t.room_number = ? AND t.day_of_week = ? AND t.is_active = TRUE
               AND ((t.start_time < ? AND t.end_time > ?) OR (t.start_time < ? AND t.end_time > ?) OR (t.start_time >= ? AND t.end_time <= ?))`;
    const p = [room_number, day_of_week, end_time, start_time, end_time, start_time, start_time, end_time];
    if (exclude_id) { q += ' AND t.timetable_id != ?'; p.push(exclude_id); }
    const [rc] = await db.query(q, p);
    if (rc.length > 0) conflicts.push({ type: 'room', message: `Room ${room_number} is occupied`, entries: rc });
  }

  res.json({ success: true, has_conflicts: conflicts.length > 0, conflicts });
}));

module.exports = router;
