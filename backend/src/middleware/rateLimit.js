const rateLimit = require('express-rate-limit');
const env = require('../config/env');

function skipInTest() {
  return env.isTest;
}

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: { error: 'Too many requests, please try again later' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: { error: 'Too many authentication attempts, please try again later' },
});

module.exports = { generalLimiter, authLimiter };
