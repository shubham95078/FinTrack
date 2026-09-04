# FinTrack frontend

React UI for FinTrack. Full setup, API, and architecture notes live in the [root README](../README.md).

## Run

With the API already running on port 5000:

```bash
npm install
npm start
```

The app opens at [http://localhost:3000](http://localhost:3000).

Optional `frontend/.env` if the API is not at `http://localhost:5000`:

```env
REACT_APP_API_BASE_URL=http://localhost:5000
```

Restart `npm start` after changing `REACT_APP_*` variables (they are baked in at build time).

## How it talks to the API

- `src/api.js` — all HTTP calls, `credentials: 'include'` for the HttpOnly session cookie
- Session restore: `GET /auth/me` on load (no token in `localStorage`)
- Analytics, budgets, recurring rules, goals, and reports are loaded from backend endpoints, not computed only in the browser

## Main UI

Desktop is a **55% / 45%** split:

- **Left — Finance management:** add transaction; budget / recurring / goals / reports (2×2); transaction history with search, filter, sort, and pagination
- **Right — Dashboard:** balance, income, expenses, loans, charts, smart insights

On narrower screens the columns stack.

Key files:

- `src/App.js` — auth shell, two-column layout
- `src/AppLeftPanel.js` — left column
- `src/AnalyticsDashboard.js` — dashboard charts
- `src/FinanceTools.js` — budgets, recurring, goals, reports, insights
- `src/index.css` — layout and visual style

## Scripts

- `npm start` — development server
- `npm test` — React tests
- `npm run build` — production build
