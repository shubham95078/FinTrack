import React from "react";

const categoryColors = {
  Food: "#ffb74d",
  Travel: "#64b5f6",
  Shopping: "#81c784",
  Bills: "#e57373",
  Other: "#ba68c8",
};

function formatDate(date) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

function ExpenseItem({ expense, onEdit, onDelete }) {
  const badgeColor = categoryColors[expense.category] || categoryColors.Other;
  return (
    <div className="expense-card">
      <div className="expense-main">
        <div className="expense-title">{expense.title}</div>
        <div className="expense-amount">₹{Number(expense.amount).toFixed(2)}</div>
      </div>
      <div className="expense-meta">
        <span className="badge" style={{ background: badgeColor }}>{expense.category}</span>
        <span className="expense-date">{formatDate(expense.date)}</span>
        <button className="icon-btn" title="Edit" onClick={onEdit}>
          ✏️
        </button>
        <button className="icon-btn" title="Delete" onClick={onDelete}>
          🗑️
        </button>
      </div>
    </div>
  );
}

export default ExpenseItem; 