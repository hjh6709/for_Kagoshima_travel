export type CachedRate = {
  rate: number;
  savedAt: number;
};

export const EXCHANGE_RATE_CACHE_MAX_AGE = 1000 * 60 * 60 * 24 * 7;

function getCacheKey(currencyCode: string) {
  return `map-planner:exchange-rate:${currencyCode}`;
}

// 환율은 오늘 탭 스탯과 환율 위젯이 함께 쓰므로 캐시 규칙을 한곳에 둔다.
export function readCachedRate(currencyCode: string): CachedRate | null {
  try {
    const raw = localStorage.getItem(getCacheKey(currencyCode));
    if (!raw) return null;
    const cached = JSON.parse(raw) as CachedRate;
    if (!Number.isFinite(cached.rate) || cached.rate <= 0) return null;
    if (Date.now() - cached.savedAt > EXCHANGE_RATE_CACHE_MAX_AGE) return null;
    return cached;
  } catch {
    return null;
  }
}

export function saveCachedRate(currencyCode: string, rate: number) {
  try {
    localStorage.setItem(
      getCacheKey(currencyCode),
      JSON.stringify({ rate, savedAt: Date.now() } satisfies CachedRate),
    );
  } catch {
    // 저장소를 사용할 수 없어도 현재 화면의 계산은 계속 제공한다.
  }
}
