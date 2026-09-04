const { query } = require('../db/pool');
const { AppError } = require('../utils/errors');
const { mapGoal } = require('../utils/mappers');

async function listGoals(userId) {
  const result = await query(
    'SELECT * FROM financial_goals WHERE user_id = $1 ORDER BY deadline NULLS LAST, id DESC',
    [userId]
  );
  return result.rows.map(mapGoal);
}

async function getOwned(userId, id) {
  const result = await query(
    'SELECT * FROM financial_goals WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  if (!result.rowCount) {
    throw new AppError(404, 'Goal not found');
  }
  return result.rows[0];
}

async function createGoal(userId, body) {
  const name = String(body.name || '').trim();
  const target = Number(body.target_amount);
  const current = Number(body.current_amount || 0);
  const deadline = body.deadline || null;
  if (!name) throw new AppError(400, 'Goal name is required');
  if (Number.isNaN(target) || target <= 0) {
    throw new AppError(400, 'Target amount must be a positive number');
  }
  if (Number.isNaN(current) || current < 0) {
    throw new AppError(400, 'Current amount cannot be negative');
  }
  const result = await query(
    `INSERT INTO financial_goals (user_id, name, target_amount, current_amount, deadline)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, name, target, current, deadline]
  );
  return mapGoal(result.rows[0]);
}

async function updateGoal(userId, id, body) {
  const existing = await getOwned(userId, id);
  const name = body.name !== undefined ? String(body.name).trim() : existing.name;
  const target = body.target_amount !== undefined ? Number(body.target_amount) : Number(existing.target_amount);
  const current =
    body.current_amount !== undefined ? Number(body.current_amount) : Number(existing.current_amount);
  const deadline = body.deadline !== undefined ? body.deadline || null : existing.deadline;
  if (!name) throw new AppError(400, 'Goal name is required');
  if (Number.isNaN(target) || target <= 0) {
    throw new AppError(400, 'Target amount must be a positive number');
  }
  if (Number.isNaN(current) || current < 0) {
    throw new AppError(400, 'Current amount cannot be negative');
  }
  const result = await query(
    `UPDATE financial_goals
     SET name = $1, target_amount = $2, current_amount = $3, deadline = $4, updated_at = NOW()
     WHERE id = $5 AND user_id = $6
     RETURNING *`,
    [name, target, current, deadline, id, userId]
  );
  return mapGoal(result.rows[0]);
}

async function deleteGoal(userId, id) {
  await getOwned(userId, id);
  await query('DELETE FROM financial_goals WHERE id = $1 AND user_id = $2', [id, userId]);
}

module.exports = { listGoals, createGoal, updateGoal, deleteGoal };
