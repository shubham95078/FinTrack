# 💰 FinTrack - Personal Finance Tracker

A modern, secure personal finance management application built with Node.js, Express, and React. Track your expenses, income, and loans with a beautiful, responsive interface and robust user authentication.

![FinTrack](https://img.shields.io/badge/FinTrack-Finance%20Tracker-blue?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)
![React](https://img.shields.io/badge/React-18+-blue?style=for-the-badge&logo=react)
![Express](https://img.shields.io/badge/Express-4.18+-black?style=for-the-badge&logo=express)

## ✨ Features

- 🔐 **Secure Authentication** - JWT-based login/signup system
- 💰 **Expense Tracking** - Monitor spending by category with visual breakdowns
- 💵 **Income Management** - Track income sources and patterns
- 🏦 **Loan Tracking** - Manage loans given and taken with person details
- 📊 **Smart Analytics Dashboard**
  - Monthly spending trend (Jan → Dec) for the current year
  - Category-wise spending (all time and per selected month)
  - Income vs expense comparison (including loans)
  - Month selector to inspect any month’s totals and categories
- 🧾 **Two‑pane Layout**
  - Left: fast entry input and history list
  - Right: summaries, breakdowns, and analytics
- 🔒 **Data Privacy** - Each user's data is completely isolated
- 📱 **Responsive Design** - Works perfectly on all devices
- 🎨 **Modern UI** - Beautiful, intuitive interface

## 🚀 Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **SQLite** - Lightweight database
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

### Frontend
- **React** - User interface library
- **CSS3** - Modern styling with gradients and animations
- **Responsive Design** - Mobile-first approach

## 📋 Prerequisites

- **Node.js** (version 14 or higher)
- **npm** (comes with Node.js)
- **Git** (for version control)

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/FinTrack.git
cd FinTrack
```

### 2. Backend Setup
```bash
cd backend
npm install
npm run dev
```
The backend will run on `http://localhost:5000`

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm start
```
The frontend will run on `http://localhost:3000`

## 📦 Containerized Setup (Beginner Friendly)

This repo includes container configuration files to run the backend + frontend together.

### 1. Prerequisites
- Install Docker Desktop (provides the container engine and compose command)

### 2. Configure environment variables
Create a root environment file:
```bash
copy .env.example .env
```
Notes:
- `.env` contains secrets (like `JWT_SECRET`) so do **not** commit or upload it to GitHub.
- `.env.example` is safe to commit.

### 3. Run with Compose
From the project root (`FinTrack`), run:
```bash
docker compose up --build -d
```

### 4. Open the app
- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:5000/health`

### 5. Stop containers
```bash
docker compose down
```

### SQLite note
- SQLite database files are persisted using a Docker volume, so your entries remain after restarting containers.

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the backend directory:
```env
JWT_SECRET=your-super-secret-key-here
PORT=5000
```

### Database
- SQLite database is automatically created on first run
- Located at `backend/instance/expenses.db`
- No additional setup required

## 📱 Usage

1. **Register** - Create your account with username, email, and password
2. **Login** - Access your personal finance dashboard
3. **Add Entries** - Track expenses, income, or loans
4. **View Analytics** - See breakdowns by category and time
5. **Manage Data** - Edit or delete entries as needed

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Entries Table
```sql
CREATE TABLE entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  amount REAL NOT NULL,
  category TEXT NOT NULL,
  date TEXT NOT NULL,
  type TEXT NOT NULL,
  loan_type TEXT,
  person TEXT,
  note TEXT,
  FOREIGN KEY (user_id) REFERENCES users (id)
);
```

## 🔌 API Endpoints

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

## 🎨 Screenshots

*[Add screenshots of your application here]*

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by the need for simple, secure personal finance tracking
- Special thanks to the open-source community

## 📞 Support

If you have any questions or need help:
- Create an issue on GitHub
- Contact: [Your Email]

---

**Made with ❤️ for better financial management** 