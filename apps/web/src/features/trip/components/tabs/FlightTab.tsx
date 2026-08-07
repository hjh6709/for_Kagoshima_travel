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

  const isReturn = flight.direction === "return";

  return (
    <article className="flight-journey-card">
      {/* 편명은 이 카드의 제목이다. 스펙의 2단 헤더 바를 유지하되 제목 요소로 남겨
          화면 읽기 프로그램이 항공편 단위로 건너뛸 수 있게 한다. */}
      <header className={`flight-journey-header${isReturn ? " return" : ""}`}>
        <div className="flight-journey-identity">
          <span className="flight-journey-label">{flight.label}</span>
          <h2>{flight.flightNumber || "편명 미등록"}</h2>
        </div>
        <span className="flight-journey-date">{departureDate}</span>
      </header>

      <div className="flight-route" aria-label={`${flight.label} 항공 노선`}>
        <div className="flight-route-point">
          <span>출발</span>
          <strong>{flight.departureAirport || "출발 공항 미등록"}</strong>
          <b>{flight.time || "시각 미등록"}</b>
        </div>
        <div className="flight-route-line" aria-hidden="true">
          <span />
          <Plane size={18} />
        </div>
        <div className="flight-route-point arrival">
          <span>도착</span>
          <strong>{flight.arrivalAirport || "도착 공항 미등록"}</strong>
          <b>{flight.arrivalTime || "도착 시각 미등록"}</b>
        </div>
      </div>

      <dl className="flight-journey-facts">
        <div>
          <dt>항공사</dt>
          <dd>{flight.airline || "항공사 미등록"}</dd>
        </div>
        <div>
          <dt>도착 날짜</dt>
          <dd>{flight.arrivalDate ? arrivalDate : "도착 날짜 미등록"}</dd>
        </div>
        {flight.memo && (
          <div>
            <dt>예약 정보</dt>
            <dd>
              <MaskedText text={flight.memo} />
            </dd>
          </div>
        )}
      </dl>
    </article>
  );
}

// 항공 탭은 실제로 등록된 노선 정보와 공항 체크 항목만 표시한다.
export function FlightTab({
  allChecklist,
  checkedItems,
  editFlightsHref,
  flights,
  getDisplayDate,
  isReadOnly,
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

      {editFlightsHref && flights.length > 0 && (
        <div className="flight-manage-row">
          <span>항공편 정보가 실제 예약과 같은지 확인하세요.</span>
          <a className="secondary-button compact-button" href={editFlightsHref}>
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
            {editFlightsHref && (
              <a className="primary-button compact-button" href={editFlightsHref}>
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
                  {isReadOnly ? (
                    <div className="check-toggle">
                      <CheckCircle2 className={isChecked ? "checked" : ""} size={24} />
                      <span>{item.title}</span>
                      <span className="visually-hidden">{isChecked ? "완료" : "미완료"}</span>
                    </div>
                  ) : (
                    <button
                      aria-pressed={isChecked}
                      className="check-toggle"
                      onClick={() => toggleCheck(item.id)}
                      type="button"
                    >
                      <CheckCircle2 className={isChecked ? "checked" : ""} size={24} />
                      <span>{item.title}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
}
