# FinTrack Backend - Node.js + Express

This is the backend API for the FinTrack application, built with Node.js and Express.js.

## Features

- RESTful API for managing financial entries (expenses, income, loans)
- SQLite database for data persistence
- CORS enabled for frontend integration
- Full CRUD operations for entries

## API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login

### Protected Routes (require authentication)
- `GET /entries` - Get all entries for authenticated user
- `POST /entries` - Create a new entry
- `PUT /entries/:id` - Update an existing entry
- `DELETE /entries/:id` - Delete an entry

### Public Routes
- `GET /health` - Health check endpoint

## Setup Instructions

1. **Install Node.js** (version 14 or higher recommended)

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   # Production mode
   npm start
   
   # Development mode (with auto-restart)
   npm run dev
   ```

4. **Access the API:**
   - Server runs on `http://localhost:5000`
   - API base URL: `http://localhost:5000`

## Database

- Uses SQLite database located at `instance/expenses.db`
- Two tables are automatically created on first run:
  - `users` - Stores user account information
  - `entries` - Stores financial entries linked to users
- No additional database setup required

## Entry Schema

```json
{
  "id": 1,
  "title": "Salary",
  "amount": 5000.00,
  "category": "Income",
  "date": "2024-01-15",
  "type": "income",
  "loan_type": null,
  "person": null,
  "note": "Monthly salary"
}
```

## Entry Types

- `income` - Money received
- `expense` - Money spent
- `loan` - Money borrowed or lent

## Loan Fields

- `loan_type`: "given" (you lent money) or "taken" (you borrowed money)
- `person`: Name of the person involved in the loan
- `note`: Additional information about the loan

## Development

- Uses `nodemon` for automatic server restart during development
- CORS enabled for local development
- Error handling and logging included

## Migration from Python Flask

This Node.js version maintains the same API structure as the original Python Flask backend, with the addition of user authentication. All financial entries are now associated with specific users for better data security and privacy. 