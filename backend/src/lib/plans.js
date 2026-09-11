/**
 * Shared subscription plan definitions.
 * Single source of truth so the order-creation controller, the Razorpay webhook,
 * and future callers agree on prices, periods, and durations.
 */
const PLANS = {
  pro_monthly: { amount: 9900, currency: 'INR', period: 'monthly', days: 30 },
  pro_yearly:  { amount: 99900, currency: 'INR', period: 'yearly', days: 365 },
};

/**
 * Helper to compute the pro subscription expiry given a plan key (fallback to
 * pro_monthly for unknown plans).
 */
const planExpiry = (plan) => {
  const p = PLANS[plan] || PLANS.pro_monthly;
  const now = new Date();
  return {
    period: p.period,
    startedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + p.days * 24 * 60 * 60 * 1000).toISOString(),
  };
};

module.exports = { PLANS, planExpiry };