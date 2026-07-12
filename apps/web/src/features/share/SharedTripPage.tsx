import { ExternalLink, Plane } from "lucide-react";
import { useMemo } from "react";
import type { SharedTripResponse } from "../../api/trips";
import { formatKoreanDate, formatShortDate } from "../../shared/date";
import { sortSharedFlights } from "../../shared/sort";
import { getFlightDirectionLabel, getScheduleTypeLabel } from "../../shared/travelOptions";

type SharedTripPageProps = {
  error: string;
  loading: boolean;
  sharedTrip: SharedTripResponse | null;
};

export function SharedTripPage({ error, loading, sharedTrip }: SharedTripPageProps) {
  const placeByID = useMemo(() => {
    if (!sharedTrip) return new Map<string, SharedTripResponse["places"][number]>();
    return new Map(sharedTrip.places.map((place) => [place.id, place]));
  }, [sharedTrip]);
  const sharedFlights = useMemo(() => sortSharedFlights(sharedTrip?.flights ?? []), [sharedTrip]);

  return (
    <main className="app-shell">
      <section className="phone-frame shared-frame">
        <div className="content">
          <section className="screen shared-screen">
            <article className="hero-card shared-hero-card">
              <span className="pill">읽기 전용 공유</span>
              {loading && (
                <>
                  <h1>공유 여행을 불러오는 중</h1>
                  <p className="muted">잠시만 기다려주세요.</p>
                </>
              )}

              {!loading && error && (
                <>
                  <h1>공유 링크를 확인하지 못했습니다</h1>
                  <p className="form-error">{error}</p>
                </>
              )}

              {!loading && !error && sharedTrip && (
                <>
                  <h1>{sharedTrip.trip.title}</h1>
                  <p className="trip-dates">
                    {formatKoreanDate(sharedTrip.trip.startDate)} ~ {formatKoreanDate(sharedTrip.trip.endDate)}
                  </p>
                  <p className="muted">
                    {sharedTrip.trip.travelers.length > 0
                      ? `${sharedTrip.trip.travelers.join(", ")}와 공유된 여행입니다.`
                      : "공유된 여행 정보입니다."}
                  </p>
                </>
              )}
            </article>

            {!loading && !error && sharedTrip && (
              <>
                <section className="section-block">
                  <div className="section-title-row">
                    <div>
                      <h2>일정</h2>
                      <p className="section-caption">공유된 최신 일정입니다.</p>
                    </div>
                    <span className="pill subtle">{sharedTrip.schedules.length}개</span>
                  </div>

                  {sharedTrip.schedules.length === 0 ? (
                    <article className="empty-state-card list-card">
                      <p className="muted">공유된 일정이 없습니다.</p>
                    </article>
                  ) : (
                    <div className="card-stack">
                      {sharedTrip.schedules.map((schedule) => {
                        const place = placeByID.get(schedule.placeId ?? "");
                        return (
                          <article className="schedule-card shared-schedule-card" key={schedule.id}>
                            <div className="schedule-time">
                              <span>{formatShortDate(schedule.date)}</span>
                              <strong>{schedule.time || "시간 미정"}</strong>
                            </div>
                            <div className="schedule-content">
                              <div className="schedule-meta">
                                <span className="pill subtle">{getScheduleTypeLabel(schedule.type)}</span>
                                {place && <span className="place-label">{place.name}</span>}
                              </div>
                              <h2>{schedule.title}</h2>
                              {schedule.transportMemo && <p>{schedule.transportMemo}</p>}
                              {schedule.guideMemo && <p className="muted">{schedule.guideMemo}</p>}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>

                <section className="section-block">
                  <div className="section-title-row">
                    <div>
                      <h2>항공편</h2>
                      <p className="section-caption">공항에서 바로 확인할 수 있는 항공 정보입니다.</p>
                    </div>
                    <span className="pill subtle">{sharedFlights.length}개</span>
                  </div>

                  {sharedFlights.length === 0 ? (
                    <article className="empty-state-card list-card">
                      <p className="muted">공유된 항공편이 없습니다.</p>
                    </article>
                  ) : (
                    <div className="card-stack">
                      {sharedFlights.map((flight) => (
                        <article className="flight-card shared-flight-card" key={flight.id}>
                          <div className="flight-card-header">
                            <span className="pill">{getFlightDirectionLabel(flight.direction)}</span>
                            <Plane size={20} />
                          </div>
                          <h2>
                            {flight.label}
                            {flight.flightNumber ? ` · ${flight.flightNumber}` : ""}
                          </h2>
                          {(flight.airline || flight.memo) && (
                            <p className="muted">{[flight.airline, flight.memo].filter(Boolean).join(" · ")}</p>
                          )}
                          <dl className="flight-details">
                            <div>
                              <dt>출발</dt>
                              <dd>
                                {flight.departureAirport}
                                <br />
                                {formatKoreanDate(flight.departureDate)} {flight.departureTime}
                              </dd>
                            </div>
                            <div>
                              <dt>도착</dt>
                              <dd>
                                {flight.arrivalAirport}
                                <br />
                                {flight.arrivalDate ? formatKoreanDate(flight.arrivalDate) : "날짜 미정"}{" "}
                                {flight.arrivalTime || "시간 미정"}
                              </dd>
                            </div>
                          </dl>
                        </article>
                      ))}
                    </div>
                  )}
                </section>

                <section className="section-block">
                  <div className="section-title-row">
                    <div>
                      <h2>장소</h2>
                      <p className="section-caption">지도 링크가 있으면 외부 지도 앱으로 열 수 있습니다.</p>
                    </div>
                    <span className="pill subtle">{sharedTrip.places.length}개</span>
                  </div>

                  {sharedTrip.places.length === 0 ? (
                    <article className="empty-state-card list-card">
                      <p className="muted">공유된 장소가 없습니다.</p>
                    </article>
                  ) : (
                    <div className="card-stack">
                      {sharedTrip.places.map((place) => (
                        <article className="place-card shared-place-card" key={place.id}>
                          <div>
                            <span className="pill subtle">{place.category}</span>
                            <h2>{place.name}</h2>
                            {place.address && <p className="muted">{place.address}</p>}
                            {place.recommendedReason && <p>{place.recommendedReason}</p>}
                          </div>
                          {place.googleMapsUrl && (
                            <a
                              className="secondary-button compact-button"
                              href={place.googleMapsUrl}
                              rel="noreferrer"
                              target="_blank"
                            >
                              <ExternalLink size={16} />
                              지도 열기
                            </a>
                          )}
                        </article>
                      ))}
                    </div>
                  )}
                </section>

                <section className="section-block">
                  <div className="section-title-row">
                    <div>
                      <h2>추천 루트</h2>
                      <p className="section-caption">공유된 이동 흐름과 참고 메모입니다.</p>
                    </div>
                    <span className="pill subtle">{sharedTrip.routes.length}개</span>
                  </div>

                  {sharedTrip.routes.length === 0 ? (
                    <article className="empty-state-card list-card">
                      <p className="muted">공유된 추천 루트가 없습니다.</p>
                    </article>
                  ) : (
                    <div className="card-stack">
                      {sharedTrip.routes.map((route) => (
                        <article className="info-card shared-route-card" key={route.id}>
                          <h2>{route.title}</h2>
                          {route.description && <p>{route.description}</p>}
                          {route.transportMemo && <p className="muted">{route.transportMemo}</p>}
                          {route.estimatedDuration && <span className="pill subtle">{route.estimatedDuration}</span>}
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
