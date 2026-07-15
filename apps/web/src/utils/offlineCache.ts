// 오프라인 대응을 위한 로컬 스토리지 캐시 유틸리티
// 네트워크 연결이 끊겨도 이전에 로드된 데이터를 렌더링할 수 있도록 로컬 스토리지에 백업합니다.

export const OFFLINE_CACHE_KEYS = {
  SHARED_TRIP: (token: string) => `shared-trip-${token}`, // 공유용 페이지 전용 키
  OWNER_TRIP: (tripId: string) => `owner-trip-${tripId}`,   // 여행 소유자(관리자)용 데이터 키
  MY_TRIPS: "my-trips",                                     // 로그인한 소유자의 여행 목록 키
};

// 캐싱 데이터 저장 시 기록 시간(timestamp)을 래핑하는 봉투 구조체
interface CacheEnvelope<T> {
  data: T;
  timestamp: number;
}

/**
 * 데이터를 브라우저 LocalStorage에 안전하게 캐싱합니다.
 * @param key 스토리지 식별 키
 * @param data 캐싱할 제네릭 데이터
 */
export function setLocalCache<T>(key: string, data: T): void {
  try {
    const envelope: CacheEnvelope<T> = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(envelope));
  } catch (e) {
    console.error("로컬 캐시를 저장하는 도중 오류가 발생했습니다.", e);
  }
}

/**
 * 브라우저 LocalStorage에 저장되어 있는 캐시 데이터를 안전하게 역직렬화하여 읽어옵니다.
 * @param key 스토리지 식별 키
 */
export function getLocalCache<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;
    const envelope = JSON.parse(item) as CacheEnvelope<T>;
    return envelope.data;
  } catch (e) {
    console.error("로컬 캐시를 읽어오는 도중 오류가 발생했습니다.", e);
    return null;
  }
}

/**
 * 브라우저의 navigator API를 사용하여 실시간 네트워크 연결 여부를 검사합니다.
 */
export function isOnline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine;
}
