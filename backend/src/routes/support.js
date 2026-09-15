const express = require('express');
const { requireAuth } = require('../lib/tenant');
const { getAdminClient } = require('../lib/supabase');

const router = express.Router();

/* Every authenticated route here requires a valid Supabase JWT. */
router.use(requireAuth);

const APPS = ['billing'];
const CATEGORIES = ['bug', 'feature', 'billing', 'account', 'other'];

/**
 * POST /api/support
 * Raise a support ticket (any MyBeezNus app). Body: { app, category, subject, message }
 */
router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    const app = APPS.includes(body.app) ? body.app : 'billing';
    const category = CATEGORIES.includes(body.category) ? body.category : 'other';
    const subject = String(body.subject || '').trim();
    const message = String(body.message || '').trim();

    if (subject.length < 3 || subject.length > 120) {
      return res.status(400).json({ error: 'Subject must be 3-120 characters.' });
    }
    if (message.length < 5 || message.length > 4000) {
      return res.status(400).json({ error: 'Message must be 5-4000 characters.' });
    }

    const { data, error } = await getAdminClient()
      .from('support_tickets')
      .insert({ user_id: req.user.uid, app: app, category: category, subject: subject, message: message })
      .select('id, app, category, subject, status, created_at')
      .single();
    if (error) throw error;

    return res.status(201).json({ ticket: data });
  } catch (err) {
    console.error('[support] create failed:', err);
    return res.status(500).json({ error: 'Could not submit your ticket. Please try again.' });
  }
});

/**
 * GET /api/support/mine
 * The caller's own tickets, newest first (status, admin replies and
 * follow-up replies included).
 */
router.get('/mine', async (req, res) => {
  try {
    const { data, error } = await getAdminClient()
      .from('support_tickets')
      .select('id, app, category, subject, message, status, admin_reply, created_at, updated_at, ticket_replies(id, sender, message, created_at)')
      .eq('user_id', req.user.uid)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;

    const tickets = (data || []).map(t => ({
      ...t,
      replies: Array.isArray(t.ticket_replies)
        ? t.ticket_replies.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        : [],
      ticket_replies: undefined,
    }));
    return res.json({ tickets });
  } catch (err) {
    console.error('[support] list failed:', err);
    return res.status(500).json({ error: 'Could not load your tickets.' });
  }
});

/**
 * POST /api/support/:id/replies
 * Add a follow-up comment to the caller's own open/in-progress ticket.
 * Body: { message }
 */
router.post('/:id/replies', async (req, res) => {
  try {
    const ticketId = String(req.params.id || '');
    const message = String((req.body || {}).message || '').trim();
    if (!/^[0-9a-f-]{36}$/i.test(ticketId)) {
      return res.status(400).json({ error: 'Invalid ticket id.' });
    }
    if (message.length < 1 || message.length > 4000) {
      return res.status(400).json({ error: 'Message must be 1-4000 characters.' });
    }

    // Ticket must belong to the caller and not be closed.
    const { data: ticket, error: tErr } = await getAdminClient()
      .from('support_tickets')
      .select('id, user_id, status')
      .eq('id', ticketId)
      .single();
    if (tErr || !ticket) return res.status(404).json({ error: 'Ticket not found.' });
    if (ticket.user_id !== req.user.uid) return res.status(403).json({ error: 'Not your ticket.' });
    if (ticket.status === 'closed') {
      return res.status(400).json({ error: 'This ticket is closed. Raise a new ticket instead.' });
    }

    const { data, error } = await getAdminClient()
      .from('ticket_replies')
      .insert({ ticket_id: ticketId, user_id: req.user.uid, sender: 'user', message })
      .select('id, sender, message, created_at')
      .single();
    if (error) throw error;

    return res.status(201).json({ reply: data });
  } catch (err) {
    console.error('[support] reply failed:', err);
    return res.status(500).json({ error: 'Could not add your reply. Please try again.' });
  }
});

module.exports = router;