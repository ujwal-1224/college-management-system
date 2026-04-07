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
  const { username, password, role } = req.body;

  try {
    const [users] = await db.query(
      'SELECT * FROM User WHERE username = ?', 
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = users[0];

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // 🔒 Enforce role match
    if (role && user.role !== role) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials for selected role'
      });
    }

    req.session.userId = user.user_id;
    req.session.username = user.username;
    req.session.role = user.role;

    res.json({
      success: true,
      role: user.role,
      redirectUrl: `/${user.role}/dashboard`
    });

  } catch (error) {
    console.error('[LOGIN ERROR]', error.message);

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