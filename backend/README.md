# FinTrack backend

Express API with PostgreSQL. Layout: `routes → controllers → services → db`.

## Run

1. Copy `../.env.example` to `.env`. Set `JWT_SECRET` and `DATABASE_URL`.
2. Ensure Postgres is up (`fintrack` database). Example:
   `postgres://fintrack:fintrack@localhost:5432/fintrack`
3. `npm install` then `npm run dev`.

Schema is applied on startup from `src/db/schema.sql`.

## Scripts

- `npm start` / `npm run dev`
- `npm test` — auth and isolation tests against `fintrack_test` (`localhost:5432`)
- `npm run migrate:sqlite` — copy an old SQLite `users`/`entries` database into Postgres

## Layout

- `src/app.js` — Helmet, CORS (credentials), cookies, rate limits, routers
- `src/middleware` — auth (cookie or Bearer), validation, errors
- `src/controllers` / `src/services` — HTTP handlers and business logic
- `src/db` — pool and migrations
