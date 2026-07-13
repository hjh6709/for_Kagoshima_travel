import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ApiError, getCurrentUser, login, register, type AuthResponse } from "../../api/auth";
import {
  createTrip,
  listMyTrips,
  updateTrip,
  type OwnerTrip,
} from "../../api/trips";
import type { AuthMode, TripManagePageProps } from "./manageTypes";
import { getSavedOwnerAuth, ownerAuthStorageKey } from "./ownerAuthStorage";
import { useTripManageDetailData } from "./useTripManageDetailData";
import {
  useFlightManageFormState,
  usePlaceManageFormState,
  useScheduleManageFormState,
  useTripCreateFormState,
  useTripEditFormState,
} from "./useTripManageFormState";
import { useTripManageShareLink } from "./useTripManageShareLink";

type UseTripManageControllerParams = {
  currentPath: string;
  isLegacyOwnerRoute: boolean;
  isManageRoute: boolean;
};

// 여행 관리 화면의 인증, 서버 데이터 조회, 생성/삭제 핸들러를 TripManagePage props로 변환한다.
export function useTripManageController({
  currentPath,
  isLegacyOwnerRoute,
  isManageRoute,
}: UseTripManageControllerParams): TripManagePageProps {
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
  const {
    newTripTitle,
    setNewTripTitle,
    newTripStartDate,
    setNewTripStartDate,
    newTripEndDate,
    setNewTripEndDate,
    newTripTravelers,
    setNewTripTravelers,
    newTripMemo,
    setNewTripMemo,
    tripCreateError,
    setTripCreateError,
    tripCreateSubmitting,
    setTripCreateSubmitting,
    resetTripCreateForm,
  } = useTripCreateFormState();
  const {
    tripEditTitle,
    setTripEditTitle,
    tripEditStartDate,
    setTripEditStartDate,
    tripEditEndDate,
    setTripEditEndDate,
    tripEditTravelers,
    setTripEditTravelers,
    tripEditMemo,
    setTripEditMemo,
    tripEditError,
    setTripEditError,
    tripEditSubmitting,
    setTripEditSubmitting,
    resetTripEditForm,
    fillTripEditForm,
  } = useTripEditFormState();
  const {
    newScheduleDate,
    setNewScheduleDate,
    newScheduleTime,
    setNewScheduleTime,
    newScheduleType,
    setNewScheduleType,
    newScheduleTitle,
    setNewScheduleTitle,
    newSchedulePlaceID,
    setNewSchedulePlaceID,
    newScheduleTransportMemo,
    setNewScheduleTransportMemo,
    newScheduleGuideMemo,
    setNewScheduleGuideMemo,
    scheduleCreateError,
    setScheduleCreateError,
    scheduleCreateSubmitting,
    setScheduleCreateSubmitting,
    isScheduleListEditing,
    setIsScheduleListEditing,
    scheduleDeleteError,
    setScheduleDeleteError,
    deletingScheduleID,
    setDeletingScheduleID,
    resetScheduleManageForm,
    prepareScheduleManageForm,
  } = useScheduleManageFormState();
  const {
    newPlaceName,
    setNewPlaceName,
    newPlaceCategory,
    setNewPlaceCategory,
    newPlaceAddress,
    setNewPlaceAddress,
    newPlaceGoogleMapsURL,
    setNewPlaceGoogleMapsURL,
    newPlaceRecommendedReason,
    setNewPlaceRecommendedReason,
    placeCreateError,
    setPlaceCreateError,
    placeCreateSubmitting,
    setPlaceCreateSubmitting,
    isPlaceListEditing,
    setIsPlaceListEditing,
    placeDeleteError,
    setPlaceDeleteError,
    deletingPlaceID,
    setDeletingPlaceID,
    resetPlaceManageForm,
  } = usePlaceManageFormState();
  const {
    newFlightDirection,
    setNewFlightDirection,
    newFlightLabel,
    setNewFlightLabel,
    newFlightAirline,
    setNewFlightAirline,
    newFlightNumber,
    setNewFlightNumber,
    newFlightDepartureAirport,
    setNewFlightDepartureAirport,
    newFlightArrivalAirport,
    setNewFlightArrivalAirport,
    newFlightDepartureDate,
    setNewFlightDepartureDate,
    newFlightDepartureTime,
    setNewFlightDepartureTime,
    newFlightArrivalDate,
    setNewFlightArrivalDate,
    newFlightArrivalTime,
    setNewFlightArrivalTime,
    newFlightMemo,
    setNewFlightMemo,
    flightCreateError,
    setFlightCreateError,
    flightCreateSubmitting,
    setFlightCreateSubmitting,
    resetFlightManageForm,
    prepareFlightManageForm,
  } = useFlightManageFormState();
  const selectedOwnerTrip = useMemo(
    () => ownerTrips.find((ownerTrip) => ownerTrip.id === selectedOwnerTripID) ?? null,
    [ownerTrips, selectedOwnerTripID]
  );

  // 인증이 만료되었을 때 화면에 남은 소유자 전용 데이터를 한 번에 비운다.
  function clearOwnerSession() {
    window.localStorage.removeItem(ownerAuthStorageKey);
    setOwnerAuth(null);
    setOwnerTrips([]);
    setSelectedOwnerTripID(null);
    clearOwnerDetailData();
  }

  const {
    clearOwnerDetailData,
    deleteOwnerPlace,
    deleteOwnerSchedule,
    ownerDetailDataError,
    ownerDetailDataLoading,
    ownerFlights,
    ownerPlaces,
    ownerSchedules,
    submitNewFlight,
    submitNewPlace,
    submitNewSchedule,
  } = useTripManageDetailData({
    clearOwnerSession,
    ownerAuth,
    selectedOwnerTrip,
    scheduleForm: {
      newScheduleDate,
      newScheduleGuideMemo,
      newSchedulePlaceID,
      newScheduleTime,
      newScheduleTitle,
      newScheduleTransportMemo,
      newScheduleType,
      setDeletingScheduleID,
      setNewScheduleGuideMemo,
      setNewSchedulePlaceID,
      setNewScheduleTime,
      setNewScheduleTitle,
      setNewScheduleTransportMemo,
      setScheduleCreateError,
      setScheduleCreateSubmitting,
      setScheduleDeleteError,
    },
    placeForm: {
      newPlaceAddress,
      newPlaceCategory,
      newPlaceGoogleMapsURL,
      newPlaceName,
      newPlaceRecommendedReason,
      setDeletingPlaceID,
      setNewPlaceAddress,
      setNewPlaceGoogleMapsURL,
      setNewPlaceName,
      setNewPlaceRecommendedReason,
      setNewSchedulePlaceID,
      setPlaceCreateError,
      setPlaceCreateSubmitting,
      setPlaceDeleteError,
    },
    flightForm: {
      newFlightAirline,
      newFlightArrivalAirport,
      newFlightArrivalDate,
      newFlightArrivalTime,
      newFlightDepartureAirport,
      newFlightDepartureDate,
      newFlightDepartureTime,
      newFlightDirection,
      newFlightLabel,
      newFlightMemo,
      newFlightNumber,
      setFlightCreateError,
      setFlightCreateSubmitting,
      setNewFlightAirline,
      setNewFlightArrivalAirport,
      setNewFlightArrivalTime,
      setNewFlightDepartureAirport,
      setNewFlightDepartureTime,
      setNewFlightLabel,
      setNewFlightMemo,
      setNewFlightNumber,
    },
  });
  const {
    copySelectedTripShareLink,
    createSelectedTripShareLink,
    resetShareLinkState,
    selectedShareLink,
    shareLinkCopied,
    shareLinkError,
    shareLinkSubmitting,
  } = useTripManageShareLink({
    clearOwnerSession,
    ownerAuth,
    selectedOwnerTrip,
  });

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
        if (error instanceof ApiError && error.status === 401) {
          clearOwnerSession();
          setOwnerTripsError("");
          return;
        }
        setOwnerTripsError(error instanceof Error ? error.message : "여행 목록을 불러오지 못했습니다.");
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

  useEffect(() => {
    if (!selectedOwnerTrip) {
      resetTripEditForm();
      resetScheduleManageForm();
      resetPlaceManageForm();
      resetFlightManageForm();
      return;
    }

    fillTripEditForm(selectedOwnerTrip);
    prepareScheduleManageForm(selectedOwnerTrip.startDate);
    resetPlaceManageForm();
    prepareFlightManageForm(selectedOwnerTrip.startDate);
  }, [selectedOwnerTrip]);

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

    const title = newTripTitle.trim();
    const startDate = newTripStartDate;
    const endDate = newTripEndDate || newTripStartDate;
    const travelers = newTripTravelers
      .split(/[\n,]/)
      .map((traveler) => traveler.trim())
      .filter(Boolean);
    const memo = newTripMemo.trim();

    if (!title || !startDate || !endDate) {
      setTripCreateError("여행명과 여행 날짜를 입력해주세요.");
      return;
    }
    if (endDate < startDate) {
      setTripCreateError("종료일은 시작일보다 빠를 수 없습니다.");
      return;
    }

    setTripCreateError("");
    setTripCreateSubmitting(true);
    try {
      const createdTrip = await createTrip(ownerAuth.accessToken, {
        title,
        startDate,
        endDate,
        travelers,
        memo: memo || undefined,
      });
      setOwnerTrips((currentTrips) => [createdTrip, ...currentTrips.filter((item) => item.id !== createdTrip.id)]);
      setSelectedOwnerTripID(createdTrip.id);
      resetTripCreateForm();
      setOwnerTripsError("");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearOwnerSession();
        setTripCreateError("");
        return;
      }
      setTripCreateError(error instanceof Error ? error.message : "여행을 만들지 못했습니다.");
    } finally {
      setTripCreateSubmitting(false);
    }
  }

  async function submitTripEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ownerAuth || !selectedOwnerTrip) return;

    const title = tripEditTitle.trim();
    const startDate = tripEditStartDate;
    const endDate = tripEditEndDate || tripEditStartDate;
    const travelers = tripEditTravelers
      .split(/[\n,]/)
      .map((traveler) => traveler.trim())
      .filter(Boolean);
    const memo = tripEditMemo.trim();

    if (!title || !startDate || !endDate) {
      setTripEditError("여행명과 여행 날짜를 입력해주세요.");
      return;
    }
    if (endDate < startDate) {
      setTripEditError("종료일은 시작일보다 빠를 수 없습니다.");
      return;
    }

    setTripEditError("");
    setTripEditSubmitting(true);
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
      setTripEditError("");
      setOwnerTripsError("");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearOwnerSession();
        setTripEditError("");
        return;
      }
      setTripEditError(error instanceof Error ? error.message : "여행 정보를 수정하지 못했습니다.");
    } finally {
      setTripEditSubmitting(false);
    }
  }

  function logoutOwner() {
    clearOwnerSession();
    resetShareLinkState();
    setScheduleCreateSubmitting(false);
    resetScheduleManageForm();
    setPlaceCreateSubmitting(false);
    resetPlaceManageForm();
    setFlightCreateSubmitting(false);
    resetFlightManageForm();
    setOwnerTripsError("");
    setAuthPassword("");
    setAuthError("");
  }

  return {
    auth: ownerAuth,
    authChecked,
    authEmail,
    authError,
    authMode,
    authPassword,
    authSubmitting,
    ownerTrips,
    ownerTripsError,
    ownerTripsLoading,
    ownerSchedules,
    ownerPlaces,
    ownerFlights,
    ownerDetailDataError,
    ownerDetailDataLoading,
    isScheduleListEditing,
    deletingScheduleID,
    isPlaceListEditing,
    deletingPlaceID,
    selectedOwnerTrip,
    selectedShareLink,
    newTripEndDate,
    newTripMemo,
    newTripStartDate,
    newTripTitle,
    newTripTravelers,
    newScheduleDate,
    newScheduleGuideMemo,
    newSchedulePlaceID,
    newScheduleTime,
    newScheduleTitle,
    newScheduleTransportMemo,
    newScheduleType,
    newPlaceAddress,
    newPlaceCategory,
    newPlaceGoogleMapsURL,
    newPlaceName,
    newPlaceRecommendedReason,
    newFlightAirline,
    newFlightArrivalAirport,
    newFlightArrivalDate,
    newFlightArrivalTime,
    newFlightDepartureAirport,
    newFlightDepartureDate,
    newFlightDepartureTime,
    newFlightDirection,
    newFlightLabel,
    newFlightMemo,
    newFlightNumber,
    flightCreateError,
    flightCreateSubmitting,
    placeCreateError,
    placeCreateSubmitting,
    placeDeleteError,
    scheduleCreateError,
    scheduleCreateSubmitting,
    scheduleDeleteError,
    shareLinkCopied,
    shareLinkError,
    shareLinkSubmitting,
    tripCreateError,
    tripCreateSubmitting,
    tripEditEndDate,
    tripEditError,
    tripEditMemo,
    tripEditStartDate,
    tripEditSubmitting,
    tripEditTitle,
    tripEditTravelers,
    onAuthEmailChange: setAuthEmail,
    onAuthModeChange: (mode) => {
      setAuthMode(mode);
      setAuthError("");
    },
    onAuthPasswordChange: setAuthPassword,
    onNewTripEndDateChange: setNewTripEndDate,
    onNewTripMemoChange: setNewTripMemo,
    onNewTripStartDateChange: (value) => {
      setNewTripStartDate(value);
      if (!newTripEndDate || newTripEndDate < value) {
        setNewTripEndDate(value);
      }
    },
    onNewTripTitleChange: setNewTripTitle,
    onNewTripTravelersChange: setNewTripTravelers,
    onNewScheduleDateChange: setNewScheduleDate,
    onNewScheduleGuideMemoChange: setNewScheduleGuideMemo,
    onNewSchedulePlaceIDChange: setNewSchedulePlaceID,
    onNewScheduleTimeChange: setNewScheduleTime,
    onNewScheduleTitleChange: setNewScheduleTitle,
    onNewScheduleTransportMemoChange: setNewScheduleTransportMemo,
    onNewScheduleTypeChange: setNewScheduleType,
    onNewPlaceAddressChange: setNewPlaceAddress,
    onNewPlaceCategoryChange: setNewPlaceCategory,
    onNewPlaceGoogleMapsURLChange: setNewPlaceGoogleMapsURL,
    onNewPlaceNameChange: setNewPlaceName,
    onNewPlaceRecommendedReasonChange: setNewPlaceRecommendedReason,
    onNewFlightAirlineChange: setNewFlightAirline,
    onNewFlightArrivalAirportChange: setNewFlightArrivalAirport,
    onNewFlightArrivalDateChange: setNewFlightArrivalDate,
    onNewFlightArrivalTimeChange: setNewFlightArrivalTime,
    onNewFlightDepartureAirportChange: setNewFlightDepartureAirport,
    onNewFlightDepartureDateChange: (value) => {
      setNewFlightDepartureDate(value);
      if (!newFlightArrivalDate || newFlightArrivalDate < value) {
        setNewFlightArrivalDate(value);
      }
    },
    onNewFlightDepartureTimeChange: setNewFlightDepartureTime,
    onNewFlightDirectionChange: setNewFlightDirection,
    onNewFlightLabelChange: setNewFlightLabel,
    onNewFlightMemoChange: setNewFlightMemo,
    onNewFlightNumberChange: setNewFlightNumber,
    onCloseOwnerTripDetail: () => setSelectedOwnerTripID(null),
    onCopyShareLink: copySelectedTripShareLink,
    onCreateShareLink: createSelectedTripShareLink,
    onDeleteSchedule: deleteOwnerSchedule,
    onScheduleListEditingChange: setIsScheduleListEditing,
    onDeletePlace: deleteOwnerPlace,
    onPlaceListEditingChange: setIsPlaceListEditing,
    onTripEditEndDateChange: setTripEditEndDate,
    onTripEditMemoChange: setTripEditMemo,
    onTripEditStartDateChange: (value) => {
      setTripEditStartDate(value);
      if (!tripEditEndDate || tripEditEndDate < value) {
        setTripEditEndDate(value);
      }
    },
    onTripEditTitleChange: setTripEditTitle,
    onTripEditTravelersChange: setTripEditTravelers,
    onLogout: logoutOwner,
    onSelectOwnerTrip: setSelectedOwnerTripID,
    onSubmitAuth: submitAuth,
    onSubmitNewPlace: submitNewPlace,
    onSubmitNewFlight: submitNewFlight,
    onSubmitNewTrip: submitNewTrip,
    onSubmitNewSchedule: submitNewSchedule,
    onSubmitTripEdit: submitTripEdit,
  };
}
