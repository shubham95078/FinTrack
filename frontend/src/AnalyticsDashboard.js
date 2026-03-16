import React, { useMemo, useState } from "react";

function parseEntryDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatINR(amount) {
  const n = Number(amount) || 0;
  return `₹${n.toFixed(2)}`;
}

function monthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getYearMonths(year) {
  const months = [];
  for (let m = 0; m < 12; m += 1) {
    months.push(new Date(year, m, 1));
  }
  return months;
}

function formatMonthLabel(key) {
  // key: YYYY-MM
  const [y, m] = String(key).split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

function getExpenseLikeCategory(e) {
  return e.type === "loan"
    ? `Loan (${e.loan_type || "given"})`
    : e.category || "Other";
}

function getMonthKeyNow() {
  return monthKey(new Date());
}

function sumExpenseLikeForMonth(expenseLike, targetMonthKey) {
  return expenseLike
    .filter((e) => monthKey(e._d) === targetMonthKey)
    .reduce((s, e) => s + e._amount, 0);
}

function categoryRowsForMonth(expenseLike, targetMonthKey, limit = 8) {
  const buckets = new Map();
  for (const e of expenseLike) {
    if (monthKey(e._d) !== targetMonthKey) continue;
    const cat = getExpenseLikeCategory(e);
    buckets.set(cat, (buckets.get(cat) || 0) + e._amount);
  }
  return Array.from(buckets.entries())
    .map(([key, value]) => ({ key, label: key, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

// Separate method (reusable) to get monthly expense total.
export function getExpenseTotalForMonth(entries, targetMonthKey) {
  const list = Array.isArray(entries) ? entries : [];
  const expenseLike = list
    .filter(Boolean)
    .map((e) => {
      const d = parseEntryDate(e.date);
      const amount = Number(e.amount) || 0;
      return { ...e, _d: d, _amount: amount };
    })
    .filter(
      (e) =>
        e._d &&
        e._amount > 0 &&
        (e.type === "expense" || (e.type === "loan" && e.loan_type === "given"))
    );

  return expenseLike
    .filter((e) => monthKey(e._d) === targetMonthKey)
    .reduce((s, e) => s + e._amount, 0);
}

function VerticalBars({ rows, color = "#1976d2", height = 160 }) {
  const max = Math.max(0, ...rows.map((r) => r.value));
  return (
    <div className="ad-vchart" style={{ height }}>
      {rows.map((r) => {
        const pct = max > 0 ? Math.round((r.value / max) * 100) : 0;
        return (
          <div className="ad-vbar" key={r.key} title={`${r.label}: ${formatINR(r.value)}`}>
            <div className="ad-vbar-track" aria-hidden="true">
              <div
                className="ad-vbar-fill"
                style={{
                  height: `${pct}%`,
                  background: `linear-gradient(180deg, ${color} 0%, rgba(25,118,210,0.20) 100%)`,
                }}
              />
            </div>
            <div className="ad-vbar-label">{r.label}</div>
          </div>
        );
      })}
    </div>
  );
}

function Card({ title, subtitle, right, children }) {
  return (
    <div className="ad-card">
      <div className="ad-card-header">
        <div>
          <div className="ad-card-title">{title}</div>
          {subtitle ? <div className="ad-card-subtitle">{subtitle}</div> : null}
        </div>
        {right ? <div className="ad-card-right">{right}</div> : null}
      </div>
      {children}
    </div>
  );
}

function AnalyticsDashboard({ entries }) {
  const currentMonthKey = getMonthKeyNow();
  const currentYear = new Date().getFullYear();
  const [selectedMonthKey, setSelectedMonthKey] = useState(currentMonthKey);

  const normalized = useMemo(() => {
    const list = Array.isArray(entries) ? entries : [];
    return list
      .filter(Boolean)
      .map((e) => {
        const d = parseEntryDate(e.date);
        const amount = Number(e.amount) || 0;
        return { ...e, _d: d, _amount: amount };
      })
      .filter((e) => e._d && e._amount > 0 && e.type);
  }, [entries]);

  const expenseLike = useMemo(
    () =>
      normalized.filter(
        (e) =>
          e.type === "expense" || (e.type === "loan" && e.loan_type === "given")
      ),
    [normalized]
  );

  const incomeLike = useMemo(
    () =>
      normalized.filter(
        (e) =>
          e.type === "income" || (e.type === "loan" && e.loan_type === "taken")
      ),
    [normalized]
  );

  const monthlySpending = useMemo(() => {
    const months = getYearMonths(currentYear);
    const buckets = new Map(months.map((m) => [monthKey(m), 0]));

    for (const e of expenseLike) {
      const key = monthKey(e._d);
      if (!buckets.has(key)) continue;
      buckets.set(key, (buckets.get(key) || 0) + e._amount);
    }

    return months.map((m) => {
      const key = monthKey(m);
      const label = m.toLocaleDateString("en-IN", { month: "short" });
      return { key, label, value: buckets.get(key) || 0 };
    });
  }, [expenseLike, currentYear]);

  const categorySpendingAllTime = useMemo(() => {
    const buckets = new Map();
    for (const e of expenseLike) {
      const category = getExpenseLikeCategory(e);
      buckets.set(category, (buckets.get(category) || 0) + e._amount);
    }
    const rows = Array.from(buckets.entries())
      .map(([key, value]) => ({ key, label: key, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
    return rows;
  }, [expenseLike]);

  const availableMonthKeys = useMemo(() => {
    const set = new Set(expenseLike.map((e) => monthKey(e._d)));
    set.add(currentMonthKey);
    return Array.from(set).sort(); // YYYY-MM sorts chronologically
  }, [expenseLike, currentMonthKey]);

  const currentMonthExpenseTotal = useMemo(
    () => sumExpenseLikeForMonth(expenseLike, currentMonthKey),
    [expenseLike, currentMonthKey]
  );

  const selectedMonthExpenseTotal = useMemo(
    () => sumExpenseLikeForMonth(expenseLike, selectedMonthKey),
    [expenseLike, selectedMonthKey]
  );

  const selectedMonthCategoryRows = useMemo(
    () => categoryRowsForMonth(expenseLike, selectedMonthKey, 8),
    [expenseLike, selectedMonthKey]
  );

  const incomeVsExpense = useMemo(() => {
    const income = incomeLike.reduce((s, e) => s + e._amount, 0);
    const expense = expenseLike.reduce((s, e) => s + e._amount, 0);
    const balance = income - expense;
    return { income, expense, balance };
  }, [incomeLike, expenseLike]);

  if (normalized.length === 0) return null;

  return (
    <section className="ad-section" aria-label="Smart Analytics Dashboard">
      <div className="ad-section-header">
        <div>
          <div className="ad-section-title">📈 Smart Analytics Dashboard</div>
          <div className="ad-section-subtitle">
            Insights from your entries (loans included)
          </div>
        </div>
        <div className="ad-month-picker">
          <div className="ad-month-picker-label">Month</div>
          <select
            className="ad-month-select"
            value={selectedMonthKey}
            onChange={(e) => setSelectedMonthKey(e.target.value)}
          >
            {availableMonthKeys.map((k) => (
              <option key={k} value={k}>
                {formatMonthLabel(k)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="ad-grid">
        <Card
          title="Monthly spending trend"
          subtitle="Last 12 months (expenses + loan given)"
          right={
            <span title="Current month total">
              {formatINR(currentMonthExpenseTotal)}
            </span>
          }
        >
          <VerticalBars rows={monthlySpending} color="#ff9800" height={170} />
        </Card>

        <Card
          title="Selected month spending"
          subtitle={`${formatMonthLabel(selectedMonthKey)} (expenses + loan given)`}
          right={formatINR(selectedMonthExpenseTotal)}
        >
          {selectedMonthCategoryRows.length === 0 ? (
            <div className="ad-empty">No spending in this month.</div>
          ) : (
            <VerticalBars
              rows={selectedMonthCategoryRows}
              color="#e57373"
              height={170}
            />
          )}
        </Card>

        <Card
          title="Category-wise spending"
          subtitle="Top categories (all time)"
          right={formatINR(categorySpendingAllTime.reduce((s, r) => s + r.value, 0))}
        >
          {categorySpendingAllTime.length === 0 ? (
            <div className="ad-empty">No spending categories yet.</div>
          ) : (
            <VerticalBars
              rows={categorySpendingAllTime}
              color="#8e24aa"
              height={170}
            />
          )}
        </Card>

        <Card
          title="Income vs expense"
          subtitle="Total (income + loan taken) vs (expense + loan given)"
          right={
            <span
              style={{
                color: incomeVsExpense.balance >= 0 ? "#1976d2" : "#e57373",
                fontWeight: 900,
              }}
            >
              {formatINR(incomeVsExpense.balance)}
            </span>
          }
        >
          <div className="ad-compare">
            <div className="ad-compare-row">
              <div className="ad-compare-label">Income</div>
              <div className="ad-compare-pill income">
                {formatINR(incomeVsExpense.income)}
              </div>
            </div>
            <div className="ad-compare-row">
              <div className="ad-compare-label">Expense</div>
              <div className="ad-compare-pill expense">
                {formatINR(incomeVsExpense.expense)}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}

export default AnalyticsDashboard;

