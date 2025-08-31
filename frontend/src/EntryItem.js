import React from "react";

const categoryColors = {
  Salary: "#388e3c",
  Business: "#1976d2",
  Investment: "#ba68c8",
  Gift: "#ffb74d",
  Interest: "#64b5f6",
  Food: "#ffb74d",
  Rent: "#e57373",
  Shopping: "#81c784",
  Travel: "#64b5f6",
  Utilities: "#90a4ae",
  Entertainment: "#f06292",
  Health: "#4db6ac",
  Education: "#9575cd",
  Bills: "#e57373",
  Other: "#bdbdbd",
  "Personal Loan": "#ff9800",
  "Friend Loan": "#8d6e63",
  "Bank Loan": "#1976d2",
};

function formatDate(date) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

function EntryItem({ entry, onEdit, onDelete }) {
  const badgeColor = categoryColors[entry.category] || categoryColors.Other;
  const isLoan = entry.type === "loan";
  return (
    <div className={`expense-card${isLoan ? " loan-card" : ""}`}>
      <div className="expense-main">
        <div className="expense-title">{entry.title}</div>
        <div className="expense-amount" style={{ color: isLoan ? "#ff9800" : entry.type === "income" ? "#388e3c" : "#e57373" }}>
          {isLoan ? (entry.loan_type === "given" ? "→ " : "← ") : entry.type === "income" ? "+" : "-"}
          ₹{Number(entry.amount).toFixed(2)}
        </div>
      </div>
      <div className="expense-meta">
        <span className="badge" style={{ background: badgeColor }}>{entry.category}</span>
        <span className="expense-date">{formatDate(entry.date)}</span>
        {isLoan && (
          <>
            <span className="badge" style={{ background: entry.loan_type === "given" ? "#1976d2" : "#e57373", marginLeft: 8 }}>
              {entry.loan_type === "given" ? "Given" : "Taken"}
            </span>
            <span style={{ marginLeft: 8, fontWeight: 500 }}>
              {entry.loan_type === "given" ? `To: ${entry.person}` : `From: ${entry.person}`}
            </span>
            {entry.note && <span style={{ marginLeft: 8, color: '#888', fontStyle: 'italic' }}>{entry.note}</span>}
          </>
        )}
        {!isLoan && (
          <span className="badge" style={{ background: entry.type === "income" ? "#388e3c" : "#e57373", marginLeft: 8 }}>
            {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
          </span>
        )}
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

export default EntryItem; 