const authService = require('../services/authService');
const { signToken, setAuthCookie, clearAuthCookie } = require('../middleware/auth');
const { asyncHandler } = require('../utils/asyncHandler');

function sendAuth(res, user, status = 200, message) {
  const token = signToken(user);
  setAuthCookie(res, token);
  return res.status(status).json({
    message,
    user,
  });
}

exports.register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  return sendAuth(res, user, 201, 'User created successfully');
});

exports.login = asyncHandler(async (req, res) => {
  const user = await authService.login(req.body);
  return sendAuth(res, user, 200, 'Login successful');
});

exports.me = asyncHandler(async (req, res) => {
  const user = await authService.getById(req.user.userId);
  res.json({ user });
});

exports.logout = asyncHandler(async (req, res) => {
  clearAuthCookie(res);
  res.json({ message: 'Logged out' });
});
