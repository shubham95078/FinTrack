const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { AppError } = require('../utils/errors');

function readToken(req) {
  const cookieToken = req.cookies && req.cookies[env.cookieName];
  if (cookieToken) return cookieToken;
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.slice(7);
  }
  return null;
}

function setAuthCookie(res, token) {
  res.cookie(env.cookieName, token, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
  });
}

function clearAuthCookie(res) {
  res.clearCookie(env.cookieName, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    path: '/',
  });
}

function signToken(user) {
  return jwt.sign({ userId: user.id, username: user.username }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

function authenticate(req, res, next) {
  const token = readToken(req);
  if (!token) {
    return next(new AppError(401, 'Access token required'));
  }
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = { userId: payload.userId, username: payload.username };
    return next();
  } catch {
    return next(new AppError(403, 'Invalid or expired token'));
  }
}

module.exports = { authenticate, setAuthCookie, clearAuthCookie, signToken };
