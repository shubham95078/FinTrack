import React, { useState, useEffect } from "react";

const initialState = { title: "", amount: "", category: "", date: "" };
const categories = ["Food", "Travel", "Shopping", "Bills", "Other"];

function ExpenseForm({ onSubmit, initial, onCancel }) {
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
    if (!form.title || !form.amount || !form.category) return;
    onSubmit({ ...form, amount: parseFloat(form.amount) });
    setForm(initialState);
  };

  return (
    <form onSubmit={handleSubmit} className="expense-form">
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

export default ExpenseForm; 