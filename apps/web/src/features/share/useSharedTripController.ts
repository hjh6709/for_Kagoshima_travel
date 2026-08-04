import { useEffect, useRef, useState } from "react";
import { ApiError } from "../../api/auth";
import { getSharedTrip, type SharedTripResponse } from "../../api/trips";
import { getLocalCache, setLocalCache, OFFLINE_CACHE_KEYS, isOnline } from "../../utils/offlineCache";

type UseSharedTripControllerParams = {
  shareToken: string;
};

// 공유 링크 공개 화면의 토큰 조회, 로딩, 에러 상태 및 오프라인 캐싱을 담당한다.
export function useSharedTripController({ shareToken }: UseSharedTripControllerParams) {
  const isShareRoute = shareToken.length > 0;
  const [sharedTrip, setSharedTrip] = useState<SharedTripResponse | null>(null);
  const [sharedTripError, setSharedTripError] = useState("");
  const [sharedTripWarning, setSharedTripWarning] = useState("");
  const [sharedTripLoading, setSharedTripLoading] = useState(isShareRoute);
  const [recoveryCount, setRecoveryCount] = useState(0);
  const activeShareToken = useRef(shareToken);
  const hasVisibleSharedTrip = useRef(false);
  const needsServerRecovery = useRef(false);

  useEffect(() => {
    if (!shareToken) return;

    const refreshAfterReconnect = () => {
      needsServerRecovery.current = false;
      setRecoveryCount((count) => count + 1);
    };
    const refreshAfterServerFailure = () => {
      if (!needsServerRecovery.current) return;

      // 연속 focus 이벤트가 같은 복구 요청을 중복 실행하지 않도록 요청 전에 잠급니다.
      needsServerRecovery.current = false;
      setRecoveryCount((count) => count + 1);
    };
    window.addEventListener("online", refreshAfterReconnect);
    window.addEventListener("focus", refreshAfterServerFailure);
    return () => {
      window.removeEventListener("online", refreshAfterReconnect);
      window.removeEventListener("focus", refreshAfterServerFailure);
    };
  }, [shareToken]);

  useEffect(() => {
    if (!shareToken) return;

    let cancelled = false;
    const isSameShareToken = activeShareToken.current === shareToken;
    const preserveCurrentTrip = recoveryCount > 0 && isSameShareToken && hasVisibleSharedTrip.current;
    if (!isSameShareToken) needsServerRecovery.current = false;
    activeShareToken.current = shareToken;

    if (!preserveCurrentTrip) {
      setSharedTripLoading(true);
      setSharedTripWarning("");
    }
    setSharedTripError("");

    // 오프라인 상태인 경우 즉시 캐시된 데이터를 불러옵니다.
    if (!isOnline()) {
      needsServerRecovery.current = false;
      const cached = getLocalCache<SharedTripResponse>(OFFLINE_CACHE_KEYS.SHARED_TRIP(shareToken));
      if (!cancelled) {
        if (cached) {
          hasVisibleSharedTrip.current = true;
          setSharedTrip(cached);
          setSharedTripWarning("네트워크 연결이 끊겼습니다. 보관된 오프라인 데이터를 표시 중입니다.");
        } else {
          hasVisibleSharedTrip.current = false;
          setSharedTrip(null);
          setSharedTripError("인터넷 연결이 필요합니다. 저장된 오프라인 데이터가 없습니다.");
        }
        setSharedTripLoading(false);
      }
      return;
    }

    if (!preserveCurrentTrip) {
      hasVisibleSharedTrip.current = false;
      setSharedTrip(null);
    }
    getSharedTrip(shareToken)
      .then((response) => {
        if (!cancelled) {
          needsServerRecovery.current = false;
          hasVisibleSharedTrip.current = true;
          setSharedTrip(response);
          setSharedTripWarning("");
          // 성공 시 다음 오프라인 접속을 위해 로컬 캐시를 업데이트합니다.
          setLocalCache(OFFLINE_CACHE_KEYS.SHARED_TRIP(shareToken), response);
        }
      })
      .catch((error) => {
        if (cancelled) return;

        // 온라인 상태에서 API 에러(예: 서버 장애)가 나더라도 캐시가 존재하면 복구합니다.
        const cached = getLocalCache<SharedTripResponse>(OFFLINE_CACHE_KEYS.SHARED_TRIP(shareToken));
        if (cached) {
          needsServerRecovery.current = true;
          hasVisibleSharedTrip.current = true;
          setSharedTrip(cached);
          setSharedTripWarning("API 서버와 연결되지 않아 보관된 오프라인 데이터를 표시 중입니다.");
          return;
        }

        if (error instanceof ApiError && error.status === 404) {
          needsServerRecovery.current = false;
          setSharedTripError("공유 링크를 찾을 수 없습니다. 링크가 정확한지 확인해주세요.");
          return;
        }
        needsServerRecovery.current = false;
        setSharedTripError(error instanceof Error ? error.message : "공유 여행 정보를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!cancelled) setSharedTripLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [recoveryCount, shareToken]);

  return { isShareRoute, sharedTrip, sharedTripError, sharedTripWarning, sharedTripLoading };
}
