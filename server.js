const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'college-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Routes
app.use('/', require('./routes/auth'));
app.use('/student', require('./routes/student'));
app.use('/staff', require('./routes/staff'));
app.use('/parent', require('./routes/parent'));
app.use('/admin', require('./routes/admin'));

// Root redirect
app.get('/', (req, res) => {
  if (req.session.userId) {
    res.redirect(`/${req.session.role}/dashboard`);
  } else {
    res.sendFile('index.html', { root: './views' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
