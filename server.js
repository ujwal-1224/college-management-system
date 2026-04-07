const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();

// ✅ BODY PARSER (VERY IMPORTANT)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ SESSION
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true
}));

// ✅ STATIC FILES
app.use(express.static('public'));

// ✅ ROUTES
const authRoutes = require('./routes/auth');
app.use('/', authRoutes);

// (your other routes here...)

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
});