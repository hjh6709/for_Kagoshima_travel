import { useEffect, useMemo, useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { ApiError, getCurrentUser, login, register, type AuthResponse } from "../../api/auth";
import { createTrip, listMyTrips, updateTrip, type OwnerTrip } from "../../api/trips";
import { isOnline } from "../../utils/offlineCache";
import {
  handleManageApiError,
  isEndDateBeforeStartDate,
  optionalTrimmedText,
  parseTravelers,
} from "./manageFormUtils";
import type { AuthMode } from "./manageTypes";
import { getSavedOwnerAuth, ownerAuthStorageKey } from "./ownerAuthStorage";

type TripCreateFormState = {
  newTripEndDate: string;
  newTripMemo: string;
  newTripStartDate: string;
  newTripTitle: string;
  newTripTravelers: string;
  newTripDestinationCountry: string;
  resetTripCreateForm: () => void;
  setTripCreateError: Dispatch<SetStateAction<string>>;
  setTripCreateSubmitting: Dispatch<SetStateAction<boolean>>;
};

type TripEditFormState = {
  setTripEditError: Dispatch<SetStateAction<string>>;
  setTripEditSubmitting: Dispatch<SetStateAction<boolean>>;
  tripEditEndDate: string;
  tripEditMemo: string;
  tripEditStartDate: string;
  tripEditTitle: string;
  tripEditTravelers: string;
  tripEditDestinationCountry: string;
};

type UseTripManageSessionTripsParams = {
  currentPath: string;
  isLegacyOwnerRoute: boolean;
  isManageRoute: boolean;
  tripCreateForm: TripCreateFormState;
  tripEditForm: TripEditFormState;
};

// 여행 관리 화면의 로그인 세션, 여행 목록, 여행 생성/수정 흐름을 담당한다.
export function useTripManageSessionTrips({
  currentPath,
  isLegacyOwnerRoute,
  isManageRoute,
  tripCreateForm,
  tripEditForm,
}: UseTripManageSessionTripsParams) {
  const [ownerAuth, setOwnerAuth] = useState<AuthResponse | null>(getSavedOwnerAuth);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authChecked, setAuthChecked] = useState(!isManageRoute);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [ownerTrips, setOwnerTrips] = useState<OwnerTrip[]>([]);
  const [ownerTripsError, setOwnerTripsError] = useState("");
  const [ownerTripsLoading, setOwnerTripsLoading] = useState(false);
  const [selectedOwnerTripID, setSelectedOwnerTripID] = useState<string | null>(null);
  const selectedOwnerTrip = useMemo(
    () => ownerTrips.find((ownerTrip) => ownerTrip.id === selectedOwnerTripID) ?? null,
    [ownerTrips, selectedOwnerTripID]
  );

  // 인증이 만료되었거나 로그아웃할 때 계정과 여행 선택 상태를 비운다.
  function clearOwnerSessionBase() {
    window.localStorage.removeItem(ownerAuthStorageKey);
    setOwnerAuth(null);
    setOwnerTrips([]);
    setSelectedOwnerTripID(null);
  }

  // 로그아웃 시 사용자가 보던 인증/목록 메시지도 함께 정리한다.
  function resetSessionMessagesForLogout() {
    setOwnerTripsError("");
    setAuthPassword("");
    setAuthError("");
  }

  function changeAuthMode(mode: AuthMode) {
    setAuthMode(mode);
    setAuthError("");
  }

  // 기존 /owner 주소로 접근한 사용자는 현재 표준 경로인 /manage로 조용히 이동시킨다.
  useEffect(() => {
    if (!isLegacyOwnerRoute) return;

    const nextPath = currentPath.replace(/^\/owner/, "/manage");
    window.history.replaceState(null, "", `${nextPath}${window.location.search}${window.location.hash}`);
  }, [currentPath, isLegacyOwnerRoute]);

  // 저장된 토큰은 앱 시작 시 한 번 검증한다. 실패하면 오래된 localStorage 세션을 폐기한다.
  useEffect(() => {
    if (!isManageRoute) return;

    const savedAuth = getSavedOwnerAuth();
    if (!savedAuth) {
      setAuthChecked(true);
      return;
    }

    let cancelled = false;
    getCurrentUser(savedAuth.accessToken)
      .then((session) => {
        if (cancelled) return;
        const nextAuth = { ...savedAuth, user: session.user };
        setOwnerAuth(nextAuth);
        window.localStorage.setItem(ownerAuthStorageKey, JSON.stringify(nextAuth));
      })
      .catch((error) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === undefined) {
          setAuthError(error.message);
          return;
        }
        window.localStorage.removeItem(ownerAuthStorageKey);
        setOwnerAuth(null);
      })
      .finally(() => {
        if (!cancelled) setAuthChecked(true);
      });

    return () => {
      cancelled = true;
    };
  }, [isManageRoute]);

  // 인증된 관리자만 본인이 만든 여행 목록을 가져온다.
  useEffect(() => {
    if (!isManageRoute || !ownerAuth) return;

    let cancelled = false;
    setOwnerTripsLoading(true);
    setOwnerTripsError("");
    listMyTrips(ownerAuth.accessToken)
      .then((trips) => {
        if (!cancelled) setOwnerTrips(trips);
      })
      .catch((error) => {
        if (cancelled) return;
        handleManageApiError(error, {
          clearOwnerSession: clearOwnerSessionBase,
          fallbackMessage: "여행 목록을 불러오지 못했습니다.",
          setError: setOwnerTripsError,
        });
      })
      .finally(() => {
        if (!cancelled) setOwnerTripsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isManageRoute, ownerAuth]);

  // 목록 갱신 후 선택했던 여행이 사라졌으면 상세 화면을 닫는다.
  useEffect(() => {
    if (!selectedOwnerTripID) return;
    if (ownerTrips.length > 0 && ownerTrips.every((ownerTrip) => ownerTrip.id !== selectedOwnerTripID)) {
      setSelectedOwnerTripID(null);
    }
  }, [ownerTrips, selectedOwnerTripID]);

  // 로그인과 회원가입은 같은 폼을 사용하되 authMode로 API만 분기한다.
  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError("");
    setAuthSubmitting(true);
    try {
      const email = authEmail.trim();
      const response = authMode === "login" ? await login(email, authPassword) : await register(email, authPassword);
      setOwnerAuth(response);
      setAuthPassword("");
      window.localStorage.setItem(ownerAuthStorageKey, JSON.stringify(response));
      setOwnerTripsError("");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "로그인 요청을 처리하지 못했습니다.");
    } finally {
      setAuthSubmitting(false);
    }
  }

  // 여행 생성 성공 시 목록 맨 앞에 반영하고 바로 상세 편집 상태로 진입한다.
  async function submitNewTrip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ownerAuth) return;

    // 오프라인 상태일 때는 API 전송을 사전에 차단하여 로컬 캐시와의 상태 불일치 방지
    if (!isOnline()) {
      tripCreateForm.setTripCreateError("네트워크 연결이 끊겼습니다. 오프라인 상태에서는 여행을 생성할 수 없습니다.");
      return;
    }

    const title = tripCreateForm.newTripTitle.trim();
    const startDate = tripCreateForm.newTripStartDate;
    const endDate = tripCreateForm.newTripEndDate || tripCreateForm.newTripStartDate;
    const travelers = parseTravelers(tripCreateForm.newTripTravelers);
    const memo = optionalTrimmedText(tripCreateForm.newTripMemo);

    if (!title || !startDate || !endDate) {
      tripCreateForm.setTripCreateError("여행명과 여행 날짜를 입력해주세요.");
      return;
    }
    if (isEndDateBeforeStartDate(startDate, endDate)) {
      tripCreateForm.setTripCreateError("종료일은 시작일보다 빠를 수 없습니다.");
      return;
    }

    tripCreateForm.setTripCreateError("");
    tripCreateForm.setTripCreateSubmitting(true);
    try {
      const createdTrip = await createTrip(ownerAuth.accessToken, {
        title,
        startDate,
        endDate,
        travelers,
        destinationCountry: tripCreateForm.newTripDestinationCountry,
        memo,
      });
      setOwnerTrips((currentTrips) => [createdTrip, ...currentTrips.filter((item) => item.id !== createdTrip.id)]);
      setSelectedOwnerTripID(createdTrip.id);
      tripCreateForm.resetTripCreateForm();
      setOwnerTripsError("");
    } catch (error) {
      handleManageApiError(error, {
        clearOwnerSession: clearOwnerSessionBase,
        fallbackMessage: "여행을 만들지 못했습니다.",
        setError: tripCreateForm.setTripCreateError,
      });
    } finally {
      tripCreateForm.setTripCreateSubmitting(false);
    }
  }

  // 여행 기본 정보 수정은 현재 선택된 여행만 대상으로 하며, 성공 후 목록의 해당 항목만 교체한다.
  async function submitTripEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ownerAuth || !selectedOwnerTrip) return;

    // 오프라인 상태일 때는 API 전송을 사전에 차단하여 로컬 캐시와의 상태 불일치 방지
    if (!isOnline()) {
      tripEditForm.setTripEditError("네트워크 연결이 끊겼습니다. 오프라인 상태에서는 여행 정보를 수정할 수 없습니다.");
      return;
    }

    const title = tripEditForm.tripEditTitle.trim();
    const startDate = tripEditForm.tripEditStartDate;
    const endDate = tripEditForm.tripEditEndDate || tripEditForm.tripEditStartDate;
    const travelers = parseTravelers(tripEditForm.tripEditTravelers);
    const memo = tripEditForm.tripEditMemo.trim();

    if (!title || !startDate || !endDate) {
      tripEditForm.setTripEditError("여행명과 여행 날짜를 입력해주세요.");
      return;
    }
    if (isEndDateBeforeStartDate(startDate, endDate)) {
      tripEditForm.setTripEditError("종료일은 시작일보다 빠를 수 없습니다.");
      return;
    }

    tripEditForm.setTripEditError("");
    tripEditForm.setTripEditSubmitting(true);
    try {
      const updatedTrip = await updateTrip(ownerAuth.accessToken, selectedOwnerTrip.id, {
        title,
        startDate,
        endDate,
        travelers,
        destinationCountry: tripEditForm.tripEditDestinationCountry,
        memo,
      });
      setOwnerTrips((currentTrips) =>
        currentTrips.map((ownerTrip) => (ownerTrip.id === updatedTrip.id ? updatedTrip : ownerTrip))
      );
      tripEditForm.setTripEditError("");
      setOwnerTripsError("");
    } catch (error) {
      handleManageApiError(error, {
        clearOwnerSession: clearOwnerSessionBase,
        fallbackMessage: "여행 정보를 수정하지 못했습니다.",
        setError: tripEditForm.setTripEditError,
      });
    } finally {
      tripEditForm.setTripEditSubmitting(false);
    }
  }

  return {
    authChecked,
    authEmail,
    authError,
    authMode,
    authPassword,
    authSubmitting,
    changeAuthMode,
    clearOwnerSessionBase,
    ownerAuth,
    ownerTrips,
    ownerTripsError,
    ownerTripsLoading,
    resetSessionMessagesForLogout,
    selectedOwnerTrip,
    setAuthEmail,
    setAuthPassword,
    setSelectedOwnerTripID,
    submitAuth,
    submitNewTrip,
    submitTripEdit,
  };
}
