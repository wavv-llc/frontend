/**
 * Module-level stale-while-revalidate cache for page data.
 * Persists across client-side navigations so pages can show
 * cached content instantly instead of re-showing loading skeletons.
 */

interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();
const TTL_MS = 5 * 60 * 1000; // 5 minutes

export function getCached<T>(key: string): T | null {
    const entry = store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        store.delete(key);
        return null;
    }
    return entry.data;
}

export function setCached<T>(key: string, data: T): void {
    store.set(key, { data, expiresAt: Date.now() + TTL_MS });
}

export function invalidateCached(...keys: string[]): void {
    for (const key of keys) {
        store.delete(key);
    }
}
