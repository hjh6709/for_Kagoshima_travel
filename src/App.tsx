import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CalendarDays,
  CheckCircle2,
  Copy,
  Home,
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

function getPlace(placeId?: string) {
  return places.find((place) => place.id === placeId);
}

function getMapUrl(place?: ReturnType<typeof getPlace>) {
  const fallback = place?.address || place?.name || "Kagoshima";
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
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<Tab>("today");
  const [tripDates, setTripDates] = useState<TripDates>(getSavedTripDates);
  const [selectedDate, setSelectedDate] = useState(schedules[0]?.date ?? trip.startDate);
  const [addressCopied, setAddressCopied] = useState(false);
  const [customChecklistItems, setCustomChecklistItems] = useState<CustomChecklistItem[]>(getSavedCustomChecklist);
  const [hiddenChecklistIDs, setHiddenChecklistIDs] = useState<string[]>(getSavedHiddenChecklistIDs);
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
  const nextSchedule = schedules[0];
  const completedScheduleCount = selectedSchedules.filter((item) => completedSchedules[item.id]).length;
  const allChecklist = useMemo(
    () => [...checklist.filter((item) => !hiddenChecklistIDs.includes(item.id)), ...customChecklistItems],
    [customChecklistItems, hiddenChecklistIDs]
  );
  const completedCount = allChecklist.filter((item) => checkedItems[item.id]).length;
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

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }, [activeTab]);

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
                <span className="eyebrow">가고시마 여행</span>
                <p className="trip-dates">
                  {formatKoreanDate(tripDates.startDate)} ~ {formatKoreanDate(tripDates.endDate)}
                </p>
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
              </div>

              <article className="hero-card">
                <div>
                  <span className="pill">다음 일정</span>
                  <h2>{nextSchedule.title}</h2>
                  <p>
                    {formatKoreanDate(getDisplayDate(nextSchedule.date))} {nextSchedule.time}
                  </p>
                  <p className="muted">{nextSchedule.parentMemo}</p>
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
                        {item.parentMemo && <p className="muted">{item.parentMemo}</p>}
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
                <h2>준비 체크리스트</h2>
                <div className="check-summary">
                  <p className="muted">
                    {allChecklist.length}개 중 {completedCount}개 완료
                  </p>
                  <span>{Math.round((completedCount / Math.max(allChecklist.length, 1)) * 100)}%</span>
                </div>
                {hiddenChecklistIDs.length > 0 && (
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
                            <button
                              aria-label={`${item.title} 삭제`}
                              className="icon-button"
                              onClick={() => removeChecklistItem(item)}
                              type="button"
                            >
                              <Trash2 size={18} />
                            </button>
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
                        <button
                          aria-label={`${item.title} 삭제`}
                          className="icon-button"
                          onClick={() => removeChecklistItem(item)}
                          type="button"
                        >
                          <Trash2 size={18} />
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
