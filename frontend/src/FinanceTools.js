import React, { useEffect, useState } from "react";
import {
  addGoal,
  addRecurring,
  deleteGoal,
  deleteRecurring,
  downloadReport,
  getBudget,
  getGoals,
  getInsights,
  getRecurring,
  saveBudget,
  updateGoal,
} from "./api";

function formatINR(n) {
  return `₹${Number(n || 0).toFixed(2)}`;
}

export function InsightsPanel({ refreshKey, onAuthError }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    getInsights()
      .then(setData)
      .catch((err) => {
        if (err.message.includes("Unauthorized")) onAuthError(err);
      });
  }, [refreshKey, onAuthError]);

  if (!data) return null;

  return (
    <div className="tool-card">
      <h3>Smart insights</h3>
      <p>{data.comparisonText}</p>
      {data.highestSpendingCategory ? (
        <p>
          Highest category this month: <strong>{data.highestSpendingCategory.label}</strong>{" "}
          ({formatINR(data.highestSpendingCategory.value)})
        </p>
      ) : (
        <p>No spending category stands out yet this month.</p>
      )}
      <p>Average daily spend: {formatINR(data.averageDailySpend)}</p>
      {data.budgetAlert ? <p className="alert-text">{data.budgetAlert}</p> : null}
    </div>
  );
}

export function BudgetPanel({ refreshKey, onChange, onAuthError }) {
  const [budget, setBudget] = useState(null);
  const [amount, setAmount] = useState("");

  const load = () => {
    getBudget()
      .then((data) => {
        setBudget(data);
        setAmount(data.amount ? String(data.amount) : "");
      })
      .catch((err) => {
        if (err.message.includes("Unauthorized")) onAuthError(err);
      });
  };

  useEffect(() => {
    load();
  }, [refreshKey, onAuthError]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const saved = await saveBudget({ amount: Number(amount), month: budget?.month });
      setBudget(saved);
      onChange();
    } catch (err) {
      if (err.message.includes("Unauthorized")) onAuthError(err);
      else alert(err.message);
    }
  };

  if (!budget) return null;
  const width = Math.min(100, budget.percent || 0);

  return (
    <div className="tool-card">
      <h3>Monthly budget {budget.month}</h3>
      <form onSubmit={handleSave} className="tool-form">
        <input
          type="number"
          min="1"
          step="0.01"
          placeholder="Budget amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <button type="submit" className="primary-btn">Save</button>
      </form>
      <div className="progress-track">
        <div
          className={`progress-fill${budget.overBudget ? " over" : ""}`}
          style={{ width: `${width}%` }}
        />
      </div>
      <p>
        Spent {formatINR(budget.spent)}
        {budget.amount != null ? ` of ${formatINR(budget.amount)}` : " (no budget set)"}
      </p>
      {budget.alert ? <p className="alert-text">{budget.alert}</p> : null}
    </div>
  );
}

export function RecurringPanel({ refreshKey, onChange, onAuthError }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "Rent",
    type: "expense",
    frequency: "monthly",
    start_date: new Date().toISOString().slice(0, 10),
  });

  const load = () => {
    getRecurring()
      .then(setItems)
      .catch((err) => {
        if (err.message.includes("Unauthorized")) onAuthError(err);
      });
  };

  useEffect(() => {
    load();
  }, [refreshKey, onAuthError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addRecurring({ ...form, amount: Number(form.amount) });
      setForm((f) => ({ ...f, title: "", amount: "" }));
      onChange();
    } catch (err) {
      if (err.message.includes("Unauthorized")) onAuthError(err);
      else alert(err.message);
    }
  };

  return (
    <div className="tool-card">
      <h3>Recurring transactions</h3>
      <form onSubmit={handleSubmit} className="tool-form">
        <input
          placeholder="Title (e.g. Rent)"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <input
          type="number"
          min="0.01"
          step="0.01"
          placeholder="Amount"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          required
        />
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          <option>Rent</option>
          <option>Bills</option>
          <option>Utilities</option>
          <option>Salary</option>
          <option>Other</option>
        </select>
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
          <option value="monthly">Monthly</option>
          <option value="weekly">Weekly</option>
          <option value="yearly">Yearly</option>
          <option value="daily">Daily</option>
        </select>
        <input
          type="date"
          value={form.start_date}
          onChange={(e) => setForm({ ...form, start_date: e.target.value })}
        />
        <button type="submit" className="primary-btn">Add</button>
      </form>
      <ul className="tool-list">
        {items.map((item) => (
          <li key={item.id}>
            <span>
              {item.title} · {formatINR(item.amount)} · {item.frequency} · next {item.next_run_date}
            </span>
            <button className="icon-btn" onClick={async () => { await deleteRecurring(item.id); onChange(); }}>
              🗑️
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function GoalsPanel({ refreshKey, onChange, onAuthError }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: "", target_amount: "", current_amount: "", deadline: "" });

  const load = () => {
    getGoals()
      .then(setItems)
      .catch((err) => {
        if (err.message.includes("Unauthorized")) onAuthError(err);
      });
  };

  useEffect(() => {
    load();
  }, [refreshKey, onAuthError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addGoal({
        name: form.name,
        target_amount: Number(form.target_amount),
        current_amount: Number(form.current_amount || 0),
        deadline: form.deadline || null,
      });
      setForm({ name: "", target_amount: "", current_amount: "", deadline: "" });
      onChange();
    } catch (err) {
      if (err.message.includes("Unauthorized")) onAuthError(err);
      else alert(err.message);
    }
  };

  return (
    <div className="tool-card">
      <h3>Financial goals</h3>
      <form onSubmit={handleSubmit} className="tool-form">
        <input
          placeholder="Goal name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          type="number"
          min="0.01"
          step="0.01"
          placeholder="Target"
          value={form.target_amount}
          onChange={(e) => setForm({ ...form, target_amount: e.target.value })}
          required
        />
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Saved so far"
          value={form.current_amount}
          onChange={(e) => setForm({ ...form, current_amount: e.target.value })}
        />
        <input
          type="date"
          value={form.deadline}
          onChange={(e) => setForm({ ...form, deadline: e.target.value })}
        />
        <button type="submit" className="primary-btn">Add</button>
      </form>
      <ul className="tool-list">
        {items.map((goal) => (
          <li key={goal.id} className="goal-item">
            <div>
              <strong>{goal.name}</strong> {formatINR(goal.current_amount)} / {formatINR(goal.target_amount)} ({goal.percent}%)
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${goal.percent}%` }} />
              </div>
            </div>
            <button
              className="secondary-btn"
              type="button"
              onClick={async () => {
                const next = Number(goal.current_amount) + 500;
                await updateGoal(goal.id, { ...goal, current_amount: next });
                onChange();
              }}
            >
              +₹500
            </button>
            <button className="icon-btn" onClick={async () => { await deleteGoal(goal.id); onChange(); }}>
              🗑️
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ReportsBar({ onAuthError }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const download = async (kind) => {
    try {
      await downloadReport(kind, { from, to });
    } catch (err) {
      if (err.message.includes("Unauthorized")) onAuthError(err);
      else alert(err.message);
    }
  };

  return (
    <div className="tool-card">
      <h3>Reports</h3>
      <div className="tool-form">
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <button type="button" className="primary-btn" onClick={() => download("csv")}>CSV</button>
        <button type="button" className="secondary-btn" onClick={() => download("pdf")}>PDF</button>
      </div>
    </div>
  );
}
