// Local storage cache utility for offline first behavior

export const OFFLINE_CACHE_KEYS = {
  SHARED_TRIP: (token: string) => `shared-trip-${token}`,
  OWNER_TRIP: (tripId: string) => `owner-trip-${tripId}`,
  MY_TRIPS: "my-trips",
};

interface CacheEnvelope<T> {
  data: T;
  timestamp: number;
}

export function setLocalCache<T>(key: string, data: T): void {
  try {
    const envelope: CacheEnvelope<T> = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(envelope));
  } catch (e) {
    console.error("Error setting local cache", e);
  }
}

export function getLocalCache<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;
    const envelope = JSON.parse(item) as CacheEnvelope<T>;
    return envelope.data;
  } catch (e) {
    console.error("Error getting local cache", e);
    return null;
  }
}

export function isOnline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine;
}
