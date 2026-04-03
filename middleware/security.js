const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

// Rate limiting for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many login attempts. Please try again after 15 minutes.'
    });
  }
});

// Rate limiting for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

// Strict rate limiting for sensitive operations
const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  message: 'Too many requests for this operation',
  standardHeaders: true,
  legacyHeaders: false
});

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Sanitize body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    });
  }
  
  // Sanitize query
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key].trim();
      }
    });
  }
  
  next();
};

// Security headers
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net', 'fonts.googleapis.com'],
      scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
      fontSrc: ["'self'", 'cdn.jsdelivr.net', 'fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Prevent parameter pollution
const preventParamPollution = hpp({
  whitelist: ['page', 'limit', 'sort', 'fields']
});

// Check account lock status
const checkAccountLock = async (req, res, next) => {
  if (!req.body.username) {
    return next();
  }

  try {
    const db = require('../config/database');
    const [users] = await db.query(
      'SELECT locked_until, failed_login_attempts FROM User WHERE username = ?',
      [req.body.username]
    );

    if (users.length > 0 && users[0].locked_until) {
      const lockTime = new Date(users[0].locked_until);
      const now = new Date();

      if (now < lockTime) {
        const minutesLeft = Math.ceil((lockTime - now) / 60000);
        return res.status(423).json({
          success: false,
          message: `Account is locked. Please try again in ${minutesLeft} minutes.`
        });
      } else {
        // Unlock account if lock time has passed
        await db.query(
          'UPDATE User SET locked_until = NULL, failed_login_attempts = 0 WHERE username = ?',
          [req.body.username]
        );
      }
    }

    next();
  } catch (error) {
    console.error('Account lock check error:', error);
    next();
  }
};

// Log failed login attempt
const logFailedLogin = async (username) => {
  try {
    const db = require('../config/database');
    const [users] = await db.query(
      'SELECT user_id, failed_login_attempts FROM User WHERE username = ?',
      [username]
    );

    if (users.length > 0) {
      const attempts = users[0].failed_login_attempts + 1;
      const maxAttempts = 5;

      if (attempts >= maxAttempts) {
        // Lock account for 30 minutes
        const lockUntil = new Date(Date.now() + 30 * 60 * 1000);
        await db.query(
          'UPDATE User SET failed_login_attempts = ?, locked_until = ? WHERE username = ?',
          [attempts, lockUntil, username]
        );
      } else {
        await db.query(
          'UPDATE User SET failed_login_attempts = ? WHERE username = ?',
          [attempts, username]
        );
      }
    }
  } catch (error) {
    console.error('Failed login logging error:', error);
  }
};

// Reset failed login attempts on successful login
const resetFailedAttempts = async (username) => {
  try {
    const db = require('../config/database');
    await db.query(
      'UPDATE User SET failed_login_attempts = 0, locked_until = NULL, last_login = NOW() WHERE username = ?',
      [username]
    );
  } catch (error) {
    console.error('Reset failed attempts error:', error);
  }
};

// Validate file upload
const validateFileUpload = (allowedTypes, maxSize = 5 * 1024 * 1024) => {
  return (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Check file type
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
      });
    }

    // Check file size
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum size: ${maxSize / (1024 * 1024)}MB`
      });
    }

    next();
  };
};

// CSRF token generation and validation
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

// Generate CSRF token endpoint
const getCsrfToken = (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
};

module.exports = {
  loginLimiter,
  apiLimiter,
  strictLimiter,
  sanitizeInput,
  securityHeaders,
  preventParamPollution,
  checkAccountLock,
  logFailedLogin,
  resetFailedAttempts,
  validateFileUpload,
  csrfProtection,
  getCsrfToken,
  xssClean: xss(),
  mongoSanitize: mongoSanitize()
};
