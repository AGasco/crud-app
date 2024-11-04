const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

module.exports = function (req, res, next) {
  const authHeader = req.header('Authorization');
  if (!authHeader)
    return res.status(401).json({ message: 'Authorization denied' });

  const tokenParts = authHeader.split(' ');

  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer')
    return res.status(401).json({ message: 'Invalid authorization format' });

  const token = tokenParts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user; // { id: user.id, role: user.role }
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};
