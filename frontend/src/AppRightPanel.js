import React from "react";
import AnalyticsDashboard from "./AnalyticsDashboard";

function AppRightPanel({
  totalIncome,
  totalExpense,
  balance,
  showIncomeBreakdown,
  setShowIncomeBreakdown,
  showExpenseBreakdown,
  setShowExpenseBreakdown,
  showBalanceBreakdown,
  setShowBalanceBreakdown,
  incomeByCategory,
  expenseByCategory,
  balanceBySource,
  entries,
  loans,
  totalLoanGiven,
  totalLoanTaken,
}) {
  const safeEntries = Array.isArray(entries) ? entries : [];

  return (
    <div className="app-right">
      <div className="summary-card">
        <span>
          Income: <span style={{ color: "#388e3c" }}>₹{totalIncome.toFixed(2)}</span>
          <button
            style={{
              marginLeft: 10,
              fontSize: 14,
              padding: "2px 10px",
              borderRadius: 6,
              border: "none",
              background: "#e3f2fd",
              cursor: "pointer",
            }}
            onClick={() => setShowIncomeBreakdown((v) => !v)}
          >
            {showIncomeBreakdown ? "▲" : "▼"}
          </button>
        </span>
        <span>
          Expense: <span style={{ color: "#e57373" }}>₹{totalExpense.toFixed(2)}</span>
          <button
            style={{
              marginLeft: 10,
              fontSize: 14,
              padding: "2px 10px",
              borderRadius: 6,
              border: "none",
              background: "#ffebee",
              cursor: "pointer",
            }}
            onClick={() => setShowExpenseBreakdown((v) => !v)}
          >
            {showExpenseBreakdown ? "▲" : "▼"}
          </button>
        </span>
        <span>
          Balance:{" "}
          <span style={{ color: balance >= 0 ? "#1976d2" : "#e57373" }}>
            ₹{balance.toFixed(2)}
          </span>
          <button
            style={{
              marginLeft: 10,
              fontSize: 14,
              padding: "2px 10px",
              borderRadius: 6,
              border: "none",
              background: "#e8eaf6",
              cursor: "pointer",
            }}
            onClick={() => setShowBalanceBreakdown((v) => !v)}
          >
            {showBalanceBreakdown ? "▲" : "▼"}
          </button>
        </span>
      </div>

      {showIncomeBreakdown && (
        <div
          style={{
            background: "#e3f2fd",
            borderRadius: 10,
            margin: "0 0 18px 0",
            padding: "10px 18px",
            fontSize: "1em",
          }}
        >
          <strong>Income by Mode:</strong>
          <ul style={{ margin: "8px 0 0 0", padding: 0, listStyle: "none" }}>
            {Object.entries(incomeByCategory).map(([cat, amt]) => (
              <li
                key={cat}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "2px 0",
                }}
              >
                <span>{cat}</span>
                <span>₹{amt.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showExpenseBreakdown && (
        <div
          style={{
            background: "#ffebee",
            borderRadius: 10,
            margin: "0 0 18px 0",
            padding: "10px 18px",
            fontSize: "1em",
          }}
        >
          <strong>Expense by Category:</strong>
          <ul style={{ margin: "8px 0 0 0", padding: 0, listStyle: "none" }}>
            {Object.entries(expenseByCategory).map(([cat, amt]) => (
              <li
                key={cat}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "2px 0",
                }}
              >
                <span>{cat}</span>
                <span>₹{amt.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showBalanceBreakdown && (
        <div
          style={{
            background: "#e8eaf6",
            borderRadius: 10,
            margin: "0 0 18px 0",
            padding: "10px 18px",
            fontSize: "1em",
          }}
        >
          <strong>Balance by Source:</strong>
          <ul style={{ margin: "8px 0 0 0", padding: 0, listStyle: "none" }}>
            {Object.entries(balanceBySource).map(([cat, amt]) => (
              <li
                key={cat}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "2px 0",
                }}
              >
                <span>{cat}</span>
                <span>₹{amt.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <AnalyticsDashboard entries={safeEntries} />

      {Array.isArray(loans) && loans.length > 0 && (
        <div className="summary-card" style={{ marginTop: 24, background: "#fff3e0" }}>
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
  );
}

export default AppRightPanel;

