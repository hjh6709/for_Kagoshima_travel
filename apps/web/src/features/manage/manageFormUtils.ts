import { ApiError } from "../../api/auth";
import type { OwnerTrip } from "../../api/trips";

type HandleManageApiErrorParams = {
  clearOwnerSession: () => void;
  fallbackMessage: string;
  setError: (message: string) => void;
};

// 쉼표와 줄바꿈을 모두 여행자 구분자로 보고 빈 값은 제거한다.
export function parseTravelers(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((traveler) => traveler.trim())
    .filter(Boolean);
}

// 선택 입력값은 공백만 있으면 API payload에서 제외한다.
export function optionalTrimmedText(value: string): string | undefined {
  const trimmedValue = value.trim();
  return trimmedValue || undefined;
}

export function isEndDateBeforeStartDate(startDate: string, endDate: string): boolean {
  return endDate < startDate;
}

export function isDateOutsideTrip(date: string, trip: OwnerTrip): boolean {
  return date < trip.startDate || date > trip.endDate;
}

// 시작일이 뒤로 밀리면 종료일도 최소 시작일에 맞춰 보정한다.
export function syncStartDateWithEndDate(
  startDate: string,
  currentEndDate: string,
  setStartDate: (value: string) => void,
  setEndDate: (value: string) => void
) {
  setStartDate(startDate);
  if (!currentEndDate || currentEndDate < startDate) {
    setEndDate(startDate);
  }
}

// 여행 관리 API 요청에서 공통으로 처리하는 인증 만료와 기본 에러 메시지 처리다.
export function handleManageApiError(
  error: unknown,
  { clearOwnerSession, fallbackMessage, setError }: HandleManageApiErrorParams
) {
  if (error instanceof ApiError && error.status === 401) {
    clearOwnerSession();
    setError("");
    return;
  }

  setError(error instanceof Error ? error.message : fallbackMessage);
}
