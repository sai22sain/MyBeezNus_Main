const { db } = require('./src/config/database');

const seedData = () => {
  console.log('Seeding sample data...');

  // Sample services
  const services = [
    { name: 'Haircut - Men', category: 1, price: 300, tax: 0 },
    { name: 'Haircut - Women', category: 1, price: 500, tax: 0 },
    { name: 'Hair Color', category: 1, price: 1500, tax: 0 },
    { name: 'Facial - Basic', category: 2, price: 800, tax: 0 },
    { name: 'Facial - Premium', category: 2, price: 1500, tax: 0 },
    { name: 'Beard Trim', category: 3, price: 150, tax: 0 },
    { name: 'Shaving', category: 3, price: 200, tax: 0 },
    { name: 'Massage - Head', category: 4, price: 400, tax: 0 },
    { name: 'Massage - Full Body', category: 4, price: 2000, tax: 0 },
    { name: 'Hair Oil', category: 5, price: 250, tax: 0 },
    { name: 'Shampoo', category: 5, price: 350, tax: 0 }
  ];

  const stmt = db.prepare('INSERT INTO items (item_name, category_id, price, tax) VALUES (?, ?, ?, ?)');
  
  services.forEach(service => {
    stmt.run(service.name, service.category, service.price, service.tax);
  });
  
  stmt.finalize();

  console.log('Sample data seeded successfully!');
  console.log('- Added 11 sample services');
  console.log('- Categories: Hair, Skin, Grooming, Spa, Products');
  
  db.close();
};

// Initialize database first
const { initDatabase } = require('./src/config/database');
initDatabase();

// Wait a bit for database to initialize
setTimeout(seedData, 1000);
