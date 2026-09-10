import { supabase } from '../supabase';

const FREE_LIMITS = { bills: 30, customers: 50 };

const toAppSub = (row) => {
  if (!row) return { plan: 'free' };
  const data = {
    plan: row.plan || 'free',
    period: row.period,
    amount: row.amount,
    paymentId: row.payment_id,
    startedAt: row.started_at,
    expiresAt: row.expires_at,
  };
  if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
    return { plan: 'free' };
  }
  return data;
};

const getSubscription = async (uid) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', uid)
    .maybeSingle();
  if (error) throw error;
  return toAppSub(data);
};

const saveSubscription = async (uid, subscriptionData) => {
  const row = {
    user_id: uid,
    plan: subscriptionData.plan || 'pro',
    period: subscriptionData.period || null,
    amount: subscriptionData.amount ?? null,
    started_at: subscriptionData.startedAt || new Date().toISOString(),
    expires_at: subscriptionData.expiresAt || null,
    payment_id: subscriptionData.paymentId || null,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from('subscriptions').upsert(row, { onConflict: 'user_id' });
  if (error) throw error;
};

const isPro = (subscription) => subscription?.plan === 'pro';

export { FREE_LIMITS, getSubscription, saveSubscription, isPro };

