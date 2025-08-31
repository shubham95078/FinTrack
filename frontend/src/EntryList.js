import React from "react";
import EntryItem from "./EntryItem";

function EntryList({ entries, onEdit, onDelete }) {
  if (!entries.length) return <p className="empty">No entries yet.</p>;
  return (
    <div className="expense-list">
      {entries.map((entry) => (
        <EntryItem
          key={entry.id}
          entry={entry}
          onEdit={() => onEdit(entry)}
          onDelete={() => onDelete(entry.id)}
        />
      ))}
    </div>
  );
}

export default EntryList; 