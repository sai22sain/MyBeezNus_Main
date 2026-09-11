/**
 * Tiny in-memory reference-data cache (per-user, TTL-based).
 *
 * What belongs here: slow-changing reference data shared across pages
 * (categories, active items). What does NOT belong here: transactional
 * data (bills, dashboard numbers), search results, or anything that must
 * be fresh on every view.
 *
 * Rules enforced by this module:
 *  - keys are always scoped by user id (no cross-tenant leaks)
 *  - entries expire by TTL (stale-while-revalidate: serve stale, refresh bg)
 *  - errors are never cached
 *  - clearUser() must be called on logout / user switch
 */

const store = new Map(); // `${uid}:${key}` -> { data, ts }
const inflight = new Map(); // `${uid}:${key}` -> Promise (dedupes concurrent mounts)

export const CACHE_TTL = {
  categories: 5 * 60 * 1000,
  activeItems: 2 * 60 * 1000,
};

const now = () => Date.now();

export function cacheKey(uid, key) {
  return `${uid}:${key}`;
}

export function getCached(uid, key, ttlMs) {
  if (!uid || !key) return { hit: false };
  const entry = store.get(cacheKey(uid, key));
  if (!entry) return { hit: false };
  if (ttlMs && now() - entry.ts > ttlMs) return { hit: false, stale: entry.data };
  return { hit: true, data: entry.data };
}

export function setCached(uid, key, data) {
  if (!uid || !key) return;
  store.set(cacheKey(uid, key), { data, ts: now() });
}

export function invalidate(uid, key) {
  if (!uid) return;
  if (key) store.delete(cacheKey(uid, key));
  else {
    for (const k of Array.from(store.keys())) {
      if (k.startsWith(`${uid}:`)) store.delete(k);
    }
  }
}

/** Drop every cached entry (logout / user switch). */
export function clearAll() {
  store.clear();
  inflight.clear();
}

/**
 * Fetch through the cache with stale-while-revalidate semantics:
 *  - fresh hit  -> return cached, no network
 *  - stale hit  -> return stale immediately, refresh in background
 *  - miss       -> concurrent callers share one network request
 * Errors are never cached; background errors are swallowed (logged).
 */
export async function cachedFetch(uid, key, ttlMs, fetcher) {
  const ck = cacheKey(uid, key);
  const entry = store.get(ck);
  if (entry && ttlMs && now() - entry.ts <= ttlMs) return entry.data;
  if (inflight.has(ck)) return inflight.get(ck);

  const p = (async () => {
    try {
      const data = await fetcher();
      setCached(uid, key, data);
      return data;
    } finally {
      inflight.delete(ck);
    }
  })();

  inflight.set(ck, p);

  // Stale-while-revalidate: hand back stale data now, refresh behind it.
  if (entry) {
    p.catch(() => {});
    return entry.data;
  }
  return p;
}
