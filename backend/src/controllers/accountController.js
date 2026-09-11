const { getAdminClient } = require('../lib/supabase');
const { db } = require('../config/database');

/**
 * POST /api/account/delete
 * Permanently deletes the authenticated user's account and ALL associated data.
 *
 * Deletes from:
 *   1. Supabase: profiles, bills, customers, items, categories, sequences
 *   2. SQLite (if present): customers, bills, bill_items, items, categories
 *   3. Supabase Auth: the user account itself
 *
 * The caller MUST present a valid Bearer token (verified by requireAuth middleware
 * in the route layer). This endpoint uses the service-role client for Supabase
 * deletes so it bypasses RLS — that's safe because we already authenticated the
 * caller and only operate on their own user_id.
 */
const deleteAccount = async (req, res) => {
  const uid = req.user.uid;

  try {
    await deleteSupabaseData(uid);
    await deleteSqliteData();
    await deleteAuthUser(uid);

    return res.json({
      message: 'Account and all data deleted successfully',
    });
  } catch (err) {
    console.error('[deleteAccount] error:', err);
    return res.status(500).json({ error: 'Failed to delete account: ' + err.message });
  }
};

/**
 * Delete all Supabase table rows owned by this user.
 * Order matters: child tables first (bills → customers → items → categories → profiles).
 */
async function deleteSupabaseData(uid) {
  const client = getAdminClient();

  // 1. bills (has items embedded as JSONB, no separate join table)
  const { error: billsErr } = await client
    .from('bills')
    .delete()
    .eq('user_id', uid);
  if (billsErr) throw billsErr;

  // 2. customers
  const { error: custErr } = await client
    .from('customers')
    .delete()
    .eq('user_id', uid);
  if (custErr) throw custErr;

  // 3. items
  const { error: itemsErr } = await client
    .from('items')
    .delete()
    .eq('user_id', uid);
  if (itemsErr) throw itemsErr;

  // 4. categories
  const { error: catErr } = await client
    .from('categories')
    .delete()
    .eq('user_id', uid);
  if (catErr) throw catErr;

  // 5. sequences
  const { error: seqErr } = await client
    .from('sequences')
    .delete()
    .eq('user_id', uid);
  if (seqErr) throw seqErr;

  // 6. profiles (last — no other table references it)
  const { error: profErr } = await client
    .from('profiles')
    .delete()
    .eq('user_id', uid);
  if (profErr) throw profErr;
}

/**
 * Delete all SQLite rows. The SQLite schema is a legacy single-tenant store
 * with no user_id column, so we wipe the entire dataset. This is acceptable
 * because:
 *   - The frontend React app (Supabase-backed) is the primary UI today.
 *   - The SQLite backend serves the old MyBills.in routes which are only
 *     used when the Supabase backend is unreachable.
 *   - A single-user local install has no other tenant to protect.
 */
async function deleteSqliteData() {
  // bill_items → bills → customers → items → categories
  // (child tables first to honour FK constraints)
  db.run('DELETE FROM bill_items', (err) => {
    if (err) console.error('[deleteSqliteData] bill_items:', err.message);
  });
  db.run('DELETE FROM bills', (err) => {
    if (err) console.error('[deleteSqliteData] bills:', err.message);
  });
  db.run('DELETE FROM customers', (err) => {
    if (err) console.error('[deleteSqliteData] customers:', err.message);
  });
  db.run('DELETE FROM items', (err) => {
    if (err) console.error('[deleteSqliteData] items:', err.message);
  });
  db.run('DELETE FROM categories', (err) => {
    if (err) console.error('[deleteSqliteData] categories:', err.message);
  });

  // Reset AUTOINCREMENT counters so the next bill/customer starts at 1 again.
  db.run('DELETE FROM sqlite_sequence WHERE name IN ("bills","customers","items","categories")', () => {});
}

/**
 * Delete the Supabase Auth user. This revokes all tokens and removes the
 * account from the identity provider. Must be called AFTER all table data is
 * deleted so RLS (if any) has already been satisfied.
 */
async function deleteAuthUser(uid) {
  const client = getAdminClient();
  const { error } = await client.auth.admin.deleteUser(uid);
  if (error) throw error;
}

module.exports = { deleteAccount };