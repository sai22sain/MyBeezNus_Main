const express = require('express');
const router = express.Router();
const { requireAuth } = require('../lib/tenant');
const { deleteAccount } = require('../controllers/accountController');

/**
 * POST /api/account/delete
 * Requires a valid Bearer token. Deletes the authenticated user's account
 * and all associated data from Supabase, SQLite, and Supabase Auth.
 */
router.post('/delete', requireAuth, deleteAccount);

module.exports = router;