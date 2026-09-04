const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const isTest = process.env.NODE_ENV === 'test';
const isProd = process.env.NODE_ENV === 'production';

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isTest,
  isProd,
  port: Number(process.env.PORT) || 5000,
  jwtSecret: isTest
    ? process.env.JWT_SECRET || 'test-jwt-secret-do-not-use-in-production'
    : required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  databaseUrl: isTest
    ? process.env.DATABASE_URL || process.env.TEST_DATABASE_URL
    : required('DATABASE_URL'),
  frontendOrigins: (process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  cookieName: process.env.COOKIE_NAME || 'ft_token',
  cookieSecure: process.env.COOKIE_SECURE
    ? process.env.COOKIE_SECURE === 'true'
    : isProd,
  cookieSameSite: process.env.COOKIE_SAMESITE || (isProd ? 'none' : 'lax'),
};

if (!env.databaseUrl) {
  throw new Error('Missing required environment variable: DATABASE_URL');
}

module.exports = env;
