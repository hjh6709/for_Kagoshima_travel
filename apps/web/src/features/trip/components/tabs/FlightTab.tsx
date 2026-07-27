import { CheckCircle2, Plane } from "lucide-react";
import { MaskedText } from "../../../../shared/components/MaskedText";
import { formatKoreanDate } from "../../../../shared/date";
import type { FlightInfo } from "../../../../types/travel";
import type { TripPageProps } from "../../tripPageTypes";
import { ProfileShortcutButton } from "../cards/ProfileShortcutButton";

type FlightCardProps = {
  flight: FlightInfo;
  getDisplayDate: (date: string) => string;
};

function displayFlightDate(date: string | undefined, getDisplayDate: (date: string) => string) {
  if (!date) return "날짜 미등록";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  return formatKoreanDate(getDisplayDate(date));
}

function FlightJourneyCard({ flight, getDisplayDate }: FlightCardProps) {
  const departureDate = displayFlightDate(flight.date, getDisplayDate);
  const arrivalDate = displayFlightDate(flight.arrivalDate, getDisplayDate);

  return (
    <article className="flight-journey-card">
      <header className="flight-journey-header">
        <span className="pill">{flight.label}</span>
        <div className="flight-identity">
          <h2>{flight.flightNumber || "편명 미등록"}</h2>
          <p>{flight.airline || "항공사 미등록"}</p>
        </div>
      </header>

      <div className="flight-route" aria-label={`${flight.label} 항공 노선`}>
        <div className="flight-route-point">
          <span>출발</span>
          <strong>{flight.departureAirport || "출발 공항 미등록"}</strong>
          <small>{departureDate}</small>
          <b>{flight.time || "시각 미등록"}</b>
        </div>
        <div className="flight-route-line" aria-hidden="true">
          <span />
          <Plane size={17} />
        </div>
        <div className="flight-route-point arrival">
          <span>도착</span>
          <strong>{flight.arrivalAirport || "도착 공항 미등록"}</strong>
          <small>{flight.arrivalDate ? arrivalDate : "도착 날짜 미등록"}</small>
          <b>{flight.arrivalTime || "도착 시각 미등록"}</b>
        </div>
      </div>

      {flight.memo && (
        <details className="flight-memo">
          <summary>예약 메모 확인</summary>
          <div>
            <MaskedText text={flight.memo} />
          </div>
        </details>
      )}
    </article>
  );
}

// 항공 탭은 실제로 등록된 노선 정보와 공항 체크 항목만 표시한다.
export function FlightTab({
  allChecklist,
  checkedItems,
  editTripHref,
  flights,
  getDisplayDate,
  toggleCheck,
  onNavigateToMyPage,
}: TripPageProps) {
  const airportChecklist = allChecklist.filter((item) => item.category === "airport");

  return (
    <section className="screen flight-screen">
      <div className="screen-title-row">
        <div>
          <h1>항공편</h1>
          <p className="flight-screen-intro">공항에서 필요한 노선과 예약 정보만 모았습니다.</p>
        </div>
        <ProfileShortcutButton onClick={onNavigateToMyPage} />
      </div>

      {editTripHref && (
        <div className="flight-manage-row">
          <span>항공편 정보가 실제 예약과 같은지 확인하세요.</span>
          <a className="secondary-button compact-button" href={editTripHref}>
            항공편 관리
          </a>
        </div>
      )}

      {flights.length === 0 ? (
        <article className="empty-state-card list-card flight-empty-state">
          <Plane aria-hidden="true" size={23} />
          <div>
            <strong>등록된 항공편이 없습니다</strong>
            <p>출발·도착 공항과 시각을 등록하면 공항에서 바로 확인할 수 있어요.</p>
            {editTripHref && (
              <a className="primary-button compact-button" href={editTripHref}>
                항공편 추가
              </a>
            )}
          </div>
        </article>
      ) : (
        <div className="flight-journey-list">
          {flights.map((flight) => (
            <FlightJourneyCard flight={flight} getDisplayDate={getDisplayDate} key={flight.id} />
          ))}
        </div>
      )}

      <section className="section-block flight-checklist-section">
        <div className="section-title-row">
          <div>
            <h2>공항에서 확인</h2>
            <p className="section-caption">탑승 전 필요한 항목만 표시합니다.</p>
          </div>
          {airportChecklist.length > 0 && (
            <span className="flight-check-count">
              {airportChecklist.filter((item) => checkedItems[item.id]).length}/{airportChecklist.length}
            </span>
          )}
        </div>

        {airportChecklist.length === 0 ? (
          <p className="flight-checklist-empty">등록된 공항 체크 항목이 없습니다.</p>
        ) : (
          <div className="card-stack">
            {airportChecklist.map((item) => {
              const isChecked = Boolean(checkedItems[item.id]);
              return (
                <div className={`check-row${isChecked ? " completed" : ""}`} key={item.id}>
                  <button
                    aria-pressed={isChecked}
                    className="check-toggle"
                    onClick={() => toggleCheck(item.id)}
                    type="button"
                  >
                    <CheckCircle2 className={isChecked ? "checked" : ""} size={24} />
                    <span>{item.title}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
}
