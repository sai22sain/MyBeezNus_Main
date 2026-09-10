require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./src/config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database
initDatabase();

// API Routes
app.use('/api/customers', require('./src/routes/customers'));
app.use('/api/items', require('./src/routes/items'));
app.use('/api/bills', require('./src/routes/bills'));
app.use('/api/reports', require('./src/routes/reports'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'MyBills API is running' });
});

// Serve static files from React build (Production)
const buildPath = path.join(__dirname, '../frontend/build');
app.use(express.static(buildPath));

// All other routes serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`
  ========================================
  MyBills Application
  ========================================
  Server running on: http://localhost:${PORT}
  Environment: Production
  Database: ${process.env.DB_PATH || './salon.db'}
  ========================================
  `);
});
