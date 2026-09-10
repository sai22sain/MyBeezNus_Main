const { db } = require('../config/database');
const { generateBillPDF } = require('../utils/pdfGenerator');
const whatsappService = require('../utils/whatsapp');
const { getISTDateTime } = require('../utils/timezone');
const path = require('path');
const fs = require('fs');

const generateBillNumber = () => {
  return new Promise((resolve, reject) => {
    db.get('SELECT bill_number FROM bills ORDER BY bill_id DESC LIMIT 1', (err, row) => {
      if (err) reject(err);
      
      if (!row) {
        resolve('BILL-00001');
      } else {
        const lastId = parseInt(row.bill_number.split('-')[1]);
        const newId = `BILL-${String(lastId + 1).padStart(5, '0')}`;
        resolve(newId);
      }
    });
  });
};

const createBill = async (req, res) => {
  try {
    const { customer_id, items, discount, payment_mode } = req.body;
    
    if (!customer_id || !items || items.length === 0) {
      return res.status(400).json({ error: 'Customer and items are required' });
    }

    const billNumber = await generateBillNumber();
    
    // Calculate totals
    let totalAmount = 0;
    let totalTax = 0;
    
    items.forEach(item => {
      const subtotal = item.price * item.quantity;
      totalAmount += subtotal;
      totalTax += (subtotal * (item.tax || 0)) / 100;
    });

    const finalAmount = totalAmount + totalTax - (discount || 0);

    // Insert bill
    db.run(
      'INSERT INTO bills (bill_number, customer_id, total_amount, discount, tax, final_amount, payment_mode, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [billNumber, customer_id, totalAmount, discount || 0, totalTax, finalAmount, payment_mode, getISTDateTime()],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        const billId = this.lastID;
        
        // Insert bill items
        const stmt = db.prepare('INSERT INTO bill_items (bill_id, item_id, quantity, price, subtotal) VALUES (?, ?, ?, ?, ?)');
        
        items.forEach(item => {
          const subtotal = item.price * item.quantity;
          stmt.run(billId, item.item_id, item.quantity, item.price, subtotal);
        });
        
        stmt.finalize();
        
        res.json({ 
          bill_id: billId, 
          bill_number: billNumber, 
          message: 'Bill created successfully' 
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getBill = (req, res) => {
  const { id } = req.params;
  
  db.get(
    `SELECT b.*, c.name as customer_name, c.mobile as customer_mobile 
     FROM bills b 
     LEFT JOIN customers c ON b.customer_id = c.customer_id 
     WHERE b.bill_id = ?`,
    [id],
    (err, bill) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!bill) return res.status(404).json({ error: 'Bill not found' });
      
      db.all(
        `SELECT bi.*, i.item_name 
         FROM bill_items bi 
         LEFT JOIN items i ON bi.item_id = i.item_id 
         WHERE bi.bill_id = ?`,
        [id],
        (err, items) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ ...bill, items });
        }
      );
    }
  );
};

const sendBillWhatsApp = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get bill details
    db.get(
      `SELECT b.*, c.name as customer_name, c.mobile as customer_mobile 
       FROM bills b 
       LEFT JOIN customers c ON b.customer_id = c.customer_id 
       WHERE b.bill_id = ?`,
      [id],
      async (err, bill) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!bill) return res.status(404).json({ error: 'Bill not found' });
        
        // Get bill items
        db.all(
          `SELECT bi.*, i.item_name 
           FROM bill_items bi 
           LEFT JOIN items i ON bi.item_id = i.item_id 
           WHERE bi.bill_id = ?`,
          [id],
          async (err, items) => {
            if (err) return res.status(500).json({ error: err.message });
            
            const billData = { ...bill, items };
            
            // Generate PDF
            const pdfDir = path.join(__dirname, '../../bills');
            if (!fs.existsSync(pdfDir)) {
              fs.mkdirSync(pdfDir, { recursive: true });
            }
            
            const pdfPath = path.join(pdfDir, `${bill.bill_number}.pdf`);
            await generateBillPDF(billData, pdfPath);
            
            // Send via WhatsApp
            const mobile = bill.customer_mobile.startsWith('+') ? bill.customer_mobile : `+91${bill.customer_mobile}`;
            await whatsappService.sendBill(mobile, bill.customer_name, bill.final_amount, pdfPath);
            
            res.json({ message: 'Bill sent successfully via WhatsApp' });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const downloadBillPDF = async (req, res) => {
  try {
    const { id } = req.params;
    
    db.get(
      `SELECT b.*, c.name as customer_name, c.mobile as customer_mobile 
       FROM bills b 
       LEFT JOIN customers c ON b.customer_id = c.customer_id 
       WHERE b.bill_id = ?`,
      [id],
      async (err, bill) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!bill) return res.status(404).json({ error: 'Bill not found' });
        
        db.all(
          `SELECT bi.*, i.item_name 
           FROM bill_items bi 
           LEFT JOIN items i ON bi.item_id = i.item_id 
           WHERE bi.bill_id = ?`,
          [id],
          async (err, items) => {
            if (err) return res.status(500).json({ error: err.message });
            
            const billData = { ...bill, items };
            
            const pdfDir = path.join(__dirname, '../../bills');
            if (!fs.existsSync(pdfDir)) {
              fs.mkdirSync(pdfDir, { recursive: true });
            }
            
            const pdfPath = path.join(pdfDir, `${bill.bill_number}.pdf`);
            await generateBillPDF(billData, pdfPath);
            
            res.download(pdfPath, `${bill.bill_number}.pdf`);
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllBills = (req, res) => {
  db.all(
    `SELECT b.*, c.name as customer_name, c.mobile as customer_mobile 
     FROM bills b 
     LEFT JOIN customers c ON b.customer_id = c.customer_id 
     ORDER BY b.created_at DESC`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
};

const updateBill = async (req, res) => {
  try {
    const { id } = req.params;
    const { items, discount, payment_mode, total_amount, tax, final_amount } = req.body;

    // Update bill
    db.run(
      'UPDATE bills SET total_amount = ?, discount = ?, tax = ?, final_amount = ?, payment_mode = ? WHERE bill_id = ?',
      [total_amount, discount || 0, tax, final_amount, payment_mode, id],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Bill not found' });

        // Delete old bill items
        db.run('DELETE FROM bill_items WHERE bill_id = ?', [id], (err) => {
          if (err) return res.status(500).json({ error: err.message });

          // Insert new bill items
          const stmt = db.prepare('INSERT INTO bill_items (bill_id, item_id, quantity, price, subtotal) VALUES (?, ?, ?, ?, ?)');
          
          items.forEach(item => {
            const subtotal = item.price * item.quantity;
            stmt.run(id, item.item_id, item.quantity, item.price, subtotal);
          });
          
          stmt.finalize();
          res.json({ message: 'Bill updated successfully' });
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteBill = (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM bill_items WHERE bill_id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    
    db.run('DELETE FROM bills WHERE bill_id = ?', [id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Bill not found' });
      res.json({ message: 'Bill deleted successfully' });
    });
  });
};

module.exports = {
  createBill,
  getBill,
  updateBill,
  deleteBill,
  sendBillWhatsApp,
  downloadBillPDF,
  getAllBills
};
