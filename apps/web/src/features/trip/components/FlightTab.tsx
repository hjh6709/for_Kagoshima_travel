import { CheckCircle2, Plane } from "lucide-react";
import type { TripPageProps } from "../tripPageTypes";

// 항공 탭 렌더링만 담당한다. 공항 체크리스트 상태 변경은 상위 핸들러를 호출한다.
export function FlightTab({ allChecklist, checkedItems, flights, toggleCheck }: TripPageProps) {
  return (
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
  );
}
