const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/database');

router.get('/login', (req, res) => {
  if (req.session.userId) {
    return res.redirect(`/${req.session.role}/dashboard`);
  }
  res.sendFile('login.html', { root: './views' });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [users] = await db.query('SELECT * FROM User WHERE username = ?', [username]);
    
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = users[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
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
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

module.exports = router;
