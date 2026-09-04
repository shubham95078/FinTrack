import React from "react";
import EntryForm from "./EntryForm";
import EntryList from "./EntryList";
import {
  BudgetPanel,
  GoalsPanel,
  RecurringPanel,
  ReportsBar,
} from "./FinanceTools";

function AppLeftPanel({
  editing,
  onSubmit,
  onCancelEdit,
  entries,
  onEdit,
  onDelete,
  saving = false,
  filters,
  onFiltersChange,
  total,
  refreshKey,
  onToolsChange,
  onAuthError,
}) {
  const safeEntries = Array.isArray(entries) ? entries : [];

  return (
    <div className="col-transactions">
      <div className="tx-section-header dash-col-header">
        <h2 className="tx-section-title">Finance Management</h2>
        <p className="tx-section-subtitle">Add, review, and plan your money</p>
      </div>

      <section className="tx-section tx-section-add" aria-label="Add Transaction">
        <div className="tx-section-header">
          <h2 className="tx-section-title">{editing ? "Update Transaction" : "Add Transaction"}</h2>
          <p className="tx-section-subtitle">
            {editing ? "Edit the selected entry, then save." : "Record an expense, income, or loan."}
          </p>
        </div>
        <EntryForm
          onSubmit={editing ? (entry) => onSubmit(editing.id, entry) : onSubmit}
          initial={editing}
          onCancel={onCancelEdit}
          saving={saving}
        />
      </section>

      <div className="tools-grid">
        <BudgetPanel refreshKey={refreshKey} onChange={onToolsChange} onAuthError={onAuthError} />
        <RecurringPanel refreshKey={refreshKey} onChange={onToolsChange} onAuthError={onAuthError} />
        <GoalsPanel refreshKey={refreshKey} onChange={onToolsChange} onAuthError={onAuthError} />
        <ReportsBar onAuthError={onAuthError} />
      </div>

      <section className="tx-section tx-section-list" aria-label="Transactions">
        <div className="tx-section-header">
          <h2 className="tx-section-title">Transaction History</h2>
          <p className="tx-section-subtitle">Search, filter, and sort your entries.</p>
        </div>
        <EntryList
          entries={safeEntries}
          onEdit={onEdit}
          onDelete={onDelete}
          filters={filters}
          onFiltersChange={onFiltersChange}
          total={total}
          page={filters.page}
          limit={filters.limit}
        />
      </section>
    </div>
  );
}

export default AppLeftPanel;
