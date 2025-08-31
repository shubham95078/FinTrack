import React, { useEffect, useState } from "react";
import { getEntries, addEntry, updateEntry, deleteEntry } from "./api";
import EntryList from "./EntryList";
import EntryForm from "./EntryForm";
import Login from "./Login";
import Register from "./Register";

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

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(savedUser));
      loadEntries();
    }
  }, []);

  const loadEntries = async () => {
    try {
      const data = await getEntries();
      setEntries(Array.isArray(data) ? data : []);
    } catch (error) {
      if (error.message.includes('Unauthorized')) {
        handleLogout();
      } else {
        // If there's any other error, set empty array
        setEntries([]);
      }
    }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2000);
  };

  const handleAdd = async (entry) => {
    const newEntry = await addEntry(entry);
    setEntries([...entries, newEntry]);
    showToast(`${entry.type === "income" ? "Income" : entry.type === "expense" ? "Expense" : "Loan"} added!`);
  };

  const handleUpdate = async (id, entry) => {
    const updated = await updateEntry(id, entry);
    setEntries(entries.map((e) => (e.id === id ? updated : e)));
    setEditing(null);
    showToast(`${entry.type === "income" ? "Income" : entry.type === "expense" ? "Expense" : "Loan"} updated!`);
  };

  const handleDelete = async (id) => {
    const entry = entries.find((e) => e.id === id);
    await deleteEntry(id);
    setEntries(entries.filter((e) => e.id !== id));
    showToast(`${entry.type === "income" ? "Income" : entry.type === "expense" ? "Expense" : "Loan"} deleted!`, "error");
  };

  const handleLogin = (data) => {
    setIsAuthenticated(true);
    setUser(data.user);
    loadEntries();
    showToast(`Welcome back, ${data.user.username}!`);
  };

  const handleRegister = (data) => {
    setIsAuthenticated(true);
    setUser(data.user);
    loadEntries();
    showToast(`Welcome to FinTrack, ${data.user.username}!`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    setEntries([]);
    showToast('Logged out successfully');
  };

  const switchToRegister = () => setShowLogin(false);
  const switchToLogin = () => setShowLogin(true);

  // Ensure entries is always an array
  const safeEntries = Array.isArray(entries) ? entries : [];
  
  // Calculate income, expense, and balance including loans
  const totalIncome = safeEntries.filter(e => e.type === "income").reduce((sum, e) => sum + Number(e.amount), 0)
    + safeEntries.filter(e => e.type === "loan" && e.loan_type === "taken").reduce((sum, e) => sum + Number(e.amount), 0);
  const totalExpense = safeEntries.filter(e => e.type === "expense").reduce((sum, e) => sum + Number(e.amount), 0)
    + safeEntries.filter(e => e.type === "loan" && e.loan_type === "given").reduce((sum, e) => sum + Number(e.amount), 0);
  const balance = totalIncome - totalExpense;

  // Loan summary
  const loans = safeEntries.filter(e => e.type === "loan");
  const totalLoanGiven = loans.filter(l => l.loan_type === "given").reduce((sum, l) => sum + Number(l.amount), 0);
  const totalLoanTaken = loans.filter(l => l.loan_type === "taken").reduce((sum, l) => sum + Number(l.amount), 0);

  // Income breakdown by category (mode)
  const incomeEntries = safeEntries.filter(e => e.type === "income");
  const incomeByCategory = incomeEntries.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
    return acc;
  }, {});
  if (totalLoanTaken > 0) {
    incomeByCategory["Loan Taken"] = totalLoanTaken;
  }

  // Expense breakdown by category
  const expenseEntries = safeEntries.filter(e => e.type === "expense");
  const expenseByCategory = expenseEntries.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
    return acc;
  }, {});
  if (totalLoanGiven > 0) {
    expenseByCategory["Loan Given"] = totalLoanGiven;
  }

  // Balance breakdown (income sources minus expense sources)
  const balanceBySource = {};
  Object.entries(incomeByCategory).forEach(([cat, amt]) => {
    balanceBySource[cat] = (balanceBySource[cat] || 0) + amt;
  });
  Object.entries(expenseByCategory).forEach(([cat, amt]) => {
    balanceBySource[cat] = (balanceBySource[cat] || 0) - amt;
  });

  // Show authentication if not logged in
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
            position: 'fixed',
            top: '25px',
            right: '25px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            padding: '15px 30px',
            borderRadius: '50px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '700',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(15px)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            zIndex: 1000,
            boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
            minWidth: '120px',
            height: '55px',
            fontFamily: 'Arial, sans-serif',
            display: 'block',
            textAlign: 'center',
            lineHeight: '1.2'
          }}
        >
          🚪 Logout
        </button>
      <div className="header">
        <h1>💸 FinTrack - Financial Tracker</h1>
        <div className="user-info">
          <span>👋 Welcome, {user?.username}!</span>
        </div>
      </div>
      <div className="summary-card">
        <span>
          Income: <span style={{color: '#388e3c'}}>₹{totalIncome.toFixed(2)}</span>
          <button
            style={{ marginLeft: 10, fontSize: 14, padding: '2px 10px', borderRadius: 6, border: 'none', background: '#e3f2fd', cursor: 'pointer' }}
            onClick={() => setShowIncomeBreakdown((v) => !v)}
          >
            {showIncomeBreakdown ? '▲' : '▼'}
          </button>
        </span>
        <span>
          Expense: <span style={{color: '#e57373'}}>₹{totalExpense.toFixed(2)}</span>
          <button
            style={{ marginLeft: 10, fontSize: 14, padding: '2px 10px', borderRadius: 6, border: 'none', background: '#ffebee', cursor: 'pointer' }}
            onClick={() => setShowExpenseBreakdown((v) => !v)}
          >
            {showExpenseBreakdown ? '▲' : '▼'}
          </button>
        </span>
        <span>
          Balance: <span style={{color: balance >= 0 ? '#1976d2' : '#e57373'}}>₹{balance.toFixed(2)}</span>
          <button
            style={{ marginLeft: 10, fontSize: 14, padding: '2px 10px', borderRadius: 6, border: 'none', background: '#e8eaf6', cursor: 'pointer' }}
            onClick={() => setShowBalanceBreakdown((v) => !v)}
          >
            {showBalanceBreakdown ? '▲' : '▼'}
          </button>
        </span>
      </div>
      {showIncomeBreakdown && (
        <div style={{ background: '#e3f2fd', borderRadius: 10, margin: '0 0 18px 0', padding: '10px 18px', fontSize: '1em' }}>
          <strong>Income by Mode:</strong>
          <ul style={{ margin: '8px 0 0 0', padding: 0, listStyle: 'none' }}>
            {Object.entries(incomeByCategory).map(([cat, amt]) => (
              <li key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                <span>{cat}</span>
                <span>₹{amt.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {showExpenseBreakdown && (
        <div style={{ background: '#ffebee', borderRadius: 10, margin: '0 0 18px 0', padding: '10px 18px', fontSize: '1em' }}>
          <strong>Expense by Category:</strong>
          <ul style={{ margin: '8px 0 0 0', padding: 0, listStyle: 'none' }}>
            {Object.entries(expenseByCategory).map(([cat, amt]) => (
              <li key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                <span>{cat}</span>
                <span>₹{amt.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {showBalanceBreakdown && (
        <div style={{ background: '#e8eaf6', borderRadius: 10, margin: '0 0 18px 0', padding: '10px 18px', fontSize: '1em' }}>
          <strong>Balance by Source:</strong>
          <ul style={{ margin: '8px 0 0 0', padding: 0, listStyle: 'none' }}>
            {Object.entries(balanceBySource).map(([cat, amt]) => (
              <li key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                <span>{cat}</span>
                <span>₹{amt.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <EntryForm
        onSubmit={editing ? (entry) => handleUpdate(editing.id, entry) : handleAdd}
        initial={editing}
        onCancel={() => setEditing(null)}
      />
      {safeEntries.length === 0 ? (
        <div className="no-entries">
          <p>No financial entries yet. Start by adding your first expense, income, or loan!</p>
        </div>
      ) : (
        <EntryList
          entries={safeEntries}
          onEdit={setEditing}
          onDelete={handleDelete}
        />
      )}
      {loans.length > 0 && (
        <div className="summary-card" style={{marginTop: 24, background: '#fff3e0'}}>
          <span>Loan Given: <span style={{color: '#1976d2'}}>₹{totalLoanGiven.toFixed(2)}</span></span>
          <span>Loan Taken: <span style={{color: '#e57373'}}>₹{totalLoanTaken.toFixed(2)}</span></span>
        </div>
      )}
      {toast && (
        <div className={`toast ${toast.type}`}>{toast.msg}</div>
      )}
    </div>
  );
}

export default App;
