const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { getAdminClient } = require('../lib/supabase');
const { planExpiry } = require('../lib/plans');

/**
 * POST /api/webhooks/razorpay
 * Razorpay -> server webhook. Verifies the HMAC signature over the raw body,
 * then writes the subscription into Supabase using the service-role client.
 * This prevents the frontend from spoofing a subscription entry.
 */
router.post('/razorpay', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      return res.status(503).json({ error: 'RAZORPAY_WEBHOOK_SECRET not configured' });
    }

    const signature = req.headers['x-razorpay-signature'];
    const body = req.body;

    // A valid webhook always has a signature + a JSON body.
    if (!signature || typeof body !== 'string' || !body.trim()) {
      return res.status(400).json({ error: 'Missing signature or body' });
    }

    const expected = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    if (signature !== expected) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = JSON.parse(body);
    const payload = event.payload || {};
    const payment = payload.payment?.entity || {};

    if (event.event === 'payment.captured' && payment.notes?.userId) {
      const uid = payment.notes.userId;
      const plan = payment.notes.plan || 'pro_monthly';
      const { period, startedAt, expiresAt } = planExpiry(plan);
      const amount = (payment.amount || 0) / 100;

      await getAdminClient()
        .from('subscriptions')
        .upsert(
          {
            user_id: uid,
            plan: 'pro',
            period,
            amount,
            started_at: startedAt,
            expires_at: expiresAt,
            payment_id: payment.id || '',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

      return res.json({ received: true });
    }

    res.json({ received: true, ignored: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;