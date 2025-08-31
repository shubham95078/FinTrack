const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database setup
const dbPath = path.join(__dirname, 'instance', 'expenses.db');
const db = new sqlite3.Database(dbPath);

// Create tables if they don't exist
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  // Entries table (now with user_id)
  db.run(`CREATE TABLE IF NOT EXISTS entries (
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
  )`);
});

// Helper function to convert database row to object
const rowToObject = (row) => ({
  id: row.id,
  title: row.title,
  amount: row.amount,
  category: row.category,
  date: row.date,
  type: row.type,
  loan_type: row.loan_type,
  person: row.person,
  note: row.note
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Authentication routes
app.post('/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  
  try {
    // Check if user already exists
    db.get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email], (err, row) => {
      if (err) {
        console.error('Error checking user:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      if (row) {
        return res.status(400).json({ error: 'Username or email already exists' });
      }
      
      // Hash password and create user
      bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
          console.error('Error hashing password:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
        
        db.run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', 
          [username, email, hashedPassword], function(err) {
          if (err) {
            console.error('Error creating user:', err);
            return res.status(500).json({ error: 'Internal server error' });
          }
          
          // Generate JWT token
          const token = jwt.sign({ userId: this.lastID, username }, JWT_SECRET, { expiresIn: '24h' });
          
          res.status(201).json({
            message: 'User created successfully',
            token,
            user: { id: this.lastID, username, email }
          });
        });
      });
    });
  } catch (error) {
    console.error('Error in registration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      console.error('Error fetching user:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        console.error('Error comparing passwords:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Generate JWT token
      const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
      
      res.json({
        message: 'Login successful',
        token,
        user: { id: user.id, username: user.username, email: user.email }
      });
    });
  });
});

// Protected routes - require authentication
// GET /entries - Get all entries for authenticated user
app.get('/entries', authenticateToken, (req, res) => {
  db.all('SELECT * FROM entries WHERE user_id = ? ORDER BY date DESC', [req.user.userId], (err, rows) => {
    if (err) {
      console.error('Error fetching entries:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    const entries = rows.map(rowToObject);
    res.json(entries);
  });
});

// POST /entries - Add new entry
app.post('/entries', authenticateToken, (req, res) => {
  const { title, amount, category, date, type, loan_type, person, note } = req.body;
  
  if (!title || !amount || !category || !type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const currentDate = date || new Date().toISOString().split('T')[0];
  
  const sql = `INSERT INTO entries (user_id, title, amount, category, date, type, loan_type, person, note) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
  db.run(sql, [req.user.userId, title, amount, category, currentDate, type, loan_type, person, note], function(err) {
    if (err) {
      console.error('Error adding entry:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    // Fetch the newly created entry
    db.get('SELECT * FROM entries WHERE id = ?', [this.lastID], (err, row) => {
      if (err) {
        console.error('Error fetching new entry:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      res.status(201).json(rowToObject(row));
    });
  });
});

// PUT /entries/:id - Update entry
app.put('/entries/:id', authenticateToken, (req, res) => {
  const entryId = parseInt(req.params.id);
  const { title, amount, category, date, type, loan_type, person, note } = req.body;
  
  // First check if entry exists and belongs to user
  db.get('SELECT * FROM entries WHERE id = ? AND user_id = ?', [entryId, req.user.userId], (err, row) => {
    if (err) {
      console.error('Error checking entry:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    
    // Update the entry
    const sql = `UPDATE entries SET 
                  title = ?, amount = ?, category = ?, date = ?, 
                  type = ?, loan_type = ?, person = ?, note = ?
                  WHERE id = ? AND user_id = ?`;
    
    db.run(sql, [
      title || row.title,
      amount || row.amount,
      category || row.category,
      date || row.date,
      type || row.type,
      loan_type !== undefined ? loan_type : row.loan_type,
      person !== undefined ? person : row.person,
      note !== undefined ? note : row.note,
      entryId,
      req.user.userId
    ], function(err) {
      if (err) {
        console.error('Error updating entry:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      // Fetch the updated entry
      db.get('SELECT * FROM entries WHERE id = ?', [entryId], (err, updatedRow) => {
        if (err) {
          console.error('Error fetching updated entry:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
        res.json(rowToObject(updatedRow));
      });
    });
  });
});

// DELETE /entries/:id - Delete entry
app.delete('/entries/:id', authenticateToken, (req, res) => {
  const entryId = parseInt(req.params.id);
  
  // First check if entry exists and belongs to user
  db.get('SELECT * FROM entries WHERE id = ? AND user_id = ?', [entryId, req.user.userId], (err, row) => {
    if (err) {
      console.error('Error checking entry:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    
    // Delete the entry
    db.run('DELETE FROM entries WHERE id = ? AND user_id = ?', [entryId, req.user.userId], function(err) {
      if (err) {
        console.error('Error deleting entry:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      res.status(204).send();
    });
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'FinTrack API is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`FinTrack server running on port ${PORT}`);
  console.log(`Database path: ${dbPath}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
}); 