import React from "react";
import ExpenseItem from "./ExpenseItem";

function ExpenseList({ expenses, onEdit, onDelete }) {
  if (!expenses.length) return <p className="empty">No expenses yet.</p>;
  return (
    <div className="expense-list">
      {expenses.map((exp) => (
        <ExpenseItem
          key={exp.id}
          expense={exp}
          onEdit={() => onEdit(exp)}
          onDelete={() => onDelete(exp.id)}
        />
      ))}
    </div>
  );
}

export default ExpenseList; 