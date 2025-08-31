import React, { useState, useEffect } from "react";

const incomeCategories = ["Salary", "Business", "Investment", "Gift", "Interest", "Other"];
const expenseCategories = ["Food", "Rent", "Shopping", "Travel", "Utilities", "Entertainment", "Health", "Education", "Bills", "Other"];
const loanCategories = ["Personal Loan", "Friend Loan", "Bank Loan", "Other"];

const initialState = { title: "", amount: "", category: "", date: "", type: "expense", loan_type: "given", person: "", note: "" };

function EntryForm({ onSubmit, initial, onCancel }) {
  const [form, setForm] = useState(initial || initialState);

  useEffect(() => {
    setForm(initial || initialState);
  }, [initial]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.amount || !form.category || !form.type) return;
    if (form.type === "loan" && (!form.loan_type || !form.person)) return;
    onSubmit({ ...form, amount: parseFloat(form.amount) });
    setForm(initialState);
  };

  let categories = expenseCategories;
  if (form.type === "income") categories = incomeCategories;
  if (form.type === "loan") categories = loanCategories;

  return (
    <form onSubmit={handleSubmit} className="expense-form">
      <select name="type" value={form.type} onChange={handleChange} required>
        <option value="expense">Expense</option>
        <option value="income">Income</option>
        <option value="loan">Loan</option>
      </select>
      <input
        name="title"
        placeholder="Title"
        value={form.title}
        onChange={handleChange}
        required
      />
      <input
        name="amount"
        type="number"
        placeholder="Amount"
        value={form.amount}
        onChange={handleChange}
        required
        min="0"
        step="0.01"
      />
      <select
        name="category"
        value={form.category}
        onChange={handleChange}
        required
      >
        <option value="">Category</option>
        {categories.map((cat) => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
      {form.type === "loan" && (
        <>
          <select name="loan_type" value={form.loan_type} onChange={handleChange} required>
            <option value="given">Given</option>
            <option value="taken">Taken</option>
          </select>
          <input
            name="person"
            placeholder={form.loan_type === "given" ? "To whom" : "From whom"}
            value={form.person}
            onChange={handleChange}
            required
          />
          <input
            name="note"
            placeholder="Note (optional)"
            value={form.note}
            onChange={handleChange}
          />
        </>
      )}
      <input
        name="date"
        type="date"
        placeholder="Date"
        value={form.date}
        onChange={handleChange}
      />
      <button type="submit" className="primary-btn">{initial ? "Update" : "Add"}</button>
      {initial && <button type="button" className="secondary-btn" onClick={onCancel}>Cancel</button>}
    </form>
  );
}

export default EntryForm; 