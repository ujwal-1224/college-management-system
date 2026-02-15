const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  res.redirect('/login');
};

const isRole = (...roles) => {
  return (req, res, next) => {
    if (req.session && req.session.role && roles.includes(req.session.role)) {
      return next();
    }
    res.status(403).send('Access Denied: You do not have permission to access this page');
  };
};

module.exports = { isAuthenticated, isRole };
