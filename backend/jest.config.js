process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-do-not-use-in-production';
process.env.DATABASE_URL = 'postgres://fintrack:fintrack@127.0.0.1:5432/fintrack_test';
process.env.COOKIE_SECURE = 'false';
process.env.COOKIE_SAMESITE = 'lax';

module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
  forceExit: true,
  testMatch: ['**/tests/**/*.test.js'],
};
