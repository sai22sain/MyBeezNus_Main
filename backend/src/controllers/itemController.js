const { db } = require('../config/database');

const addItem = (req, res) => {
  const { item_name, category_id, price, tax } = req.body;
  
  if (!item_name || !category_id || !price) {
    return res.status(400).json({ error: 'Item name, category, and price are required' });
  }

  db.run(
    'INSERT INTO items (item_name, category_id, price, tax) VALUES (?, ?, ?, ?)',
    [item_name, category_id, price, tax || 0],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ item_id: this.lastID, message: 'Item added successfully' });
    }
  );
};

const updateItem = (req, res) => {
  const { id } = req.params;
  const { item_name, category_id, price, tax, is_active } = req.body;
  
  db.run(
    'UPDATE items SET item_name = ?, category_id = ?, price = ?, tax = ?, is_active = ? WHERE item_id = ?',
    [item_name, category_id, price, tax, is_active, id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Item not found' });
      res.json({ message: 'Item updated successfully' });
    }
  );
};

const toggleItemStatus = (req, res) => {
  const { id } = req.params;
  
  db.run(
    'UPDATE items SET is_active = NOT is_active WHERE item_id = ?',
    [id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Item not found' });
      res.json({ message: 'Item status updated successfully' });
    }
  );
};

const getAllItems = (req, res) => {
  db.all(
    `SELECT i.*, c.category_name 
     FROM items i 
     LEFT JOIN categories c ON i.category_id = c.category_id 
     ORDER BY c.category_name, i.item_name`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
};

const getActiveItems = (req, res) => {
  db.all(
    `SELECT i.*, c.category_name 
     FROM items i 
     LEFT JOIN categories c ON i.category_id = c.category_id 
     WHERE i.is_active = 1 
     ORDER BY c.category_name, i.item_name`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
};

const getCategories = (req, res) => {
  db.all('SELECT * FROM categories ORDER BY category_name', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

const addCategory = (req, res) => {
  const { category_name } = req.body;
  
  if (!category_name) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  db.run(
    'INSERT INTO categories (category_name) VALUES (?)',
    [category_name],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Category already exists' });
        }
        return res.status(500).json({ error: err.message });
      }
      res.json({ category_id: this.lastID, message: 'Category added successfully' });
    }
  );
};

const deleteItem = (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM items WHERE item_id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Item not found' });
    res.json({ message: 'Item deleted successfully' });
  });
};

const deleteCategory = (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM categories WHERE category_id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Category not found' });
    res.json({ message: 'Category deleted successfully' });
  });
};

module.exports = {
  addItem,
  updateItem,
  deleteItem,
  toggleItemStatus,
  getAllItems,
  getActiveItems,
  getCategories,
  addCategory,
  deleteCategory
};
