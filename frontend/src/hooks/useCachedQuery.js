import { useEffect, useRef, useState } from 'react';
import { cachedFetch, invalidate } from '../utils/core/cache';

/**
 * useCachedQuery(uid, key, ttlMs, fetcher, opts)
 * React binding over cachedFetch: serves cache instantly, revalidates
 * stale entries in the background, dedupes concurrent mounts.
 */
export function useCachedQuery(uid, key, ttlMs, fetcher, opts = {}) {
  const { enabled = true } = opts;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    if (!enabled || !uid) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    cachedFetch(uid, key, ttlMs, () => fetcherRef.current())
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, key, enabled]);

  return {
    data: data || [],
    loading,
    error,
    refresh: async () => {
      invalidate(uid, key);
      setLoading(true);
      try {
        const d = await cachedFetch(uid, key, ttlMs, () => fetcherRef.current());
        setData(d);
      } catch (e) {
        setError(e);
      } finally {
        setLoading(false);
      }
    },
  };
}
