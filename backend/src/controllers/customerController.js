const { db } = require('../config/database');
const { getISTDateTime } = require('../utils/timezone');

const generateCustomerId = () => {
  return new Promise((resolve, reject) => {
    db.get('SELECT customer_id FROM customers ORDER BY customer_id DESC LIMIT 1', (err, row) => {
      if (err) reject(err);
      
      if (!row) {
        resolve('SALON-00001');
      } else {
        const lastId = parseInt(row.customer_id.split('-')[1]);
        const newId = `SALON-${String(lastId + 1).padStart(5, '0')}`;
        resolve(newId);
      }
    });
  });
};

const addCustomer = async (req, res) => {
  try {
    const { name, mobile, dob, gender, address, notes } = req.body;
    
    if (!name || !mobile) {
      return res.status(400).json({ error: 'Name and mobile are required' });
    }

    const customerId = await generateCustomerId();
    
    db.run(
      'INSERT INTO customers (customer_id, name, mobile, dob, gender, address, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [customerId, name, mobile, dob, gender, address, notes, getISTDateTime()],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Mobile number already exists' });
          }
          return res.status(500).json({ error: err.message });
        }
        res.json({ customer_id: customerId, message: 'Customer added successfully' });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const searchCustomer = (req, res) => {
  const { query } = req.query;
  
  if (!query) {
    return res.status(400).json({ error: 'Search query required' });
  }

  db.all(
    'SELECT * FROM customers WHERE mobile LIKE ? OR name LIKE ? ORDER BY created_at DESC',
    [`%${query}%`, `%${query}%`],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
};

const getCustomer = (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM customers WHERE customer_id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Customer not found' });
    res.json(row);
  });
};

const updateCustomer = (req, res) => {
  const { id } = req.params;
  const { name, mobile, dob, gender, address, notes } = req.body;
  
  db.run(
    'UPDATE customers SET name = ?, mobile = ?, dob = ?, gender = ?, address = ?, notes = ? WHERE customer_id = ?',
    [name, mobile, dob, gender, address, notes, id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Customer not found' });
      res.json({ message: 'Customer updated successfully' });
    }
  );
};

const getCustomerHistory = (req, res) => {
  const { id } = req.params;
  
  db.all(
    `SELECT b.*, COUNT(bi.id) as items_count 
     FROM bills b 
     LEFT JOIN bill_items bi ON b.bill_id = bi.bill_id 
     WHERE b.customer_id = ? 
     GROUP BY b.bill_id 
     ORDER BY b.created_at DESC`,
    [id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
};

const getAllCustomers = (req, res) => {
  db.all('SELECT * FROM customers ORDER BY created_at DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

const getBirthdayReminders = (req, res) => {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  
  db.all(
    `SELECT * FROM customers WHERE dob LIKE ?`,
    [`%-${month}-${day}`],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
};

const deleteCustomer = (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM customers WHERE customer_id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json({ message: 'Customer deleted successfully' });
  });
};

module.exports = {
  addCustomer,
  searchCustomer,
  getCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerHistory,
  getAllCustomers,
  getBirthdayReminders
};
