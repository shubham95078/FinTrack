const { query } = require('../db/pool');
const { AppError } = require('../utils/errors');
const { mapEntry } = require('../utils/mappers');
const { todayString, toDateString } = require('../utils/dates');

const SORT_COLUMNS = {
  date: 'date',
  amount: 'amount',
  title: 'title',
  category: 'category',
};

function normalizeEntryPayload(body, existing = {}) {
  const title = body.title !== undefined ? String(body.title).trim() : existing.title;
  const category = body.category !== undefined ? String(body.category).trim() : existing.category;
  const type = body.type !== undefined ? String(body.type).trim().toLowerCase() : existing.type;
  const amountRaw = body.amount !== undefined ? body.amount : existing.amount;
  const amount = Number(amountRaw);
  const date = toDateString(body.date || existing.date) || todayString();
  const loan_type =
    type === 'loan'
      ? (body.loan_type !== undefined ? body.loan_type : existing.loan_type)
      : null;
  const person =
    type === 'loan'
      ? (body.person !== undefined ? String(body.person).trim() : existing.person)
      : null;
  const note = body.note !== undefined ? body.note || null : existing.note || null;

  if (!title || !category || !type) {
    throw new AppError(400, 'Missing required fields');
  }
  if (Number.isNaN(amount) || amount <= 0) {
    throw new AppError(400, 'Invalid amount. Amount must be a positive number.');
  }
  if (!['income', 'expense', 'loan'].includes(type)) {
    throw new AppError(400, 'Type must be income, expense, or loan');
  }
  if (type === 'loan') {
    if (!['given', 'taken'].includes(loan_type)) {
      throw new AppError(400, 'Loan type must be given or taken');
    }
    if (!person) {
      throw new AppError(400, 'Person is required for loan entries');
    }
  }

  return { title, amount, category, date, type, loan_type, person, note };
}

async function listEntries(userId, filters = {}) {
  const {
    search = '',
    type,
    category,
    from,
    to,
    sort = 'date',
    order = 'desc',
    page = 1,
    limit = 20,
  } = filters;

  const sortCol = SORT_COLUMNS[sort] || 'date';
  const sortDir = String(order).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
  const offset = (pageNum - 1) * limitNum;

  const where = ['user_id = $1'];
  const params = [userId];

  if (search) {
    params.push(`%${search}%`);
    where.push(`(title ILIKE $${params.length} OR COALESCE(note, '') ILIKE $${params.length} OR COALESCE(person, '') ILIKE $${params.length})`);
  }
  if (type) {
    params.push(type);
    where.push(`type = $${params.length}`);
  }
  if (category) {
    params.push(category);
    where.push(`category = $${params.length}`);
  }
  if (from) {
    params.push(from);
    where.push(`date >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    where.push(`date <= $${params.length}`);
  }

  const whereSql = where.join(' AND ');
  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM entries WHERE ${whereSql}`,
    params
  );

  const listParams = [...params, limitNum, offset];
  const listResult = await query(
    `SELECT * FROM entries
     WHERE ${whereSql}
     ORDER BY ${sortCol} ${sortDir}, id DESC
     LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
    listParams
  );

  return {
    items: listResult.rows.map(mapEntry),
    total: countResult.rows[0].total,
    page: pageNum,
    limit: limitNum,
  };
}

async function createEntry(userId, body, extra = {}) {
  const data = normalizeEntryPayload(body);
  const result = await query(
    `INSERT INTO entries (user_id, title, amount, category, date, type, loan_type, person, note, recurring_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      userId,
      data.title,
      data.amount,
      data.category,
      data.date,
      data.type,
      data.loan_type,
      data.person,
      data.note,
      extra.recurring_id || null,
    ]
  );
  return mapEntry(result.rows[0]);
}

async function getOwnedEntry(userId, entryId) {
  const result = await query(
    'SELECT * FROM entries WHERE id = $1 AND user_id = $2',
    [entryId, userId]
  );
  if (!result.rowCount) {
    throw new AppError(404, 'Entry not found');
  }
  return result.rows[0];
}

async function updateEntry(userId, entryId, body) {
  const existing = await getOwnedEntry(userId, entryId);
  const data = normalizeEntryPayload(body, {
    ...existing,
    date: toDateString(existing.date),
  });
  const result = await query(
    `UPDATE entries SET
       title = $1, amount = $2, category = $3, date = $4,
       type = $5, loan_type = $6, person = $7, note = $8
     WHERE id = $9 AND user_id = $10
     RETURNING *`,
    [
      data.title,
      data.amount,
      data.category,
      data.date,
      data.type,
      data.loan_type,
      data.person,
      data.note,
      entryId,
      userId,
    ]
  );
  return mapEntry(result.rows[0]);
}

async function deleteEntry(userId, entryId) {
  await getOwnedEntry(userId, entryId);
  await query('DELETE FROM entries WHERE id = $1 AND user_id = $2', [entryId, userId]);
}

module.exports = {
  listEntries,
  createEntry,
  updateEntry,
  deleteEntry,
  getOwnedEntry,
  normalizeEntryPayload,
};
