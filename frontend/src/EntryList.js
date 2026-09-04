import React from "react";
import EntryItem from "./EntryItem";

function EntryList({
  entries,
  onEdit,
  onDelete,
  filters,
  onFiltersChange,
  total,
  page,
  limit,
}) {
  const pages = Math.max(1, Math.ceil((total || 0) / (limit || 20)));
  const noEntriesYet = total === 0 && !filters.search && !filters.type;

  return (
    <div className="tx-list-block">
      <div className="entry-toolbar" aria-label="Search, filter, and sort">
        <input
          placeholder="Search title, note, person"
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value, page: 1 })}
        />
        <select
          value={filters.type}
          onChange={(e) => onFiltersChange({ ...filters, type: e.target.value, page: 1 })}
        >
          <option value="">All types</option>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
          <option value="loan">Loan</option>
        </select>
        <select
          value={filters.sort}
          onChange={(e) => onFiltersChange({ ...filters, sort: e.target.value })}
        >
          <option value="date">Sort by date</option>
          <option value="amount">Sort by amount</option>
          <option value="title">Sort by title</option>
          <option value="category">Sort by category</option>
        </select>
        <select
          value={filters.order}
          onChange={(e) => onFiltersChange({ ...filters, order: e.target.value })}
        >
          <option value="desc">Newest / high first</option>
          <option value="asc">Oldest / low first</option>
        </select>
      </div>

      {!entries.length ? (
        <p className={noEntriesYet ? "empty no-entries" : "empty"}>
          {noEntriesYet
            ? "No financial entries yet. Start by adding your first expense, income, or loan!"
            : "No entries match these filters."}
        </p>
      ) : (
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
      )}

      <div className="pager">
        <button
          type="button"
          className="secondary-btn"
          disabled={page <= 1}
          onClick={() => onFiltersChange({ ...filters, page: page - 1 })}
        >
          Previous
        </button>
        <span>
          Page {page} of {pages} ({total} total)
        </span>
        <button
          type="button"
          className="secondary-btn"
          disabled={page >= pages}
          onClick={() => onFiltersChange({ ...filters, page: page + 1 })}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default EntryList;
