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
import { createTrip, listMyTrips, type OwnerTrip } from "./api/trips";
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

const checklistCategoryLabels = {
  before: "출발 전",
  airport: "공항",
  daily: "여행 중",
  return: "귀국 전",
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
      description: "귀국 후 짐과 분실물을 한 번 더 확인하세요.",
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

function App() {
  const isOwnerRoute = window.location.pathname.startsWith("/owner");
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<Tab>("today");
  const [ownerAuth, setOwnerAuth] = useState<AuthResponse | null>(getSavedOwnerAuth);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authChecked, setAuthChecked] = useState(!isOwnerRoute);
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
    if (!isOwnerRoute) return;

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
  }, [isOwnerRoute]);

  useEffect(() => {
    if (!isOwnerRoute || !ownerAuth) return;

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
  }, [isOwnerRoute, ownerAuth]);

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
        setTripCreateError("");
        return;
      }
      setTripCreateError(error instanceof Error ? error.message : "여행을 만들지 못했습니다.");
    } finally {
      setTripCreateSubmitting(false);
    }
  }

  function logoutOwner() {
    window.localStorage.removeItem(ownerAuthStorageKey);
    setOwnerAuth(null);
    setOwnerTrips([]);
    setSelectedOwnerTripID(null);
    setOwnerTripsError("");
    setAuthPassword("");
    setAuthError("");
  }

  if (isOwnerRoute) {
    return (
      <OwnerApp
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
        selectedOwnerTrip={selectedOwnerTrip}
        newTripEndDate={newTripEndDate}
        newTripMemo={newTripMemo}
        newTripStartDate={newTripStartDate}
        newTripTitle={newTripTitle}
        newTripTravelers={newTripTravelers}
        tripCreateError={tripCreateError}
        tripCreateSubmitting={tripCreateSubmitting}
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
        onCloseOwnerTripDetail={() => setSelectedOwnerTripID(null)}
        onLogout={logoutOwner}
        onSelectOwnerTrip={setSelectedOwnerTripID}
        onSubmitAuth={submitAuth}
        onSubmitNewTrip={submitNewTrip}
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
                      귀국
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
              <p className="muted">공항에서 바로 확인할 수 있도록 출국·귀국 항공편을 따로 모았습니다.</p>

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

type OwnerAppProps = {
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
  ownerTrips: OwnerTrip[];
  ownerTripsError: string;
  ownerTripsLoading: boolean;
  selectedOwnerTrip: OwnerTrip | null;
  tripCreateError: string;
  tripCreateSubmitting: boolean;
  onAuthEmailChange: (value: string) => void;
  onAuthModeChange: (mode: AuthMode) => void;
  onAuthPasswordChange: (value: string) => void;
  onNewTripEndDateChange: (value: string) => void;
  onNewTripMemoChange: (value: string) => void;
  onNewTripStartDateChange: (value: string) => void;
  onNewTripTitleChange: (value: string) => void;
  onNewTripTravelersChange: (value: string) => void;
  onCloseOwnerTripDetail: () => void;
  onLogout: () => void;
  onSelectOwnerTrip: (tripID: string) => void;
  onSubmitAuth: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitNewTrip: (event: FormEvent<HTMLFormElement>) => void;
};

function OwnerApp({
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
  ownerTrips,
  ownerTripsError,
  ownerTripsLoading,
  selectedOwnerTrip,
  tripCreateError,
  tripCreateSubmitting,
  onAuthEmailChange,
  onAuthModeChange,
  onAuthPasswordChange,
  onNewTripEndDateChange,
  onNewTripMemoChange,
  onNewTripStartDateChange,
  onNewTripTitleChange,
  onNewTripTravelersChange,
  onCloseOwnerTripDetail,
  onLogout,
  onSelectOwnerTrip,
  onSubmitAuth,
  onSubmitNewTrip,
}: OwnerAppProps) {
  return (
    <main className="app-shell">
      <section className="phone-frame owner-frame">
        <div className="content">
          <section className="screen owner-screen">
            {!authChecked && (
              <article className="info-card auth-card">
                <span className="pill">관리자</span>
                <h1>로그인 확인 중</h1>
                <p className="muted">저장된 로그인 정보를 확인하고 있습니다.</p>
              </article>
            )}

            {authChecked && !auth && (
              <article className="info-card auth-card">
                <span className="pill">관리자</span>
                <h1>여행 관리 로그인</h1>
                <p className="muted">여행 생성자는 로그인 후 여행 정보와 공유 링크를 관리합니다.</p>

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
                    <span className="eyebrow">관리자 화면</span>
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

                      <div className="owner-action-grid">
                        <button className="quick-button" disabled type="button">
                          <CalendarDays size={18} />
                          일정 편집 준비 중
                        </button>
                        <button className="quick-button" disabled type="button">
                          <MapPin size={18} />
                          장소 편집 준비 중
                        </button>
                        <button className="quick-button" disabled type="button">
                          <Copy size={18} />
                          공유 링크 준비 중
                        </button>
                      </div>
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
