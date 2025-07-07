function manageLayout(req, res, next) {
  res.locals.layout = 'manage_layout';
  next();
};

module.exports = manageLayout;