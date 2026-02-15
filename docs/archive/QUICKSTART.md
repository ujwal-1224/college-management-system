# Quick Start Guide

## Prerequisites Check

Make sure you have:
- ✓ Node.js installed (v14+)
- ✓ MySQL installed and running
- ✓ MySQL root password (or leave blank if none)

## Setup Steps

### 1. Configure Database Connection

Edit the `.env` file and update your MySQL password:

```
DB_PASSWORD=your_mysql_password_here
```

If you don't have a password, leave it blank:
```
DB_PASSWORD=
```

### 2. Setup Database (One Command)

```bash
npm run setup
```

This will:
- Create the `college_management` database
- Create all tables
- Insert the admin user

### 3. (Optional) Add Sample Data

```bash
node scripts/seed-data.js
```

This adds sample students, faculty, courses, and attendance records.

### 4. Start the Server

```bash
npm start
```

### 5. Open Browser

Navigate to: **http://localhost:3000**

## Login Credentials

### Admin Dashboard
- Username: `admin`
- Password: `admin123`

### Student Dashboard (if seeded)
- Username: `student1`
- Password: `student123`

### Faculty Dashboard (if seeded)
- Username: `faculty1`
- Password: `faculty123`

## Troubleshooting

### MySQL Connection Error
- Check if MySQL is running: `mysql -u root -p`
- Verify credentials in `.env` file
- Make sure port 3306 is not blocked

### Port 3000 Already in Use
Change the port in `.env`:
```
PORT=3001
```

### Cannot Find Module Error
Run: `npm install`

## Next Steps

After logging in, you can:
- View role-specific dashboards
- Check attendance records (student)
- View assigned courses (faculty)
- See system statistics (admin)

## Development Mode

For auto-restart on file changes:
```bash
npm run dev
```

Requires: `npm install -g nodemon`
