const { verifyUserToken } = require('./supabase');

/**
 * Express middleware: require a valid Supabase access token (Bearer) and attach
 * the verified user to req.user. Guards every backend data route.
 */
const requireAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Authentication required' });
    const user = await verifyUserToken(token);
    req.user = { uid: user.id, email: user.email };
    next();
  } catch (e) {
    return res.status(401).json({ error: e.message });
  }
};

/**
 * Query helper enforcing tenant isolation (always filters by the authenticated
 * user_id) so routes cannot accidentally cross tenant boundaries.
 */
const listUserRows = async ({ supabase, uid, table, columns = '*', options = {} }) => {
  let q = supabase.from(table).select(columns).eq('user_id', uid);
  const { fromDate, toDate } = options;
  if (fromDate) q = q.gte('created_at', fromDate);
  if (toDate) q = q.lte('created_at', toDate);
  const { orderBy = 'created_at', ascending = false } = options;
  q = q.order(orderBy, { ascending });
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
};

module.exports = { requireAuth, listUserRows };