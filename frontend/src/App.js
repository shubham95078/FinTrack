import React, { useCallback, useEffect, useState } from "react";
import {
  getEntries,
  addEntry,
  updateEntry,
  deleteEntry,
  getSummary,
  getMe,
  logout,
  API_BASE,
} from "./api";
import Login from "./Login";
import Register from "./Register";
import AppLeftPanel from "./AppLeftPanel";
import AppRightPanel, { AnalyticsErrorBoundary } from "./AppRightPanel";
import SummaryBar from "./SummaryBar";
import AnalyticsDashboard from "./AnalyticsDashboard";
import { InsightsPanel } from "./FinanceTools";
import "./App.css";

const emptySummary = {
  totalIncome: 0,
  totalExpense: 0,
  balance: 0,
  totalLoanGiven: 0,
  totalLoanTaken: 0,
  incomeByCategory: {},
  expenseByCategory: {},
  balanceBySource: {},
};

const defaultFilters = {
  search: "",
  type: "",
  sort: "date",
  order: "desc",
  page: 1,
  limit: 10,
};

function App() {
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState(defaultFilters);
  const [queryFilters, setQueryFilters] = useState(defaultFilters);
  const [summary, setSummary] = useState(emptySummary);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);
  const [showIncomeBreakdown, setShowIncomeBreakdown] = useState(false);
  const [showExpenseBreakdown, setShowExpenseBreakdown] = useState(false);
  const [showBalanceBreakdown, setShowBalanceBreakdown] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [booting, setBooting] = useState(true);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2000);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch {
      // Cookie is cleared server-side when possible; always reset local session.
    }
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setUser(null);
    setEntries([]);
    setSummary(emptySummary);
    showToast("Logged out successfully");
  }, [showToast]);

  const warmupBackend = useCallback(() => {
    fetch(`${API_BASE}/health`).catch(() => {});
  }, []);

  const loadSummary = useCallback(async () => {
    const data = await getSummary();
    setSummary(data);
  }, []);

  const loadEntries = useCallback(async () => {
    try {
      const data = await getEntries(queryFilters);
      setEntries(Array.isArray(data.items) ? data.items : []);
      setTotal(data.total || 0);
      await loadSummary();
    } catch (error) {
      if (error.message.includes("Unauthorized")) {
        handleLogout();
      }
    }
  }, [queryFilters, handleLogout, loadSummary]);

  const bump = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setQueryFilters(filters), 300);
    return () => clearTimeout(timer);
  }, [filters]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      warmupBackend();
      try {
        const session = await getMe();
        if (cancelled) return;
        if (session?.user) {
          setIsAuthenticated(true);
          setUser(session.user);
        }
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [warmupBackend]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadEntries();
  }, [isAuthenticated, loadEntries, refreshKey]);

  const handleAdd = async (entry) => {
    setSaving(true);
    try {
      await addEntry(entry);
      showToast(
        `${entry.type === "income" ? "Income" : entry.type === "expense" ? "Expense" : "Loan"} added!`
      );
      bump();
    } catch (error) {
      if (error.message && error.message.includes("Unauthorized")) {
        handleLogout();
        return;
      }
      showToast(error.message || "Error adding entry. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id, entry) => {
    try {
      await updateEntry(id, entry);
      setEditing(null);
      showToast(
        `${entry.type === "income" ? "Income" : entry.type === "expense" ? "Expense" : "Loan"} updated!`
      );
      bump();
    } catch (error) {
      if (error.message && error.message.includes("Unauthorized")) {
        handleLogout();
        return;
      }
      showToast(error.message || "Error updating entry. Please try again.", "error");
    }
  };

  const handleDelete = async (id) => {
    try {
      const entry = entries.find((e) => e.id === id);
      await deleteEntry(id);
      showToast(
        `${entry?.type === "income" ? "Income" : entry?.type === "expense" ? "Expense" : "Loan"} deleted!`,
        "error"
      );
      bump();
    } catch (error) {
      if (error.message && error.message.includes("Unauthorized")) {
        handleLogout();
        return;
      }
      showToast(error.message || "Error deleting entry. Please try again.", "error");
    }
  };

  const handleLogin = (data) => {
    setIsAuthenticated(true);
    setUser(data.user);
    warmupBackend();
    showToast(`Welcome back, ${data.user.username}!`);
  };

  const handleRegister = (data) => {
    setIsAuthenticated(true);
    setUser(data.user);
    warmupBackend();
    showToast(`Welcome to FinTrack, ${data.user.username}!`);
  };

  const switchToRegister = () => setShowLogin(false);
  const switchToLogin = () => setShowLogin(true);

  if (booting) {
    return <div className="auth-container"><div className="auth-card">Loading FinTrack…</div></div>;
  }

  if (!isAuthenticated) {
    return (
      <>
        {showLogin ? (
          <Login onLogin={handleLogin} onSwitchToRegister={switchToRegister} />
        ) : (
          <Register onRegister={handleRegister} onSwitchToLogin={switchToLogin} />
        )}
      </>
    );
  }

  return (
    <div className="container">
      <button onClick={handleLogout} className="logout-btn">
        Logout
      </button>

      <div className="header">
        <h1>FinTrack - Financial Tracker</h1>
        <div className="user-info">
          <span>Welcome, {user?.username}!</span>
        </div>
      </div>

      <div className="main-dashboard">
        <AppLeftPanel
          editing={editing}
          onSubmit={editing ? handleUpdate : handleAdd}
          onCancelEdit={() => setEditing(null)}
          entries={entries}
          onEdit={setEditing}
          onDelete={handleDelete}
          saving={saving}
          filters={filters}
          onFiltersChange={setFilters}
          total={total}
          refreshKey={refreshKey}
          onToolsChange={bump}
          onAuthError={handleLogout}
        />

        <aside className="col-dashboard" aria-label="Dashboard">
          <div className="tx-section-header dash-col-header">
            <h2 className="tx-section-title">Dashboard</h2>
            <p className="tx-section-subtitle">Balance, trends, and insights</p>
          </div>

          <SummaryBar
            totalIncome={summary.totalIncome}
            totalExpense={summary.totalExpense}
            balance={summary.balance}
            showIncomeBreakdown={showIncomeBreakdown}
            setShowIncomeBreakdown={setShowIncomeBreakdown}
            showExpenseBreakdown={showExpenseBreakdown}
            setShowExpenseBreakdown={setShowExpenseBreakdown}
            showBalanceBreakdown={showBalanceBreakdown}
            setShowBalanceBreakdown={setShowBalanceBreakdown}
          />

          <AppRightPanel
            showIncomeBreakdown={showIncomeBreakdown}
            showExpenseBreakdown={showExpenseBreakdown}
            showBalanceBreakdown={showBalanceBreakdown}
            incomeByCategory={summary.incomeByCategory}
            expenseByCategory={summary.expenseByCategory}
            balanceBySource={summary.balanceBySource}
            breakdownOnly
          />

          {(summary.totalLoanGiven > 0 || summary.totalLoanTaken > 0) && (
            <div className="summary-card loan-summary-card">
              <span>
                Loan Given:{" "}
                <span style={{ color: "#1976d2" }}>₹{Number(summary.totalLoanGiven).toFixed(2)}</span>
              </span>
              <span>
                Loan Taken:{" "}
                <span style={{ color: "#e57373" }}>₹{Number(summary.totalLoanTaken).toFixed(2)}</span>
              </span>
            </div>
          )}

          <div className="analytics-panel">
            <AnalyticsErrorBoundary>
              <AnalyticsDashboard refreshKey={refreshKey} />
            </AnalyticsErrorBoundary>
          </div>

          <InsightsPanel refreshKey={refreshKey} onAuthError={handleLogout} />
        </aside>
      </div>

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}

export default App;
