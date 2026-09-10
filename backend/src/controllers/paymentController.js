const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const PLANS = {
  pro_monthly: { amount: 9900, currency: 'INR', period: 'monthly', days: 30 },
  pro_yearly:  { amount: 99900, currency: 'INR', period: 'yearly', days: 365 }
};

// Create Razorpay order
const createOrder = async (req, res) => {
  try {
    const { plan, userId } = req.body;
    if (!PLANS[plan]) return res.status(400).json({ error: 'Invalid plan' });

    const order = await razorpay.orders.create({
      amount: PLANS[plan].amount,
      currency: PLANS[plan].currency,
      receipt: `receipt_${userId}_${Date.now()}`,
      notes: { userId, plan }
    });

    res.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Verify payment signature and return subscription data
const verifyPayment = (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan, userId } = req.body;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    const planData = PLANS[plan];
    const now = new Date();
    const expiresAt = new Date(now.getTime() + planData.days * 24 * 60 * 60 * 1000);

    res.json({
      success: true,
      subscription: {
        plan: 'pro',
        period: planData.period,
        startedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        amount: planData.amount / 100
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createOrder, verifyPayment };
