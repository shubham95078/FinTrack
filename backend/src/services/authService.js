const bcrypt = require('bcryptjs');
const { query } = require('../db/pool');
const { AppError } = require('../utils/errors');
const { mapUser } = require('../utils/mappers');

async function register({ username, email, password }) {
  const existing = await query(
    'SELECT id FROM users WHERE username = $1 OR email = $2',
    [username, email]
  );
  if (existing.rowCount > 0) {
    throw new AppError(400, 'Username or email already exists');
  }
  const hashed = await bcrypt.hash(password, 10);
  const result = await query(
    `INSERT INTO users (username, email, password)
     VALUES ($1, $2, $3)
     RETURNING id, username, email`,
    [username, email, hashed]
  );
  return mapUser(result.rows[0]);
}

async function login({ username, password }) {
  const result = await query('SELECT * FROM users WHERE username = $1', [username]);
  const user = result.rows[0];
  if (!user) {
    throw new AppError(401, 'Invalid credentials');
  }
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw new AppError(401, 'Invalid credentials');
  }
  return mapUser(user);
}

async function getById(id) {
  const result = await query(
    'SELECT id, username, email FROM users WHERE id = $1',
    [id]
  );
  if (!result.rowCount) {
    throw new AppError(401, 'User not found');
  }
  return mapUser(result.rows[0]);
}

module.exports = { register, login, getById };
