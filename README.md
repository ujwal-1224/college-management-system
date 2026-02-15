# College Management System

> A comprehensive full-stack College Management System with enterprise-grade UI, supporting four user roles: Admin, Student, Staff, and Parent.

[![Status](https://img.shields.io/badge/status-production%20ready-brightgreen)]()
[![Version](https://img.shields.io/badge/version-2.0-blue)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

![Enterprise UI](https://img.shields.io/badge/UI-Enterprise%20Grade-1E3A8A)
![Node.js](https://img.shields.io/badge/Node.js-14%2B-339933)
![Express](https://img.shields.io/badge/Express-4.x-000000)
![MySQL](https://img.shields.io/badge/MySQL-5.7%2B-4479A1)

---

## 🚀 Quick Start

### Start in 30 Seconds

```bash
# 1. Install dependencies
npm install

# 2. Start demo server (no database required)
node server-demo.js

# 3. Open browser
http://localhost:3001
```

### Demo Credentials

| Role    | Username   | Password    |
|---------|------------|-------------|
| Admin   | admin      | admin123    |
| Student | ujwal      | student123  |
| Staff   | soubhagya  | staff123    |
| Parent  | shashi     | parent123   |

---

## ✨ Features

### 🎓 Multi-Role System
- **Admin** - System administration, comprehensive reports, analytics
- **Student** - Academic records, attendance, grades, fee management
- **Staff** - Course management, attendance marking, grade entry, timetable
- **Parent** - Child monitoring, attendance tracking, results viewing

### 📊 Core Modules

#### Attendance Management
- Mark attendance by course and date
- View attendance records and history
- Generate comprehensive reports
- Support for Present, Absent, Late statuses

#### Grade Management
- Create exams and upload marks
- Auto-grade calculation (A+, A, B+, B, C, D, F)
- View results and performance analytics
- Generate detailed reports

#### Timetable Management
- View weekly class schedules
- Day, time, course, and room details
- Current day highlighting
- Clean tabular format

#### Fee Management
- View fee breakdown and payment history
- Multiple payment methods support
- Receipt generation
- Parent access to child's fee status

#### Profile Management
- Edit personal information
- Change password securely
- View hostel information
- Update contact details

### 🎨 Enterprise UI Design

#### Design Principles
✅ Clean, minimal, professional  
✅ No emojis or playful elements  
✅ Flat design with subtle shadows  
✅ Fast performance (0.15s transitions)  
✅ Fully responsive (desktop, tablet, mobile)  
✅ Production-grade quality  

#### Color Palette
```
Primary:    #1E3A8A (Navy Blue)
Accent:     #2563EB (Bright Blue)
Background: #F8FAFC (Light Grey)
Surface:    #FFFFFF (White)
Success:    #22C55E (Green)
Warning:    #F59E0B (Orange)
Error:      #EF4444 (Red)
```

---

## 🛠️ Technology Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MySQL** - Database (with demo mode fallback)
- **bcrypt** - Password hashing
- **express-session** - Session management

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Custom enterprise theme
- **JavaScript** - Vanilla JS
- **Bootstrap 5.3** - Grid system and utilities
- **Bootstrap Icons** - Professional iconography

### Architecture
- MVC Pattern
- RESTful APIs
- Session-based Authentication
- Role-based Access Control

---

## 📦 Installation

### Prerequisites
```bash
Node.js >= 14.x
npm >= 6.x
MySQL >= 5.7 (for production mode)
```

### Demo Mode (No Database)
```bash
# Install dependencies
npm install

# Start demo server
node server-demo.js

# Access at http://localhost:3001
```

### Production Mode (with MySQL)
```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your MySQL credentials

# 3. Create database and tables
mysql -u root -p < config/schema.sql

# 4. Seed data (optional)
node scripts/seed-data.js

# 5. Start production server
npm start

# Access at http://localhost:3000
```

---

## 📁 Project Structure

```
college-management-system/
├── config/
│   ├── database.js              # MySQL connection
│   ├── demoData.js              # Centralized demo data
│   └── schema.sql               # Database schema
├── middleware/
│   └── auth.js                  # Authentication middleware
├── routes/
│   ├── auth.js                  # Login/logout routes
│   ├── admin.js                 # Admin routes
│   ├── student.js               # Student routes
│   ├── staff.js                 # Staff routes
│   └── parent.js                # Parent routes
├── views/
│   ├── index.html               # Landing page
│   ├── login.html               # Login page
│   ├── admin-*.html             # Admin pages
│   ├── student-*.html           # Student pages
│   ├── staff-*.html             # Staff pages
│   └── parent-*.html            # Parent pages
├── public/
│   ├── css/
│   │   └── enterprise-theme.css # Main enterprise theme
│   └── js/
│       ├── admin-*.js           # Admin scripts
│       ├── student-*.js         # Student scripts
│       ├── staff-*.js           # Staff scripts
│       ├── parent-*.js          # Parent scripts
│       └── utils.js             # Shared utilities
├── scripts/
│   ├── seed-data.js             # Database seeding
│   └── test-connection.js       # DB connection test
├── docs/
│   ├── features/                # Feature documentation
│   ├── setup/                   # Setup guides
│   └── archive/                 # Historical docs
├── server.js                    # Production server (MySQL)
├── server-demo.js               # Demo server (no DB)
├── package.json                 # Dependencies
└── .env                         # Environment config
```

---

## 🔐 Security Features

### Authentication
- ✅ bcrypt password hashing (10 salt rounds)
- ✅ Session-based authentication
- ✅ Secure session cookies
- ✅ Login required for protected routes

### Authorization
- ✅ Role-based access control
- ✅ Middleware protection on all routes
- ✅ User role verification
- ✅ Unauthorized access prevention

### Data Protection
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS protection (input sanitization)
- ✅ CSRF protection (session tokens)
- ✅ Secure password storage

---

## 📖 API Documentation

### Authentication Endpoints
```
POST   /login              # User login
GET    /logout             # User logout
```

### Admin Endpoints
```
GET    /admin/dashboard                # Admin dashboard
GET    /admin/attendance-reports       # Attendance reports
GET    /admin/results-reports          # Results reports
GET    /admin/api/attendance-report    # Get attendance data
GET    /admin/api/results-report       # Get results data
```

### Staff Endpoints
```
GET    /staff/dashboard                # Staff dashboard
GET    /staff/timetable                # Staff timetable
GET    /staff/attendance               # Attendance marking
GET    /staff/grades                   # Grade management
GET    /staff/api/timetable            # Get timetable data
POST   /staff/api/attendance           # Mark attendance
POST   /staff/api/marks                # Upload marks
```

### Student Endpoints
```
GET    /student/dashboard              # Student dashboard
GET    /student/api/profile            # Get profile
GET    /student/api/attendance         # Get attendance
GET    /student/api/results            # Get results
POST   /student/api/payment            # Make payment
```

### Parent Endpoints
```
GET    /parent/dashboard               # Parent dashboard
GET    /parent/api/children            # Get children
GET    /parent/api/attendance/:id      # Get child attendance
GET    /parent/api/results/:id         # Get child results
```

---

## 🧪 Testing

### Manual Testing
```bash
# Start demo server
node server-demo.js

# Follow testing guide
See FINAL_TESTING_GUIDE.md
```

### Test Coverage
- ✅ All pages tested
- ✅ All features functional
- ✅ Cross-browser tested
- ✅ Responsive design verified
- ✅ Security tested

---

## 📚 Documentation

### Essential Guides
- **[QUICK_START.md](QUICK_START.md)** - Get started in 30 seconds
- **[FINAL_TESTING_GUIDE.md](FINAL_TESTING_GUIDE.md)** - Comprehensive testing checklist
- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Complete project overview
- **[ENTERPRISE_UI_COMPLETE.md](ENTERPRISE_UI_COMPLETE.md)** - UI implementation details
- **[ENTERPRISE_UI_IMPLEMENTATION_PLAN.md](ENTERPRISE_UI_IMPLEMENTATION_PLAN.md)** - UI design guide

### Feature Documentation
- **[docs/features/ATTENDANCE_FEATURE.md](docs/features/ATTENDANCE_FEATURE.md)** - Attendance system
- **[docs/features/GRADES_FEATURE.md](docs/features/GRADES_FEATURE.md)** - Grade management

### Setup Guides
- **[docs/setup/SETUP_INSTRUCTIONS.md](docs/setup/SETUP_INSTRUCTIONS.md)** - Installation guide
- **[docs/setup/EXTENDED_SETUP_GUIDE.md](docs/setup/EXTENDED_SETUP_GUIDE.md)** - Advanced setup

---

## 🌐 Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS/Android)

---

## 📱 Responsive Design

- ✅ Desktop (1280px+)
- ✅ Tablet (768px - 1279px)
- ✅ Mobile (< 768px)

---

## 🚀 Deployment

### Pre-Deployment Checklist
- [ ] Update .env with production values
- [ ] Configure production database
- [ ] Run database migrations
- [ ] Test all features
- [ ] Configure SSL/HTTPS
- [ ] Set up monitoring
- [ ] Configure backups

### Deployment Steps
1. Deploy to production server
2. Configure domain/DNS
3. Set up SSL certificate
4. Configure firewall rules
5. Monitor error logs
6. Test production environment

---

## 🔄 Version History

### Version 2.0 (Current) - February 15, 2026
- ✅ Complete enterprise UI redesign
- ✅ All modules updated with new theme
- ✅ Improved performance and responsiveness
- ✅ Enhanced user experience
- ✅ Production-ready quality

### Version 1.5
- ✅ Added timetable management
- ✅ Centralized demo data
- ✅ Improved navigation

### Version 1.0
- ✅ Initial release
- ✅ Four role system
- ✅ Attendance management
- ✅ Grade management

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👥 Authors

- **Development Team** - Initial work and enterprise UI implementation

---

## 🙏 Acknowledgments

- Bootstrap team for the excellent framework
- Bootstrap Icons for professional iconography
- Node.js and Express.js communities
- MySQL team for reliable database

---

## 📞 Support

### Documentation
All documentation is available in the project:
- Quick start guides
- Testing guides
- Feature documentation
- API documentation

### Demo Access
- **URL:** http://localhost:3001
- **Mode:** Demo (no database required)
- **Credentials:** See table above

---

## 🎯 Future Enhancements

### High Priority
- [ ] Real-time notifications system
- [ ] Data export functionality (PDF/Excel)
- [ ] Advanced search and filtering
- [ ] Email notification system
- [ ] Document upload/management

### Medium Priority
- [ ] Dark mode theme variant
- [ ] Advanced analytics dashboard
- [ ] Course scheduling system
- [ ] Library management module
- [ ] Hostel management module

### Low Priority
- [ ] Mobile app (React Native)
- [ ] API documentation (Swagger)
- [ ] Automated testing suite
- [ ] Performance monitoring
- [ ] Multi-language support

---

## 📊 Project Status

- **Status:** ✅ Production Ready
- **Quality:** Enterprise Grade
- **Version:** 2.0
- **Last Updated:** February 15, 2026

---

## 🔗 Quick Links

- [Quick Start Guide](QUICK_START.md)
- [Testing Guide](FINAL_TESTING_GUIDE.md)
- [Project Summary](PROJECT_SUMMARY.md)
- [Enterprise UI Details](ENTERPRISE_UI_COMPLETE.md)

---

**Built with ❤️ for educational institutions**

*Making education management simple, efficient, and professional.*
