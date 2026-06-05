import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Copy,
  Home,
  Map,
  MapPin,
  Phone,
  Route,
  Shield,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { checklist, emergencies, places, routes, schedules, trip } from "./data/sampleTrip";
import type { ScheduleItem } from "./types/travel";

type Tab = "today" | "schedule" | "map" | "concierge";

const tabs: Array<{ id: Tab; label: string; icon: typeof Home }> = [
  { id: "today", label: "오늘", icon: Home },
  { id: "schedule", label: "전체 일정", icon: CalendarDays },
  { id: "map", label: "지도", icon: Map },
  { id: "concierge", label: "긴급", icon: Shield },
];

const scheduleTypeLabels: Record<ScheduleItem["type"], string> = {
  move: "이동",
  meal: "식사",
  sightseeing: "관광",
  hotel: "숙소",
  shopping: "쇼핑",
  etc: "기타",
};

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

function calcTripNights(start: string, end: string): string {
  const diff = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000);
  return `${diff}박 ${diff + 1}일`;
}

function App() {
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<Tab>("today");
  const [selectedDate, setSelectedDate] = useState(schedules[0]?.date ?? trip.startDate);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => {
    const saved = window.localStorage.getItem("kagoshima-checklist");
    try {
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const dates = useMemo(() => Array.from(new Set(schedules.map((item) => item.date))), []);
  const selectedSchedules = schedules.filter((item) => item.date === selectedDate);
  const nextSchedule = schedules[0];
  const completedCount = Object.values(checkedItems).filter(Boolean).length;

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }, [activeTab]);

  function toggleCheck(id: string) {
    const next = { ...checkedItems, [id]: !checkedItems[id] };
    setCheckedItems(next);
    window.localStorage.setItem("kagoshima-checklist", JSON.stringify(next));
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
                  {formatKoreanDate(trip.startDate)} ~ {formatKoreanDate(trip.endDate)}
                  &nbsp;·&nbsp;{calcTripNights(trip.startDate, trip.endDate)}
                </p>
              </div>

              <article className="hero-card">
                <div>
                  <span className="pill">다음 일정</span>
                  <h2>{nextSchedule.title}</h2>
                  <p>
                    {formatKoreanDate(nextSchedule.date)} {nextSchedule.time}
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
                    {formatKoreanDate(date)}
                  </button>
                ))}
              </div>
              <div className="card-stack">
                {selectedSchedules.map((item) => {
                  const place = getPlace(item.placeId);
                  return (
                    <article className="schedule-card" key={item.id}>
                      <span className="time">{item.time}</span>
                      <div>
                        <p className="pill subtle">{scheduleTypeLabels[item.type]}</p>
                        <h2>{item.title}</h2>
                        {place && <p className="muted">{place.name}</p>}
                        {item.parentMemo && <p>{item.parentMemo}</p>}
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
                <p className="muted">
                  {checklist.length}개 중 {completedCount}개 완료
                </p>
                <div className="card-stack">
                  {checklist.map((item) => (
                    <button className="check-row" key={item.id} onClick={() => toggleCheck(item.id)}>
                      <CheckCircle2 className={checkedItems[item.id] ? "checked" : ""} size={24} />
                      <span>{item.title}</span>
                    </button>
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
                      <span className="pill subtle">{place.category}</span>
                      <h2>{place.name}</h2>
                      <p>{place.recommendedReason}</p>
                      {place.address && <p className="muted">{place.address}</p>}
                    </div>
                    <a
                      className="secondary-button"
                      href={getMapUrl(place)}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <MapPin size={18} />
                      보기
                    </a>
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
                <h2>항공편</h2>
                <p>출국/귀국 항공편 정보를 입력할 자리입니다.</p>
              </article>
              <article className="info-card">
                <h2>숙소</h2>
                <p>숙소 이름, 주소, 전화번호, 체크인 시간을 입력하세요.</p>
                <button className="secondary-button">
                  <Copy size={18} />
                  주소 복사
                </button>
              </article>
              <article className="info-card">
                <h2>일본어 문장</h2>
                <p>この住所までお願いします。</p>
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
