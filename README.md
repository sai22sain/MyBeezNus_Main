# Salon Billing and Customer Management Application

A complete salon management system with billing, customer management, WhatsApp integration, and reporting features. Optimized for ChromeOS Flex and Chromebook.

## Features

### Customer Management
- Auto-generated Customer IDs (SALON-00001, SALON-00002, etc.)
- Customer profiles with name, mobile, DOB, gender, address, notes
- Search customers by mobile or name
- View customer visit history
- Birthday reminders

### Services/Products Management
- Categorized services (Hair, Skin, Grooming, Spa, Products)
- Price and tax management
- Enable/disable services
- Easy service selection during billing

### Billing System
- Auto-generated Bill Numbers (BILL-00001, BILL-00002, etc.)
- Multiple items per bill
- Automatic tax calculation
- Discount support
- Multiple payment modes (Cash, UPI, Card)
- PDF bill generation
- WhatsApp bill delivery

### WhatsApp Integration
- Automatic bill delivery via WhatsApp Cloud API
- PDF attachment with bill details
- Resend bill option

### Reports & Analytics
- Daily revenue reports
- Monthly revenue reports
- Top services analysis
- Repeat customer tracking
- Export reports to Excel

## Technology Stack

- **Frontend**: React 18
- **Backend**: Node.js with Express
- **Database**: SQLite (perfect for ChromeOS)
- **PDF Generation**: PDFKit
- **WhatsApp**: Meta WhatsApp Cloud API
- **Excel Export**: ExcelJS

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables in `.env`:
```
PORT=5000
DB_PATH=./salon.db

# WhatsApp Cloud API Configuration
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token

# Salon Details
SALON_NAME=Your Salon Name
SALON_ADDRESS=Your Salon Address
SALON_PHONE=Your Contact Number
```

4. Start the backend server:
```bash
npm start
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## WhatsApp Cloud API Setup

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a Business App
3. Add WhatsApp product to your app
4. Get your Phone Number ID from the WhatsApp dashboard
5. Generate a permanent Access Token
6. Update the `.env` file with these credentials:
   - `WHATSAPP_PHONE_NUMBER_ID`: Your phone number ID
   - `WHATSAPP_ACCESS_TOKEN`: Your access token

### Important WhatsApp Notes:
- Phone numbers must be in international format (e.g., +919876543210)
- Test with your own number first
- For production, you need to verify your business and get approval from Meta

## Database Schema

### Customers Table
- customer_id (TEXT, PRIMARY KEY)
- name (TEXT)
- mobile (TEXT, UNIQUE)
- dob (TEXT)
- gender (TEXT)
- address (TEXT)
- notes (TEXT)
- created_at (DATETIME)

### Categories Table
- category_id (INTEGER, PRIMARY KEY)
- category_name (TEXT, UNIQUE)

### Items Table
- item_id (INTEGER, PRIMARY KEY)
- item_name (TEXT)
- category_id (INTEGER)
- price (REAL)
- tax (REAL)
- is_active (INTEGER)

### Bills Table
- bill_id (INTEGER, PRIMARY KEY)
- bill_number (TEXT, UNIQUE)
- customer_id (TEXT)
- total_amount (REAL)
- discount (REAL)
- tax (REAL)
- final_amount (REAL)
- payment_mode (TEXT)
- created_at (DATETIME)

### Bill_Items Table
- id (INTEGER, PRIMARY KEY)
- bill_id (INTEGER)
- item_id (INTEGER)
- quantity (INTEGER)
- price (REAL)
- subtotal (REAL)

## Usage Guide

### Adding a Customer
1. Go to "Customers" page
2. Click "Add Customer"
3. Fill in customer details (name and mobile are required)
4. Click "Add Customer"

### Creating a Bill
1. Go to "New Bill" page
2. Search and select a customer (or add new customer)
3. Click on services/products to add to bill
4. Adjust quantities if needed
5. Add discount (optional)
6. Select payment mode
7. Click "Generate Bill & Send WhatsApp"

### Managing Services
1. Go to "Services" page
2. Click "Add Service" to create new service
3. Edit existing services by clicking "Edit"
4. Enable/disable services as needed

### Viewing Reports
1. Go to "Reports" page
2. View daily/monthly revenue
3. Check top services
4. See repeat customers
5. Export reports to Excel

## API Endpoints

### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/search?query=` - Search customers
- `GET /api/customers/:id` - Get customer by ID
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `GET /api/customers/:id/history` - Get customer history
- `GET /api/customers/birthdays` - Get birthday reminders

### Items/Services
- `GET /api/items` - Get all items
- `GET /api/items/active` - Get active items
- `POST /api/items` - Create item
- `PUT /api/items/:id` - Update item
- `PATCH /api/items/:id/toggle` - Toggle item status
- `GET /api/items/categories` - Get categories
- `POST /api/items/categories` - Create category

### Bills
- `GET /api/bills` - Get all bills
- `GET /api/bills/:id` - Get bill by ID
- `POST /api/bills` - Create bill
- `GET /api/bills/:id/download` - Download bill PDF
- `POST /api/bills/:id/whatsapp` - Send bill via WhatsApp

### Reports
- `GET /api/reports/dashboard` - Get dashboard stats
- `GET /api/reports/daily?date=` - Get daily revenue
- `GET /api/reports/monthly?month=&year=` - Get monthly revenue
- `GET /api/reports/top-services?limit=` - Get top services
- `GET /api/reports/repeat-customers` - Get repeat customers
- `GET /api/reports/export?startDate=&endDate=` - Export revenue report

## ChromeOS Optimization

This application is optimized for ChromeOS Flex:
- Uses SQLite (no external database server needed)
- Lightweight and fast
- Tablet-friendly UI
- Works offline (except WhatsApp features)
- Low resource consumption

## Troubleshooting

### Backend won't start
- Check if port 5000 is available
- Verify all dependencies are installed
- Check .env file configuration

### WhatsApp not sending
- Verify WhatsApp credentials in .env
- Check phone number format (+country code)
- Ensure internet connection
- Check Meta Business Manager for API status

### Database errors
- Delete salon.db file and restart backend to recreate
- Check file permissions

## Production Deployment

### For ChromeOS/Chromebook:
1. Build frontend:
```bash
cd frontend
npm run build
```

2. Serve frontend build from backend:
Update backend server.js to serve static files

3. Run backend:
```bash
cd backend
npm start
```

### For Cloud Deployment:
- Deploy backend to services like Heroku, AWS, or DigitalOcean
- Deploy frontend to Netlify, Vercel, or similar
- Update API_BASE_URL in frontend to point to deployed backend

## License

MIT License - Free to use and modify

## Support

For issues or questions, please create an issue in the repository.
