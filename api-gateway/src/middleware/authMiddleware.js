const { expressjwt: jwt } = require('express-jwt');
const jwksRsa = require('jwks-rsa');
const dotenv = require('dotenv');

dotenv.config();

// JWT authentication middleware
const authMiddleware = jwt({
  secret: process.env.JWT_SECRET,
  algorithms: ['HS256'],
  credentialsRequired: true,
  getToken: function fromHeaderOrQuerystring(req) {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
      return req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
      return req.query.token;
    }
    return null;
  }
}).unless({
  path: [
    '/health',
    '/api/auth/login',
    '/api/auth/register',
    { url: /^\/api\/auth\/verify\/.*/, methods: ['GET'] }
  ]
});

// Role-based authorization middleware
const authorizeRoles = (roles = []) => {
  return (req, res, next) => {
    if (!req.auth || !req.auth.roles) {
      return res.status(403).json({ error: 'Forbidden: Role verification failed' });
    }

    const userRoles = req.auth.roles;
    const hasRole = roles.some(role => userRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    next();
  };
};

module.exports = {
  authMiddleware,
  authorizeRoles
};