const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Body parsing
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Compression (optional)
try { app.use(require('compression')()); } catch (e) {}

// Static files
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// HTTP logging (optional)
try {
  const { httpLogger } = require('./middleware/logger');
  app.use(httpLogger);
} catch (e) {}

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'college-cms-secret-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Routes
app.use('/',        require('./routes/auth'));
app.use('/student', require('./routes/student'));
app.use('/staff',   require('./routes/staff'));
app.use('/faculty', require('./routes/faculty'));
app.use('/parent',  require('./routes/parent'));
app.use('/admin',   require('./routes/admin'));

// Root redirect
app.get('/', (req, res) => {
  if (req.session.userId) return res.redirect('/' + req.session.role + '/dashboard');
  res.sendFile('index.html', { root: './views' });
});

// 404 handler
app.use((req, res) => {
  if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
    return res.status(404).json({ success: false, message: 'Route not found' });
  }
  res.status(404).redirect('/login');
});

// Global error handler
app.use((err, req, res, _next) => {
  const status = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Something went wrong. Please try again.';
  console.error('[ERROR]', err.message);
  if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
    return res.status(status).json({ success: false, message });
  }
  res.status(status).send(message);
});

// Start server
app.listen(PORT, () => {
  console.log('\n✓ College Management System');
  console.log('✓ Server running on http://localhost:' + PORT);
  console.log('✓ Environment: ' + (process.env.NODE_ENV || 'development'));
});

module.exports = app;
