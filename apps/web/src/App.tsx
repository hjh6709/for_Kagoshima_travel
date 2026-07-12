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
  LockKeyhole,
  LogOut,
  Map as MapIcon,
  MapPin,
  Plane,
  PlusCircle,
  Phone,
  Route,
  Shield,
  Trash2,
  UserRound,
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
import type { ChecklistItem, ScheduleItem } from "./types/travel";

type Tab = "today" | "schedule" | "flight" | "map" | "concierge";
type TripDates = {
  startDate: string;
  endDate: string;
};
type ChecklistCategory = ChecklistItem["category"];
type CustomChecklistItem = ChecklistItem & { custom: true };
type ScheduleOrderByDate = Record<string, string[]>;
type AuthMode = "login" | "register";
type TravelPhase = "before" | "during" | "after";

const tabs: Array<{ id: Tab; label: string; icon: typeof Home }> = [
  { id: "today", label: "오늘", icon: Home },
  { id: "schedule", label: "전체 일정", icon: CalendarDays },
  { id: "flight", label: "항공", icon: Plane },
  { id: "map", label: "지도", icon: MapIcon },
  { id: "concierge", label: "긴급", icon: Shield },
];

const scheduleTypeLabels: Record<ScheduleItem["type"], string> = {
  move: "이동",
  meal: "식사",
  golf: "골프",
  sightseeing: "관광",
  hotel: "숙소",
  shopping: "쇼핑",
  etc: "기타",
};
const scheduleTypeOptions = Object.entries(scheduleTypeLabels) as Array<[ScheduleItem["type"], string]>;

function getScheduleTypeLabel(type: string) {
  return scheduleTypeLabels[type as ScheduleItem["type"]] ?? "일정";
}

const placeCategoryLabels = {
  hotel: "숙소",
  meal: "식사",
  golf: "골프",
  cafe: "카페",
  sightseeing: "관광",
  shopping: "쇼핑",
  transport: "이동",
  etc: "기타",
} as const;
type PlaceCategory = keyof typeof placeCategoryLabels;
const placeCategoryOptions = Object.entries(placeCategoryLabels) as Array<[PlaceCategory, string]>;

const flightDirectionLabels = {
  departure: "출국",
  return: "입국",
  domestic: "국내 이동",
  etc: "기타",
} as const;
type FlightDirection = keyof typeof flightDirectionLabels;
const flightDirectionOptions = Object.entries(flightDirectionLabels) as Array<[FlightDirection, string]>;

const checklistCategoryLabels = {
  before: "출발 전",
  airport: "공항",
  daily: "여행 중",
  return: "입국 전",
} as const;
const checklistCategories = Object.entries(checklistCategoryLabels) as Array<[ChecklistCategory, string]>;
const ownerAuthStorageKey = "travel-app-owner-auth";

const translationLinks = [
  {
    id: "google-translate",
    label: "Google 번역 열기",
    href: "https://translate.google.com/?sl=auto&tl=ja&op=translate",
  },
  {
    id: "papago",
    label: "Papago 열기",
    href: "https://papago.naver.com/",
  },
] as const;

function getSavedOwnerAuth(): AuthResponse | null {
  const saved = window.localStorage.getItem(ownerAuthStorageKey);
  try {
    const parsed = saved ? JSON.parse(saved) : null;
    if (
      parsed &&
      typeof parsed.accessToken === "string" &&
      typeof parsed.user?.id === "string" &&
      typeof parsed.user?.email === "string"
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function getPlace(placeId?: string) {
  return places.find((place) => place.id === placeId);
}

function getMapUrl(place?: ReturnType<typeof getPlace>) {
  const fallback = place?.address || place?.name || "여행지";
  return place?.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fallback)}`;
}

function formatKoreanDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${date.getMonth() + 1}월 ${date.getDate()}일(${days[date.getDay()]})`;
}

function formatShortDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${date.getMonth() + 1}/${date.getDate()}(${days[date.getDay()]})`;
}

function getDateOffset(from: string, to: string): number {
  return Math.round((new Date(`${to}T00:00:00`).getTime() - new Date(`${from}T00:00:00`).getTime()) / 86400000);
}

function shiftDate(baseDate: string, offset: number): string {
  const date = new Date(`${baseDate}T00:00:00`);
  date.setDate(date.getDate() + offset);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTodayDateString(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function clampDate(date: string, startDate: string, endDate: string): string {
  if (date < startDate) return startDate;
  if (date > endDate) return endDate;
  return date;
}

function getTravelPhase(today: string, dates: TripDates): TravelPhase {
  if (today < dates.startDate) return "before";
  if (today > dates.endDate) return "after";
  return "during";
}

function getTravelStatus(today: string, dates: TripDates): { phase: TravelPhase; label: string; description: string } {
  const phase = getTravelPhase(today, dates);
  if (phase === "before") {
    const daysLeft = Math.max(getDateOffset(today, dates.startDate), 0);
    return {
      phase,
      label: daysLeft === 0 ? "오늘 출발" : `출발 D-${daysLeft}`,
      description: "출발 전 준비물과 항공편을 먼저 확인하세요.",
    };
  }
  if (phase === "after") {
    return {
      phase,
      label: "여행 완료",
      description: "입국 후 짐과 분실물을 한 번 더 확인하세요.",
    };
  }

  const dayNumber = getDateOffset(dates.startDate, today) + 1;
  return {
    phase,
    label: `여행 ${dayNumber}일차`,
    description: "오늘 일정과 다음 이동만 확인하면 됩니다.",
  };
}

function isDateValue(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isChecklistCategory(value: unknown): value is ChecklistCategory {
  return typeof value === "string" && value in checklistCategoryLabels;
}

function isCustomChecklistItem(item: ChecklistItem): item is CustomChecklistItem {
  return "custom" in item && item.custom === true;
}

function getSavedTripDates(): TripDates {
  const fallback = { startDate: trip.startDate, endDate: trip.endDate };
  const saved = window.localStorage.getItem("kagoshima-trip-dates");
  try {
    const parsed = saved ? JSON.parse(saved) : fallback;
    return isDateValue(parsed.startDate) && isDateValue(parsed.endDate) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function getSavedCustomChecklist(): CustomChecklistItem[] {
  const saved = window.localStorage.getItem("kagoshima-custom-checklist");
  try {
    const parsed = saved ? JSON.parse(saved) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is CustomChecklistItem => {
      return (
        typeof item?.id === "string" &&
        isChecklistCategory(item.category) &&
        typeof item.title === "string" &&
        item.title.trim().length > 0 &&
        item.custom === true
      );
    });
  } catch {
    return [];
  }
}

function getSavedHiddenChecklistIDs(): string[] {
  const saved = window.localStorage.getItem("kagoshima-hidden-checklist");
  try {
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function getSavedScheduleCompletions(): Record<string, boolean> {
  const saved = window.localStorage.getItem("kagoshima-schedule-completions");
  try {
    const parsed = saved ? JSON.parse(saved) : {};
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, boolean] => {
        const [id, completed] = entry;
        return typeof id === "string" && typeof completed === "boolean";
      })
    );
  } catch {
    return {};
  }
}

function getSavedScheduleOrder(): ScheduleOrderByDate {
  const saved = window.localStorage.getItem("kagoshima-schedule-order");
  try {
    const parsed = saved ? JSON.parse(saved) : {};
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, string[]] => {
        const [date, ids] = entry;
        return isDateValue(date) && Array.isArray(ids) && ids.every((id) => typeof id === "string");
      })
    );
  } catch {
    return {};
  }
}

function getOrderedSchedulesForDate(date: string, orderByDate: ScheduleOrderByDate): ScheduleItem[] {
  const baseSchedules = schedules.filter((item) => item.date === date);
  const order = orderByDate[date];
  if (!order) return baseSchedules;

  const orderIndex = new Map(order.map((id, index) => [id, index]));
  return [...baseSchedules].sort((left, right) => {
    const leftIndex = orderIndex.get(left.id) ?? Number.MAX_SAFE_INTEGER;
    const rightIndex = orderIndex.get(right.id) ?? Number.MAX_SAFE_INTEGER;
    return leftIndex - rightIndex;
  });
}

function toAbsoluteWebURL(path: string) {
  return new URL(path, window.location.origin).toString();
}

function sortSharedSchedules(items: SharedSchedule[]): SharedSchedule[] {
  return [...items].sort((left, right) => {
    const byDate = left.date.localeCompare(right.date);
    if (byDate !== 0) return byDate;

    const byTime = left.time.localeCompare(right.time);
    if (byTime !== 0) return byTime;

    return left.title.localeCompare(right.title);
  });
}

function sortSharedPlaces(items: SharedPlace[]): SharedPlace[] {
  return [...items].sort((left, right) => {
    const byCategory = left.category.localeCompare(right.category);
    if (byCategory !== 0) return byCategory;

    return left.name.localeCompare(right.name);
  });
}

function sortSharedFlights(items: SharedFlight[]): SharedFlight[] {
  return [...items].sort((left, right) => {
    const byDate = left.departureDate.localeCompare(right.departureDate);
    if (byDate !== 0) return byDate;

    const byTime = left.departureTime.localeCompare(right.departureTime);
    if (byTime !== 0) return byTime;

    return left.label.localeCompare(right.label);
  });
}

function getFlightDirectionLabel(direction: string) {
  return flightDirectionLabels[direction as FlightDirection] ?? "항공";
}

function getShareTokenFromPath(path: string) {
  const match = path.match(/^\/share\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : "";
}

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
    return <SharedTripApp error={sharedTripError} loading={sharedTripLoading} sharedTrip={sharedTrip} />;
  }

  if (isManageRoute) {
    return (
      <TripManageApp
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

type SharedTripAppProps = {
  error: string;
  loading: boolean;
  sharedTrip: SharedTripResponse | null;
};

function SharedTripApp({ error, loading, sharedTrip }: SharedTripAppProps) {
  const placeByID = useMemo(() => {
    if (!sharedTrip) return new Map<string, SharedTripResponse["places"][number]>();
    return new Map(sharedTrip.places.map((place) => [place.id, place]));
  }, [sharedTrip]);
  const sharedFlights = useMemo(() => sortSharedFlights(sharedTrip?.flights ?? []), [sharedTrip]);

  return (
    <main className="app-shell">
      <section className="phone-frame shared-frame">
        <div className="content">
          <section className="screen shared-screen">
            <article className="hero-card shared-hero-card">
              <span className="pill">읽기 전용 공유</span>
              {loading && (
                <>
                  <h1>공유 여행을 불러오는 중</h1>
                  <p className="muted">잠시만 기다려주세요.</p>
                </>
              )}

              {!loading && error && (
                <>
                  <h1>공유 링크를 확인하지 못했습니다</h1>
                  <p className="form-error">{error}</p>
                </>
              )}

              {!loading && !error && sharedTrip && (
                <>
                  <h1>{sharedTrip.trip.title}</h1>
                  <p className="trip-dates">
                    {formatKoreanDate(sharedTrip.trip.startDate)} ~ {formatKoreanDate(sharedTrip.trip.endDate)}
                  </p>
                  <p className="muted">
                    {sharedTrip.trip.travelers.length > 0
                      ? `${sharedTrip.trip.travelers.join(", ")}와 공유된 여행입니다.`
                      : "공유된 여행 정보입니다."}
                  </p>
                </>
              )}
            </article>

            {!loading && !error && sharedTrip && (
              <>
                <section className="section-block">
                  <div className="section-title-row">
                    <div>
                      <h2>일정</h2>
                      <p className="section-caption">공유된 최신 일정입니다.</p>
                    </div>
                    <span className="pill subtle">{sharedTrip.schedules.length}개</span>
                  </div>

                  {sharedTrip.schedules.length === 0 ? (
                    <article className="empty-state-card list-card">
                      <p className="muted">공유된 일정이 없습니다.</p>
                    </article>
                  ) : (
                    <div className="card-stack">
                      {sharedTrip.schedules.map((schedule) => {
                        const place = placeByID.get(schedule.placeId ?? "");
                        return (
                          <article className="schedule-card shared-schedule-card" key={schedule.id}>
                            <div className="schedule-time">
                              <span>{formatShortDate(schedule.date)}</span>
                              <strong>{schedule.time || "시간 미정"}</strong>
                            </div>
                            <div className="schedule-content">
                              <div className="schedule-meta">
                                <span className="pill subtle">{getScheduleTypeLabel(schedule.type)}</span>
                                {place && <span className="place-label">{place.name}</span>}
                              </div>
                              <h2>{schedule.title}</h2>
                              {schedule.transportMemo && <p>{schedule.transportMemo}</p>}
                              {schedule.guideMemo && <p className="muted">{schedule.guideMemo}</p>}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>

                <section className="section-block">
                  <div className="section-title-row">
                    <div>
                      <h2>항공편</h2>
                      <p className="section-caption">공항에서 바로 확인할 수 있는 항공 정보입니다.</p>
                    </div>
                    <span className="pill subtle">{sharedFlights.length}개</span>
                  </div>

                  {sharedFlights.length === 0 ? (
                    <article className="empty-state-card list-card">
                      <p className="muted">공유된 항공편이 없습니다.</p>
                    </article>
                  ) : (
                    <div className="card-stack">
                      {sharedFlights.map((flight) => (
                        <article className="flight-card shared-flight-card" key={flight.id}>
                          <div className="flight-card-header">
                            <span className="pill">{getFlightDirectionLabel(flight.direction)}</span>
                            <Plane size={20} />
                          </div>
                          <h2>
                            {flight.label}
                            {flight.flightNumber ? ` · ${flight.flightNumber}` : ""}
                          </h2>
                          {(flight.airline || flight.memo) && (
                            <p className="muted">{[flight.airline, flight.memo].filter(Boolean).join(" · ")}</p>
                          )}
                          <dl className="flight-details">
                            <div>
                              <dt>출발</dt>
                              <dd>
                                {flight.departureAirport}
                                <br />
                                {formatKoreanDate(flight.departureDate)} {flight.departureTime}
                              </dd>
                            </div>
                            <div>
                              <dt>도착</dt>
                              <dd>
                                {flight.arrivalAirport}
                                <br />
                                {flight.arrivalDate ? formatKoreanDate(flight.arrivalDate) : "날짜 미정"}{" "}
                                {flight.arrivalTime || "시간 미정"}
                              </dd>
                            </div>
                          </dl>
                        </article>
                      ))}
                    </div>
                  )}
                </section>

                <section className="section-block">
                  <div className="section-title-row">
                    <div>
                      <h2>장소</h2>
                      <p className="section-caption">지도 링크가 있으면 외부 지도 앱으로 열 수 있습니다.</p>
                    </div>
                    <span className="pill subtle">{sharedTrip.places.length}개</span>
                  </div>

                  {sharedTrip.places.length === 0 ? (
                    <article className="empty-state-card list-card">
                      <p className="muted">공유된 장소가 없습니다.</p>
                    </article>
                  ) : (
                    <div className="card-stack">
                      {sharedTrip.places.map((place) => (
                        <article className="place-card shared-place-card" key={place.id}>
                          <div>
                            <span className="pill subtle">{place.category}</span>
                            <h2>{place.name}</h2>
                            {place.address && <p className="muted">{place.address}</p>}
                            {place.recommendedReason && <p>{place.recommendedReason}</p>}
                          </div>
                          {place.googleMapsUrl && (
                            <a
                              className="secondary-button compact-button"
                              href={place.googleMapsUrl}
                              rel="noreferrer"
                              target="_blank"
                            >
                              <ExternalLink size={16} />
                              지도 열기
                            </a>
                          )}
                        </article>
                      ))}
                    </div>
                  )}
                </section>

                <section className="section-block">
                  <div className="section-title-row">
                    <div>
                      <h2>추천 루트</h2>
                      <p className="section-caption">공유된 이동 흐름과 참고 메모입니다.</p>
                    </div>
                    <span className="pill subtle">{sharedTrip.routes.length}개</span>
                  </div>

                  {sharedTrip.routes.length === 0 ? (
                    <article className="empty-state-card list-card">
                      <p className="muted">공유된 추천 루트가 없습니다.</p>
                    </article>
                  ) : (
                    <div className="card-stack">
                      {sharedTrip.routes.map((route) => (
                        <article className="info-card shared-route-card" key={route.id}>
                          <h2>{route.title}</h2>
                          {route.description && <p>{route.description}</p>}
                          {route.transportMemo && <p className="muted">{route.transportMemo}</p>}
                          {route.estimatedDuration && <span className="pill subtle">{route.estimatedDuration}</span>}
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

type TripManageAppProps = {
  auth: AuthResponse | null;
  authChecked: boolean;
  authEmail: string;
  authError: string;
  authMode: AuthMode;
  authPassword: string;
  authSubmitting: boolean;
  newTripEndDate: string;
  newTripMemo: string;
  newTripStartDate: string;
  newTripTitle: string;
  newTripTravelers: string;
  newScheduleDate: string;
  newScheduleGuideMemo: string;
  newSchedulePlaceID: string;
  newScheduleTime: string;
  newScheduleTitle: string;
  newScheduleTransportMemo: string;
  newScheduleType: ScheduleItem["type"];
  newPlaceAddress: string;
  newPlaceCategory: PlaceCategory;
  newPlaceGoogleMapsURL: string;
  newPlaceName: string;
  newPlaceRecommendedReason: string;
  newFlightAirline: string;
  newFlightArrivalAirport: string;
  newFlightArrivalDate: string;
  newFlightArrivalTime: string;
  newFlightDepartureAirport: string;
  newFlightDepartureDate: string;
  newFlightDepartureTime: string;
  newFlightDirection: FlightDirection;
  newFlightLabel: string;
  newFlightMemo: string;
  newFlightNumber: string;
  ownerTrips: OwnerTrip[];
  ownerTripsError: string;
  ownerTripsLoading: boolean;
  ownerSchedules: SharedSchedule[];
  ownerPlaces: SharedPlace[];
  ownerFlights: SharedFlight[];
  ownerDetailDataError: string;
  ownerDetailDataLoading: boolean;
  isScheduleListEditing: boolean;
  deletingScheduleID: string;
  isPlaceListEditing: boolean;
  deletingPlaceID: string;
  selectedOwnerTrip: OwnerTrip | null;
  selectedShareLink: string;
  flightCreateError: string;
  flightCreateSubmitting: boolean;
  placeCreateError: string;
  placeCreateSubmitting: boolean;
  placeDeleteError: string;
  scheduleCreateError: string;
  scheduleCreateSubmitting: boolean;
  scheduleDeleteError: string;
  shareLinkCopied: boolean;
  shareLinkError: string;
  shareLinkSubmitting: boolean;
  tripCreateError: string;
  tripCreateSubmitting: boolean;
  tripEditEndDate: string;
  tripEditError: string;
  tripEditMemo: string;
  tripEditStartDate: string;
  tripEditSubmitting: boolean;
  tripEditTitle: string;
  tripEditTravelers: string;
  onAuthEmailChange: (value: string) => void;
  onAuthModeChange: (mode: AuthMode) => void;
  onAuthPasswordChange: (value: string) => void;
  onNewTripEndDateChange: (value: string) => void;
  onNewTripMemoChange: (value: string) => void;
  onNewTripStartDateChange: (value: string) => void;
  onNewTripTitleChange: (value: string) => void;
  onNewTripTravelersChange: (value: string) => void;
  onNewScheduleDateChange: (value: string) => void;
  onNewScheduleGuideMemoChange: (value: string) => void;
  onNewSchedulePlaceIDChange: (value: string) => void;
  onNewScheduleTimeChange: (value: string) => void;
  onNewScheduleTitleChange: (value: string) => void;
  onNewScheduleTransportMemoChange: (value: string) => void;
  onNewScheduleTypeChange: (value: ScheduleItem["type"]) => void;
  onNewPlaceAddressChange: (value: string) => void;
  onNewPlaceCategoryChange: (value: PlaceCategory) => void;
  onNewPlaceGoogleMapsURLChange: (value: string) => void;
  onNewPlaceNameChange: (value: string) => void;
  onNewPlaceRecommendedReasonChange: (value: string) => void;
  onNewFlightAirlineChange: (value: string) => void;
  onNewFlightArrivalAirportChange: (value: string) => void;
  onNewFlightArrivalDateChange: (value: string) => void;
  onNewFlightArrivalTimeChange: (value: string) => void;
  onNewFlightDepartureAirportChange: (value: string) => void;
  onNewFlightDepartureDateChange: (value: string) => void;
  onNewFlightDepartureTimeChange: (value: string) => void;
  onNewFlightDirectionChange: (value: FlightDirection) => void;
  onNewFlightLabelChange: (value: string) => void;
  onNewFlightMemoChange: (value: string) => void;
  onNewFlightNumberChange: (value: string) => void;
  onCloseOwnerTripDetail: () => void;
  onCopyShareLink: () => void;
  onCreateShareLink: () => void;
  onDeleteSchedule: (scheduleID: string) => void;
  onScheduleListEditingChange: (value: boolean) => void;
  onDeletePlace: (placeID: string) => void;
  onPlaceListEditingChange: (value: boolean) => void;
  onTripEditEndDateChange: (value: string) => void;
  onTripEditMemoChange: (value: string) => void;
  onTripEditStartDateChange: (value: string) => void;
  onTripEditTitleChange: (value: string) => void;
  onTripEditTravelersChange: (value: string) => void;
  onLogout: () => void;
  onSelectOwnerTrip: (tripID: string) => void;
  onSubmitAuth: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitNewFlight: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitNewPlace: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitNewTrip: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitNewSchedule: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitTripEdit: (event: FormEvent<HTMLFormElement>) => void;
};

function TripManageApp({
  auth,
  authChecked,
  authEmail,
  authError,
  authMode,
  authPassword,
  authSubmitting,
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
  onAuthEmailChange,
  onAuthModeChange,
  onAuthPasswordChange,
  onNewTripEndDateChange,
  onNewTripMemoChange,
  onNewTripStartDateChange,
  onNewTripTitleChange,
  onNewTripTravelersChange,
  onNewScheduleDateChange,
  onNewScheduleGuideMemoChange,
  onNewSchedulePlaceIDChange,
  onNewScheduleTimeChange,
  onNewScheduleTitleChange,
  onNewScheduleTransportMemoChange,
  onNewScheduleTypeChange,
  onNewPlaceAddressChange,
  onNewPlaceCategoryChange,
  onNewPlaceGoogleMapsURLChange,
  onNewPlaceNameChange,
  onNewPlaceRecommendedReasonChange,
  onNewFlightAirlineChange,
  onNewFlightArrivalAirportChange,
  onNewFlightArrivalDateChange,
  onNewFlightArrivalTimeChange,
  onNewFlightDepartureAirportChange,
  onNewFlightDepartureDateChange,
  onNewFlightDepartureTimeChange,
  onNewFlightDirectionChange,
  onNewFlightLabelChange,
  onNewFlightMemoChange,
  onNewFlightNumberChange,
  onCloseOwnerTripDetail,
  onCopyShareLink,
  onCreateShareLink,
  onDeleteSchedule,
  onScheduleListEditingChange,
  onDeletePlace,
  onPlaceListEditingChange,
  onTripEditEndDateChange,
  onTripEditMemoChange,
  onTripEditStartDateChange,
  onTripEditTitleChange,
  onTripEditTravelersChange,
  onLogout,
  onSelectOwnerTrip,
  onSubmitAuth,
  onSubmitNewFlight,
  onSubmitNewPlace,
  onSubmitNewTrip,
  onSubmitNewSchedule,
  onSubmitTripEdit,
}: TripManageAppProps) {
  const ownerPlaceByID = useMemo(() => new Map(ownerPlaces.map((place) => [place.id, place])), [ownerPlaces]);

  return (
    <main className="app-shell">
      <section className="phone-frame owner-frame">
        <div className="content">
          <section className="screen owner-screen">
            {!authChecked && (
              <article className="info-card auth-card">
                <span className="pill">여행 관리 계정</span>
                <h1>로그인 확인 중</h1>
                <p className="muted">저장된 로그인 정보를 확인하고 있습니다.</p>
              </article>
            )}

            {authChecked && !auth && (
              <article className="info-card auth-card">
                <span className="pill">여행 관리 계정</span>
                <h1>{authMode === "login" ? "여행 관리 로그인" : "여행 관리 계정 만들기"}</h1>
                <p className="muted">
                  처음 사용하는 경우 계정을 만든 뒤 여행을 생성합니다. 공유 링크를 받은 가족이나 동행자는 로그인 없이
                  읽기 전용으로 확인합니다.
                </p>

                <form className="auth-form" onSubmit={onSubmitAuth}>
                  <label>
                    이메일
                    <input
                      autoComplete="email"
                      inputMode="email"
                      onChange={(event) => onAuthEmailChange(event.target.value)}
                      placeholder="you@example.com"
                      required
                      type="email"
                      value={authEmail}
                    />
                  </label>
                  <label>
                    비밀번호
                    <input
                      autoComplete={authMode === "login" ? "current-password" : "new-password"}
                      minLength={8}
                      onChange={(event) => onAuthPasswordChange(event.target.value)}
                      placeholder="8자 이상"
                      required
                      type="password"
                      value={authPassword}
                    />
                  </label>

                  {authError && <p className="form-error">{authError}</p>}

                  <button className="primary-button" disabled={authSubmitting} type="submit">
                    <LockKeyhole size={18} />
                    {authSubmitting ? "처리 중" : authMode === "login" ? "로그인" : "회원가입"}
                  </button>
                </form>

                <button
                  className="secondary-button auth-switch-button"
                  onClick={() => onAuthModeChange(authMode === "login" ? "register" : "login")}
                  type="button"
                >
                  {authMode === "login" ? "계정이 없으면 회원가입" : "이미 계정이 있으면 로그인"}
                </button>

                <p className="auth-help">
                  로컬 개발은 <code>VITE_API_BASE_URL=http://localhost:8080</code> 설정이 필요합니다.
                </p>
              </article>
            )}

            {authChecked && auth && (
              <>
                <div className="owner-header">
                  <div>
                    <span className="eyebrow">여행 관리 계정</span>
                    <h1>여행 관리</h1>
                    <p className="muted">{auth.user.email}</p>
                  </div>
                  <button className="icon-button neutral" onClick={onLogout} type="button" aria-label="로그아웃">
                    <LogOut size={18} />
                  </button>
                </div>

                <article className="hero-card">
                  <div>
                    <span className="pill">내 여행</span>
                    <h2>관리할 여행을 선택하세요</h2>
                    <p className="muted">
                      로그인한 계정으로 여행을 만들고, 이후 일정과 장소를 연결합니다.
                    </p>
                  </div>
                  <a className="primary-button" href="/">
                    <UserRound size={18} />
                    여행 화면 보기
                  </a>
                </article>

                {selectedOwnerTrip && (
                  <section className="section-block owner-detail-section">
                    <div className="section-title-row">
                      <div>
                        <span className="pill">선택한 여행</span>
                        <h2>{selectedOwnerTrip.title}</h2>
                        <p className="section-caption">
                          {formatKoreanDate(selectedOwnerTrip.startDate)} ~ {formatKoreanDate(selectedOwnerTrip.endDate)}
                        </p>
                      </div>
                      <button className="secondary-button compact-button" onClick={onCloseOwnerTripDetail} type="button">
                        목록으로
                      </button>
                    </div>

                    <article className="owner-trip-detail-card">
                      <div className="detail-grid">
                        <div>
                          <span className="muted-label">여행자</span>
                          <p>
                            {selectedOwnerTrip.travelers.length > 0
                              ? selectedOwnerTrip.travelers.join(", ")
                              : "여행자 미입력"}
                          </p>
                        </div>
                        <div>
                          <span className="muted-label">메모</span>
                          <p>{selectedOwnerTrip.memo || "메모 없음"}</p>
                        </div>
                      </div>

                      <form className="auth-form trip-edit-form" onSubmit={onSubmitTripEdit}>
                        <div className="section-title-row compact-title-row">
                          <div>
                            <h3>기본 정보 수정</h3>
                            <p className="section-caption">여행명, 기간, 여행자, 메모를 수정합니다.</p>
                          </div>
                        </div>

                        <label>
                          여행명
                          <input
                            onChange={(event) => onTripEditTitleChange(event.target.value)}
                            required
                            type="text"
                            value={tripEditTitle}
                          />
                        </label>

                        <div className="form-grid-two">
                          <label>
                            시작일
                            <input
                              onChange={(event) => onTripEditStartDateChange(event.target.value)}
                              required
                              type="date"
                              value={tripEditStartDate}
                            />
                          </label>
                          <label>
                            종료일
                            <input
                              min={tripEditStartDate || undefined}
                              onChange={(event) => onTripEditEndDateChange(event.target.value)}
                              required
                              type="date"
                              value={tripEditEndDate}
                            />
                          </label>
                        </div>

                        <label>
                          여행자
                          <textarea
                            onChange={(event) => onTripEditTravelersChange(event.target.value)}
                            placeholder="쉼표 또는 줄바꿈으로 입력"
                            rows={3}
                            value={tripEditTravelers}
                          />
                        </label>

                        <label>
                          메모
                          <textarea
                            onChange={(event) => onTripEditMemoChange(event.target.value)}
                            placeholder="여행 목적, 주의사항, 준비 메모"
                            rows={3}
                            value={tripEditMemo}
                          />
                        </label>

                        {tripEditError && <p className="form-error">{tripEditError}</p>}

                        <button className="primary-button" disabled={tripEditSubmitting} type="submit">
                          <CheckCircle2 size={18} />
                          {tripEditSubmitting ? "저장 중" : "기본 정보 저장"}
                        </button>
                      </form>

                      <div className="owner-action-grid">
                        <button className="quick-button" disabled type="button">
                          <CalendarDays size={18} />
                          일정 조회 연결됨
                        </button>
                        <button className="quick-button" disabled type="button">
                          <MapPin size={18} />
                          장소 조회 연결됨
                        </button>
                        <button className="quick-button" disabled type="button">
                          <Plane size={18} />
                          항공 조회 연결됨
                        </button>
                        <button
                          className="quick-button"
                          disabled={shareLinkSubmitting}
                          onClick={onCreateShareLink}
                          type="button"
                        >
                          <Copy size={18} />
                          {shareLinkSubmitting
                            ? "공유 링크 만드는 중"
                            : selectedShareLink
                              ? "새 공유 링크 만들기"
                              : "읽기 전용 공유 링크 만들기"}
                        </button>
                      </div>

                      {selectedShareLink && (
                        <div className="share-link-panel">
                          <label>
                            공유 링크
                            <input readOnly value={selectedShareLink} />
                          </label>
                          <div className="share-link-actions">
                            <button className="secondary-button compact-button" onClick={onCopyShareLink} type="button">
                              <Copy size={16} />
                              링크 복사
                            </button>
                            <a
                              className="secondary-button compact-button"
                              href={selectedShareLink}
                              rel="noreferrer"
                              target="_blank"
                            >
                              <ExternalLink size={16} />
                              열기
                            </a>
                          </div>
                        </div>
                      )}

                      {shareLinkCopied && <p className="form-success">공유 링크를 복사했습니다.</p>}
                      {shareLinkError && <p className="form-error">{shareLinkError}</p>}

                      <section className="owner-linked-data-section">
                        <div className="section-title-row compact-title-row">
                          <div>
                            <h3>장소 추가</h3>
                            <p className="section-caption">
                              일정에 연결하거나 공유 화면에 표시할 장소를 서버에 저장합니다.
                            </p>
                          </div>
                        </div>

                        <form className="auth-form compact-owner-form" onSubmit={onSubmitNewPlace}>
                          <div className="form-grid-two">
                            <label>
                              장소 이름
                              <input
                                onChange={(event) => onNewPlaceNameChange(event.target.value)}
                                placeholder="예: 공항 렌터카 센터"
                                required
                                type="text"
                                value={newPlaceName}
                              />
                            </label>
                            <label>
                              분류
                              <select
                                onChange={(event) => onNewPlaceCategoryChange(event.target.value as PlaceCategory)}
                                value={newPlaceCategory}
                              >
                                {placeCategoryOptions.map(([category, label]) => (
                                  <option key={category} value={category}>
                                    {label}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>

                          <label>
                            주소
                            <input
                              onChange={(event) => onNewPlaceAddressChange(event.target.value)}
                              placeholder="예: 공항 1층 또는 숙소 주소"
                              type="text"
                              value={newPlaceAddress}
                            />
                          </label>

                          <label>
                            Google Maps 링크
                            <input
                              inputMode="url"
                              onChange={(event) => onNewPlaceGoogleMapsURLChange(event.target.value)}
                              placeholder="https://www.google.com/maps/..."
                              type="url"
                              value={newPlaceGoogleMapsURL}
                            />
                          </label>

                          <label>
                            추천/안내 메모
                            <textarea
                              onChange={(event) => onNewPlaceRecommendedReasonChange(event.target.value)}
                              placeholder="예: 도착 후 바로 이동할 장소, 운영시간 확인 필요"
                              rows={2}
                              value={newPlaceRecommendedReason}
                            />
                          </label>

                          {placeCreateError && <p className="form-error">{placeCreateError}</p>}

                          <button className="primary-button" disabled={placeCreateSubmitting} type="submit">
                            <PlusCircle size={18} />
                            {placeCreateSubmitting ? "장소 추가 중" : "장소 추가"}
                          </button>
                        </form>
                      </section>

                      <section className="owner-linked-data-section">
                        <div className="section-title-row compact-title-row">
                          <div>
                            <h3>항공편 추가</h3>
                            <p className="section-caption">공유 화면 항공 정보에 표시할 항공편을 서버에 저장합니다.</p>
                          </div>
                        </div>

                        <form className="auth-form compact-owner-form" onSubmit={onSubmitNewFlight}>
                          <div className="form-grid-two">
                            <label>
                              구분
                              <select
                                onChange={(event) => onNewFlightDirectionChange(event.target.value as FlightDirection)}
                                value={newFlightDirection}
                              >
                                {flightDirectionOptions.map(([direction, label]) => (
                                  <option key={direction} value={direction}>
                                    {label}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label>
                              항공편 이름
                              <input
                                onChange={(event) => onNewFlightLabelChange(event.target.value)}
                                placeholder="예: 출국 항공편"
                                required
                                type="text"
                                value={newFlightLabel}
                              />
                            </label>
                          </div>

                          <div className="form-grid-two">
                            <label>
                              항공사
                              <input
                                onChange={(event) => onNewFlightAirlineChange(event.target.value)}
                                placeholder="예: 대한항공"
                                type="text"
                                value={newFlightAirline}
                              />
                            </label>
                            <label>
                              편명
                              <input
                                autoCapitalize="characters"
                                onChange={(event) => onNewFlightNumberChange(event.target.value)}
                                placeholder="예: KE123"
                                type="text"
                                value={newFlightNumber}
                              />
                            </label>
                          </div>

                          <div className="form-grid-two">
                            <label>
                              출발 공항
                              <input
                                onChange={(event) => onNewFlightDepartureAirportChange(event.target.value)}
                                placeholder="예: 인천"
                                required
                                type="text"
                                value={newFlightDepartureAirport}
                              />
                            </label>
                            <label>
                              도착 공항
                              <input
                                onChange={(event) => onNewFlightArrivalAirportChange(event.target.value)}
                                placeholder="예: 도쿄"
                                required
                                type="text"
                                value={newFlightArrivalAirport}
                              />
                            </label>
                          </div>

                          <div className="form-grid-two">
                            <label>
                              출발 날짜
                              <input
                                max={selectedOwnerTrip.endDate}
                                min={selectedOwnerTrip.startDate}
                                onChange={(event) => onNewFlightDepartureDateChange(event.target.value)}
                                required
                                type="date"
                                value={newFlightDepartureDate}
                              />
                            </label>
                            <label>
                              출발 시간
                              <input
                                onChange={(event) => onNewFlightDepartureTimeChange(event.target.value)}
                                placeholder="예: 10:30"
                                required
                                type="text"
                                value={newFlightDepartureTime}
                              />
                            </label>
                          </div>

                          <div className="form-grid-two">
                            <label>
                              도착 날짜
                              <input
                                min={newFlightDepartureDate || selectedOwnerTrip.startDate}
                                onChange={(event) => onNewFlightArrivalDateChange(event.target.value)}
                                type="date"
                                value={newFlightArrivalDate}
                              />
                            </label>
                            <label>
                              도착 시간
                              <input
                                onChange={(event) => onNewFlightArrivalTimeChange(event.target.value)}
                                placeholder="예: 12:45"
                                type="text"
                                value={newFlightArrivalTime}
                              />
                            </label>
                          </div>

                          <label>
                            항공 메모
                            <textarea
                              onChange={(event) => onNewFlightMemoChange(event.target.value)}
                              placeholder="예: 터미널, 수하물, 체크인 주의사항"
                              rows={2}
                              value={newFlightMemo}
                            />
                          </label>

                          {flightCreateError && <p className="form-error">{flightCreateError}</p>}

                          <button className="primary-button" disabled={flightCreateSubmitting} type="submit">
                            <PlusCircle size={18} />
                            {flightCreateSubmitting ? "항공편 추가 중" : "항공편 추가"}
                          </button>
                        </form>
                      </section>

                      <section className="owner-linked-data-section">
                        <div className="section-title-row compact-title-row">
                          <div>
                            <h3>일정 추가</h3>
                            <p className="section-caption">공유 화면에 표시할 일정을 서버에 저장합니다.</p>
                          </div>
                        </div>

                        <form className="auth-form compact-owner-form" onSubmit={onSubmitNewSchedule}>
                          <div className="form-grid-two">
                            <label>
                              날짜
                              <input
                                max={selectedOwnerTrip.endDate}
                                min={selectedOwnerTrip.startDate}
                                onChange={(event) => onNewScheduleDateChange(event.target.value)}
                                required
                                type="date"
                                value={newScheduleDate}
                              />
                            </label>
                            <label>
                              시간
                              <input
                                onChange={(event) => onNewScheduleTimeChange(event.target.value)}
                                placeholder="예: 10:30"
                                required
                                type="text"
                                value={newScheduleTime}
                              />
                            </label>
                          </div>

                          <div className="form-grid-two">
                            <label>
                              유형
                              <select
                                onChange={(event) =>
                                  onNewScheduleTypeChange(event.target.value as ScheduleItem["type"])
                                }
                                value={newScheduleType}
                              >
                                {scheduleTypeOptions.map(([type, label]) => (
                                  <option key={type} value={type}>
                                    {label}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label>
                              연결 장소
                              <select
                                onChange={(event) => onNewSchedulePlaceIDChange(event.target.value)}
                                value={newSchedulePlaceID}
                              >
                                <option value="">장소 연결 안 함</option>
                                {ownerPlaces.map((place) => (
                                  <option key={place.id} value={place.id}>
                                    {place.name}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>

                          <label>
                            일정 제목
                            <input
                              onChange={(event) => onNewScheduleTitleChange(event.target.value)}
                              placeholder="예: 공항 도착 후 렌터카 수령"
                              required
                              type="text"
                              value={newScheduleTitle}
                            />
                          </label>

                          <label>
                            이동 메모
                            <textarea
                              onChange={(event) => onNewScheduleTransportMemoChange(event.target.value)}
                              placeholder="예: 택시, 버스, 도보 이동 정보"
                              rows={2}
                              value={newScheduleTransportMemo}
                            />
                          </label>

                          <label>
                            안내 메모
                            <textarea
                              onChange={(event) => onNewScheduleGuideMemoChange(event.target.value)}
                              placeholder="예: 준비물, 현장 주의사항, 가족에게 보여줄 설명"
                              rows={2}
                              value={newScheduleGuideMemo}
                            />
                          </label>

                          {scheduleCreateError && <p className="form-error">{scheduleCreateError}</p>}

                          <button className="primary-button" disabled={scheduleCreateSubmitting} type="submit">
                            <PlusCircle size={18} />
                            {scheduleCreateSubmitting ? "일정 추가 중" : "일정 추가"}
                          </button>
                        </form>
                      </section>

                      <section className="owner-linked-data-section">
                        <div className="section-title-row compact-title-row">
                          <div>
                            <h3>공유되는 일정</h3>
                            <p className="section-caption">현재 서버에 저장되어 공유 화면에 표시되는 일정입니다.</p>
                          </div>
                          <div className="section-actions">
                            <span className="pill subtle">{ownerSchedules.length}개</span>
                            <button
                              className="secondary-button compact-button"
                              disabled={ownerSchedules.length === 0}
                              onClick={() => onScheduleListEditingChange(!isScheduleListEditing)}
                              type="button"
                            >
                              {isScheduleListEditing ? "완료" : "편집"}
                            </button>
                          </div>
                        </div>

                        {ownerDetailDataLoading && <p className="muted">일정과 장소를 불러오는 중입니다.</p>}
                        {ownerDetailDataError && <p className="form-error">{ownerDetailDataError}</p>}
                        {scheduleDeleteError && <p className="form-error">{scheduleDeleteError}</p>}

                        {!ownerDetailDataLoading && !ownerDetailDataError && ownerSchedules.length === 0 && (
                          <article className="empty-state-card list-card">
                            <p className="muted">아직 서버에 저장된 일정이 없습니다.</p>
                          </article>
                        )}

                        {!ownerDetailDataLoading && !ownerDetailDataError && ownerSchedules.length > 0 && (
                          <div className="card-stack compact-card-stack">
                            {ownerSchedules.map((schedule) => {
                              const place = ownerPlaceByID.get(schedule.placeId ?? "");
                              return (
                                <article className="owner-linked-card" key={schedule.id}>
                                  <div>
                                    <span className="muted-label">
                                      {formatKoreanDate(schedule.date)} · {schedule.time || "시간 미정"}
                                    </span>
                                    <h2>{schedule.title}</h2>
                                    <p className="section-caption">
                                      {getScheduleTypeLabel(schedule.type)}
                                      {place ? ` · ${place.name}` : ""}
                                    </p>
                                  </div>
                                  {schedule.guideMemo && <p className="muted">{schedule.guideMemo}</p>}
                                  {isScheduleListEditing && (
                                    <div className="owner-linked-actions">
                                      <button
                                        className="danger-button compact-button"
                                        disabled={deletingScheduleID === schedule.id}
                                        onClick={() => onDeleteSchedule(schedule.id)}
                                        type="button"
                                      >
                                        <Trash2 size={16} />
                                        {deletingScheduleID === schedule.id ? "삭제 중" : "삭제"}
                                      </button>
                                    </div>
                                  )}
                                </article>
                              );
                            })}
                          </div>
                        )}
                      </section>

                      <section className="owner-linked-data-section">
                        <div className="section-title-row compact-title-row">
                          <div>
                            <h3>공유되는 장소</h3>
                            <p className="section-caption">일정에서 참조하거나 공유 화면에 표시되는 장소입니다.</p>
                          </div>
                          <div className="section-actions">
                            <span className="pill subtle">{ownerPlaces.length}개</span>
                            <button
                              className="secondary-button compact-button"
                              disabled={ownerPlaces.length === 0}
                              onClick={() => onPlaceListEditingChange(!isPlaceListEditing)}
                              type="button"
                            >
                              {isPlaceListEditing ? "완료" : "편집"}
                            </button>
                          </div>
                        </div>

                        {placeDeleteError && <p className="form-error">{placeDeleteError}</p>}

                        {!ownerDetailDataLoading && !ownerDetailDataError && ownerPlaces.length === 0 && (
                          <article className="empty-state-card list-card">
                            <p className="muted">아직 서버에 저장된 장소가 없습니다.</p>
                          </article>
                        )}

                        {!ownerDetailDataLoading && !ownerDetailDataError && ownerPlaces.length > 0 && (
                          <div className="card-stack compact-card-stack">
                            {ownerPlaces.map((place) => (
                              <article className="owner-linked-card" key={place.id}>
                                <div>
                                  <span className="muted-label">{place.category}</span>
                                  <h2>{place.name}</h2>
                                  {place.address && <p className="section-caption">{place.address}</p>}
                                </div>
                                <div className="owner-linked-actions">
                                  {place.googleMapsUrl && (
                                    <a
                                      className="secondary-button compact-button"
                                      href={place.googleMapsUrl}
                                      rel="noreferrer"
                                      target="_blank"
                                    >
                                      <ExternalLink size={16} />
                                      지도 열기
                                    </a>
                                  )}
                                  {isPlaceListEditing && (
                                    <button
                                      className="danger-button compact-button"
                                      disabled={deletingPlaceID === place.id}
                                      onClick={() => onDeletePlace(place.id)}
                                      type="button"
                                    >
                                      <Trash2 size={16} />
                                      {deletingPlaceID === place.id ? "삭제 중" : "삭제"}
                                    </button>
                                  )}
                                </div>
                              </article>
                            ))}
                          </div>
                        )}
                      </section>

                      <section className="owner-linked-data-section">
                        <div className="section-title-row compact-title-row">
                          <div>
                            <h3>공유되는 항공편</h3>
                            <p className="section-caption">공유 화면 항공 정보에 표시되는 항공편입니다.</p>
                          </div>
                          <span className="pill subtle">{ownerFlights.length}개</span>
                        </div>

                        {!ownerDetailDataLoading && !ownerDetailDataError && ownerFlights.length === 0 && (
                          <article className="empty-state-card list-card">
                            <p className="muted">아직 서버에 저장된 항공편이 없습니다.</p>
                          </article>
                        )}

                        {!ownerDetailDataLoading && !ownerDetailDataError && ownerFlights.length > 0 && (
                          <div className="card-stack compact-card-stack">
                            {ownerFlights.map((flight) => (
                              <article className="owner-linked-card" key={flight.id}>
                                <div>
                                  <span className="muted-label">
                                    {getFlightDirectionLabel(flight.direction)} ·{" "}
                                    {formatKoreanDate(flight.departureDate)} {flight.departureTime}
                                  </span>
                                  <h2>
                                    {flight.label}
                                    {flight.flightNumber ? ` · ${flight.flightNumber}` : ""}
                                  </h2>
                                  <p className="section-caption">
                                    {flight.departureAirport} → {flight.arrivalAirport}
                                  </p>
                                </div>
                                {flight.memo && <p className="muted">{flight.memo}</p>}
                              </article>
                            ))}
                          </div>
                        )}
                      </section>
                    </article>
                  </section>
                )}

                <section className="section-block">
                  <div className="section-title-row">
                    <div>
                      <h2>새 여행 만들기</h2>
                      <p className="section-caption">여행명과 기간만 입력하면 먼저 여행 공간을 만들 수 있습니다.</p>
                    </div>
                  </div>

                  <form className="auth-form trip-create-form" onSubmit={onSubmitNewTrip}>
                    <label>
                      여행명
                      <input
                        onChange={(event) => onNewTripTitleChange(event.target.value)}
                        placeholder="예: 여름 가족 여행"
                        required
                        type="text"
                        value={newTripTitle}
                      />
                    </label>

                    <div className="form-grid-two">
                      <label>
                        시작일
                        <input
                          onChange={(event) => onNewTripStartDateChange(event.target.value)}
                          required
                          type="date"
                          value={newTripStartDate}
                        />
                      </label>
                      <label>
                        종료일
                        <input
                          min={newTripStartDate || undefined}
                          onChange={(event) => onNewTripEndDateChange(event.target.value)}
                          required
                          type="date"
                          value={newTripEndDate}
                        />
                      </label>
                    </div>

                    <label>
                      여행자
                      <textarea
                        onChange={(event) => onNewTripTravelersChange(event.target.value)}
                        placeholder="쉼표 또는 줄바꿈으로 입력&#10;예: 나, 가족"
                        rows={3}
                        value={newTripTravelers}
                      />
                    </label>

                    <label>
                      메모
                      <textarea
                        onChange={(event) => onNewTripMemoChange(event.target.value)}
                        placeholder="여행 목적, 주의사항, 준비 메모"
                        rows={3}
                        value={newTripMemo}
                      />
                    </label>

                    {tripCreateError && <p className="form-error">{tripCreateError}</p>}

                    <button className="primary-button" disabled={tripCreateSubmitting} type="submit">
                      <PlusCircle size={18} />
                      {tripCreateSubmitting ? "만드는 중" : "새 여행 만들기"}
                    </button>
                  </form>
                </section>

                <section className="section-block">
                  <div className="section-title-row">
                    <h2>여행 목록</h2>
                    <span className="pill subtle">{ownerTrips.length}개</span>
                  </div>

                  {ownerTripsLoading && <p className="muted">여행 목록을 불러오는 중입니다.</p>}

                  {ownerTripsError && <p className="form-error">{ownerTripsError}</p>}

                  {!ownerTripsLoading && !ownerTripsError && ownerTrips.length === 0 && (
                    <article className="info-card empty-state-card">
                      <PlusCircle size={28} />
                      <h2>아직 만든 여행이 없습니다</h2>
                      <p className="muted">위 폼에서 첫 여행을 만들면 이 목록에 바로 표시됩니다.</p>
                    </article>
                  )}

                  {!ownerTripsLoading && !ownerTripsError && ownerTrips.length > 0 && (
                    <div className="card-stack">
                      {ownerTrips.map((ownerTrip) => (
                        <article className="owner-trip-card" key={ownerTrip.id}>
                          <div>
                            <span className="pill subtle">여행</span>
                            <h2>{ownerTrip.title}</h2>
                            <p className="muted">
                              {formatKoreanDate(ownerTrip.startDate)} ~ {formatKoreanDate(ownerTrip.endDate)}
                            </p>
                            <p>{ownerTrip.travelers.length > 0 ? ownerTrip.travelers.join(", ") : "여행자 미입력"}</p>
                          </div>
                          <button
                            className="secondary-button compact-button"
                            onClick={() => onSelectOwnerTrip(ownerTrip.id)}
                            type="button"
                          >
                            관리하기
                          </button>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

export default App;
