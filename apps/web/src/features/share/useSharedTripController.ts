import { useEffect, useState } from "react";
import { ApiError } from "../../api/auth";
import { getSharedTrip, type SharedTripResponse } from "../../api/trips";

type UseSharedTripControllerParams = {
  shareToken: string;
};

// 공유 링크 공개 화면의 토큰 조회, 로딩, 에러 상태만 담당한다.
export function useSharedTripController({ shareToken }: UseSharedTripControllerParams) {
  const isShareRoute = shareToken.length > 0;
  const [sharedTrip, setSharedTrip] = useState<SharedTripResponse | null>(null);
  const [sharedTripError, setSharedTripError] = useState("");
  const [sharedTripLoading, setSharedTripLoading] = useState(isShareRoute);

  useEffect(() => {
    if (!shareToken) return;

    let cancelled = false;
    setSharedTripLoading(true);
    setSharedTripError("");
    setSharedTrip(null);
    getSharedTrip(shareToken)
      .then((response) => {
        if (!cancelled) setSharedTrip(response);
      })
      .catch((error) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 404) {
          setSharedTripError("공유 링크를 찾을 수 없습니다. 링크가 정확한지 확인해주세요.");
          return;
        }
        setSharedTripError(error instanceof Error ? error.message : "공유 여행 정보를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!cancelled) setSharedTripLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [shareToken]);

  return { isShareRoute, sharedTrip, sharedTripError, sharedTripLoading };
}
