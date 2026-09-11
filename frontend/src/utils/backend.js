import { supabase } from '../supabase';

/**
 * Thin wrapper around the MyBeezNus backend API.
 * Attaches the user's Supabase access token (Bearer) so backend routes can
 * verify identity. Targets are reserved for high-risk/privileged operations
 * that must NOT run with the anon key in the browser:
 *   - atomic bill/customer number generation
 *   - Excel report export
 *   - Razorpay webhook subscription writes
 */
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const getAccessToken = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
};

/**
 * Call a backend endpoint. Returns `null` (instead of throwing) when the
 * backend is unreachable or unconfigured, so callers can fall back to the
 * existing client-side behavior.
 */
const callBackend = async (method, path, payload) => {
  const token = await getAccessToken();
  if (!token || !process.env.REACT_APP_API_URL) return null;

  const url = `${API_URL}${path}`;
  const opts = {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };

  if (payload) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(payload);
  }

  try {
    const res = await fetch(url, opts);
    if (!res.ok) return null;
    const type = res.headers.get('content-type') || '';
    return type.includes('application/json') ? res.json() : res.blob();
  } catch {
    return null;
  }
};

export const backendAPI = {
  nextBillNumber: (prefix) => callBackend('POST', '/api/numbers/next-bill', { prefix }),
  nextCustomerNumber: (prefix) => callBackend('POST', '/api/numbers/next-customer', { prefix }),
  exportRevenue: (startDate, endDate) =>
    callBackend('GET', `/api/reports/export?startDate=${startDate}&endDate=${endDate}`),
};

export default backendAPI;