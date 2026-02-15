# Testing Guide - Four Role System

## Overview

The College Management System now supports FOUR user roles:
1. **Admin** - System administrator
2. **Student** - Student users
3. **Staff** - Faculty/Teaching staff
4. **Parent** - Parent/Guardian of students

## Quick Test (Demo Mode)

The demo server is currently running with all four roles ready to test.

**Access:** http://localhost:3001

---

## Test Credentials

### 1. Admin Login
```
Username: admin
Password: admin123
Dashboard: /admin/dashboard
```

**Features to Test:**
- View system statistics (total students, staff, courses)
- See recent students list
- Access admin-only features
- Try accessing other role dashboards (should be denied)

---

### 2. Student Login
```
Username: student1
Password: student123
Dashboard: /student/dashboard
```

**Features to Test:**
- View student profile (name, department, semester)
- Check attendance records
- See course enrollment
- Verify cannot access admin/staff/parent dashboards

---

### 3. Staff Login
```
Username: staff1
Password: staff123
Dashboard: /staff/dashboard
```

**Features to Test:**
- View staff profile (name, department, designation)
- See assigned courses
- View students in their courses
- Check course statistics
- Verify cannot access admin/student/parent dashboards

---

### 4. Parent Login
```
Username: parent1
Password: parent123
Dashboard: /parent/dashboard
```

**Features to Test:**
- View parent profile
- See list of children (linked students)
- Click "Attendance" button to view child's attendance
- Click "Results" button to view child's exam results
- Verify cannot access admin/student/staff dashboards

---

## Testing Checklist

### Authentication Tests
- [ ] Login with admin credentials
- [ ] Login with student credentials
- [ ] Login with staff credentials
- [ ] Login with parent credentials
- [ ] Try invalid credentials (should fail)
- [ ] Logout and verify redirect to login
- [ ] Try accessing dashboard without login (should redirect)

### Role-Based Access Control
- [ ] Admin can only access /admin/dashboard
- [ ] Student can only access /student/dashboard
- [ ] Staff can only access /staff/dashboard
- [ ] Parent can only access /parent/dashboard
- [ ] Direct URL access to wrong role dashboard shows "Access Denied"

### Dashboard Features

#### Admin Dashboard
- [ ] Statistics display correctly
- [ ] Student list loads
- [ ] Navigation menu works
- [ ] Logout button works

#### Student Dashboard
- [ ] Profile information displays
- [ ] Attendance table loads
- [ ] Department and semester shown
- [ ] Responsive design works

#### Staff Dashboard
- [ ] Profile information displays
- [ ] Assigned courses list loads
- [ ] Student list displays
- [ ] Course statistics shown

#### Parent Dashboard
- [ ] Profile information displays
- [ ] Children list loads
- [ ] Attendance button works for each child
- [ ] Results button works for each child
- [ ] Multiple children supported

### Security Tests
- [ ] Passwords are hashed (not visible in database)
- [ ] Session persists across page refreshes
- [ ] Session expires after logout
- [ ] Cannot access API endpoints without authentication
- [ ] Cannot access other role's API endpoints

### UI/UX Tests
- [ ] All dashboards are responsive (mobile, tablet, desktop)
- [ ] Navigation menus work on all screen sizes
- [ ] Tables are scrollable on small screens
- [ ] Color coding is consistent (Admin: dark, Student: blue, Staff: green, Parent: yellow)
- [ ] All buttons and links work

---

## Testing Workflow

### Test 1: Complete Login Flow
1. Open http://localhost:3001
2. Login as admin (admin/admin123)
3. Verify redirect to /admin/dashboard
4. Check admin features
5. Logout
6. Repeat for student, staff, parent

### Test 2: Role Isolation
1. Login as student
2. Try to access http://localhost:3001/admin/dashboard
3. Should see "Access Denied"
4. Try to access http://localhost:3001/staff/dashboard
5. Should see "Access Denied"
6. Verify only /student/dashboard is accessible

### Test 3: Parent-Child Relationship
1. Login as parent (parent1/parent123)
2. View children list
3. Click "Attendance" for John Doe
4. Verify attendance records display
5. Click "Results" for John Doe
6. Verify exam results display

### Test 4: Session Management
1. Login as any user
2. Refresh the page
3. Should remain logged in
4. Close browser and reopen
5. Should still be logged in (within 24 hours)
6. Click logout
7. Should redirect to login page
8. Try to access dashboard
9. Should redirect to login

---

## Production Testing (with MySQL)

After setting up the database:

### Setup Steps
```bash
# Configure database
nano .env  # Add MySQL password

# Setup database
npm run setup

# Start production server
npm start
```

### Test with Database
1. Access http://localhost:3000
2. Login with credentials from database
3. Test all CRUD operations
4. Verify data persistence
5. Test relationships (parent-student, staff-course)

---

## Expected Behavior

### Successful Login
- Redirects to role-specific dashboard
- Session created
- User information displayed
- Navigation menu shows role

### Failed Login
- Error message displayed
- Remains on login page
- No session created

### Unauthorized Access
- "Access Denied" message
- HTTP 403 status
- No data exposed

### Logout
- Session destroyed
- Redirect to login page
- Cannot access dashboards

---

## Common Issues & Solutions

### Issue: "Access Denied" after login
**Solution:** Check that user role in database matches dashboard URL

### Issue: Cannot see children (Parent)
**Solution:** Verify StudentParent relationship exists in database

### Issue: No courses shown (Staff)
**Solution:** Verify courses are assigned to staff in Course table

### Issue: Session not persisting
**Solution:** Check SESSION_SECRET in .env file

---

## Database Verification

To verify all roles are set up correctly:

```sql
-- Check all users
SELECT user_id, username, role FROM User;

-- Check admin
SELECT * FROM Admin;

-- Check students
SELECT * FROM Student;

-- Check staff
SELECT * FROM Staff;

-- Check parents
SELECT * FROM Parent;

-- Check parent-student relationships
SELECT * FROM StudentParent;
```

---

## API Endpoints by Role

### Admin
- GET /admin/dashboard
- GET /admin/api/stats
- GET /admin/api/students

### Student
- GET /student/dashboard
- GET /student/api/profile
- GET /student/api/attendance

### Staff
- GET /staff/dashboard
- GET /staff/api/profile
- GET /staff/api/courses
- GET /staff/api/students

### Parent
- GET /parent/dashboard
- GET /parent/api/profile
- GET /parent/api/children
- GET /parent/api/child-attendance/:studentId
- GET /parent/api/child-results/:studentId

---

## Success Criteria

✅ All four roles can login successfully
✅ Each role sees only their dashboard
✅ Role-based access control works
✅ All dashboard features functional
✅ Parent can view children's data
✅ Staff can view assigned courses
✅ Student can view attendance
✅ Admin can view system statistics
✅ Security measures in place
✅ Responsive design works

---

## Next Steps After Testing

1. Add more test users for each role
2. Implement CRUD operations
3. Add more features per role
4. Enhance parent-child features
5. Add staff attendance marking
6. Implement grade submission
7. Add notification system
8. Create reports and analytics

**Happy Testing!** 🎓
