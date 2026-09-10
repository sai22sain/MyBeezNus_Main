const { db } = require('../config/database');
const { getISTDate } = require('../utils/timezone');
const ExcelJS = require('exceljs');

const getDailyRevenue = (req, res) => {
  const { date } = req.query;
  const targetDate = date || getISTDate();
  
  db.get(
    `SELECT 
      COUNT(*) as total_bills,
      SUM(final_amount) as total_revenue,
      AVG(final_amount) as avg_bill_amount
     FROM bills 
     WHERE DATE(created_at) = ?`,
    [targetDate],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(row);
    }
  );
};

const getMonthlyRevenue = (req, res) => {
  const { month, year } = req.query;
  const currentDate = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(currentDate.getTime() + istOffset);
  const targetMonth = month || String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const targetYear = year || istDate.getUTCFullYear();
  
  db.get(
    `SELECT 
      COUNT(*) as total_bills,
      SUM(final_amount) as total_revenue,
      AVG(final_amount) as avg_bill_amount
     FROM bills 
     WHERE strftime('%m', created_at) = ? AND strftime('%Y', created_at) = ?`,
    [String(targetMonth).padStart(2, '0'), String(targetYear)],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(row);
    }
  );
};

const getTopServices = (req, res) => {
  const { limit } = req.query;
  
  db.all(
    `SELECT 
      i.item_name,
      COUNT(bi.id) as times_sold,
      SUM(bi.quantity) as total_quantity,
      SUM(bi.subtotal) as total_revenue
     FROM bill_items bi
     LEFT JOIN items i ON bi.item_id = i.item_id
     GROUP BY bi.item_id
     ORDER BY times_sold DESC
     LIMIT ?`,
    [limit || 10],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
};

const getRepeatCustomers = (req, res) => {
  db.all(
    `SELECT 
      c.customer_id,
      c.name,
      c.mobile,
      COUNT(b.bill_id) as visit_count,
      SUM(b.final_amount) as total_spent,
      MAX(b.created_at) as last_visit
     FROM customers c
     LEFT JOIN bills b ON c.customer_id = b.customer_id
     GROUP BY c.customer_id
     HAVING visit_count > 1
     ORDER BY visit_count DESC`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
};

const getDashboardStats = (req, res) => {
  const today = getISTDate();
  const currentDate = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(currentDate.getTime() + istOffset);
  const currentMonth = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const currentYear = istDate.getUTCFullYear();
  
  db.get(
    `SELECT 
      (SELECT COUNT(*) FROM customers) as total_customers,
      (SELECT COUNT(*) FROM bills WHERE DATE(created_at) = ?) as today_bills,
      (SELECT COALESCE(SUM(final_amount), 0) FROM bills WHERE DATE(created_at) = ?) as today_revenue,
      (SELECT COALESCE(SUM(final_amount), 0) FROM bills WHERE strftime('%m', created_at) = ? AND strftime('%Y', created_at) = ?) as month_revenue,
      (SELECT COUNT(*) FROM items WHERE is_active = 1) as active_services`,
    [today, today, currentMonth, String(currentYear)],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(row);
    }
  );
};

const exportRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    db.all(
      `SELECT 
        b.bill_number,
        b.created_at,
        c.name as customer_name,
        c.mobile,
        b.total_amount,
        b.discount,
        b.tax,
        b.final_amount,
        b.payment_mode
       FROM bills b
       LEFT JOIN customers c ON b.customer_id = c.customer_id
       WHERE DATE(b.created_at) BETWEEN ? AND ?
       ORDER BY b.created_at DESC`,
      [startDate, endDate],
      async (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Revenue Report');
        
        worksheet.columns = [
          { header: 'Bill Number', key: 'bill_number', width: 15 },
          { header: 'Date', key: 'created_at', width: 20 },
          { header: 'Customer Name', key: 'customer_name', width: 25 },
          { header: 'Mobile', key: 'mobile', width: 15 },
          { header: 'Subtotal', key: 'total_amount', width: 12 },
          { header: 'Discount', key: 'discount', width: 12 },
          { header: 'Tax', key: 'tax', width: 12 },
          { header: 'Final Amount', key: 'final_amount', width: 15 },
          { header: 'Payment Mode', key: 'payment_mode', width: 15 }
        ];
        
        worksheet.addRows(rows);
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=revenue_report_${startDate}_${endDate}.xlsx`);
        
        await workbook.xlsx.write(res);
        res.end();
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getDailyRevenue,
  getMonthlyRevenue,
  getTopServices,
  getRepeatCustomers,
  getDashboardStats,
  exportRevenueReport
};
