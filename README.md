# FinTrack

FinTrack is a full-stack personal finance application for tracking income, expenses, and loans. Users can manage transactions, set monthly budgets and savings goals, generate reports, and view analytics on a two-column dashboard.

The frontend is **React**. The API is **Node.js** and **Express**, with data stored in **PostgreSQL**.

## Features

**Authentication**
- Register and log in
- Passwords hashed with bcryptjs
- JWT stored in an HttpOnly cookie
- Session restore via `GET /auth/me`

**Transactions**
- Income, expense, and loan entries (loan given / loan taken)
- Add, edit, and delete
- Each user’s data is isolated from other users

**Search, filter, sort, and pagination**
- Server-side query parameters on `GET /entries`

**Budgets**
- Monthly budget amount
- Spending progress and over-budget alerts

**Recurring transactions**
- Daily, weekly, monthly, or yearly frequency
- Due items are written as dated entries

**Financial goals**
- Target amount, current amount, and progress

**Reports**
- CSV and PDF export for the authenticated user

**Analytics and insights**
- Totals computed in SQL on the server
- Monthly spending trends
- Category-wise spending
- Income vs expense
- Smart insights (for example month-over-month spending and top categories)

**Security**
- Helmet, CORS with credentials, rate limiting, request validation, and centralized error handling

## Application layout

On desktop the main screen is a **55% / 45%** split.

**Left — Finance management (55%)**
1. Add Transaction
2. Monthly Budget, Recurring Transactions, Financial Goals, and Reports (2×2 grid)
3. Transaction History at the bottom (search, filter, sort, list, pagination)

**Right — Dashboard (45%)**
- Balance, income, and expenses
- Loan summary
- Charts (income vs expense, category spending, monthly trends)
- Smart insights

On tablet and mobile the columns stack into a single column.

## Tech stack

**Backend**
- Node.js, Express
- PostgreSQL (`pg`)
- JWT, HttpOnly cookies, bcryptjs
- Helmet, express-rate-limit, express-validator, pdfkit

**Frontend**
- React (Create React App)
- `fetch` with `credentials: 'include'`

## Architecture

The API is organized as **routes → controllers → services → db**.

- **Routes** — URL paths, HTTP methods, auth and validation middleware
- **Controllers** — parse the request and return the HTTP response
- **Services** — business rules and SQL (including user-scoped queries)
- **db** — PostgreSQL pool and schema applied on startup (`backend/src/db/schema.sql`)

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL (local install or Docker)

If you are not using Docker, create a role and databases:

```sql
CREATE USER fintrack WITH PASSWORD 'fintrack' CREATEDB;
CREATE DATABASE fintrack OWNER fintrack;
CREATE DATABASE fintrack_test OWNER fintrack;
```

### Environment

Copy [`.env.example`](.env.example) to `backend/.env` and set a long random `JWT_SECRET`:

```env
NODE_ENV=development
PORT=5000
JWT_SECRET=your-super-secret-key-here
DATABASE_URL=postgres://fintrack:fintrack@localhost:5432/fintrack
FRONTEND_URL=http://localhost:3000
COOKIE_SECURE=false
COOKIE_SAMESITE=lax
```

Optional: from the repo root, `docker compose up -d` starts PostgreSQL 16 with user/password/database `fintrack` on port 5432. Create `fintrack_test` separately if you will run API tests.

Schema (tables, constraints, indexes) is applied when the API starts.

### Backend

```bash
cd backend
npm install
npm run dev
```

Health check: `GET http://localhost:5000/health`

### Frontend

```bash
cd frontend
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000). The browser includes cookies because requests use `credentials: 'include'` and the API enables CORS credentials.

Optional `frontend/.env` if the API is not at `http://localhost:5000`:

```env
REACT_APP_API_BASE_URL=http://localhost:5000
```

Restart `npm start` after changing `REACT_APP_*` variables.

### Migrating old SQLite data

If `backend/instance/expenses.db` exists from an earlier version:

```bash
cd backend
npm run migrate:sqlite
```

## Authentication and security

- Passwords are hashed with bcryptjs before they are stored
- On register/login the API sets an HttpOnly cookie (`ft_token`) containing a JWT; the token is not returned in the JSON body
- The React app sends `credentials: 'include'` and restores the session with `GET /auth/me`
- Protected queries filter by the authenticated user’s id, so one user cannot read or change another user’s records
- **Helmet** sets security headers
- **CORS** allowlists `FRONTEND_URL` (and Vercel preview hosts) and allows credentials
- **Rate limiting** on general traffic and on login/register
- **express-validator** on auth and entry payloads
- A centralized error handler returns JSON errors without stack traces

Bearer tokens are still accepted on protected routes so tests and non-browser clients can authenticate. The web UI uses cookies only.

## Testing

```bash
cd backend
npm test
```

There are **16** automated API tests in `backend/tests/api.test.js` (Jest + Supertest). They use `fintrack_test` on `127.0.0.1:5432` (`backend/jest.config.js`) and truncate tables between cases.

Coverage includes:
- Registration, login, short-password and duplicate-username rejection
- HttpOnly cookie session, `GET /auth/me`, and logout
- Unauthenticated access rejected
- Cross-user isolation for entries, analytics, budgets, goals, recurring rules, and CSV reports
- Entry search, type filter, sort, and pagination

## Database

| Table | Role |
|---|---|
| `users` | Unique username and email, hashed password |
| `entries` | Transactions; `user_id` → `users` `ON DELETE CASCADE`; optional `recurring_id` |
| `monthly_budgets` | Unique `(user_id, month)` as `YYYY-MM` |
| `recurring_transactions` | Frequency (`daily` / `weekly` / `monthly` / `yearly`) and `next_run_date` |
| `financial_goals` | Target amount, current amount, optional deadline |

Implemented constraints and indexes include:
- `entries.amount > 0`; `type` in `income`, `expense`, `loan`; loans require `loan_type` and `person`
- Indexes on entries: `(user_id, date)`, type, category, title, amount
- `recurring_id` → `recurring_transactions` `ON DELETE SET NULL`

## API

### Public

| Method | Path | Notes |
|---|---|---|
| `GET` | `/health` | Process health |
| `POST` | `/auth/register` | Sets HttpOnly cookie |
| `POST` | `/auth/login` | Sets HttpOnly cookie |
| `POST` | `/auth/logout` | Clears cookie |

### Authenticated

Cookie or `Authorization: Bearer`. All data routes are scoped to the current user.

| Method | Path |
|---|---|
| `GET` | `/auth/me` |
| `GET` | `/entries?search=&type=&category=&from=&to=&sort=&order=&page=&limit=` |
| `POST` | `/entries` |
| `PUT` | `/entries/:id` |
| `DELETE` | `/entries/:id` |
| `GET` | `/analytics/summary` |
| `GET` | `/analytics/dashboard?month=YYYY-MM` |
| `GET` | `/analytics/insights` |
| `GET` | `/budgets?month=YYYY-MM` |
| `GET` | `/budgets/history` |
| `PUT` | `/budgets` |
| `GET`, `POST` | `/recurring` |
| `PUT`, `DELETE` | `/recurring/:id` |
| `GET`, `POST` | `/goals` |
| `PUT`, `DELETE` | `/goals/:id` |
| `GET` | `/reports/csv` |
| `GET` | `/reports/pdf` |

`sort` for entries: `date`, `amount`, `title`, or `category`. `order`: `asc` or `desc`.

## Production notes

- Use a long random `JWT_SECRET`; do not commit `.env`
- Hosted Postgres: set `DATABASE_SSL=true` if required by the provider
- Set `FRONTEND_URL` to the real origin(s), comma-separated
- Cross-site HTTPS cookies (separate frontend and API hosts): `COOKIE_SECURE=true` and `COOKIE_SAMESITE=none`

## License

MIT
