const { query } = require('../db/pool');
const { AppError } = require('../utils/errors');
const { mapBudget } = require('../utils/mappers');
const { currentMonthKey, isValidMonthKey } = require('../utils/dates');
const analyticsService = require('./analyticsService');

async function spentForMonth(userId, month) {
  return analyticsService.expenseTotalForMonth(userId, month);
}

async function getBudget(userId, month = currentMonthKey()) {
  if (!isValidMonthKey(month)) {
    throw new AppError(400, 'Month must be YYYY-MM');
  }
  const result = await query(
    'SELECT * FROM monthly_budgets WHERE user_id = $1 AND month = $2',
    [userId, month]
  );
  const spent = await spentForMonth(userId, month);
  if (!result.rowCount) {
    return {
      id: null,
      month,
      amount: null,
      spent,
      remaining: null,
      percent: 0,
      overBudget: false,
      alert: null,
    };
  }
  const mapped = mapBudget(result.rows[0], spent);
  mapped.alert = mapped.overBudget
    ? `Over budget by ₹${Math.abs(mapped.remaining).toFixed(2)} this month.`
    : mapped.percent >= 80
      ? `You have used ${mapped.percent}% of your ${month} budget.`
      : null;
  return mapped;
}

async function upsertBudget(userId, { month, amount }) {
  const targetMonth = month || currentMonthKey();
  if (!isValidMonthKey(targetMonth)) {
    throw new AppError(400, 'Month must be YYYY-MM');
  }
  const amountNum = Number(amount);
  if (Number.isNaN(amountNum) || amountNum <= 0) {
    throw new AppError(400, 'Budget amount must be a positive number');
  }
  const result = await query(
    `INSERT INTO monthly_budgets (user_id, month, amount, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (user_id, month)
     DO UPDATE SET amount = EXCLUDED.amount, updated_at = NOW()
     RETURNING *`,
    [userId, targetMonth, amountNum]
  );
  const spent = await spentForMonth(userId, targetMonth);
  const mapped = mapBudget(result.rows[0], spent);
  mapped.alert = mapped.overBudget
    ? `Over budget by ₹${Math.abs(mapped.remaining).toFixed(2)} this month.`
    : null;
  return mapped;
}

async function listBudgets(userId) {
  const result = await query(
    'SELECT * FROM monthly_budgets WHERE user_id = $1 ORDER BY month DESC',
    [userId]
  );
  const items = [];
  for (const row of result.rows) {
    const spent = await spentForMonth(userId, row.month);
    items.push(mapBudget(row, spent));
  }
  return items;
}

module.exports = { getBudget, upsertBudget, listBudgets };
