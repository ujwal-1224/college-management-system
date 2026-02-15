# Complete Setup Instructions

## Step-by-Step Setup

### Step 1: Update MySQL Credentials

Open the `.env` file and add your MySQL password:

```bash
# If you have a MySQL password:
DB_PASSWORD=your_password

# If no password (common on Mac with Homebrew):
DB_PASSWORD=
```

### Step 2: Create Database Manually

Open MySQL command line:

```bash
mysql -u root -p
```

Then run:

```sql
CREATE DATABASE IF NOT EXISTS college_management;
USE college_management;
SOURCE config/schema.sql;
EXIT;
```

**OR** use the automated script:

```bash
npm run setup
```

### Step 3: (Optional) Add Sample Data

```bash
node scripts/seed-data.js
```

This creates:
- 1 Student user (student1 / student123)
- 1 Faculty user (faculty1 / faculty123)
- 3 Sample courses
- Sample attendance records
- 2 Hostels

### Step 4: Start the Application

```bash
npm start
```

You should see:
```
Server running on http://localhost:3000
```

### Step 5: Access the Application

Open your browser: **http://localhost:3000**

## Default Login

**Admin Access:**
- Username: `admin`
- Password: `admin123`

## Verify Installation

1. Login with admin credentials
2. You should see the Admin Dashboard
3. Check that statistics are displayed
4. Try logging out and logging back in

## Common Issues

### Issue: "Access denied for user 'root'"
**Solution:** Update `DB_PASSWORD` in `.env` file with your MySQL password

### Issue: "Cannot connect to MySQL"
**Solution:** 
- Check if MySQL is running: `brew services list` (Mac) or `systemctl status mysql` (Linux)
- Start MySQL: `brew services start mysql` (Mac) or `sudo systemctl start mysql` (Linux)

### Issue: "Database does not exist"
**Solution:** Run the database creation commands from Step 2

### Issue: "Port 3000 already in use"
**Solution:** Change port in `.env`:
```
PORT=3001
```

### Issue: "Module not found"
**Solution:** 
```bash
npm install
```

## Testing Different Roles

After seeding data, test all three roles:

1. **Admin Dashboard** (admin / admin123)
   - View total students, faculty, courses
   - See recent student list

2. **Student Dashboard** (student1 / student123)
   - View profile information
   - Check attendance records

3. **Faculty Dashboard** (faculty1 / faculty123)
   - View profile
   - See assigned courses

## Database Tables Created

- User (authentication)
- Student, Faculty, Admin (user profiles)
- Course (course management)
- Attendance (attendance tracking)
- Exam, Result (examination system)
- FeePayment (fee management)
- Hostel, HostelAllocation (hostel management)

## Next Steps

The system is now ready for:
- Adding more students, faculty, courses
- Recording attendance
- Managing exams and results
- Tracking fee payments
- Allocating hostel rooms

## Need Help?

Check the main README.md for API documentation and architecture details.
