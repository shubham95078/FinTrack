import React from "react";

function SummaryBar({
  totalIncome,
  totalExpense,
  balance,
  showIncomeBreakdown,
  setShowIncomeBreakdown,
  showExpenseBreakdown,
  setShowExpenseBreakdown,
  showBalanceBreakdown,
  setShowBalanceBreakdown,
}) {
  return (
    <div className="summary-card summary-card-full">
      <span>
        Income: <span style={{ color: "#388e3c" }}>₹{totalIncome.toFixed(2)}</span>
        <button
          type="button"
          className="summary-toggle"
          style={{ background: "#e3f2fd" }}
          onClick={() => setShowIncomeBreakdown((v) => !v)}
        >
          {showIncomeBreakdown ? "▲" : "▼"}
        </button>
      </span>
      <span>
        Expense: <span style={{ color: "#e57373" }}>₹{totalExpense.toFixed(2)}</span>
        <button
          type="button"
          className="summary-toggle"
          style={{ background: "#ffebee" }}
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
          type="button"
          className="summary-toggle"
          style={{ background: "#e8eaf6" }}
          onClick={() => setShowBalanceBreakdown((v) => !v)}
        >
          {showBalanceBreakdown ? "▲" : "▼"}
        </button>
      </span>
    </div>
  );
}

export default SummaryBar;
