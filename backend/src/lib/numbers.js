const { getAdminClient } = require('./supabase');

/**
 * Atomic, collision-free number generation via a Postgres SECURITY DEFINER RPC
 * (sequences table keyed by user_id + entity_type). Replaces the old
 * count + prefix approach that could collide on concurrent creates.
 */
const nextNumber = async ({ uid, entityType, prefix }) => {
  const client = getAdminClient();
  const { data, error } = await client.rpc('next_sequence_number', {
    p_user_id: uid,
    p_entity_type: entityType, // 'bill' | 'customer'
    p_prefix: prefix || null,
  });
  if (error) throw error;
  return data;
};

const nextBillNumber = (uid, prefix) => nextNumber({ uid, entityType: 'bill', prefix });
const nextCustomerNumber = (uid, prefix) => nextNumber({ uid, entityType: 'customer', prefix });

module.exports = { nextNumber, nextBillNumber, nextCustomerNumber };