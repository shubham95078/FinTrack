function mapEntry(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    amount: Number(row.amount) || 0,
    category: row.category,
    date: require('../utils/dates').toDateString(row.date),
    type: row.type,
    loan_type: row.loan_type,
    person: row.person,
    note: row.note,
    recurring_id: row.recurring_id || null,
  };
}

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    email: row.email,
  };
}

function mapBudget(row, spent = 0) {
  if (!row) return null;
  const amount = Number(row.amount) || 0;
  const spentNum = Number(spent) || 0;
  const remaining = amount - spentNum;
  const percent = amount > 0 ? Math.min(999, (spentNum / amount) * 100) : 0;
  return {
    id: row.id,
    month: row.month,
    amount,
    spent: spentNum,
    remaining,
    percent: Math.round(percent * 10) / 10,
    overBudget: spentNum > amount,
  };
}

function mapRecurring(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    amount: Number(row.amount) || 0,
    category: row.category,
    type: row.type,
    loan_type: row.loan_type,
    person: row.person,
    note: row.note,
    frequency: row.frequency,
    start_date: require('../utils/dates').toDateString(row.start_date),
    end_date: require('../utils/dates').toDateString(row.end_date),
    next_run_date: require('../utils/dates').toDateString(row.next_run_date),
    is_active: row.is_active,
  };
}

function mapGoal(row) {
  if (!row) return null;
  const target = Number(row.target_amount) || 0;
  const current = Number(row.current_amount) || 0;
  const percent = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  return {
    id: row.id,
    name: row.name,
    target_amount: target,
    current_amount: current,
    remaining: Math.max(0, target - current),
    percent: Math.round(percent * 10) / 10,
    deadline: require('../utils/dates').toDateString(row.deadline),
    completed: current >= target,
  };
}

module.exports = { mapEntry, mapUser, mapBudget, mapRecurring, mapGoal };
