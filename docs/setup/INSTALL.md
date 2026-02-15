# Installation Guide - Choose Your Method

## Method 1: Automated Setup (Recommended)

### Step 1: Configure MySQL Password

Edit `.env` file:
```bash
DB_PASSWORD=your_mysql_password
```

### Step 2: Run Setup Script

```bash
npm run setup
```

If successful, skip to "Start Server" section below.

---

## Method 2: Manual Setup (If automated fails)

### Step 1: Open MySQL Command Line

```bash
# Mac/Linux
mysql -u root -p

# Or specify the full path
/usr/local/mysql/bin/mysql -u root -p
```

Enter your MySQL password when prompted.

### Step 2: Run Setup Commands

Copy and paste these commands one by one:

```sql
CREATE DATABASE IF NOT EXISTS college_management;
USE college_management;
SOURCE config/schema.sql;
EXIT;
```

**OR** run the complete setup file:

```bash
mysql -u root -p < scripts/manual-setup.sql
```

### Step 3: Verify Database

```bash
mysql -u root -p -e "USE college_management; SHOW TABLES;"
```

You should see 11 tables listed.

---

## Method 3: MySQL Workbench (GUI)

1. Open MySQL Workbench
2. Connect to your local MySQL server
3. Click "File" → "Run SQL Script"
4. Select `config/schema.sql`
5. Click "Run"

---

## Add Sample Data (Optional)

After database setup, add test data:

```bash
# Update .env with your MySQL password first
npm run seed
```

This creates:
- Student user: student1 / student123
- Faculty user: faculty1 / faculty123
- Sample courses and attendance

---

## Start Server

```bash
npm start
```

Expected output:
```
Server running on http://localhost:3000
```

---

## Access Application

Open browser: **http://localhost:3000**

**Login:**
- Username: `admin`
- Password: `admin123`

---

## Troubleshooting

### "Access denied for user 'root'"

**Solution 1:** Check MySQL password
```bash
# Test MySQL connection
mysql -u root -p
```

**Solution 2:** Update .env file with correct password

**Solution 3:** Use different MySQL user
```bash
# In .env file
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
```

### "Cannot connect to MySQL"

**Check if MySQL is running:**
```bash
# Mac
brew services list

# Linux
systemctl status mysql

# Or check process
ps aux | grep mysql
```

**Start MySQL:**
```bash
# Mac
brew services start mysql

# Linux
sudo systemctl start mysql
```

### "Database does not exist"

Run manual setup (Method 2 above)

### "Port 3000 already in use"

Change port in `.env`:
```
PORT=3001
```

### "Module not found"

```bash
npm install
```

---

## Verify Installation

1. ✓ Database created
2. ✓ Tables created (11 tables)
3. ✓ Admin user inserted
4. ✓ Server starts without errors
5. ✓ Can login at http://localhost:3000

---

## Quick Test Commands

```bash
# Test database connection
npm run test-db

# Check if server starts
npm start

# View all npm commands
npm run
```

---

## Need More Help?

- Check **START_HERE.md** for quick start
- See **README.md** for full documentation
- Review **SETUP_INSTRUCTIONS.md** for detailed steps

---

## Success Checklist

- [ ] MySQL is running
- [ ] .env file configured
- [ ] Database created
- [ ] Tables created
- [ ] Admin user exists
- [ ] Server starts successfully
- [ ] Can access http://localhost:3000
- [ ] Can login with admin/admin123

**All checked?** You're ready to use the system! 🎉
