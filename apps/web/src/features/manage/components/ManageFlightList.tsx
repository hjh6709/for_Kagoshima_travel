import { formatKoreanDate } from "../../../shared/date";
import { getFlightDirectionLabel } from "../../../shared/travelOptions";
import type { TripManagePageProps } from "../manageTypes";

type ManageFlightListProps = Pick<
  TripManagePageProps,
  "ownerDetailDataError" | "ownerDetailDataLoading" | "ownerFlights"
>;

// 서버에 저장되어 공유 화면 항공 탭에 표시되는 항공편 목록만 담당한다.
export function ManageFlightList({ ownerDetailDataError, ownerDetailDataLoading, ownerFlights }: ManageFlightListProps) {
  return (
    <section className="owner-linked-data-section">
      <div className="section-title-row compact-title-row">
        <div>
          <h3>공유되는 항공편</h3>
          <p className="section-caption">공유 화면 항공 정보에 표시되는 항공편입니다.</p>
        </div>
        <span className="pill subtle">{ownerFlights.length}개</span>
      </div>

      {!ownerDetailDataLoading && !ownerDetailDataError && ownerFlights.length === 0 && (
        <article className="empty-state-card list-card">
          <p className="muted">아직 서버에 저장된 항공편이 없습니다.</p>
        </article>
      )}

      {!ownerDetailDataLoading && !ownerDetailDataError && ownerFlights.length > 0 && (
        <div className="card-stack compact-card-stack">
          {ownerFlights.map((flight) => (
            <article className="owner-linked-card" key={flight.id}>
              <div>
                <span className="muted-label">
                  {getFlightDirectionLabel(flight.direction)} · {formatKoreanDate(flight.departureDate)}{" "}
                  {flight.departureTime}
                </span>
                <h2>
                  {flight.label}
                  {flight.flightNumber ? ` · ${flight.flightNumber}` : ""}
                </h2>
                <p className="section-caption">
                  {flight.departureAirport} → {flight.arrivalAirport}
                </p>
              </div>
              {flight.memo && <p className="muted">{flight.memo}</p>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
