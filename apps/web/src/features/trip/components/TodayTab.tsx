import { AlertTriangle, CalendarDays, CheckCircle2, MapPin, Plane, Route } from "lucide-react";
import { formatKoreanDate } from "../../../shared/date";
import type { TripPageProps } from "../tripPageTypes";

// 오늘 탭 렌더링만 담당한다. 상태 변경은 상위에서 전달한 핸들러를 호출한다.
export function TodayTab({
  checkedItems,
  focusCompletedScheduleCount,
  focusSchedules,
  getDisplayDate,
  getMapUrl,
  getPlace,
  homeChecklistCompletedCount,
  homeChecklistItems,
  nextSchedule,
  routes,
  setActiveTab,
  toggleCheck,
  trip,
  tripDates,
  travelStatus,
  updateTripDate,
}: TripPageProps) {
  return (
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
  );
}
