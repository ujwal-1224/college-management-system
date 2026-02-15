# 🎓 College Management System - START HERE

Welcome! Your complete College Management System is ready.

## 🚀 Quick Start (3 Steps)

### 1️⃣ Configure MySQL Password

Edit `.env` file and add your MySQL password:
```bash
DB_PASSWORD=your_mysql_password
```

### 2️⃣ Test Database Connection

```bash
npm run test-db
```

This will verify your MySQL connection and show database status.

### 3️⃣ Setup Database & Start

```bash
# Create database and tables
npm run setup

# (Optional) Add sample data
npm run seed

# Start the server
npm start
```

### 4️⃣ Open Browser

Go to: **http://localhost:3000**

Login with: `admin` / `admin123`

---

## 📚 Documentation

- **QUICKSTART.md** - Fast setup guide
- **SETUP_INSTRUCTIONS.md** - Detailed setup with troubleshooting
- **README.md** - Complete project documentation

## 🔧 Available Commands

```bash
npm start          # Start the server
npm run dev        # Start with auto-reload (needs nodemon)
npm run setup      # Create database and tables
npm run seed       # Add sample data
npm run test-db    # Test MySQL connection
```

## 👥 Test Accounts (after seeding)

| Role    | Username  | Password    |
|---------|-----------|-------------|
| Admin   | admin     | admin123    |
| Student | student1  | student123  |
| Faculty | faculty1  | faculty123  |

## 📁 Project Structure

```
college-management-system/
├── config/          # Database config & schema
├── middleware/      # Authentication middleware
├── routes/          # API routes (auth, student, faculty, admin)
├── views/           # HTML pages
├── public/          # Static files (CSS, JS)
├── scripts/         # Setup & utility scripts
└── server.js        # Main application
```

## ✨ Features

✅ Role-based authentication (Student, Faculty, Admin)
✅ Secure password hashing with bcrypt
✅ Session management
✅ Responsive Bootstrap UI
✅ MySQL database with 11 tables
✅ RESTful API endpoints
✅ Protected routes

## 🆘 Need Help?

**Connection Issues?**
```bash
npm run test-db
```

**Database Issues?**
See SETUP_INSTRUCTIONS.md

**General Questions?**
Check README.md

---

## 🎯 What's Next?

After setup, you can:
- Explore different role dashboards
- Add more students and faculty
- Create courses and assign faculty
- Record attendance
- Manage exams and results
- Track fee payments
- Allocate hostel rooms

**Ready to begin? Run:** `npm run test-db`
