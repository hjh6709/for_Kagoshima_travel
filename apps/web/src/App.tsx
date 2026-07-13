import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ApiError, getCurrentUser, login, register, type AuthResponse } from "./api/auth";
import {
  createShareLink,
  createTripFlight,
  createTripPlace,
  createTripSchedule,
  createTrip,
  deleteTripPlace,
  deleteTripSchedule,
  listTripFlights,
  listTripPlaces,
  listTripSchedules,
  listMyTrips,
  updateTrip,
  type OwnerTrip,
  type SharedFlight,
  type SharedPlace,
  type SharedSchedule,
} from "./api/trips";
import { TripManagePage } from "./features/manage/TripManagePage";
import type { AuthMode } from "./features/manage/manageTypes";
import { getSavedOwnerAuth, ownerAuthStorageKey } from "./features/manage/ownerAuthStorage";
import { SharedTripPage } from "./features/share/SharedTripPage";
import { useSharedTripController } from "./features/share/useSharedTripController";
import { TripPage } from "./features/trip/TripPage";
import { useTripPageController } from "./features/trip/useTripPageController";
import { getShareTokenFromPath, toAbsoluteWebURL } from "./shared/share";
import { sortSharedFlights, sortSharedPlaces, sortSharedSchedules } from "./shared/sort";
import type { FlightDirection } from "./shared/travelOptions";
import type { PlaceCategory, ScheduleItem } from "./types/travel";

function App() {
  const currentPath = window.location.pathname;
  const isLegacyOwnerRoute = currentPath === "/owner" || currentPath.startsWith("/owner/");
  const isManageRoute = currentPath === "/manage" || currentPath.startsWith("/manage/") || isLegacyOwnerRoute;
  const shareToken = getShareTokenFromPath(currentPath);
  const { isShareRoute, sharedTrip, sharedTripError, sharedTripLoading } = useSharedTripController({ shareToken });
  const tripPageProps = useTripPageController();
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
  const [newTripTitle, setNewTripTitle] = useState("");
  const [newTripStartDate, setNewTripStartDate] = useState("");
  const [newTripEndDate, setNewTripEndDate] = useState("");
  const [newTripTravelers, setNewTripTravelers] = useState("");
  const [newTripMemo, setNewTripMemo] = useState("");
  const [tripCreateError, setTripCreateError] = useState("");
  const [tripCreateSubmitting, setTripCreateSubmitting] = useState(false);
  const [tripEditTitle, setTripEditTitle] = useState("");
  const [tripEditStartDate, setTripEditStartDate] = useState("");
  const [tripEditEndDate, setTripEditEndDate] = useState("");
  const [tripEditTravelers, setTripEditTravelers] = useState("");
  const [tripEditMemo, setTripEditMemo] = useState("");
  const [tripEditError, setTripEditError] = useState("");
  const [tripEditSubmitting, setTripEditSubmitting] = useState(false);
  const [shareLinksByTripID, setShareLinksByTripID] = useState<Record<string, string>>({});
  const [shareLinkError, setShareLinkError] = useState("");
  const [shareLinkSubmitting, setShareLinkSubmitting] = useState(false);
  const [shareLinkCopied, setShareLinkCopied] = useState(false);
  const [ownerSchedules, setOwnerSchedules] = useState<SharedSchedule[]>([]);
  const [ownerPlaces, setOwnerPlaces] = useState<SharedPlace[]>([]);
  const [ownerFlights, setOwnerFlights] = useState<SharedFlight[]>([]);
  const [ownerDetailDataError, setOwnerDetailDataError] = useState("");
  const [ownerDetailDataLoading, setOwnerDetailDataLoading] = useState(false);
  const [newScheduleDate, setNewScheduleDate] = useState("");
  const [newScheduleTime, setNewScheduleTime] = useState("");
  const [newScheduleType, setNewScheduleType] = useState<ScheduleItem["type"]>("sightseeing");
  const [newScheduleTitle, setNewScheduleTitle] = useState("");
  const [newSchedulePlaceID, setNewSchedulePlaceID] = useState("");
  const [newScheduleTransportMemo, setNewScheduleTransportMemo] = useState("");
  const [newScheduleGuideMemo, setNewScheduleGuideMemo] = useState("");
  const [scheduleCreateError, setScheduleCreateError] = useState("");
  const [scheduleCreateSubmitting, setScheduleCreateSubmitting] = useState(false);
  const [isScheduleListEditing, setIsScheduleListEditing] = useState(false);
  const [scheduleDeleteError, setScheduleDeleteError] = useState("");
  const [deletingScheduleID, setDeletingScheduleID] = useState("");
  const [newPlaceName, setNewPlaceName] = useState("");
  const [newPlaceCategory, setNewPlaceCategory] = useState<PlaceCategory>("sightseeing");
  const [newPlaceAddress, setNewPlaceAddress] = useState("");
  const [newPlaceGoogleMapsURL, setNewPlaceGoogleMapsURL] = useState("");
  const [newPlaceRecommendedReason, setNewPlaceRecommendedReason] = useState("");
  const [placeCreateError, setPlaceCreateError] = useState("");
  const [placeCreateSubmitting, setPlaceCreateSubmitting] = useState(false);
  const [isPlaceListEditing, setIsPlaceListEditing] = useState(false);
  const [placeDeleteError, setPlaceDeleteError] = useState("");
  const [deletingPlaceID, setDeletingPlaceID] = useState("");
  const [newFlightDirection, setNewFlightDirection] = useState<FlightDirection>("departure");
  const [newFlightLabel, setNewFlightLabel] = useState("");
  const [newFlightAirline, setNewFlightAirline] = useState("");
  const [newFlightNumber, setNewFlightNumber] = useState("");
  const [newFlightDepartureAirport, setNewFlightDepartureAirport] = useState("");
  const [newFlightArrivalAirport, setNewFlightArrivalAirport] = useState("");
  const [newFlightDepartureDate, setNewFlightDepartureDate] = useState("");
  const [newFlightDepartureTime, setNewFlightDepartureTime] = useState("");
  const [newFlightArrivalDate, setNewFlightArrivalDate] = useState("");
  const [newFlightArrivalTime, setNewFlightArrivalTime] = useState("");
  const [newFlightMemo, setNewFlightMemo] = useState("");
  const [flightCreateError, setFlightCreateError] = useState("");
  const [flightCreateSubmitting, setFlightCreateSubmitting] = useState(false);
  const selectedOwnerTrip = useMemo(
    () => ownerTrips.find((ownerTrip) => ownerTrip.id === selectedOwnerTripID) ?? null,
    [ownerTrips, selectedOwnerTripID]
  );

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
          window.localStorage.removeItem(ownerAuthStorageKey);
          setOwnerAuth(null);
          setOwnerTrips([]);
          setSelectedOwnerTripID(null);
          setOwnerSchedules([]);
          setOwnerPlaces([]);
          setOwnerFlights([]);
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
      setTripEditTitle("");
      setTripEditStartDate("");
      setTripEditEndDate("");
      setTripEditTravelers("");
      setTripEditMemo("");
      setTripEditError("");
      setNewScheduleDate("");
      setNewScheduleTime("");
      setNewScheduleType("sightseeing");
      setNewScheduleTitle("");
      setNewSchedulePlaceID("");
      setNewScheduleTransportMemo("");
      setNewScheduleGuideMemo("");
      setScheduleCreateError("");
      setIsScheduleListEditing(false);
      setScheduleDeleteError("");
      setDeletingScheduleID("");
      setNewPlaceName("");
      setNewPlaceCategory("sightseeing");
      setNewPlaceAddress("");
      setNewPlaceGoogleMapsURL("");
      setNewPlaceRecommendedReason("");
      setPlaceCreateError("");
      setIsPlaceListEditing(false);
      setPlaceDeleteError("");
      setDeletingPlaceID("");
      setNewFlightDirection("departure");
      setNewFlightLabel("");
      setNewFlightAirline("");
      setNewFlightNumber("");
      setNewFlightDepartureAirport("");
      setNewFlightArrivalAirport("");
      setNewFlightDepartureDate("");
      setNewFlightDepartureTime("");
      setNewFlightArrivalDate("");
      setNewFlightArrivalTime("");
      setNewFlightMemo("");
      setFlightCreateError("");
      return;
    }

    setTripEditTitle(selectedOwnerTrip.title);
    setTripEditStartDate(selectedOwnerTrip.startDate);
    setTripEditEndDate(selectedOwnerTrip.endDate);
    setTripEditTravelers(selectedOwnerTrip.travelers.join(", "));
    setTripEditMemo(selectedOwnerTrip.memo ?? "");
    setTripEditError("");
    setShareLinkError("");
    setShareLinkCopied(false);
    setNewScheduleDate(selectedOwnerTrip.startDate);
    setNewScheduleTime("");
    setNewScheduleType("sightseeing");
    setNewScheduleTitle("");
    setNewSchedulePlaceID("");
    setNewScheduleTransportMemo("");
    setNewScheduleGuideMemo("");
    setScheduleCreateError("");
    setIsScheduleListEditing(false);
    setScheduleDeleteError("");
    setDeletingScheduleID("");
    setNewPlaceName("");
    setNewPlaceCategory("sightseeing");
    setNewPlaceAddress("");
    setNewPlaceGoogleMapsURL("");
    setNewPlaceRecommendedReason("");
    setPlaceCreateError("");
    setIsPlaceListEditing(false);
    setPlaceDeleteError("");
    setDeletingPlaceID("");
    setNewFlightDirection("departure");
    setNewFlightLabel("");
    setNewFlightAirline("");
    setNewFlightNumber("");
    setNewFlightDepartureAirport("");
    setNewFlightArrivalAirport("");
    setNewFlightDepartureDate(selectedOwnerTrip.startDate);
    setNewFlightDepartureTime("");
    setNewFlightArrivalDate(selectedOwnerTrip.startDate);
    setNewFlightArrivalTime("");
    setNewFlightMemo("");
    setFlightCreateError("");
  }, [selectedOwnerTrip]);

  useEffect(() => {
    if (!ownerAuth || !selectedOwnerTrip) {
      setOwnerSchedules([]);
      setOwnerPlaces([]);
      setOwnerFlights([]);
      setOwnerDetailDataError("");
      setOwnerDetailDataLoading(false);
      return;
    }

    let cancelled = false;
    setOwnerDetailDataLoading(true);
    setOwnerDetailDataError("");
    Promise.all([
      listTripSchedules(ownerAuth.accessToken, selectedOwnerTrip.id),
      listTripPlaces(ownerAuth.accessToken, selectedOwnerTrip.id),
      listTripFlights(ownerAuth.accessToken, selectedOwnerTrip.id),
    ])
      .then(([nextSchedules, nextPlaces, nextFlights]) => {
        if (cancelled) return;
        setOwnerSchedules(sortSharedSchedules(nextSchedules));
        setOwnerPlaces(sortSharedPlaces(nextPlaces));
        setOwnerFlights(sortSharedFlights(nextFlights));
      })
      .catch((error) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 401) {
          window.localStorage.removeItem(ownerAuthStorageKey);
          setOwnerAuth(null);
          setOwnerTrips([]);
          setSelectedOwnerTripID(null);
          setOwnerSchedules([]);
          setOwnerPlaces([]);
          setOwnerFlights([]);
          setOwnerDetailDataError("");
          return;
        }
        setOwnerSchedules([]);
        setOwnerPlaces([]);
        setOwnerFlights([]);
        setOwnerDetailDataError(error instanceof Error ? error.message : "여행 상세 데이터를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!cancelled) setOwnerDetailDataLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ownerAuth, selectedOwnerTrip]);

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
      setNewTripTitle("");
      setNewTripStartDate("");
      setNewTripEndDate("");
      setNewTripTravelers("");
      setNewTripMemo("");
      setOwnerTripsError("");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        window.localStorage.removeItem(ownerAuthStorageKey);
        setOwnerAuth(null);
        setOwnerTrips([]);
        setSelectedOwnerTripID(null);
        setOwnerSchedules([]);
        setOwnerPlaces([]);
        setOwnerFlights([]);
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
        window.localStorage.removeItem(ownerAuthStorageKey);
        setOwnerAuth(null);
        setOwnerTrips([]);
        setSelectedOwnerTripID(null);
        setOwnerSchedules([]);
        setOwnerPlaces([]);
        setOwnerFlights([]);
        setTripEditError("");
        return;
      }
      setTripEditError(error instanceof Error ? error.message : "여행 정보를 수정하지 못했습니다.");
    } finally {
      setTripEditSubmitting(false);
    }
  }

  async function createSelectedTripShareLink() {
    if (!ownerAuth || !selectedOwnerTrip) return;

    setShareLinkError("");
    setShareLinkCopied(false);
    setShareLinkSubmitting(true);
    try {
      const link = await createShareLink(ownerAuth.accessToken, selectedOwnerTrip.id);
      setShareLinksByTripID((currentLinks) => ({
        ...currentLinks,
        [selectedOwnerTrip.id]: toAbsoluteWebURL(link.webPath),
      }));
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        window.localStorage.removeItem(ownerAuthStorageKey);
        setOwnerAuth(null);
        setOwnerTrips([]);
        setSelectedOwnerTripID(null);
        setOwnerSchedules([]);
        setOwnerPlaces([]);
        setOwnerFlights([]);
        setShareLinkError("");
        return;
      }
      setShareLinkError(error instanceof Error ? error.message : "공유 링크를 만들지 못했습니다.");
    } finally {
      setShareLinkSubmitting(false);
    }
  }

  async function submitNewSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ownerAuth || !selectedOwnerTrip) return;

    const date = newScheduleDate;
    const time = newScheduleTime.trim();
    const title = newScheduleTitle.trim();
    const transportMemo = newScheduleTransportMemo.trim();
    const guideMemo = newScheduleGuideMemo.trim();

    if (!date || !time || !title) {
      setScheduleCreateError("날짜, 시간, 제목을 입력해주세요.");
      return;
    }
    if (date < selectedOwnerTrip.startDate || date > selectedOwnerTrip.endDate) {
      setScheduleCreateError("일정 날짜는 여행 기간 안에서 선택해주세요.");
      return;
    }

    setScheduleCreateError("");
    setScheduleCreateSubmitting(true);
    try {
      const createdSchedule = await createTripSchedule(ownerAuth.accessToken, selectedOwnerTrip.id, {
        date,
        time,
        type: newScheduleType,
        title,
        placeId: newSchedulePlaceID || undefined,
        transportMemo: transportMemo || undefined,
        guideMemo: guideMemo || undefined,
      });
      setOwnerSchedules((currentSchedules) => sortSharedSchedules([...currentSchedules, createdSchedule]));
      setNewScheduleTime("");
      setNewScheduleTitle("");
      setNewSchedulePlaceID("");
      setNewScheduleTransportMemo("");
      setNewScheduleGuideMemo("");
      setScheduleCreateError("");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        window.localStorage.removeItem(ownerAuthStorageKey);
        setOwnerAuth(null);
        setOwnerTrips([]);
        setSelectedOwnerTripID(null);
        setOwnerSchedules([]);
        setOwnerPlaces([]);
        setOwnerFlights([]);
        setScheduleCreateError("");
        return;
      }
      setScheduleCreateError(error instanceof Error ? error.message : "일정을 추가하지 못했습니다.");
    } finally {
      setScheduleCreateSubmitting(false);
    }
  }

  async function deleteOwnerSchedule(scheduleID: string) {
    if (!ownerAuth || !selectedOwnerTrip) return;

    const schedule = ownerSchedules.find((item) => item.id === scheduleID);
    const confirmed = window.confirm(
      schedule ? `"${schedule.title}" 일정을 삭제할까요?` : "일정을 삭제할까요?"
    );
    if (!confirmed) return;

    setScheduleDeleteError("");
    setDeletingScheduleID(scheduleID);
    try {
      await deleteTripSchedule(ownerAuth.accessToken, selectedOwnerTrip.id, scheduleID);
      setOwnerSchedules((currentSchedules) => currentSchedules.filter((item) => item.id !== scheduleID));
      setScheduleDeleteError("");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        window.localStorage.removeItem(ownerAuthStorageKey);
        setOwnerAuth(null);
        setOwnerTrips([]);
        setSelectedOwnerTripID(null);
        setOwnerSchedules([]);
        setOwnerPlaces([]);
        setOwnerFlights([]);
        setScheduleDeleteError("");
        return;
      }
      setScheduleDeleteError(error instanceof Error ? error.message : "일정을 삭제하지 못했습니다.");
    } finally {
      setDeletingScheduleID("");
    }
  }

  async function submitNewPlace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ownerAuth || !selectedOwnerTrip) return;

    const name = newPlaceName.trim();
    const address = newPlaceAddress.trim();
    const googleMapsUrl = newPlaceGoogleMapsURL.trim();
    const recommendedReason = newPlaceRecommendedReason.trim();

    if (!name) {
      setPlaceCreateError("장소 이름을 입력해주세요.");
      return;
    }

    setPlaceCreateError("");
    setPlaceCreateSubmitting(true);
    try {
      const createdPlace = await createTripPlace(ownerAuth.accessToken, selectedOwnerTrip.id, {
        name,
        category: newPlaceCategory,
        address: address || undefined,
        googleMapsUrl: googleMapsUrl || undefined,
        recommendedReason: recommendedReason || undefined,
      });
      setOwnerPlaces((currentPlaces) => sortSharedPlaces([...currentPlaces, createdPlace]));
      setNewSchedulePlaceID(createdPlace.id);
      setNewPlaceName("");
      setNewPlaceAddress("");
      setNewPlaceGoogleMapsURL("");
      setNewPlaceRecommendedReason("");
      setPlaceCreateError("");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        window.localStorage.removeItem(ownerAuthStorageKey);
        setOwnerAuth(null);
        setOwnerTrips([]);
        setSelectedOwnerTripID(null);
        setOwnerSchedules([]);
        setOwnerPlaces([]);
        setOwnerFlights([]);
        setPlaceCreateError("");
        return;
      }
      setPlaceCreateError(error instanceof Error ? error.message : "장소를 추가하지 못했습니다.");
    } finally {
      setPlaceCreateSubmitting(false);
    }
  }

  async function deleteOwnerPlace(placeID: string) {
    if (!ownerAuth || !selectedOwnerTrip) return;

    const place = ownerPlaces.find((item) => item.id === placeID);
    const confirmed = window.confirm(
      place ? `"${place.name}" 장소를 삭제할까요? 연결된 일정에서는 장소 표시가 사라집니다.` : "장소를 삭제할까요?"
    );
    if (!confirmed) return;

    setPlaceDeleteError("");
    setDeletingPlaceID(placeID);
    try {
      await deleteTripPlace(ownerAuth.accessToken, selectedOwnerTrip.id, placeID);
      setOwnerPlaces((currentPlaces) => currentPlaces.filter((item) => item.id !== placeID));
      setNewSchedulePlaceID((currentPlaceID) => (currentPlaceID === placeID ? "" : currentPlaceID));
      setPlaceDeleteError("");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        window.localStorage.removeItem(ownerAuthStorageKey);
        setOwnerAuth(null);
        setOwnerTrips([]);
        setSelectedOwnerTripID(null);
        setOwnerSchedules([]);
        setOwnerPlaces([]);
        setOwnerFlights([]);
        setPlaceDeleteError("");
        return;
      }
      setPlaceDeleteError(error instanceof Error ? error.message : "장소를 삭제하지 못했습니다.");
    } finally {
      setDeletingPlaceID("");
    }
  }

  async function submitNewFlight(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ownerAuth || !selectedOwnerTrip) return;

    const label = newFlightLabel.trim();
    const airline = newFlightAirline.trim();
    const flightNumber = newFlightNumber.trim();
    const departureAirport = newFlightDepartureAirport.trim();
    const arrivalAirport = newFlightArrivalAirport.trim();
    const departureDate = newFlightDepartureDate;
    const departureTime = newFlightDepartureTime.trim();
    const arrivalDate = newFlightArrivalDate;
    const arrivalTime = newFlightArrivalTime.trim();
    const memo = newFlightMemo.trim();

    if (!label || !departureAirport || !arrivalAirport || !departureDate || !departureTime) {
      setFlightCreateError("항공편 이름, 출발/도착 공항, 출발 날짜와 시간을 입력해주세요.");
      return;
    }
    if (departureDate < selectedOwnerTrip.startDate || departureDate > selectedOwnerTrip.endDate) {
      setFlightCreateError("출발 날짜는 여행 기간 안에서 선택해주세요.");
      return;
    }
    if (arrivalDate && arrivalDate < departureDate) {
      setFlightCreateError("도착 날짜는 출발 날짜보다 빠를 수 없습니다.");
      return;
    }

    setFlightCreateError("");
    setFlightCreateSubmitting(true);
    try {
      const createdFlight = await createTripFlight(ownerAuth.accessToken, selectedOwnerTrip.id, {
        direction: newFlightDirection,
        label,
        airline: airline || undefined,
        flightNumber: flightNumber || undefined,
        departureAirport,
        arrivalAirport,
        departureDate,
        departureTime,
        arrivalDate: arrivalDate || undefined,
        arrivalTime: arrivalTime || undefined,
        memo: memo || undefined,
      });
      setOwnerFlights((currentFlights) => sortSharedFlights([...currentFlights, createdFlight]));
      setNewFlightLabel("");
      setNewFlightAirline("");
      setNewFlightNumber("");
      setNewFlightDepartureAirport("");
      setNewFlightArrivalAirport("");
      setNewFlightDepartureTime("");
      setNewFlightArrivalTime("");
      setNewFlightMemo("");
      setFlightCreateError("");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        window.localStorage.removeItem(ownerAuthStorageKey);
        setOwnerAuth(null);
        setOwnerTrips([]);
        setSelectedOwnerTripID(null);
        setOwnerSchedules([]);
        setOwnerPlaces([]);
        setOwnerFlights([]);
        setFlightCreateError("");
        return;
      }
      setFlightCreateError(error instanceof Error ? error.message : "항공편을 추가하지 못했습니다.");
    } finally {
      setFlightCreateSubmitting(false);
    }
  }

  function copySelectedTripShareLink() {
    if (!selectedOwnerTrip) return;

    const shareLink = shareLinksByTripID[selectedOwnerTrip.id];
    if (!shareLink) return;
    if (!navigator.clipboard?.writeText) {
      setShareLinkCopied(false);
      setShareLinkError("이 브라우저에서는 자동 복사를 지원하지 않습니다. 링크를 직접 선택해 복사해주세요.");
      return;
    }

    navigator.clipboard
      .writeText(shareLink)
      .then(() => {
        setShareLinkError("");
        setShareLinkCopied(true);
      })
      .catch(() => {
        setShareLinkCopied(false);
        setShareLinkError("자동 복사에 실패했습니다. 링크를 직접 선택해 복사해주세요.");
      });
  }

  function logoutOwner() {
    window.localStorage.removeItem(ownerAuthStorageKey);
    setOwnerAuth(null);
    setOwnerTrips([]);
    setSelectedOwnerTripID(null);
    setShareLinksByTripID({});
    setShareLinkError("");
    setShareLinkCopied(false);
    setOwnerSchedules([]);
    setOwnerPlaces([]);
    setOwnerFlights([]);
    setOwnerDetailDataError("");
    setOwnerDetailDataLoading(false);
    setNewScheduleDate("");
    setNewScheduleTime("");
    setNewScheduleType("sightseeing");
    setNewScheduleTitle("");
    setNewSchedulePlaceID("");
    setNewScheduleTransportMemo("");
    setNewScheduleGuideMemo("");
    setScheduleCreateError("");
    setScheduleCreateSubmitting(false);
    setIsScheduleListEditing(false);
    setScheduleDeleteError("");
    setDeletingScheduleID("");
    setNewPlaceName("");
    setNewPlaceCategory("sightseeing");
    setNewPlaceAddress("");
    setNewPlaceGoogleMapsURL("");
    setNewPlaceRecommendedReason("");
    setPlaceCreateError("");
    setPlaceCreateSubmitting(false);
    setIsPlaceListEditing(false);
    setPlaceDeleteError("");
    setDeletingPlaceID("");
    setNewFlightDirection("departure");
    setNewFlightLabel("");
    setNewFlightAirline("");
    setNewFlightNumber("");
    setNewFlightDepartureAirport("");
    setNewFlightArrivalAirport("");
    setNewFlightDepartureDate("");
    setNewFlightDepartureTime("");
    setNewFlightArrivalDate("");
    setNewFlightArrivalTime("");
    setNewFlightMemo("");
    setFlightCreateError("");
    setFlightCreateSubmitting(false);
    setOwnerTripsError("");
    setAuthPassword("");
    setAuthError("");
  }

  if (isShareRoute) {
    return <SharedTripPage error={sharedTripError} loading={sharedTripLoading} sharedTrip={sharedTrip} />;
  }

  if (isManageRoute) {
    // App은 API 호출과 세션 상태를 담당하고, TripManagePage는 props로 받은 여행 관리 화면만 렌더링한다.
    return (
      <TripManagePage
        auth={ownerAuth}
        authChecked={authChecked}
        authEmail={authEmail}
        authError={authError}
        authMode={authMode}
        authPassword={authPassword}
        authSubmitting={authSubmitting}
        ownerTrips={ownerTrips}
        ownerTripsError={ownerTripsError}
        ownerTripsLoading={ownerTripsLoading}
        ownerSchedules={ownerSchedules}
        ownerPlaces={ownerPlaces}
        ownerFlights={ownerFlights}
        ownerDetailDataError={ownerDetailDataError}
        ownerDetailDataLoading={ownerDetailDataLoading}
        isScheduleListEditing={isScheduleListEditing}
        deletingScheduleID={deletingScheduleID}
        isPlaceListEditing={isPlaceListEditing}
        deletingPlaceID={deletingPlaceID}
        selectedOwnerTrip={selectedOwnerTrip}
        selectedShareLink={selectedOwnerTrip ? (shareLinksByTripID[selectedOwnerTrip.id] ?? "") : ""}
        newTripEndDate={newTripEndDate}
        newTripMemo={newTripMemo}
        newTripStartDate={newTripStartDate}
        newTripTitle={newTripTitle}
        newTripTravelers={newTripTravelers}
        newScheduleDate={newScheduleDate}
        newScheduleGuideMemo={newScheduleGuideMemo}
        newSchedulePlaceID={newSchedulePlaceID}
        newScheduleTime={newScheduleTime}
        newScheduleTitle={newScheduleTitle}
        newScheduleTransportMemo={newScheduleTransportMemo}
        newScheduleType={newScheduleType}
        newPlaceAddress={newPlaceAddress}
        newPlaceCategory={newPlaceCategory}
        newPlaceGoogleMapsURL={newPlaceGoogleMapsURL}
        newPlaceName={newPlaceName}
        newPlaceRecommendedReason={newPlaceRecommendedReason}
        newFlightAirline={newFlightAirline}
        newFlightArrivalAirport={newFlightArrivalAirport}
        newFlightArrivalDate={newFlightArrivalDate}
        newFlightArrivalTime={newFlightArrivalTime}
        newFlightDepartureAirport={newFlightDepartureAirport}
        newFlightDepartureDate={newFlightDepartureDate}
        newFlightDepartureTime={newFlightDepartureTime}
        newFlightDirection={newFlightDirection}
        newFlightLabel={newFlightLabel}
        newFlightMemo={newFlightMemo}
        newFlightNumber={newFlightNumber}
        flightCreateError={flightCreateError}
        flightCreateSubmitting={flightCreateSubmitting}
        placeCreateError={placeCreateError}
        placeCreateSubmitting={placeCreateSubmitting}
        placeDeleteError={placeDeleteError}
        scheduleCreateError={scheduleCreateError}
        scheduleCreateSubmitting={scheduleCreateSubmitting}
        scheduleDeleteError={scheduleDeleteError}
        shareLinkCopied={shareLinkCopied}
        shareLinkError={shareLinkError}
        shareLinkSubmitting={shareLinkSubmitting}
        tripCreateError={tripCreateError}
        tripCreateSubmitting={tripCreateSubmitting}
        tripEditEndDate={tripEditEndDate}
        tripEditError={tripEditError}
        tripEditMemo={tripEditMemo}
        tripEditStartDate={tripEditStartDate}
        tripEditSubmitting={tripEditSubmitting}
        tripEditTitle={tripEditTitle}
        tripEditTravelers={tripEditTravelers}
        onAuthEmailChange={setAuthEmail}
        onAuthModeChange={(mode) => {
          setAuthMode(mode);
          setAuthError("");
        }}
        onAuthPasswordChange={setAuthPassword}
        onNewTripEndDateChange={setNewTripEndDate}
        onNewTripMemoChange={setNewTripMemo}
        onNewTripStartDateChange={(value) => {
          setNewTripStartDate(value);
          if (!newTripEndDate || newTripEndDate < value) {
            setNewTripEndDate(value);
          }
        }}
        onNewTripTitleChange={setNewTripTitle}
        onNewTripTravelersChange={setNewTripTravelers}
        onNewScheduleDateChange={setNewScheduleDate}
        onNewScheduleGuideMemoChange={setNewScheduleGuideMemo}
        onNewSchedulePlaceIDChange={setNewSchedulePlaceID}
        onNewScheduleTimeChange={setNewScheduleTime}
        onNewScheduleTitleChange={setNewScheduleTitle}
        onNewScheduleTransportMemoChange={setNewScheduleTransportMemo}
        onNewScheduleTypeChange={setNewScheduleType}
        onNewPlaceAddressChange={setNewPlaceAddress}
        onNewPlaceCategoryChange={setNewPlaceCategory}
        onNewPlaceGoogleMapsURLChange={setNewPlaceGoogleMapsURL}
        onNewPlaceNameChange={setNewPlaceName}
        onNewPlaceRecommendedReasonChange={setNewPlaceRecommendedReason}
        onNewFlightAirlineChange={setNewFlightAirline}
        onNewFlightArrivalAirportChange={setNewFlightArrivalAirport}
        onNewFlightArrivalDateChange={setNewFlightArrivalDate}
        onNewFlightArrivalTimeChange={setNewFlightArrivalTime}
        onNewFlightDepartureAirportChange={setNewFlightDepartureAirport}
        onNewFlightDepartureDateChange={(value) => {
          setNewFlightDepartureDate(value);
          if (!newFlightArrivalDate || newFlightArrivalDate < value) {
            setNewFlightArrivalDate(value);
          }
        }}
        onNewFlightDepartureTimeChange={setNewFlightDepartureTime}
        onNewFlightDirectionChange={setNewFlightDirection}
        onNewFlightLabelChange={setNewFlightLabel}
        onNewFlightMemoChange={setNewFlightMemo}
        onNewFlightNumberChange={setNewFlightNumber}
        onCloseOwnerTripDetail={() => setSelectedOwnerTripID(null)}
        onCopyShareLink={copySelectedTripShareLink}
        onCreateShareLink={createSelectedTripShareLink}
        onDeleteSchedule={deleteOwnerSchedule}
        onScheduleListEditingChange={setIsScheduleListEditing}
        onDeletePlace={deleteOwnerPlace}
        onPlaceListEditingChange={setIsPlaceListEditing}
        onTripEditEndDateChange={setTripEditEndDate}
        onTripEditMemoChange={setTripEditMemo}
        onTripEditStartDateChange={(value) => {
          setTripEditStartDate(value);
          if (!tripEditEndDate || tripEditEndDate < value) {
            setTripEditEndDate(value);
          }
        }}
        onTripEditTitleChange={setTripEditTitle}
        onTripEditTravelersChange={setTripEditTravelers}
        onLogout={logoutOwner}
        onSelectOwnerTrip={setSelectedOwnerTripID}
        onSubmitAuth={submitAuth}
        onSubmitNewPlace={submitNewPlace}
        onSubmitNewFlight={submitNewFlight}
        onSubmitNewTrip={submitNewTrip}
        onSubmitNewSchedule={submitNewSchedule}
        onSubmitTripEdit={submitTripEdit}
      />
    );
  }

  return <TripPage {...tripPageProps} />;
}


export default App;
