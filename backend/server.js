const optimizeCuts = require('./cutOptimizer');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const pool = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Test route
app.get('/', (req, res) => {
  res.send('OptiSmart API is running 🚀');
});

// Register Request Route
app.post('/api/register-request', async (req, res) => {
  const { email } = req.body;
  try {
    await pool.query(
      'INSERT INTO access_requests(email) VALUES($1) ON CONFLICT DO NOTHING',
      [email]
    );
    res.json({ message: 'Access request submitted.' });
  } catch (err) {
    console.error('Error saving request:', err);
    res.status(500).json({ error: 'Could not submit request' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

const { hashPassword, generateRandomPassword, sendEmailWithCredentials } = require('./auth');

// Get all access requests (for admin)
app.get('/api/access-requests', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM access_requests');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching access requests:', err);
    res.status(500).json({ error: 'Error fetching requests' });
  }
});

// Approve a user
app.post('/api/approve-user', async (req, res) => {
  const { email, role } = req.body;
  const password = generateRandomPassword();
  const hashed = hashPassword(password);

  try {
    // Save user
    await pool.query('INSERT INTO users (email, password, role) VALUES ($1, $2, $3)', [email, hashed, role || 'user']);
    // Delete request
    await pool.query('DELETE FROM access_requests WHERE email = $1', [email]);
    // Send email
    await sendEmailWithCredentials(email, password);
    res.json({ message: 'User approved and email sent.' });
  } catch (err) {
    console.error('Error approving user:', err);
    res.status(500).json({ error: 'Approval failed' });
  }
});

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Login Route
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userRes.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({ token, user: { email: user.email, role: user.role } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/optimize', (req, res) => {
  const { cuts, stock } = req.body;

  if (!cuts || !stock) {
    return res.status(400).json({ error: 'Missing cuts or stock data' });
  }

  const result = optimizeCuts(cuts, stock);
  res.json(result);
});
// Simple test route to try optimizer
app.get('/api/test-optimize', (req, res) => {
  const cuts = [1200, 800, 800, 500];
  const stock = [2500, 3000];

  const result = optimizeCuts(cuts, stock);
  res.json(result);
});
