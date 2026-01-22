const { verifyToken } = require('../utils/jwt');

exports.protect = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized', success: false });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ message: 'Invalid token', success: false });
  }

  req.user = decoded; // attach user info to request
  next();
};
