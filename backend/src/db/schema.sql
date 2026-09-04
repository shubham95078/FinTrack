CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS entries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  category VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'loan')),
  loan_type VARCHAR(20) CHECK (loan_type IS NULL OR loan_type IN ('given', 'taken')),
  person VARCHAR(200),
  note TEXT,
  recurring_id INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT entries_loan_fields_chk CHECK (
    type <> 'loan' OR (loan_type IS NOT NULL AND person IS NOT NULL AND btrim(person) <> '')
  )
);

CREATE INDEX IF NOT EXISTS idx_entries_user_date ON entries (user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_entries_user_type ON entries (user_id, type);
CREATE INDEX IF NOT EXISTS idx_entries_user_category ON entries (user_id, category);
CREATE INDEX IF NOT EXISTS idx_entries_user_title ON entries (user_id, title);
CREATE INDEX IF NOT EXISTS idx_entries_user_amount ON entries (user_id, amount);

CREATE TABLE IF NOT EXISTS monthly_budgets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month CHAR(7) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT monthly_budgets_month_chk CHECK (month ~ '^\d{4}-\d{2}$'),
  CONSTRAINT monthly_budgets_user_month_uq UNIQUE (user_id, month)
);

CREATE INDEX IF NOT EXISTS idx_monthly_budgets_user ON monthly_budgets (user_id, month);

CREATE TABLE IF NOT EXISTS recurring_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  category VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'loan')),
  loan_type VARCHAR(20) CHECK (loan_type IS NULL OR loan_type IN ('given', 'taken')),
  person VARCHAR(200),
  note TEXT,
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE,
  next_run_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT recurring_loan_fields_chk CHECK (
    type <> 'loan' OR (loan_type IS NOT NULL AND person IS NOT NULL AND btrim(person) <> '')
  ),
  CONSTRAINT recurring_end_after_start_chk CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_recurring_user_next ON recurring_transactions (user_id, is_active, next_run_date);

ALTER TABLE entries DROP CONSTRAINT IF EXISTS entries_recurring_id_fkey;
ALTER TABLE entries
  ADD CONSTRAINT entries_recurring_id_fkey
  FOREIGN KEY (recurring_id) REFERENCES recurring_transactions(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS financial_goals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  target_amount NUMERIC(12, 2) NOT NULL CHECK (target_amount > 0),
  current_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  deadline DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goals_user ON financial_goals (user_id, deadline);
