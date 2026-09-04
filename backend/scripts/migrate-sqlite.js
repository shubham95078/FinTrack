/**
 * One-time copy of users + entries from the old SQLite file into PostgreSQL.
 * Usage: node scripts/migrate-sqlite.js [path-to-expenses.db]
 */
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { pool } = require('../src/db/pool');
const { migrate } = require('../src/db/migrate');

const dbPath = process.argv[2] || path.join(__dirname, '../instance/expenses.db');

function all(db, sql) {
  return new Promise((resolve, reject) => {
    db.all(sql, (err, rows) => (err ? reject(err) : resolve(rows || [])));
  });
}

async function run() {
  if (!fs.existsSync(dbPath)) {
    console.error(`SQLite database not found at ${dbPath}`);
    process.exit(1);
  }
  await migrate();
  const db = new sqlite3.Database(dbPath);
  const users = await all(db, 'SELECT * FROM users');
  const entries = await all(db, 'SELECT * FROM entries');
  const idMap = new Map();

  for (const user of users) {
    const result = await pool.query(
      `INSERT INTO users (username, email, password, created_at)
       VALUES ($1, $2, $3, COALESCE($4::timestamptz, NOW()))
       ON CONFLICT (username) DO UPDATE SET email = EXCLUDED.email
       RETURNING id`,
      [user.username, user.email, user.password, user.created_at || null]
    );
    idMap.set(user.id, result.rows[0].id);
  }

  let copied = 0;
  for (const entry of entries) {
    const userId = idMap.get(entry.user_id);
    if (!userId) continue;
    await pool.query(
      `INSERT INTO entries (user_id, title, amount, category, date, type, loan_type, person, note)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        userId,
        entry.title,
        entry.amount,
        entry.category,
        entry.date,
        entry.type,
        entry.loan_type || null,
        entry.person || null,
        entry.note || null,
      ]
    );
    copied += 1;
  }

  db.close();
  await pool.end();
  console.log(`Migrated ${users.length} users and ${copied} entries.`);
}

run().catch(async (err) => {
  console.error(err);
  await pool.end().catch(() => {});
  process.exit(1);
});
