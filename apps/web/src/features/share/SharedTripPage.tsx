import { ExternalLink, Plane, Compass, CalendarRange, Users, Maximize2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { SharedTripResponse } from "../../api/trips";
import { formatKoreanDate, formatShortDate } from "../../shared/date";
import { sortSharedFlights } from "../../shared/sort";
import { getFlightDirectionLabel, getScheduleTypeLabel } from "../../shared/travelOptions";

type SharedTripPageProps = {
  error: string;
  warning: string;
  loading: boolean;
  sharedTrip: SharedTripResponse | null;
};

export function SharedTripPage({ error, warning, loading, sharedTrip }: SharedTripPageProps) {
  const [zoomedPlace, setZoomedPlace] = useState<{ name: string; address?: string } | null>(null);

  useEffect(() => {
    // 검색엔진 크롤링 색인 방지 (noindex, nofollow) 메타 태그 동적 삽입
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);

    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  const placeByID = useMemo(() => {
    if (!sharedTrip) return new Map<string, SharedTripResponse["places"][number]>();
    return new Map(sharedTrip.places.map((place) => [place.id, place]));
  }, [sharedTrip]);
  const sharedFlights = useMemo(() => sortSharedFlights(sharedTrip?.flights ?? []), [sharedTrip]);

  return (
    <>
      <main className="app-shell">
        <section className="phone-frame shared-frame">
          <div className="content">
            <section className="screen shared-screen">
              <article className="hero-card shared-hero-card premium-hero-card">
                <div className="shared-brand-row">
                  <div className="brand-badge-circle">
                    <Compass className="brand-logo-icon" size={20} />
                  </div>
                <span className="pill subtle">동반자 공유 여정</span>
              </div>

              {loading && (
                <div className="shared-loading-wrapper" style={{ display: "grid", placeItems: "center", textAlign: "center", gap: "10px", padding: "12px 0" }}>
                  <Compass className="spin-slow" size={32} />
                  <h1>여정을 불러오는 중입니다</h1>
                  <p className="muted">잠시만 기다려 주세요.</p>
                </div>
              )}

              {!loading && error && (
                <div className="shared-error-wrapper">
                  <h1>공유 링크 확인 실패</h1>
                  <p className="form-error">{error}</p>
                </div>
              )}

              {!loading && !error && sharedTrip && (
                <div className="shared-success-content">
                  {warning && (
                    <div className="offline-warning-banner" style={{ marginBottom: "16px", padding: "12px", background: "rgba(220, 100, 0, 0.1)", border: "1px solid rgba(220, 100, 0, 0.3)", borderRadius: "8px", color: "#ffa500", fontSize: "13px", fontWeight: 700, lineHeight: 1.4 }}>
                      ⚠️ {warning}
                    </div>
                  )}
                  <h1 className="trip-title-premium" style={{ marginBottom: "12px" }}>{sharedTrip.trip.title}</h1>
                  <div className="trip-meta-premium-row" style={{ display: "grid", gap: "8px" }}>
                    <div className="trip-meta-item" style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--c-text)", fontSize: "14px", fontWeight: 700 }}>
                      <CalendarRange size={16} className="muted" />
                      <span>
                        {formatKoreanDate(sharedTrip.trip.startDate)} ~ {formatKoreanDate(sharedTrip.trip.endDate)}
                      </span>
                    </div>
                    {sharedTrip.trip.travelers.length > 0 && (
                      <div className="trip-meta-item" style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--c-muted)", fontSize: "13px", fontWeight: 700 }}>
                        <Users size={16} />
                        <span>동행인: {sharedTrip.trip.travelers.join(", ")}</span>
                      </div>
                    )}
                  </div>
                </div>
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
                    <div className="card-stack timeline-stack">
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
                        <article className="flight-card-premium" key={flight.id} style={{ marginBottom: "16px" }}>
                          <div className="flight-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <span className="pill" style={{ background: "var(--c-green-light)", color: "var(--c-green)" }}>
                              {getFlightDirectionLabel(flight.direction)}
                            </span>
                            <span className="muted" style={{ fontSize: "13px", fontWeight: 700 }}>
                              {flight.flightNumber || "편명 미정"}
                            </span>
                          </div>

                          <div className="ticket-airport-row">
                            <div className="airport-box" style={{ textAlign: "left" }}>
                              <span className="airport-code">{flight.departureAirport || "DEP"}</span>
                              <span className="airport-name">출발 공항</span>
                            </div>
                            <div className="ticket-plane-divider">
                              <div className="plane-line"></div>
                              <div className="plane-icon-wrapper">
                                <Plane size={16} />
                              </div>
                            </div>
                            <div className="airport-box" style={{ textAlign: "right" }}>
                              <span className="airport-code">{flight.arrivalAirport || "ARR"}</span>
                              <span className="airport-name">도착 공항</span>
                            </div>
                          </div>

                          <div className="ticket-time-detail">
                            <div>
                              <span style={{ display: "block", fontSize: "11px", color: "var(--c-muted)", marginBottom: "2px" }}>출발 시각</span>
                              <span>{formatShortDate(flight.departureDate)} {flight.departureTime}</span>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <span style={{ display: "block", fontSize: "11px", color: "var(--c-muted)", marginBottom: "2px" }}>도착 시각</span>
                              <span>
                                {flight.arrivalDate ? formatShortDate(flight.arrivalDate) : "날짜 미정"}{" "}
                                {flight.arrivalTime || "시간 미정"}
                              </span>
                            </div>
                          </div>

                          <div className="ticket-bottom-info">
                            <span>{flight.airline || "항공사 미정"}</span>
                            <span>{flight.label}</span>
                          </div>
                          
                          {flight.memo && (
                            <div style={{ borderTop: "1px dashed rgba(28, 50, 37, 0.08)", paddingTop: "8px", marginTop: "4px", fontSize: "12px", color: "var(--c-muted)" }}>
                              메모: {flight.memo}
                            </div>
                          )}
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
                          
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
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

                            {/* 
                              중국(CN) 여행의 경우, 구글 지도 차단 현상을 우회할 수 있도록 
                              고덕지도(Amap) 및 장소 주소 복사 버튼을 제공합니다.
                            */}
                            {sharedTrip.trip.destinationCountry === "CN" && (
                              <>
                                {place.longitude && place.latitude && (
                                  <a
                                    className="secondary-button compact-button"
                                    href={`https://uri.amap.com/marker?position=${place.longitude},${place.latitude}&name=${encodeURIComponent(place.name)}`}
                                    rel="noreferrer"
                                    target="_blank"
                                    style={{
                                      background: "rgba(251, 191, 36, 0.15)",
                                      border: "1px solid rgba(251, 191, 36, 0.3)",
                                      color: "#fbbf24",
                                    }}
                                  >
                                    🗺️ 고덕지도
                                  </a>
                                )}
                                <button
                                  className="secondary-button compact-button"
                                  onClick={() => {
                                    const copyString = `${place.name}${place.address ? ` (${place.address})` : ""}`;
                                    navigator.clipboard.writeText(copyString);
                                    alert("장소 이름과 주소가 복사되었습니다! 고덕지도 앱 등에 붙여넣어 검색하세요.");
                                  }}
                                  type="button"
                                >
                                  📋 정보 복사
                                </button>
                                <button
                                  className="secondary-button compact-button"
                                  onClick={() => setZoomedPlace({ name: place.name, address: place.address })}
                                  type="button"
                                  title="큰 글씨로 보기"
                                >
                                  <Maximize2 size={14} /> 큰 글씨
                                </button>
                              </>
                            )}
                          </div>
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

                <section className="section-block shared-checklist-section">
                  <div className="section-title-row">
                    <div>
                      <h2>준비물 체크리스트</h2>
                      <p className="section-caption">여행을 떠나기 전 챙겨야 할 필수 준비물 목록입니다. (읽기 전용)</p>
                    </div>
                    <span className="pill subtle">
                      {sharedTrip.checklist ? sharedTrip.checklist.length : 0}개
                    </span>
                  </div>

                  {(!sharedTrip.checklist || sharedTrip.checklist.length === 0) ? (
                    <article className="empty-state-card list-card">
                      <p className="muted">등록된 준비물이 없습니다.</p>
                    </article>
                  ) : (
                    <div className="card-stack">
                      {sharedTrip.checklist.map((item) => (
                        <article className={`checklist-item-row ${item.isCompleted ? "completed" : ""}`} style={{ pointerEvents: 'none' }} key={item.id}>
                          <label className="checkbox-container read-only-checkbox">
                            <input
                              type="checkbox"
                              checked={item.isCompleted}
                              readOnly
                              disabled
                            />
                            <span className="checkmark"></span>
                            <span className="item-title">{item.title}</span>
                          </label>
                          <span className="pill subtle category-pill">{item.category}</span>
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

    {/* 대화면 텍스트 줌 모달 */}
    {zoomedPlace && (
      <div className="modal-overlay" onClick={() => setZoomedPlace(null)}>
        <div className="zoom-modal-card" onClick={(e) => e.stopPropagation()}>
          <button className="close-btn" onClick={() => setZoomedPlace(null)}>
            <X size={24} />
          </button>
          <div className="zoom-modal-content">
            <span className="zoom-korean">목적지 안내</span>
            <span className="zoom-foreign" style={{ fontSize: "32px", fontWeight: 700 }}>{zoomedPlace.name}</span>
            {zoomedPlace.address && (
              <span className="zoom-pronun" style={{ fontSize: "16px", marginTop: "12px", color: "var(--c-muted)", wordBreak: "break-all" }}>
                주소: {zoomedPlace.address}
              </span>
            )}
          </div>
          <p className="zoom-instruction">현지 직원에게 스마트폰 화면을 직접 보여주세요!</p>
        </div>
      </div>
    )}
    </>
  );
}
