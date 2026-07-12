import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CalendarDays,
  CheckCircle2,
  Copy,
  ExternalLink,
  Home,
  Languages,
  Map as MapIcon,
  MapPin,
  Plane,
  PlusCircle,
  Phone,
  Route,
  Shield,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ApiError, getCurrentUser, login, register, type AuthResponse } from "./api/auth";
import {
  createShareLink,
  createTripFlight,
  createTripPlace,
  createTripSchedule,
  createTrip,
  deleteTripPlace,
  deleteTripSchedule,
  getSharedTrip,
  listTripFlights,
  listTripPlaces,
  listTripSchedules,
  listMyTrips,
  updateTrip,
  type OwnerTrip,
  type SharedFlight,
  type SharedPlace,
  type SharedSchedule,
  type SharedTripResponse,
} from "./api/trips";
import {
  accommodation,
  checklist,
  emergencies,
  flights,
  phrases,
  places,
  routes,
  schedules,
  trip,
} from "./data/sampleTrip";
import { TripManagePage } from "./features/manage/TripManagePage";
import type { AuthMode } from "./features/manage/manageTypes";
import { getSavedOwnerAuth, ownerAuthStorageKey } from "./features/manage/ownerAuthStorage";
import { SharedTripPage } from "./features/share/SharedTripPage";
import {
  getMapUrl,
  getOrderedSchedulesForDate,
  getPlace,
  getSavedCustomChecklist,
  getSavedHiddenChecklistIDs,
  getSavedScheduleCompletions,
  getSavedScheduleOrder,
  getSavedTripDates,
  isCustomChecklistItem,
  type ChecklistCategory,
  type CustomChecklistItem,
  type ScheduleOrderByDate,
  type Tab,
} from "./features/trip/tripViewState";
import {
  clampDate,
  formatKoreanDate,
  formatShortDate,
  getDateOffset,
  getTodayDateString,
  getTravelStatus,
  shiftDate,
  type TripDates,
} from "./shared/date";
import { getShareTokenFromPath, toAbsoluteWebURL } from "./shared/share";
import { sortSharedFlights, sortSharedPlaces, sortSharedSchedules } from "./shared/sort";
import {
  checklistCategories,
  placeCategoryLabels,
  scheduleTypeLabels,
  translationLinks,
  type FlightDirection,
} from "./shared/travelOptions";
import type { ChecklistItem, PlaceCategory, ScheduleItem } from "./types/travel";

const tabs: Array<{ id: Tab; label: string; icon: typeof Home }> = [
  { id: "today", label: "오늘", icon: Home },
  { id: "schedule", label: "전체 일정", icon: CalendarDays },
  { id: "flight", label: "항공", icon: Plane },
  { id: "map", label: "지도", icon: MapIcon },
  { id: "concierge", label: "긴급", icon: Shield },
];

function App() {
  const currentPath = window.location.pathname;
  const isLegacyOwnerRoute = currentPath === "/owner" || currentPath.startsWith("/owner/");
  const isManageRoute = currentPath === "/manage" || currentPath.startsWith("/manage/") || isLegacyOwnerRoute;
  const shareToken = getShareTokenFromPath(currentPath);
  const isShareRoute = shareToken.length > 0;
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<Tab>("today");
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
  const [sharedTrip, setSharedTrip] = useState<SharedTripResponse | null>(null);
  const [sharedTripError, setSharedTripError] = useState("");
  const [sharedTripLoading, setSharedTripLoading] = useState(isShareRoute);
  const [tripDates, setTripDates] = useState<TripDates>(getSavedTripDates);
  const [selectedDate, setSelectedDate] = useState(schedules[0]?.date ?? trip.startDate);
  const [addressCopied, setAddressCopied] = useState(false);
  const [customChecklistItems, setCustomChecklistItems] = useState<CustomChecklistItem[]>(getSavedCustomChecklist);
  const [hiddenChecklistIDs, setHiddenChecklistIDs] = useState<string[]>(getSavedHiddenChecklistIDs);
  const [isChecklistEditing, setIsChecklistEditing] = useState(false);
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [newChecklistCategory, setNewChecklistCategory] = useState<ChecklistCategory>("before");
  const [completedSchedules, setCompletedSchedules] = useState<Record<string, boolean>>(getSavedScheduleCompletions);
  const [scheduleOrderByDate, setScheduleOrderByDate] = useState<ScheduleOrderByDate>(getSavedScheduleOrder);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => {
    const saved = window.localStorage.getItem("kagoshima-checklist");
    try {
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const dates = useMemo(() => Array.from(new Set(schedules.map((item) => item.date))), []);
  const selectedSchedules = useMemo(
    () => getOrderedSchedulesForDate(selectedDate, scheduleOrderByDate),
    [selectedDate, scheduleOrderByDate]
  );
  const completedScheduleCount = selectedSchedules.filter((item) => completedSchedules[item.id]).length;
  const allChecklist = useMemo(
    () => [...checklist.filter((item) => !hiddenChecklistIDs.includes(item.id)), ...customChecklistItems],
    [customChecklistItems, hiddenChecklistIDs]
  );
  const completedCount = allChecklist.filter((item) => checkedItems[item.id]).length;
  const today = getTodayDateString();
  const travelStatus = getTravelStatus(today, tripDates);
  const displayFocusDate = clampDate(today, tripDates.startDate, tripDates.endDate);
  const focusDateOffset = getDateOffset(tripDates.startDate, displayFocusDate);
  const focusScheduleDate = shiftDate(trip.startDate, focusDateOffset);
  const focusSchedules = useMemo(
    () => getOrderedSchedulesForDate(focusScheduleDate, scheduleOrderByDate),
    [focusScheduleDate, scheduleOrderByDate]
  );
  const nextSchedule =
    focusSchedules.find((item) => !completedSchedules[item.id]) ??
    schedules.find((item) => !completedSchedules[item.id]) ??
    schedules[0];
  const focusCompletedScheduleCount = focusSchedules.filter((item) => completedSchedules[item.id]).length;
  const homeChecklistCategories: ChecklistCategory[] =
    travelStatus.phase === "before" ? ["before", "airport"] : travelStatus.phase === "during" ? ["daily"] : ["return"];
  const homeChecklistItems = allChecklist
    .filter((item) => homeChecklistCategories.includes(item.category))
    .slice(0, 4);
  const homeChecklistCompletedCount = homeChecklistItems.filter((item) => checkedItems[item.id]).length;
  const groupedChecklist = useMemo(
    () =>
      checklistCategories
        .map(([category, label]) => ({
          category,
          label,
          items: allChecklist.filter((item) => item.category === category),
        }))
        .filter((group) => group.items.length > 0),
    [allChecklist]
  );
  const selectedOwnerTrip = useMemo(
    () => ownerTrips.find((ownerTrip) => ownerTrip.id === selectedOwnerTripID) ?? null,
    [ownerTrips, selectedOwnerTripID]
  );

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }, [activeTab]);

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

  function getDisplayDate(dateStr: string) {
    return shiftDate(tripDates.startDate, getDateOffset(trip.startDate, dateStr));
  }

  function updateTripDate(field: "startDate" | "endDate", value: string) {
    if (!value) return;
    const next = { ...tripDates, [field]: value };
    if (next.endDate < next.startDate) {
      next.endDate = next.startDate;
    }
    setTripDates(next);
    window.localStorage.setItem("kagoshima-trip-dates", JSON.stringify(next));
  }

  function copyAccommodationAddress() {
    navigator.clipboard
      ?.writeText(accommodation.address)
      .then(() => {
        setAddressCopied(true);
        window.setTimeout(() => setAddressCopied(false), 2000);
      })
      .catch(() => {});
  }

  function toggleCheck(id: string) {
    const next = { ...checkedItems, [id]: !checkedItems[id] };
    setCheckedItems(next);
    window.localStorage.setItem("kagoshima-checklist", JSON.stringify(next));
  }

  function saveCustomChecklist(items: CustomChecklistItem[]) {
    setCustomChecklistItems(items);
    window.localStorage.setItem("kagoshima-custom-checklist", JSON.stringify(items));
  }

  function addChecklistItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = newChecklistTitle.trim();
    if (!title) return;
    const nextItem: CustomChecklistItem = {
      id: `custom-check-${Date.now()}`,
      category: newChecklistCategory,
      title,
      custom: true,
    };
    saveCustomChecklist([...customChecklistItems, nextItem]);
    setNewChecklistTitle("");
  }

  function removeCustomChecklistItem(id: string) {
    saveCustomChecklist(customChecklistItems.filter((item) => item.id !== id));
    removeChecklistCompletion(id);
  }

  function removeChecklistCompletion(id: string) {
    const nextCheckedItems = { ...checkedItems };
    delete nextCheckedItems[id];
    setCheckedItems(nextCheckedItems);
    window.localStorage.setItem("kagoshima-checklist", JSON.stringify(nextCheckedItems));
  }

  function hideDefaultChecklistItem(id: string) {
    const nextHiddenIDs = Array.from(new Set([...hiddenChecklistIDs, id]));
    setHiddenChecklistIDs(nextHiddenIDs);
    window.localStorage.setItem("kagoshima-hidden-checklist", JSON.stringify(nextHiddenIDs));
    removeChecklistCompletion(id);
  }

  function removeChecklistItem(item: ChecklistItem) {
    if (isCustomChecklistItem(item)) {
      removeCustomChecklistItem(item.id);
      return;
    }
    hideDefaultChecklistItem(item.id);
  }

  function restoreDefaultChecklistItems() {
    setHiddenChecklistIDs([]);
    window.localStorage.setItem("kagoshima-hidden-checklist", JSON.stringify([]));
  }

  function saveCompletedSchedules(next: Record<string, boolean>) {
    setCompletedSchedules(next);
    window.localStorage.setItem("kagoshima-schedule-completions", JSON.stringify(next));
  }

  function toggleScheduleComplete(id: string) {
    saveCompletedSchedules({ ...completedSchedules, [id]: !completedSchedules[id] });
  }

  function saveScheduleOrder(next: ScheduleOrderByDate) {
    setScheduleOrderByDate(next);
    window.localStorage.setItem("kagoshima-schedule-order", JSON.stringify(next));
  }

  function moveSchedule(scheduleID: string, direction: "up" | "down") {
    const currentOrder = selectedSchedules.map((item) => item.id);
    const currentIndex = currentOrder.indexOf(scheduleID);
    const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= currentOrder.length) return;

    const nextOrder = [...currentOrder];
    [nextOrder[currentIndex], nextOrder[nextIndex]] = [nextOrder[nextIndex], nextOrder[currentIndex]];
    saveScheduleOrder({ ...scheduleOrderByDate, [selectedDate]: nextOrder });
  }

  return (
    <main className="app-shell">
      <section className="phone-frame">
        <div className="content" ref={contentRef}>
          {activeTab === "today" && (
            <section className="screen">
              <div className="trip-header">
                <span className="eyebrow">공유 여행 일정</span>
                <h1>{trip.title}</h1>
                <p className="trip-dates">
                  {formatKoreanDate(tripDates.startDate)} ~ {formatKoreanDate(tripDates.endDate)}
                </p>
                <article className={`status-card ${travelStatus.phase}`}>
                  <span>{travelStatus.label}</span>
                  <p>{travelStatus.description}</p>
                </article>
              </div>

              <article className="hero-card">
                <div>
                  <span className="pill">다음 일정</span>
                  <h2>{nextSchedule.title}</h2>
                  <p>
                    {formatKoreanDate(getDisplayDate(nextSchedule.date))} {nextSchedule.time}
                  </p>
                  <p className="muted">{nextSchedule.guideMemo}</p>
                </div>
                <a
                  className="primary-button"
                  href={getMapUrl(getPlace(nextSchedule.placeId))}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <MapPin size={20} />
                  지도 열기
                </a>
              </article>

              <section className="section-block">
                <div className="section-title-row">
                  <div>
                    <h2>오늘 확인</h2>
                    <p className="section-caption">
                      일정 {focusSchedules.length}개 중 {focusCompletedScheduleCount}개 완료 · 체크{" "}
                      {homeChecklistItems.length}개 중 {homeChecklistCompletedCount}개 완료
                    </p>
                  </div>
                  <button className="secondary-button compact-button" onClick={() => setActiveTab("schedule")} type="button">
                    전체 보기
                  </button>
                </div>

                <div className="home-checklist-card">
                  {homeChecklistItems.length > 0 ? (
                    homeChecklistItems.map((item) => (
                      <button className="home-check-item" key={item.id} onClick={() => toggleCheck(item.id)} type="button">
                        <CheckCircle2 className={checkedItems[item.id] ? "checked" : ""} size={22} />
                        <span>{item.title}</span>
                      </button>
                    ))
                  ) : (
                    <p className="muted">오늘 확인할 체크리스트가 없습니다.</p>
                  )}
                </div>
              </section>

              <div className="grid-two">
                <button className="quick-button" onClick={() => setActiveTab("schedule")}>
                  <CalendarDays size={22} />
                  일정 보기
                </button>
                <button className="quick-button" onClick={() => setActiveTab("flight")}>
                  <Plane size={22} />
                  항공편
                </button>
                <button className="quick-button danger" onClick={() => setActiveTab("concierge")}>
                  <AlertTriangle size={22} />
                  긴급 연락
                </button>
              </div>

              <section className="section-block">
                <details className="date-details">
                  <summary>여행 날짜 조정</summary>
                  <div className="date-form" aria-label="여행 날짜 변경">
                    <label>
                      출발
                      <input
                        type="date"
                        value={tripDates.startDate}
                        onChange={(event) => updateTripDate("startDate", event.target.value)}
                      />
                    </label>
                    <label>
                      입국
                      <input
                        type="date"
                        value={tripDates.endDate}
                        onChange={(event) => updateTripDate("endDate", event.target.value)}
                      />
                    </label>
                  </div>
                </details>
              </section>

              <section className="section-block">
                <h2>추천 루트</h2>
                {routes.map((route) => (
                  <article className="list-card" key={route.id}>
                    <Route size={22} />
                    <div>
                      <strong>{route.title}</strong>
                      <p>{route.description}</p>
                    </div>
                  </article>
                ))}
              </section>
            </section>
          )}

          {activeTab === "schedule" && (
            <section className="screen">
              <h1>일정</h1>
              <div className="date-tabs">
                {dates.map((date) => (
                  <button
                    className={date === selectedDate ? "active" : ""}
                    key={date}
                    onClick={() => setSelectedDate(date)}
                  >
                    {formatShortDate(getDisplayDate(date))}
                  </button>
                ))}
              </div>
              <div className="schedule-summary">
                <span>
                  {selectedSchedules.length}개 중 {completedScheduleCount}개 완료
                </span>
                <small>일정 순서는 날짜별로 저장됩니다.</small>
              </div>
              <div className="card-stack">
                {selectedSchedules.map((item, index) => {
                  const place = getPlace(item.placeId);
                  const isCompleted = completedSchedules[item.id];
                  return (
                    <article className={`schedule-card ${isCompleted ? "completed" : ""}`} key={item.id}>
                      <span className="time">{item.time}</span>
                      <div className="schedule-content">
                        <div className="schedule-meta">
                          <span className="pill subtle">{scheduleTypeLabels[item.type]}</span>
                          {isCompleted && <span className="pill completed-pill">완료</span>}
                          {place && <span className="place-label">{place.name}</span>}
                        </div>
                        <h2>{item.title}</h2>
                        {item.transportMemo && (
                          <p className="schedule-detail">
                            <strong>이동</strong>
                            {item.transportMemo}
                          </p>
                        )}
                        {item.reservationMemo && (
                          <p className="schedule-detail">
                            <strong>예약</strong>
                            {item.reservationMemo}
                          </p>
                        )}
                        {item.guideMemo && <p className="muted">{item.guideMemo}</p>}
                        <div className="schedule-actions">
                          <button
                            className="secondary-button compact-button"
                            onClick={() => toggleScheduleComplete(item.id)}
                            type="button"
                          >
                            <CheckCircle2 size={18} />
                            {isCompleted ? "완료 취소" : "완료"}
                          </button>
                          <div className="schedule-move-actions" aria-label={`${item.title} 순서 변경`}>
                            <button
                              aria-label={`${item.title} 위로 이동`}
                              className="icon-button neutral"
                              disabled={index === 0}
                              onClick={() => moveSchedule(item.id, "up")}
                              type="button"
                            >
                              <ArrowUp size={18} />
                            </button>
                            <button
                              aria-label={`${item.title} 아래로 이동`}
                              className="icon-button neutral"
                              disabled={index === selectedSchedules.length - 1}
                              onClick={() => moveSchedule(item.id, "down")}
                              type="button"
                            >
                              <ArrowDown size={18} />
                            </button>
                          </div>
                        </div>
                        <a
                          className="secondary-button"
                          href={getMapUrl(place)}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          <MapPin size={18} />
                          지도
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>

              <section className="section-block">
                <div className="section-title-row">
                  <h2>준비 체크리스트</h2>
                  <button
                    className="secondary-button compact-button"
                    onClick={() => setIsChecklistEditing(!isChecklistEditing)}
                    type="button"
                  >
                    {isChecklistEditing ? "완료" : "편집"}
                  </button>
                </div>
                <div className="check-summary">
                  <p className="muted">
                    {allChecklist.length}개 중 {completedCount}개 완료
                  </p>
                  <span>{Math.round((completedCount / Math.max(allChecklist.length, 1)) * 100)}%</span>
                </div>
                {isChecklistEditing && hiddenChecklistIDs.length > 0 && (
                  <button className="secondary-button restore-button" onClick={restoreDefaultChecklistItems} type="button">
                    기본 체크리스트 {hiddenChecklistIDs.length}개 복원
                  </button>
                )}

                <form className="check-add-form" onSubmit={addChecklistItem}>
                  <label>
                    구분
                    <select
                      value={newChecklistCategory}
                      onChange={(event) => setNewChecklistCategory(event.target.value as ChecklistCategory)}
                    >
                      {checklistCategories.map(([category, label]) => (
                        <option key={category} value={category}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    추가할 항목
                    <input
                      placeholder="예: 여권 사본 챙기기"
                      type="text"
                      value={newChecklistTitle}
                      onChange={(event) => setNewChecklistTitle(event.target.value)}
                    />
                  </label>
                  <button className="primary-button" type="submit">
                    <PlusCircle size={18} />
                    추가
                  </button>
                </form>

                <div className="check-groups">
                  {groupedChecklist.map((group) => (
                    <section className="check-group" key={group.category}>
                      <h3>{group.label}</h3>
                      <div className="card-stack">
                        {group.items.map((item) => (
                          <div className="check-row" key={item.id}>
                            <button className="check-toggle" onClick={() => toggleCheck(item.id)} type="button">
                              <CheckCircle2 className={checkedItems[item.id] ? "checked" : ""} size={24} />
                              <span>{item.title}</span>
                            </button>
                            {isChecklistEditing && (
                              <button
                                aria-label={`${item.title} 삭제`}
                                className="icon-button"
                                onClick={() => removeChecklistItem(item)}
                                type="button"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </section>
            </section>
          )}

          {activeTab === "flight" && (
            <section className="screen">
              <h1>항공편</h1>
              <p className="muted">공항에서 바로 확인할 수 있도록 출국·입국 항공편을 따로 모았습니다.</p>

              <div className="card-stack">
                {flights.map((flight) => (
                  <article className="flight-card" key={flight.id}>
                    <div className="flight-card-header">
                      <span className="pill">{flight.label}</span>
                      <Plane size={28} />
                    </div>
                    <h2>
                      {flight.airline} {flight.flightNumber}
                    </h2>
                    <dl className="flight-details">
                      <div>
                        <dt>날짜</dt>
                        <dd>{flight.date}</dd>
                      </div>
                      <div>
                        <dt>시간</dt>
                        <dd>{flight.time}</dd>
                      </div>
                    </dl>
                    {flight.memo && <p className="schedule-detail danger-note">{flight.memo}</p>}
                  </article>
                ))}
              </div>

              <section className="section-block">
                <h2>공항에서 확인할 것</h2>
                <div className="card-stack">
                  {allChecklist
                    .filter((item) => item.category === "airport")
                    .map((item) => (
                      <div className="check-row" key={item.id}>
                        <button className="check-toggle" onClick={() => toggleCheck(item.id)} type="button">
                          <CheckCircle2 className={checkedItems[item.id] ? "checked" : ""} size={24} />
                          <span>{item.title}</span>
                        </button>
                      </div>
                    ))}
                </div>
              </section>
            </section>
          )}

          {activeTab === "map" && (
            <section className="screen">
              <h1>지도와 추천 장소</h1>
              <div className="map-preview">
                {places.map((place, index) => (
                  <a
                    className={`map-pin pin-${index + 1}`}
                    href={getMapUrl(place)}
                    key={place.id}
                    rel="noopener noreferrer"
                    target="_blank"
                    title={place.name}
                  >
                    <MapPin size={18} />
                  </a>
                ))}
              </div>
              <div className="card-stack">
                {places.map((place) => (
                  <article className="place-card" key={place.id}>
                    <div>
                      <span className="pill subtle">{placeCategoryLabels[place.category]}</span>
                      <h2>{place.name}</h2>
                      <p>{place.recommendedReason}</p>
                      {place.address && <p className="muted">{place.address}</p>}
                      {place.cautionMemo && <p className="schedule-detail danger-note">{place.cautionMemo}</p>}
                    </div>
                    <div className="card-footer">
                      <span>{placeCategoryLabels[place.category]}</span>
                      <a
                        className="secondary-button compact-button"
                        href={getMapUrl(place)}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        <MapPin size={18} />
                        보기
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {activeTab === "concierge" && (
            <section className="screen">
              <h1>긴급과 여행 정보</h1>
              <section className="section-block compact">
                <h2>긴급 연락</h2>
                <div className="card-stack">
                  {emergencies.map((item) => (
                    <article className="emergency-card" key={item.id}>
                      <h2>{item.title}</h2>
                      <p>{item.description}</p>
                      {item.phone && (
                        <a className="primary-button" href={`tel:${item.phone}`}>
                          <Phone size={18} />
                          전화하기
                        </a>
                      )}
                    </article>
                  ))}
                </div>
              </section>

              <section className="section-block">
                <h2>여행 정보</h2>
                <article className="info-card">
                  <h2>숙소</h2>
                  <p>{accommodation.name}</p>
                  <p className="muted">{accommodation.address}</p>
                  <p>
                    체크인 {accommodation.checkIn} · 체크아웃 {accommodation.checkOut}
                  </p>
                  {accommodation.memo && <p className="muted">{accommodation.memo}</p>}
                  <button className="secondary-button" onClick={copyAccommodationAddress}>
                    <Copy size={18} />
                    {addressCopied ? "복사됨" : "주소 복사"}
                  </button>
                </article>
                <article className="info-card">
                  <h2>일본어 문장</h2>
                  {phrases.map((phrase) => (
                    <p key={phrase.id}>
                      <strong>{phrase.situation}</strong>
                      <br />
                      {phrase.korean} · {phrase.japanese}
                    </p>
                  ))}
                  <div className="translation-actions" aria-label="번역 서비스 바로가기">
                    {translationLinks.map((link) => (
                      <a
                        className="secondary-button translation-button"
                        href={link.href}
                        key={link.id}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        <Languages size={18} />
                        <span>{link.label}</span>
                        <ExternalLink className="trailing-icon" size={16} />
                      </a>
                    ))}
                  </div>
                </article>
              </section>
            </section>
          )}
        </div>

        <nav className="bottom-tabs" aria-label="주요 메뉴">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                aria-current={activeTab === tab.id ? "page" : undefined}
                className={activeTab === tab.id ? "active" : ""}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={21} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </section>
    </main>
  );
}


export default App;
