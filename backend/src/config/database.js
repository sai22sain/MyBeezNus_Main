const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DB_PATH || './salon.db';
const db = new sqlite3.Database(dbPath);

const initDatabase = () => {
  db.serialize(() => {
    // Customers table
    db.run(`CREATE TABLE IF NOT EXISTS customers (
      customer_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      mobile TEXT UNIQUE NOT NULL,
      dob TEXT,
      gender TEXT,
      address TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Categories table
    db.run(`CREATE TABLE IF NOT EXISTS categories (
      category_id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_name TEXT NOT NULL UNIQUE
    )`);

    // Items/Services table
    db.run(`CREATE TABLE IF NOT EXISTS items (
      item_id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_name TEXT NOT NULL,
      category_id INTEGER,
      price REAL NOT NULL,
      tax REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY (category_id) REFERENCES categories(category_id)
    )`);

    // Bills table
    db.run(`CREATE TABLE IF NOT EXISTS bills (
      bill_id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_number TEXT UNIQUE NOT NULL,
      customer_id TEXT,
      total_amount REAL NOT NULL,
      discount REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      final_amount REAL NOT NULL,
      payment_mode TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
    )`);

    // Bill Items table
    db.run(`CREATE TABLE IF NOT EXISTS bill_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_id INTEGER,
      item_id INTEGER,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      subtotal REAL NOT NULL,
      FOREIGN KEY (bill_id) REFERENCES bills(bill_id),
      FOREIGN KEY (item_id) REFERENCES items(item_id)
    )`);

    // Insert default categories
    const defaultCategories = ['Hair', 'Skin', 'Grooming', 'Spa', 'Products'];
    const stmt = db.prepare('INSERT OR IGNORE INTO categories (category_name) VALUES (?)');
    defaultCategories.forEach(cat => stmt.run(cat));
    stmt.finalize();

    console.log('Database initialized successfully');
  });
};

module.exports = { db, initDatabase };
