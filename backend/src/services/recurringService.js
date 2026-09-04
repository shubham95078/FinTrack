const { query, withTransaction } = require('../db/pool');
const { AppError } = require('../utils/errors');
const { mapRecurring } = require('../utils/mappers');
const { todayString, addFrequency, toDateString } = require('../utils/dates');
const entryService = require('./entryService');

function normalizeRecurring(body, existing = {}) {
  const data = entryService.normalizeEntryPayload(
    {
      title: body.title,
      amount: body.amount,
      category: body.category,
      date: body.start_date || existing.start_date,
      type: body.type,
      loan_type: body.loan_type,
      person: body.person,
      note: body.note,
    },
    existing
  );
  const frequency = body.frequency !== undefined ? body.frequency : existing.frequency;
  if (!['daily', 'weekly', 'monthly', 'yearly'].includes(frequency)) {
    throw new AppError(400, 'Frequency must be daily, weekly, monthly, or yearly');
  }
  const start_date = toDateString(body.start_date || existing.start_date);
  const end_date =
    body.end_date !== undefined
      ? toDateString(body.end_date) || null
      : toDateString(existing.end_date);
  const is_active = body.is_active !== undefined ? Boolean(body.is_active) : existing.is_active !== false;
  return { ...data, frequency, start_date, end_date, is_active };
}

async function listRecurring(userId) {
  const result = await query(
    'SELECT * FROM recurring_transactions WHERE user_id = $1 ORDER BY next_run_date ASC, id DESC',
    [userId]
  );
  return result.rows.map(mapRecurring);
}

async function getOwned(userId, id) {
  const result = await query(
    'SELECT * FROM recurring_transactions WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  if (!result.rowCount) {
    throw new AppError(404, 'Recurring transaction not found');
  }
  return result.rows[0];
}

async function createRecurring(userId, body) {
  const data = normalizeRecurring(body);
  const next_run_date = data.start_date;
  const result = await query(
    `INSERT INTO recurring_transactions
      (user_id, title, amount, category, type, loan_type, person, note, frequency, start_date, end_date, next_run_date, is_active)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING *`,
    [
      userId,
      data.title,
      data.amount,
      data.category,
      data.type,
      data.loan_type,
      data.person,
      data.note,
      data.frequency,
      data.start_date,
      data.end_date,
      next_run_date,
      data.is_active,
    ]
  );
  await processDueForUser(userId);
  const fresh = await getOwned(userId, result.rows[0].id);
  return mapRecurring(fresh);
}

async function updateRecurring(userId, id, body) {
  const existing = await getOwned(userId, id);
  const data = normalizeRecurring(body, existing);
  const result = await query(
    `UPDATE recurring_transactions SET
       title = $1, amount = $2, category = $3, type = $4, loan_type = $5, person = $6, note = $7,
       frequency = $8, start_date = $9, end_date = $10, is_active = $11
     WHERE id = $12 AND user_id = $13
     RETURNING *`,
    [
      data.title,
      data.amount,
      data.category,
      data.type,
      data.loan_type,
      data.person,
      data.note,
      data.frequency,
      data.start_date,
      data.end_date,
      data.is_active,
      id,
      userId,
    ]
  );
  return mapRecurring(result.rows[0]);
}

async function deleteRecurring(userId, id) {
  await getOwned(userId, id);
  await query('DELETE FROM recurring_transactions WHERE id = $1 AND user_id = $2', [id, userId]);
}

async function processDueForUser(userId) {
  const today = todayString();
  const due = await query(
    `SELECT * FROM recurring_transactions
     WHERE user_id = $1 AND is_active = TRUE AND next_run_date <= $2
     ORDER BY id`,
    [userId, today]
  );

  let created = 0;
  for (const row of due.rows) {
    await withTransaction(async (client) => {
      let next = require('../utils/dates').toDateString(row.next_run_date);
      const end = require('../utils/dates').toDateString(row.end_date);
      while (next && next <= today && (!end || next <= end)) {
        const existing = await client.query(
          `SELECT id FROM entries
           WHERE user_id = $1 AND recurring_id = $2 AND date = $3`,
          [userId, row.id, next]
        );
        if (!existing.rowCount) {
          await client.query(
            `INSERT INTO entries (user_id, title, amount, category, date, type, loan_type, person, note, recurring_id)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
            [
              userId,
              row.title,
              row.amount,
              row.category,
              next,
              row.type,
              row.loan_type,
              row.person,
              row.note,
              row.id,
            ]
          );
          created += 1;
        }
        next = addFrequency(next, row.frequency);
      }
      const deactivate = Boolean(end && next && next > end);
      await client.query(
        `UPDATE recurring_transactions
         SET next_run_date = $1, is_active = $2
         WHERE id = $3 AND user_id = $4`,
        [next || row.next_run_date, !deactivate, row.id, userId]
      );
    });
  }
  return created;
}

async function processAllDue() {
  const users = await query(
    `SELECT DISTINCT user_id FROM recurring_transactions WHERE is_active = TRUE`
  );
  for (const row of users.rows) {
    await processDueForUser(row.user_id);
  }
}

module.exports = {
  listRecurring,
  createRecurring,
  updateRecurring,
  deleteRecurring,
  processDueForUser,
  processAllDue,
};
