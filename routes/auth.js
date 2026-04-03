const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const path = require('path');
const db = require('../config/database');

// 🔐 GET LOGIN PAGE
router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/login.html'));
});

// 🔐 LOGIN POST
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    console.log("LOGIN ATTEMPT:", username);

    // ✅ FIXED TABLE NAME
    const [users] = await db.query(
      'SELECT * FROM User WHERE username = ?', 
      [username]
    );

    // ❌ USER NOT FOUND
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = users[0];

    // ✅ TEMP PASSWORD CHECK (PLAIN TEXT)
    // (Later you can switch to bcrypt)
   const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // ✅ SESSION SETUP (FIXED FIELD NAMES)
    req.session.userId = user.user_id;
    req.session.username = user.username;
    req.session.role = user.role;

    console.log("LOGIN SUCCESS:", user.username, user.role);

    // ✅ SUCCESS RESPONSE
    res.json({
      success: true,
      role: user.role,
      redirectUrl: `/${user.role}/dashboard`
    });

  } catch (error) {
    console.error("🔥 LOGIN ERROR FULL:");
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 🔓 LOGOUT
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;