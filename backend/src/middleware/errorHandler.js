const { AppError } = require('../utils/errors');

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  if (err.code === '23505') {
    return res.status(400).json({ error: 'A record with those unique values already exists' });
  }
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Related record was not found' });
  }
  if (err.code === '23514') {
    return res.status(400).json({ error: 'Value failed a database constraint' });
  }

  console.error(err);
  return res.status(500).json({ error: 'Internal server error' });
}

function notFound(req, res) {
  res.status(404).json({ error: 'Not found' });
}

module.exports = { errorHandler, notFound };
