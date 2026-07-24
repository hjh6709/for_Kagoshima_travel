import { CheckCircle2, Plane } from "lucide-react";
import type { TripPageProps } from "../tripPageTypes";
import { MaskedText } from "../../../shared/components/MaskedText";

// 항공 탭 렌더링만 담당한다. 공항 체크리스트 상태 변경은 상위 핸들러를 호출한다.
export function FlightTab({ allChecklist, checkedItems, flights, toggleCheck, trip }: TripPageProps) {
  const destCode = trip?.destinationCountry === "CN" ? "PVG" : "KOJ";
  const destName = trip?.destinationCountry === "CN" ? "상하이 푸동" : "가고시마 공항";

  return (
    <section className="screen">
      <h1>항공편</h1>
      <p className="muted">공항에서 바로 확인할 수 있도록 출국·입국 항공편을 따로 모았습니다.</p>

      {flights.length === 0 && (
        <article className="empty-state-card list-card">
          <p className="muted">등록된 항공편이 없습니다. 편집 화면에서 항공편을 추가해보세요.</p>
        </article>
      )}

      <div className="card-stack">
        {flights.map((flight) => {
          const isOutbound = flight.label?.includes("출국") || flight.label?.includes("가는");
          const depCode = isOutbound ? "ICN" : destCode;
          const depName = isOutbound ? "인천공항" : destName;
          const arrCode = isOutbound ? destCode : "ICN";
          const arrName = isOutbound ? destName : "인천공항";

          return (
            <article className="flight-card-premium" key={flight.id} style={{ marginBottom: "16px" }}>
              <div className="flight-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <span className="pill" style={{ background: "var(--c-green-light)", color: "var(--c-green)" }}>
                  {flight.label}
                </span>
                <span className="muted" style={{ fontSize: "13px", fontWeight: 700 }}>
                  {flight.flightNumber || "편명 미정"}
                </span>
              </div>

              <div className="ticket-airport-row">
                <div className="airport-box" style={{ textAlign: "left" }}>
                  <span className="airport-code">{depCode}</span>
                  <span className="airport-name">{depName}</span>
                </div>
                <div className="ticket-plane-divider">
                  <div className="plane-line"></div>
                  <div className="plane-icon-wrapper">
                    <Plane size={16} />
                  </div>
                </div>
                <div className="airport-box" style={{ textAlign: "right" }}>
                  <span className="airport-code">{arrCode}</span>
                  <span className="airport-name">{arrName}</span>
                </div>
              </div>

              <div className="ticket-time-detail">
                <div>
                  <span style={{ display: "block", fontSize: "11px", color: "var(--c-muted)", marginBottom: "2px" }}>출발 정보</span>
                  <span>
                    {flight.date || "날짜 미정"}{" "}
                    {flight.time || "시간 미정"}
                  </span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ display: "block", fontSize: "11px", color: "var(--c-muted)", marginBottom: "2px" }}>도착 정보</span>
                  <span>상세 일정 참조</span>
                </div>
              </div>

              <div className="ticket-bottom-info">
                <span>{flight.airline || "항공사 미정"}</span>
                <span>비행 정보</span>
              </div>
              
              {flight.memo && (
                <div style={{ borderTop: "1px dashed rgba(28, 50, 37, 0.08)", paddingTop: "8px", marginTop: "4px", fontSize: "12px", color: "var(--c-muted)" }}>
                  <MaskedText text={flight.memo} label="메모/예약번호:" />
                </div>
              )}
            </article>
          );
        })}
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
