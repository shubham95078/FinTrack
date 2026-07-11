import React from "react";

class AnalyticsErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <section className="ad-section ad-section-error">
          <div className="ad-section-title">Analytics could not load</div>
          <div className="ad-empty">{this.state.error.message}</div>
        </section>
      );
    }
    return this.props.children;
  }
}

function AppRightPanel({
  showIncomeBreakdown,
  showExpenseBreakdown,
  showBalanceBreakdown,
  incomeByCategory,
  expenseByCategory,
  balanceBySource,
  breakdownOnly,
}) {
  if (!breakdownOnly) {
    return null;
  }

  return (
    <div className="breakdown-panel">
      {showIncomeBreakdown && (
        <div className="breakdown-card breakdown-income">
          <strong>Income by Mode:</strong>
          <ul>
            {Object.entries(incomeByCategory).map(([cat, amt]) => (
              <li key={cat}>
                <span>{cat}</span>
                <span>₹{amt.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showExpenseBreakdown && (
        <div className="breakdown-card breakdown-expense">
          <strong>Expense by Category:</strong>
          <ul>
            {Object.entries(expenseByCategory).map(([cat, amt]) => (
              <li key={cat}>
                <span>{cat}</span>
                <span>₹{amt.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showBalanceBreakdown && (
        <div className="breakdown-card breakdown-balance">
          <strong>Balance by Source:</strong>
          <ul>
            {Object.entries(balanceBySource).map(([cat, amt]) => (
              <li key={cat}>
                <span>{cat}</span>
                <span>₹{amt.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default AppRightPanel;
export { AnalyticsErrorBoundary };
