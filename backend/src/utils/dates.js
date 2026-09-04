function formatLocalDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toDateString(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  const s = String(value);
  return s.slice(0, 10);
}

function todayString() {
  return formatLocalDate(new Date());
}

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function addFrequency(dateStr, frequency) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (frequency === 'daily') date.setDate(date.getDate() + 1);
  else if (frequency === 'weekly') date.setDate(date.getDate() + 7);
  else if (frequency === 'monthly') date.setMonth(date.getMonth() + 1);
  else if (frequency === 'yearly') date.setFullYear(date.getFullYear() + 1);
  return formatLocalDate(date);
}

function monthRange(monthKey) {
  const [y, m] = monthKey.split('-').map(Number);
  const start = `${monthKey}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const end = `${monthKey}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
}

function previousMonthKey(monthKey) {
  const [y, m] = monthKey.split('-').map(Number);
  const date = new Date(y, m - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function isValidMonthKey(value) {
  return /^\d{4}-\d{2}$/.test(value || '');
}

function isValidDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || '');
}

module.exports = {
  toDateString,
  todayString,
  currentMonthKey,
  addFrequency,
  monthRange,
  previousMonthKey,
  isValidMonthKey,
  isValidDate,
  formatLocalDate,
};
