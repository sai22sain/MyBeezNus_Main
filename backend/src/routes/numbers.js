const express = require('express');
const router = express.Router();
const { requireAuth } = require('../lib/tenant');
const { getAdminClient } = require('../lib/supabase');
const { nextBillNumber, nextCustomerNumber } = require('../lib/numbers');

/**
 * Resolve the entity prefix for a user. The frontend already holds the profile
 * (in AuthContext) and usually sends the configured prefix, so in the common
 * case we skip the profile fetch entirely — one round-trip instead of two.
 * We only fall back to a profile lookup when no prefix is provided.
 */
const resolvePrefix = async (client, uid, { column, fallback, sent }) => {
  if (sent) return sent;
  const { data: profile } = await client
    .from('profiles')
    .select(column)
    .eq('user_id', uid)
    .maybeSingle();
  return profile?.[column] || fallback;
};

/** POST /api/numbers/next-bill  body: { prefix } */
router.post('/next-bill', requireAuth, async (req, res) => {
  try {
    const prefix = await resolvePrefix(getAdminClient(), req.user.uid, {
      column: 'bill_prefix', fallback: 'BILL', sent: req.body?.prefix,
    });
    const number = await nextBillNumber(req.user.uid, prefix);
    res.json({ number, prefix });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** POST /api/numbers/next-customer  body: { prefix } */
router.post('/next-customer', requireAuth, async (req, res) => {
  try {
    const prefix = await resolvePrefix(getAdminClient(), req.user.uid, {
      column: 'customer_prefix', fallback: 'CUST', sent: req.body?.prefix,
    });
    const number = await nextCustomerNumber(req.user.uid, prefix);
    res.json({ number, prefix });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;