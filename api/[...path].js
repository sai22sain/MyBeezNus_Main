// Vercel serverless catch-all: all /api/* requests are routed here.
// It simply delegates to the Express app in backend/server.js.
const app = require('../backend/server');

module.exports = app;