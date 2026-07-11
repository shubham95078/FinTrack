import React, { useCallback, useEffect, useState } from "react";
import { getEntries, addEntry, updateEntry, deleteEntry, API_BASE } from "./api";
import Login from "./Login";
import Register from "./Register";
import AppLeftPanel from "./AppLeftPanel";
import AppRightPanel, { AnalyticsErrorBoundary } from "./AppRightPanel";
import AnalyticsDashboard from "./AnalyticsDashboard";
import SummaryBar from "./SummaryBar";

function App() {
  const [entries, setEntries] = useState([]);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);
  const [showIncomeBreakdown, setShowIncomeBreakdown] = useState(false);
  const [showExpenseBreakdown, setShowExpenseBreakdown] = useState(false);
  const [showBalanceBreakdown, setShowBalanceBreakdown] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(true);
  const [saving, setSaving] = useState(false);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2000);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setUser(null);
    setEntries([]);
    showToast("Logged out successfully");
  }, [showToast]);

  const warmupBackend = useCallback(() => {
    fetch(`${API_BASE}/health`).catch(() => {});
  }, []);

  const loadEntries = useCallback(async () => {
    try {
      const data = await getEntries();
      setEntries(Array.isArray(data) ? data : []);
    } catch (error) {
      if (error.message.includes("Unauthorized")) {
        handleLogout();
      }
      // Keep existing entries on temporary network errors (hosted backend wake-up)
    }
  }, [handleLogout]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (token && savedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(savedUser));
      warmupBackend();
      loadEntries();
    }
  }, [loadEntries, warmupBackend]);

  const handleAdd = async (entry) => {
    setSaving(true);
    try {
      const created = await addEntry(entry);
      setEntries((prev) => [created, ...(Array.isArray(prev) ? prev : [])]);
      showToast(
        `${entry.type === "income" ? "Income" : entry.type === "expense" ? "Expense" : "Loan"} added!`
      );
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
      const updated = await updateEntry(id, entry);
      setEntries(entries.map((e) => (e.id === id ? updated : e)));
      setEditing(null);
      showToast(
        `${entry.type === "income" ? "Income" : entry.type === "expense" ? "Expense" : "Loan"} updated!`
      );
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
      setEntries(entries.filter((e) => e.id !== id));
      showToast(
        `${entry.type === "income" ? "Income" : entry.type === "expense" ? "Expense" : "Loan"} deleted!`,
        "error"
      );
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
    loadEntries();
    showToast(`Welcome back, ${data.user.username}!`);
  };

  const handleRegister = (data) => {
    setIsAuthenticated(true);
    setUser(data.user);
    warmupBackend();
    loadEntries();
    showToast(`Welcome to FinTrack, ${data.user.username}!`);
  };

  const switchToRegister = () => setShowLogin(false);
  const switchToLogin = () => setShowLogin(true);

  const safeEntries = Array.isArray(entries) ? entries : [];

  const totalIncome =
    safeEntries
      .filter((e) => e.type === "income")
      .reduce((sum, e) => sum + Number(e.amount), 0) +
    safeEntries
      .filter((e) => e.type === "loan" && e.loan_type === "taken")
      .reduce((sum, e) => sum + Number(e.amount), 0);

  const totalExpense =
    safeEntries
      .filter((e) => e.type === "expense")
      .reduce((sum, e) => sum + Number(e.amount), 0) +
    safeEntries
      .filter((e) => e.type === "loan" && e.loan_type === "given")
      .reduce((sum, e) => sum + Number(e.amount), 0);

  const balance = totalIncome - totalExpense;

  const loans = safeEntries.filter((e) => e.type === "loan");
  const totalLoanGiven = loans
    .filter((l) => l.loan_type === "given")
    .reduce((sum, l) => sum + Number(l.amount), 0);
  const totalLoanTaken = loans
    .filter((l) => l.loan_type === "taken")
    .reduce((sum, l) => sum + Number(l.amount), 0);

  const incomeEntries = safeEntries.filter((e) => e.type === "income");
  const incomeByCategory = incomeEntries.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
    return acc;
  }, {});
  if (totalLoanTaken > 0) {
    incomeByCategory["Loan Taken"] = totalLoanTaken;
  }

  const expenseEntries = safeEntries.filter((e) => e.type === "expense");
  const expenseByCategory = expenseEntries.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
    return acc;
  }, {});
  if (totalLoanGiven > 0) {
    expenseByCategory["Loan Given"] = totalLoanGiven;
  }

  const balanceBySource = {};
  Object.entries(incomeByCategory).forEach(([cat, amt]) => {
    balanceBySource[cat] = (balanceBySource[cat] || 0) + amt;
  });
  Object.entries(expenseByCategory).forEach(([cat, amt]) => {
    balanceBySource[cat] = (balanceBySource[cat] || 0) - amt;
  });

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
      <button
        onClick={handleLogout}
        className="logout-btn"
        style={{
          position: "fixed",
          top: "25px",
          right: "25px",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          padding: "15px 30px",
          borderRadius: "50px",
          cursor: "pointer",
          fontSize: "16px",
          fontWeight: "700",
          transition: "all 0.3s ease",
          backdropFilter: "blur(15px)",
          border: "2px solid rgba(255, 255, 255, 0.3)",
          textTransform: "uppercase",
          letterSpacing: "1px",
          zIndex: 1000,
          boxShadow: "0 8px 25px rgba(102, 126, 234, 0.4)",
          minWidth: "120px",
          height: "55px",
          fontFamily: "Arial, sans-serif",
          display: "block",
          textAlign: "center",
          lineHeight: "1.2",
        }}
      >
        Logout
      </button>

      <div className="header">
        <h1>FinTrack - Financial Tracker</h1>
        <div className="user-info">
          <span>Welcome, {user?.username}!</span>
        </div>
      </div>

      <SummaryBar
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        balance={balance}
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
        incomeByCategory={incomeByCategory}
        expenseByCategory={expenseByCategory}
        balanceBySource={balanceBySource}
        breakdownOnly
      />

      <div className="analytics-panel">
        <AnalyticsErrorBoundary>
          <AnalyticsDashboard entries={safeEntries} />
        </AnalyticsErrorBoundary>
      </div>

      <div className="app-layout">
        <AppLeftPanel
          editing={editing}
          onSubmit={editing ? handleUpdate : handleAdd}
          onCancelEdit={() => setEditing(null)}
          entries={safeEntries}
          onEdit={setEditing}
          onDelete={handleDelete}
          saving={saving}
        />

        {Array.isArray(loans) && loans.length > 0 && (
          <div className="summary-card loan-summary-card">
            <span>
              Loan Given:{" "}
              <span style={{ color: "#1976d2" }}>₹{totalLoanGiven.toFixed(2)}</span>
            </span>
            <span>
              Loan Taken:{" "}
              <span style={{ color: "#e57373" }}>₹{totalLoanTaken.toFixed(2)}</span>
            </span>
          </div>
        )}
      </div>

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}

export default App;
