import { useEffect, useMemo, useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { ApiError, getCurrentUser, login, register, type AuthResponse } from "../../api/auth";
import { createTrip, listMyTrips, updateTrip, type OwnerTrip } from "../../api/trips";
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

  useEffect(() => {
    if (!isLegacyOwnerRoute) return;

    const nextPath = currentPath.replace(/^\/owner/, "/manage");
    window.history.replaceState(null, "", `${nextPath}${window.location.search}${window.location.hash}`);
  }, [currentPath, isLegacyOwnerRoute]);

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

  useEffect(() => {
    if (!selectedOwnerTripID) return;
    if (ownerTrips.length > 0 && ownerTrips.every((ownerTrip) => ownerTrip.id !== selectedOwnerTripID)) {
      setSelectedOwnerTripID(null);
    }
  }, [ownerTrips, selectedOwnerTripID]);

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

  async function submitNewTrip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ownerAuth) return;

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

  async function submitTripEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ownerAuth || !selectedOwnerTrip) return;

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
