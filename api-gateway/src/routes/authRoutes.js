const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const dotenv = require('dotenv');

dotenv.config();

const router = express.Router();

// Proxy all auth requests to the Auth Service
router.use('/', createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/auth': '/api/auth' },
  logLevel: 'error',
  onError: (err, req, res) => {
    console.error(`Auth Service Proxy Error: ${err.message}`);
    res.status(500).json({ error: 'Authentication service unavailable' });
  }
}));

module.exports = router;