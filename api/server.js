// Vercel serverless function: handles all /api/* requests via rewrite in vercel.json.
// Delegates to the Express app in backend/server.js.
const app = require('../backend/server');

module.exports = app;