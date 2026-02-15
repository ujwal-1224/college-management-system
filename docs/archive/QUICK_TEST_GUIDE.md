# Quick Navigation Test Guide

## 🚀 Fast Test (2 minutes)

### Step 1: Open Application
```
http://localhost:3001
```

### Step 2: Login
```
Username: student1
Password: student123
```

### Step 3: Test Navbar Buttons

Click each button in the navbar and verify:

| Button | Expected Result | Status |
|--------|----------------|--------|
| **Dashboard** | Shows overview with stats and quick actions | ⬜ |
| **Courses** | Shows enrolled courses table | ⬜ |
| **Fees** | Shows fee breakdown and payment form | ⬜ |
| **🔔 (Bell)** | Shows notifications list | ⬜ |

### Step 4: Test Quick Actions

From Dashboard, click:

| Button | Expected Result | Status |
|--------|----------------|--------|
| **My Courses** | Navigates to courses section | ⬜ |
| **Pay Fees** | Navigates to fees section | ⬜ |
| **Edit Profile** | Navigates to profile section | ⬜ |
| **Timetable** | Navigates to timetable section | ⬜ |

### Step 5: Test Back Buttons

From any section, click **← Back** button:
- Should return to Dashboard overview ⬜

### Step 6: Check Active State

When you click a navbar button:
- Button should turn **blue** ⬜
- Button should have **underline** ⬜
- Button should be **bold** ⬜

### Step 7: Check Console

Press **F12** to open browser console:
- Should see **no red errors** ⬜
- Should see data loading messages ⬜

## ✅ Success Criteria

All checkboxes above should be checked ✓

## 🐛 If Something Doesn't Work

### Quick Fixes:

1. **Hard refresh browser**
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

2. **Check server is running**
   ```bash
   # Should show output
   lsof -i :3001
   ```

3. **Restart server**
   ```bash
   pkill -f "node server-demo.js"
   node server-demo.js
   ```

4. **Test standalone navigation**
   ```bash
   open test-navigation.html
   ```

## 📱 Mobile Test

1. Open browser DevTools (F12)
2. Click device toolbar icon (phone icon)
3. Select mobile device (iPhone, Android)
4. Test:
   - Hamburger menu opens ⬜
   - All navbar links work ⬜
   - Menu closes after click ⬜

## 🎯 Expected Behavior

### When clicking "Courses":
1. Overview section disappears
2. Courses section appears
3. "Courses" navbar button turns blue
4. Table shows enrolled courses
5. No console errors

### When clicking "Fees":
1. Current section disappears
2. Fees section appears
3. "Fees" navbar button turns blue
4. Fee breakdown displays
5. Payment history loads

## 📊 Data Should Load

Each section should show real data:
- **Dashboard**: CGPA, pending dues, hostel room
- **Courses**: 4 enrolled courses
- **Timetable**: Weekly schedule
- **Fees**: ₹71,000 total, ₹6,000 pending
- **Notifications**: 4 announcements
- **Profile**: Student details and hostel info

## 🔍 Console Messages

You should see:
```
✓ Profile loaded
✓ Academic progress loaded
✓ Attendance loaded
✓ Results loaded
✓ Fees loaded
✓ Notifications loaded
```

## ❌ Should NOT See

- "404 Not Found" errors
- "Function not defined" errors
- "Cannot read property" errors
- Blank sections
- Unresponsive buttons

## 📝 Report Issues

If test fails, note:
1. Which button doesn't work
2. Console error message
3. Browser and version
4. Screenshot if possible

## 🎉 All Tests Pass?

Navigation is working correctly! You can now:
- Navigate between all sections
- Use quick actions
- View all student data
- Make payments (demo)
- Update profile (demo)
- View notifications

---

**Test Duration**: ~2 minutes
**Last Updated**: February 15, 2026
**Status**: ✅ All navigation working
