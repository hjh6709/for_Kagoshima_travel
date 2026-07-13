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
import type { FormEvent, RefObject } from "react";
import { formatKoreanDate, formatShortDate, type TripDates } from "../../shared/date";
import { checklistCategories, placeCategoryLabels, scheduleTypeLabels, translationLinks } from "../../shared/travelOptions";
import type {
  AccommodationInfo,
  ChecklistItem,
  EmergencyInfo,
  FlightInfo,
  Place,
  RecommendedRoute,
  ScheduleItem,
  Trip,
  UsefulPhrase,
} from "../../types/travel";
import type { ChecklistCategory, Tab } from "./tripViewState";

type TripPageProps = {
  accommodation: AccommodationInfo;
  activeTab: Tab;
  addressCopied: boolean;
  allChecklist: ChecklistItem[];
  checkedItems: Record<string, boolean>;
  completedCount: number;
  completedScheduleCount: number;
  completedSchedules: Record<string, boolean>;
  contentRef: RefObject<HTMLDivElement | null>;
  dates: string[];
  emergencies: EmergencyInfo[];
  flights: FlightInfo[];
  focusCompletedScheduleCount: number;
  focusSchedules: ScheduleItem[];
  getDisplayDate: (dateStr: string) => string;
  getMapUrl: (place?: Place) => string;
  getPlace: (placeId?: string) => Place | undefined;
  groupedChecklist: Array<{ category: ChecklistCategory; label: string; items: ChecklistItem[] }>;
  hiddenChecklistIDs: string[];
  homeChecklistCompletedCount: number;
  homeChecklistItems: ChecklistItem[];
  isChecklistEditing: boolean;
  newChecklistCategory: ChecklistCategory;
  newChecklistTitle: string;
  nextSchedule: ScheduleItem;
  phrases: UsefulPhrase[];
  places: Place[];
  routes: RecommendedRoute[];
  selectedDate: string;
  selectedSchedules: ScheduleItem[];
  trip: Trip;
  tripDates: TripDates;
  travelStatus: { phase: string; label: string; description: string };
  addChecklistItem: (event: FormEvent<HTMLFormElement>) => void;
  copyAccommodationAddress: () => void;
  moveSchedule: (scheduleID: string, direction: "up" | "down") => void;
  removeChecklistItem: (item: ChecklistItem) => void;
  restoreDefaultChecklistItems: () => void;
  setActiveTab: (tab: Tab) => void;
  setIsChecklistEditing: (value: boolean) => void;
  setNewChecklistCategory: (category: ChecklistCategory) => void;
  setNewChecklistTitle: (title: string) => void;
  setSelectedDate: (date: string) => void;
  toggleCheck: (id: string) => void;
  toggleScheduleComplete: (id: string) => void;
  updateTripDate: (field: "startDate" | "endDate", value: string) => void;
};

const tabs: Array<{ id: Tab; label: string; icon: typeof Home }> = [
  { id: "today", label: "오늘", icon: Home },
  { id: "schedule", label: "전체 일정", icon: CalendarDays },
  { id: "flight", label: "항공", icon: Plane },
  { id: "map", label: "지도", icon: MapIcon },
  { id: "concierge", label: "긴급", icon: Shield },
];

// 일반 여행 화면 렌더링만 담당한다. 상태 저장과 API 흐름은 App.tsx가 관리한다.
export function TripPage({
  accommodation,
  activeTab,
  addressCopied,
  allChecklist,
  checkedItems,
  completedCount,
  completedScheduleCount,
  completedSchedules,
  contentRef,
  dates,
  emergencies,
  flights,
  focusCompletedScheduleCount,
  focusSchedules,
  getDisplayDate,
  getMapUrl,
  getPlace,
  groupedChecklist,
  hiddenChecklistIDs,
  homeChecklistCompletedCount,
  homeChecklistItems,
  isChecklistEditing,
  newChecklistCategory,
  newChecklistTitle,
  nextSchedule,
  phrases,
  places,
  routes,
  selectedDate,
  selectedSchedules,
  trip,
  tripDates,
  travelStatus,
  addChecklistItem,
  copyAccommodationAddress,
  moveSchedule,
  removeChecklistItem,
  restoreDefaultChecklistItems,
  setActiveTab,
  setIsChecklistEditing,
  setNewChecklistCategory,
  setNewChecklistTitle,
  setSelectedDate,
  toggleCheck,
  toggleScheduleComplete,
  updateTripDate,
}: TripPageProps) {
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
