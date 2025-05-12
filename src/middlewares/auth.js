const jwt = require('jsonwebtoken');

exports.authenticate = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    console.log('Authorization header:', authHeader);
    if (!authHeader) {
      console.log('No Authorization header');
      return res.status(401).json({ error: 'Por favor, autentique-se' });
    }
    const token = authHeader.replace('Bearer ', '');
    console.log('Token extracted:', token);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.log('Authentication error:', error.message);
    res.status(401).json({ error: 'Por favor, autentique-se' });
  }
};
