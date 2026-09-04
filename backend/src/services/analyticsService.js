const { query } = require('../db/pool');
const { currentMonthKey, monthRange, previousMonthKey, isValidMonthKey } = require('../utils/dates');
const { AppError } = require('../utils/errors');

const EXPENSE_LIKE = `(type = 'expense' OR (type = 'loan' AND loan_type = 'given'))`;
const INCOME_LIKE = `(type = 'income' OR (type = 'loan' AND loan_type = 'taken'))`;

function categoryLabel(row) {
  if (row.type === 'loan') {
    return `Loan (${row.loan_type || 'given'})`;
  }
  return row.category || 'Other';
}

async function summary(userId) {
  const result = await query(
    `SELECT
       COALESCE(SUM(CASE WHEN ${INCOME_LIKE} THEN amount ELSE 0 END), 0)::numeric AS total_income,
       COALESCE(SUM(CASE WHEN ${EXPENSE_LIKE} THEN amount ELSE 0 END), 0)::numeric AS total_expense,
       COALESCE(SUM(CASE WHEN type = 'loan' AND loan_type = 'given' THEN amount ELSE 0 END), 0)::numeric AS total_loan_given,
       COALESCE(SUM(CASE WHEN type = 'loan' AND loan_type = 'taken' THEN amount ELSE 0 END), 0)::numeric AS total_loan_taken
     FROM entries
     WHERE user_id = $1`,
    [userId]
  );
  const row = result.rows[0];
  const totalIncome = Number(row.total_income);
  const totalExpense = Number(row.total_expense);
  const totalLoanGiven = Number(row.total_loan_given);
  const totalLoanTaken = Number(row.total_loan_taken);

  const breakdown = await query(
    `SELECT type, loan_type, category, SUM(amount)::numeric AS total
     FROM entries
     WHERE user_id = $1
     GROUP BY type, loan_type, category`,
    [userId]
  );

  const incomeByCategory = {};
  const expenseByCategory = {};
  for (const item of breakdown.rows) {
    const amt = Number(item.total);
    if (item.type === 'income') {
      incomeByCategory[item.category] = (incomeByCategory[item.category] || 0) + amt;
    } else if (item.type === 'expense') {
      expenseByCategory[item.category] = (expenseByCategory[item.category] || 0) + amt;
    } else if (item.type === 'loan' && item.loan_type === 'taken') {
      incomeByCategory['Loan Taken'] = (incomeByCategory['Loan Taken'] || 0) + amt;
    } else if (item.type === 'loan' && item.loan_type === 'given') {
      expenseByCategory['Loan Given'] = (expenseByCategory['Loan Given'] || 0) + amt;
    }
  }

  const balanceBySource = {};
  Object.entries(incomeByCategory).forEach(([cat, amt]) => {
    balanceBySource[cat] = (balanceBySource[cat] || 0) + amt;
  });
  Object.entries(expenseByCategory).forEach(([cat, amt]) => {
    balanceBySource[cat] = (balanceBySource[cat] || 0) - amt;
  });

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    totalLoanGiven,
    totalLoanTaken,
    incomeByCategory,
    expenseByCategory,
    balanceBySource,
  };
}

function emptyYearSeries(year) {
  const rows = [];
  for (let m = 1; m <= 12; m += 1) {
    const key = `${year}-${String(m).padStart(2, '0')}`;
    const label = new Date(year, m - 1, 1).toLocaleDateString('en-IN', { month: 'short' });
    rows.push({ key, label, value: 0 });
  }
  return rows;
}

async function monthlySeries(userId, year, likeSql) {
  const rows = emptyYearSeries(year);
  const result = await query(
    `SELECT to_char(date, 'YYYY-MM') AS month_key, SUM(amount)::numeric AS total
     FROM entries
     WHERE user_id = $1 AND ${likeSql} AND EXTRACT(YEAR FROM date) = $2
     GROUP BY 1`,
    [userId, year]
  );
  const map = new Map(rows.map((r) => [r.key, r]));
  for (const item of result.rows) {
    const row = map.get(item.month_key);
    if (row) row.value = Number(item.total);
  }
  return rows;
}

async function categoryRows(userId, likeSql, monthKey, limit = 8) {
  const params = [userId];
  let dateFilter = '';
  if (monthKey) {
    const { start, end } = monthRange(monthKey);
    params.push(start, end);
    dateFilter = `AND date >= $2 AND date <= $3`;
  }
  const result = await query(
    `SELECT type, loan_type, category, SUM(amount)::numeric AS total
     FROM entries
     WHERE user_id = $1 AND ${likeSql} ${dateFilter}
     GROUP BY type, loan_type, category
     ORDER BY total DESC
     LIMIT ${limit}`,
    params
  );
  return result.rows.map((r) => ({
    key: categoryLabel(r),
    label: categoryLabel(r),
    value: Number(r.total),
  }));
}

async function monthTotal(userId, likeSql, monthKey) {
  const { start, end } = monthRange(monthKey);
  const result = await query(
    `SELECT COALESCE(SUM(amount), 0)::numeric AS total
     FROM entries
     WHERE user_id = $1 AND ${likeSql} AND date >= $2 AND date <= $3`,
    [userId, start, end]
  );
  return Number(result.rows[0].total);
}

async function availableMonths(userId) {
  const result = await query(
    `SELECT DISTINCT to_char(date, 'YYYY-MM') AS month_key
     FROM entries
     WHERE user_id = $1
     ORDER BY month_key`,
    [userId]
  );
  const keys = result.rows.map((r) => r.month_key);
  const now = currentMonthKey();
  if (!keys.includes(now)) keys.push(now);
  return keys.sort();
}

async function dashboard(userId, monthKey) {
  const selected = monthKey && isValidMonthKey(monthKey) ? monthKey : currentMonthKey();
  if (!isValidMonthKey(selected)) {
    throw new AppError(400, 'Invalid month');
  }
  const year = new Date().getFullYear();
  const current = currentMonthKey();

  const [
    monthlySpending,
    monthlyIncome,
    categorySpendingAllTime,
    selectedMonthCategoryRows,
    selectedMonthIncomeRows,
    currentMonthExpenseTotal,
    selectedMonthExpenseTotal,
    selectedMonthIncomeTotal,
    currentMonthIncomeTotal,
    totals,
    months,
  ] = await Promise.all([
    monthlySeries(userId, year, EXPENSE_LIKE),
    monthlySeries(userId, year, INCOME_LIKE),
    categoryRows(userId, EXPENSE_LIKE, null, 8),
    categoryRows(userId, EXPENSE_LIKE, selected, 8),
    categoryRows(userId, INCOME_LIKE, selected, 8),
    monthTotal(userId, EXPENSE_LIKE, current),
    monthTotal(userId, EXPENSE_LIKE, selected),
    monthTotal(userId, INCOME_LIKE, selected),
    monthTotal(userId, INCOME_LIKE, current),
    summary(userId),
    availableMonths(userId),
  ]);

  return {
    year,
    currentMonthKey: current,
    selectedMonthKey: selected,
    availableMonthKeys: months,
    monthlySpending,
    monthlyIncome,
    categorySpendingAllTime,
    selectedMonthCategoryRows,
    selectedMonthIncomeRows,
    currentMonthExpenseTotal,
    selectedMonthExpenseTotal,
    selectedMonthIncomeTotal,
    currentMonthIncomeTotal,
    incomeVsExpense: {
      income: totals.totalIncome,
      expense: totals.totalExpense,
      balance: totals.balance,
    },
    hasEntries: totals.totalIncome > 0 || totals.totalExpense > 0,
  };
}

async function expenseTotalForMonth(userId, monthKey) {
  return monthTotal(userId, EXPENSE_LIKE, monthKey);
}

async function insights(userId) {
  const month = currentMonthKey();
  const prev = previousMonthKey(month);
  const [thisMonth, lastMonth, topCats, totals, daysResult] = await Promise.all([
    monthTotal(userId, EXPENSE_LIKE, month),
    monthTotal(userId, EXPENSE_LIKE, prev),
    categoryRows(userId, EXPENSE_LIKE, month, 3),
    summary(userId),
    query(
      `SELECT COUNT(DISTINCT date)::int AS days
       FROM entries
       WHERE user_id = $1 AND ${EXPENSE_LIKE}
         AND to_char(date, 'YYYY-MM') = $2`,
      [userId, month]
    ),
  ]);

  const change = lastMonth === 0
    ? (thisMonth > 0 ? 100 : 0)
    : ((thisMonth - lastMonth) / lastMonth) * 100;
  const days = Math.max(1, new Date().getDate());
  const avgDaily = thisMonth / days;
  const highest = topCats[0] || null;

  let comparisonText;
  if (lastMonth === 0 && thisMonth === 0) {
    comparisonText = 'No spending recorded this month or last month.';
  } else if (lastMonth === 0) {
    comparisonText = `You spent ₹${thisMonth.toFixed(2)} this month (no spending last month).`;
  } else if (change > 0) {
    comparisonText = `Spending is ${Math.abs(change).toFixed(1)}% higher than last month.`;
  } else if (change < 0) {
    comparisonText = `Spending is ${Math.abs(change).toFixed(1)}% lower than last month.`;
  } else {
    comparisonText = 'Spending is the same as last month.';
  }

  const savingsRate =
    totals.totalIncome > 0
      ? Math.round(((totals.balance / totals.totalIncome) * 100) * 10) / 10
      : 0;

  return {
    month,
    previousMonth: prev,
    thisMonthSpending: thisMonth,
    lastMonthSpending: lastMonth,
    spendingChangePercent: Math.round(change * 10) / 10,
    comparisonText,
    highestSpendingCategory: highest,
    topCategories: topCats,
    averageDailySpend: Math.round(avgDaily * 100) / 100,
    daysElapsedInMonth: days,
    daysWithExpenses: daysResult.rows[0].days,
    savingsRate,
    balance: totals.balance,
  };
}

module.exports = {
  summary,
  dashboard,
  insights,
  expenseTotalForMonth,
  EXPENSE_LIKE,
};
