import React, { useEffect, useState } from "react";
import { getDashboard } from "./api";

function formatINR(amount) {
  const n = Number(amount) || 0;
  return `₹${n.toFixed(2)}`;
}

function formatMonthLabel(key) {
  const [y, m] = String(key).split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

function VerticalBars({ rows, color = "#1976d2", trackHeight = 120, emptyMessage = "No data yet." }) {
  const list = Array.isArray(rows) ? rows : [];
  const max = Math.max(0, ...list.map((r) => r.value));
  const hasData = list.some((r) => r.value > 0);

  if (!hasData) {
    return <div className="ad-empty">{emptyMessage}</div>;
  }

  return (
    <div className="ad-vchart" style={{ minHeight: trackHeight + 28 }}>
      {list.map((r) => {
        const barHeight =
          max > 0 && r.value > 0
            ? Math.max(10, Math.round((r.value / max) * trackHeight))
            : 0;
        return (
          <div className="ad-vbar" key={r.key} title={`${r.label}: ${formatINR(r.value)}`}>
            <div
              className="ad-vbar-track"
              style={{ height: `${trackHeight}px`, minHeight: `${trackHeight}px` }}
            >
              {barHeight > 0 ? (
                <div
                  className="ad-vbar-fill"
                  style={{
                    height: `${barHeight}px`,
                    minHeight: `${barHeight}px`,
                    background: color,
                  }}
                />
              ) : null}
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

function AnalyticsDashboard({ refreshKey = 0 }) {
  const [selectedMonthKey, setSelectedMonthKey] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getDashboard(selectedMonthKey || undefined)
      .then((payload) => {
        if (cancelled) return;
        setData(payload);
        if (!selectedMonthKey && payload.selectedMonthKey) {
          setSelectedMonthKey(payload.selectedMonthKey);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedMonthKey, refreshKey]);

  if (error) {
    return (
      <section className="ad-section" aria-label="Smart Analytics Dashboard">
        <div className="ad-empty">{error}</div>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="ad-section" aria-label="Smart Analytics Dashboard">
        <div className="ad-section-title">Smart Analytics Dashboard</div>
        <div className="ad-empty">Loading analytics…</div>
      </section>
    );
  }

  if (!data.hasEntries) {
    return (
      <section className="ad-section" aria-label="Smart Analytics Dashboard">
        <div className="ad-section-header">
          <div>
            <div className="ad-section-title">Smart Analytics Dashboard</div>
            <div className="ad-section-subtitle">Add income or expenses to see charts here.</div>
          </div>
        </div>
        <div className="ad-empty">No entries yet.</div>
      </section>
    );
  }

  const incomeVsExpense = data.incomeVsExpense || { income: 0, expense: 0, balance: 0 };

  return (
    <section className="ad-section" aria-label="Smart Analytics Dashboard">
      <div className="ad-section-header">
        <div>
          <div className="ad-section-title">Smart Analytics Dashboard</div>
          <div className="ad-section-subtitle">Your financial overview at a glance</div>
        </div>
        <div className="ad-month-picker">
          <div className="ad-month-picker-label">Month</div>
          <select
            className="ad-month-select"
            value={selectedMonthKey || data.selectedMonthKey}
            onChange={(e) => setSelectedMonthKey(e.target.value)}
          >
            {(data.availableMonthKeys || []).map((k) => (
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
          subtitle={`Jan → Dec ${data.year} (expenses + loan given)`}
          right={formatINR(data.currentMonthExpenseTotal)}
        >
          <VerticalBars
            rows={data.monthlySpending}
            color="#ff9800"
            emptyMessage="No expenses yet. Add an expense to see this chart."
          />
        </Card>

        <Card
          title="Monthly income trend"
          subtitle={`Jan → Dec ${data.year} (income + loan taken)`}
          right={formatINR(data.currentMonthIncomeTotal)}
        >
          <VerticalBars
            rows={data.monthlyIncome}
            color="#43a047"
            emptyMessage="No income yet. Add income to see this chart."
          />
        </Card>

        <Card
          title="Selected month spending"
          subtitle={`${formatMonthLabel(data.selectedMonthKey)} (expenses + loan given)`}
          right={formatINR(data.selectedMonthExpenseTotal)}
        >
          {(data.selectedMonthCategoryRows || []).length === 0 ? (
            <div className="ad-empty">No spending in this month.</div>
          ) : (
            <VerticalBars rows={data.selectedMonthCategoryRows} color="#e57373" />
          )}
        </Card>

        <Card
          title="Selected month income"
          subtitle={`${formatMonthLabel(data.selectedMonthKey)} (income + loan taken)`}
          right={formatINR(data.selectedMonthIncomeTotal)}
        >
          {(data.selectedMonthIncomeRows || []).length === 0 ? (
            <div className="ad-empty">No income in this month.</div>
          ) : (
            <VerticalBars rows={data.selectedMonthIncomeRows} color="#66bb6a" />
          )}
        </Card>

        <Card
          title="Category-wise spending"
          subtitle="Top categories (all time)"
          right={formatINR((data.categorySpendingAllTime || []).reduce((s, r) => s + r.value, 0))}
        >
          {(data.categorySpendingAllTime || []).length === 0 ? (
            <div className="ad-empty">No spending categories yet.</div>
          ) : (
            <VerticalBars rows={data.categorySpendingAllTime} color="#8e24aa" />
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
              <div className="ad-compare-pill income">{formatINR(incomeVsExpense.income)}</div>
            </div>
            <div className="ad-compare-row">
              <div className="ad-compare-label">Expense</div>
              <div className="ad-compare-pill expense">{formatINR(incomeVsExpense.expense)}</div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}

export default AnalyticsDashboard;
export { VerticalBars, Card };
