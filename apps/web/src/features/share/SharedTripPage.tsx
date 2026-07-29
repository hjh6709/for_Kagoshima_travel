import {
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Circle,
  Compass,
  Info,
  MapPinned,
  Plane,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ChecklistItemResponse } from "../../api/checklist";
import type { SharedSchedule } from "../../api/schedules";
import type { SharedTripResponse } from "../../api/trips";
import {
  formatKoreanDate,
  formatShortDate,
  getTodayDateString,
  getTravelPhase,
  getTravelStatus,
} from "../../shared/date";
import { sortSharedFlights } from "../../shared/sort";
import { getFlightDirectionLabel, getScheduleTypeLabel } from "../../shared/travelOptions";
import { SharedTripMapSection } from "./SharedTripMapSection";
import {
  getSharedChecklistForPhase,
  getSharedFocusDate,
  getSharedSchedulesForDate,
} from "./sharedTripView";

type SharedTripPageProps = {
  error: string;
  warning: string;
  loading: boolean;
  sharedTrip: SharedTripResponse | null;
};

type SharedView = "today" | "map" | "info";

const checklistCategoryLabels: Record<ChecklistItemResponse["category"], string> = {
  before: "출발 전",
  airport: "공항",
  daily: "여행 중",
  return: "귀국 전",
};

function SharedSectionHeading({
  count,
  description,
  title,
}: {
  count?: number;
  description: string;
  title: string;
}) {
  return (
    <div className="shared-section-heading">
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {count !== undefined && <span className="shared-count">{count}</span>}
    </div>
  );
}

function SharedScheduleList({
  emptyMessage,
  placeByID,
  schedules,
}: {
  emptyMessage: string;
  placeByID: Map<string, SharedTripResponse["places"][number]>;
  schedules: SharedSchedule[];
}) {
  if (schedules.length === 0) {
    return (
      <div className="shared-empty-state">
        <CalendarDays aria-hidden="true" size={22} />
        <strong>{emptyMessage}</strong>
      </div>
    );
  }

  return (
    <ol className="shared-schedule-list">
      {schedules.map((schedule) => {
        const place = placeByID.get(schedule.placeId ?? "");
        return (
          <li key={schedule.id}>
            <div className="shared-schedule-time">
              <span>{formatShortDate(schedule.date)}</span>
              <strong>{schedule.time || "시간 미정"}</strong>
            </div>
            <article>
              <div className="shared-schedule-meta">
                <span>{getScheduleTypeLabel(schedule.type)}</span>
                {place && <span>{place.name}</span>}
              </div>
              <h3>{schedule.title}</h3>
              {schedule.transportMemo && <p>{schedule.transportMemo}</p>}
              {schedule.guideMemo && <p>{schedule.guideMemo}</p>}
            </article>
          </li>
        );
      })}
    </ol>
  );
}

function SharedChecklistList({
  emptyMessage,
  items,
}: {
  emptyMessage: string;
  items: readonly ChecklistItemResponse[];
}) {
  if (items.length === 0) {
    return (
      <div className="shared-empty-state">
        <CheckCircle2 aria-hidden="true" size={22} />
        <strong>{emptyMessage}</strong>
      </div>
    );
  }

  return (
    <ul className="shared-checklist-list">
      {items.map((item) => (
        <li className={item.isCompleted ? "completed" : ""} key={item.id}>
          {item.isCompleted ? (
            <CheckCircle2 aria-label="완료" size={20} />
          ) : (
            <Circle aria-label="미완료" size={20} />
          )}
          <span>
            <strong>{item.title}</strong>
            <small>{checklistCategoryLabels[item.category]}</small>
          </span>
        </li>
      ))}
    </ul>
  );
}

function SharedFlightSection({ sharedTrip }: { sharedTrip: SharedTripResponse }) {
  const flights = sortSharedFlights(sharedTrip.flights);

  return (
    <section className="shared-section">
      <SharedSectionHeading
        count={flights.length}
        description="공항에서 필요한 출발·도착 정보를 모았습니다."
        title="항공편"
      />
      {flights.length === 0 ? (
        <div className="shared-empty-state">
          <Plane aria-hidden="true" size={22} />
          <strong>공유된 항공편이 없습니다</strong>
        </div>
      ) : (
        <div className="shared-flight-list">
          {flights.map((flight) => (
            <article key={flight.id}>
              <div className="shared-flight-topline">
                <span>{getFlightDirectionLabel(flight.direction)}</span>
                <strong>{flight.flightNumber || "편명 미정"}</strong>
              </div>
              <div className="shared-flight-route">
                <div>
                  <strong>{flight.departureAirport || "출발 공항"}</strong>
                  <span>
                    {formatShortDate(flight.departureDate)} {flight.departureTime || "시간 미정"}
                  </span>
                </div>
                <Plane aria-hidden="true" size={18} />
                <div>
                  <strong>{flight.arrivalAirport || "도착 공항"}</strong>
                  <span>
                    {flight.arrivalDate ? formatShortDate(flight.arrivalDate) : "날짜 미정"}{" "}
                    {flight.arrivalTime || "시간 미정"}
                  </span>
                </div>
              </div>
              <p>{flight.airline || "항공사 미정"} · {flight.label}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function SharedRoutesSection({ sharedTrip }: { sharedTrip: SharedTripResponse }) {
  return (
    <section className="shared-section">
      <SharedSectionHeading
        count={sharedTrip.routes.length}
        description="여행 관리자가 공유한 이동 흐름입니다."
        title="추천 루트"
      />
      {sharedTrip.routes.length === 0 ? (
        <div className="shared-empty-state">
          <MapPinned aria-hidden="true" size={22} />
          <strong>공유된 추천 루트가 없습니다</strong>
        </div>
      ) : (
        <div className="shared-route-list">
          {sharedTrip.routes.map((route) => (
            <article key={route.id}>
              <h3>{route.title}</h3>
              {route.description && <p>{route.description}</p>}
              {route.transportMemo && <p>{route.transportMemo}</p>}
              {route.estimatedDuration && <span>{route.estimatedDuration}</span>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export function SharedTripPage({
  error,
  warning,
  loading,
  sharedTrip,
}: SharedTripPageProps) {
  const [activeView, setActiveView] = useState<SharedView>("today");

  useEffect(() => {
    const existingMeta = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const previousContent = existingMeta?.content;
    const meta = existingMeta ?? document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    if (!existingMeta) document.head.appendChild(meta);

    return () => {
      if (existingMeta && previousContent !== undefined) {
        existingMeta.content = previousContent;
      } else {
        meta.remove();
      }
    };
  }, []);

  const placeByID = useMemo(() => {
    if (!sharedTrip) return new Map<string, SharedTripResponse["places"][number]>();
    return new Map(sharedTrip.places.map((place) => [place.id, place]));
  }, [sharedTrip]);

  const today = getTodayDateString();
  const tripDates = sharedTrip
    ? { startDate: sharedTrip.trip.startDate, endDate: sharedTrip.trip.endDate }
    : null;
  const focusDate = tripDates
    ? getSharedFocusDate(tripDates.startDate, tripDates.endDate, today)
    : "";
  const travelPhase = tripDates ? getTravelPhase(today, tripDates) : "before";
  const travelStatus = tripDates ? getTravelStatus(today, tripDates) : null;
  const focusSchedules = sharedTrip
    ? getSharedSchedulesForDate(sharedTrip.schedules, focusDate)
    : [];
  const focusChecklist = sharedTrip
    ? getSharedChecklistForPhase(sharedTrip.checklist, travelPhase)
    : [];
  const focusTitle =
    travelPhase === "before" ? "첫날 미리보기" : travelPhase === "during" ? "오늘 일정" : "마지막 날 기록";

  return (
    <main className="app-shell">
      <section className="phone-frame shared-frame">
        <div className="content">
          <section className="screen shared-screen">
            <header className="shared-hero">
              <div className="shared-brand-row">
                <span className="shared-brand-mark">
                  <Compass aria-hidden="true" size={19} />
                </span>
                <span>Map Planner 공유 여행</span>
              </div>

              {loading && (
                <div className="shared-load-state" role="status">
                  <span aria-hidden="true" className="shared-loading-mark" />
                  <h1>여행을 불러오는 중입니다</h1>
                  <p>공유된 최신 정보를 확인하고 있습니다.</p>
                </div>
              )}

              {!loading && error && (
                <div className="shared-load-state shared-load-error" role="alert">
                  <h1>공유 여행을 열지 못했습니다</h1>
                  <p>{error}</p>
                  <div>
                    <button className="primary-button" onClick={() => window.location.reload()} type="button">
                      다시 시도
                    </button>
                    <a className="secondary-button" href="/">서비스 홈</a>
                  </div>
                </div>
              )}

              {!loading && !error && sharedTrip && (
                <>
                  <span className="shared-status">{travelStatus?.label}</span>
                  <h1>{sharedTrip.trip.title}</h1>
                  <div className="shared-trip-meta">
                    <span>
                      <CalendarRange aria-hidden="true" size={17} />
                      {formatKoreanDate(sharedTrip.trip.startDate)} ~ {formatKoreanDate(sharedTrip.trip.endDate)}
                    </span>
                    {sharedTrip.trip.travelers.length > 0 && (
                      <span>
                        <Users aria-hidden="true" size={17} />
                        {sharedTrip.trip.travelers.join(", ")}
                      </span>
                    )}
                  </div>
                </>
              )}
            </header>

            {!loading && !error && sharedTrip && (
              <>
                {warning && (
                  <p className="shared-offline-warning" role="status">
                    {warning}
                  </p>
                )}

                <nav aria-label="공유 여행 보기" className="shared-view-tabs">
                  <button
                    aria-pressed={activeView === "today"}
                    className={activeView === "today" ? "active" : ""}
                    onClick={() => setActiveView("today")}
                    type="button"
                  >
                    <CalendarDays aria-hidden="true" size={17} />
                    오늘
                  </button>
                  <button
                    aria-pressed={activeView === "map"}
                    className={activeView === "map" ? "active" : ""}
                    onClick={() => setActiveView("map")}
                    type="button"
                  >
                    <MapPinned aria-hidden="true" size={17} />
                    지도
                  </button>
                  <button
                    aria-pressed={activeView === "info"}
                    className={activeView === "info" ? "active" : ""}
                    onClick={() => setActiveView("info")}
                    type="button"
                  >
                    <Info aria-hidden="true" size={17} />
                    여행정보
                  </button>
                </nav>

                {activeView === "today" && (
                  <div className="shared-view-content">
                    <section className="shared-section">
                      <SharedSectionHeading
                        count={focusSchedules.length}
                        description={`${formatKoreanDate(focusDate)}에 확인할 일정입니다.`}
                        title={focusTitle}
                      />
                      <SharedScheduleList
                        emptyMessage="이 날짜에 공유된 일정이 없습니다"
                        placeByID={placeByID}
                        schedules={focusSchedules}
                      />
                    </section>

                    <section className="shared-section">
                      <SharedSectionHeading
                        count={focusChecklist.length}
                        description="현재 여행 단계에서 필요한 항목만 보여줍니다."
                        title="오늘 확인"
                      />
                      <SharedChecklistList
                        emptyMessage="지금 확인할 체크 항목이 없습니다"
                        items={focusChecklist}
                      />
                    </section>
                  </div>
                )}

                {activeView === "map" && <SharedTripMapSection sharedTrip={sharedTrip} />}

                {activeView === "info" && (
                  <div className="shared-view-content">
                    <section className="shared-section">
                      <SharedSectionHeading
                        count={sharedTrip.schedules.length}
                        description="여행 전체 일정을 날짜와 시간순으로 확인하세요."
                        title="전체 일정"
                      />
                      <SharedScheduleList
                        emptyMessage="공유된 일정이 없습니다"
                        placeByID={placeByID}
                        schedules={sharedTrip.schedules}
                      />
                    </section>
                    <SharedFlightSection sharedTrip={sharedTrip} />
                    <SharedRoutesSection sharedTrip={sharedTrip} />
                    <section className="shared-section">
                      <SharedSectionHeading
                        count={sharedTrip.checklist.length}
                        description="여행 관리자가 공유한 전체 체크 항목입니다."
                        title="전체 체크리스트"
                      />
                      <SharedChecklistList
                        emptyMessage="공유된 체크 항목이 없습니다"
                        items={sharedTrip.checklist}
                      />
                    </section>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
