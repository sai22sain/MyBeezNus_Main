require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

let adminClient = null;

/**
 * Shared service-role (admin) Supabase client.
 * Use ONLY server-side: it bypasses Row Level Security and holds elevated
 * privileges. NEVER import this module from frontend code.
 */
const getAdminClient = () => {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env vars');
  }
  if (!adminClient) {
    adminClient = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return adminClient;
};

/**
 * Verify a Supabase user JWT and return the user. Lets the backend trust the
 * caller identity sent by the frontend instead of trusting request-body params.
 */
const verifyUserToken = async (accessToken) => {
  if (!accessToken) throw new Error('Missing access token');
  const { data, error } = await getAdminClient().auth.getUser(accessToken);
  if (error || !data.user) throw new Error('Invalid access token');
  return data.user;
};

module.exports = { getAdminClient, verifyUserToken };