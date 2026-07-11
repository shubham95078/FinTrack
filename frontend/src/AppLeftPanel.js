import React from "react";
import EntryForm from "./EntryForm";
import EntryList from "./EntryList";
import AnalyticsDashboard from "./AnalyticsDashboard";
import { AnalyticsErrorBoundary } from "./AppRightPanel";

function AppLeftPanel({
  editing,
  onSubmit,
  onCancelEdit,
  entries,
  onEdit,
  onDelete,
  saving = false,
}) {
  const safeEntries = Array.isArray(entries) ? entries : [];

  return (
    <div className="app-left">
      <div className="analytics-panel">
        <AnalyticsErrorBoundary>
          <AnalyticsDashboard entries={safeEntries} />
        </AnalyticsErrorBoundary>
      </div>

      <EntryForm
        onSubmit={editing ? (entry) => onSubmit(editing.id, entry) : onSubmit}
        initial={editing}
        onCancel={onCancelEdit}
        saving={saving}
      />

      {safeEntries.length === 0 ? (
        <div className="no-entries">
          <p>No financial entries yet. Start by adding your first expense, income, or loan!</p>
        </div>
      ) : (
        <EntryList entries={safeEntries} onEdit={onEdit} onDelete={onDelete} />
      )}
    </div>
  );
}

export default AppLeftPanel;

