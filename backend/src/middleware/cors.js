const env = require('../config/env');

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (env.frontendOrigins.includes(origin)) return true;
  if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) return true;
  return false;
}

module.exports = { isAllowedOrigin };
