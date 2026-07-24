import { useState } from "react";
import { Navigation, Copy, Maximize2, Train, AlertTriangle, X } from "lucide-react";
import { placeCategoryLabels } from "../../../shared/travelOptions";
import type { TripPageProps } from "../tripPageTypes";
import { getDirectionUrl, getPlaceMarkerUrl } from "../../../utils/mapLinks";

export function MapTab({ selectedSchedules, getPlace, places, trip }: TripPageProps) {
  const [subTab, setSubTab] = useState<"timeline" | "all">("timeline");
  
  // 택시 제시용 큰 글씨 모달
  const [phraseModal, setPhraseModal] = useState<{ open: boolean; title: string; address: string }>({
    open: false,
    title: "",
    address: "",
  });

  // 개별 장소 카드 내의 길찾기 메뉴 노출 여부
  const [activeDirections, setActiveDirections] = useState<Record<string, boolean>>({});

  const isChina = trip.destinationCountry === "CN";

  // 클립보드 복사 헬퍼
  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    alert("주소가 클립보드에 복사되었습니다.");
  };

  const toggleDirections = (placeId: string) => {
    setActiveDirections((prev) => ({
      ...prev,
      [placeId]: !prev[placeId],
    }));
  };

  // 스케줄 목록에서 장소가 등록된 일정만 추출하여 타임라인 순으로 구성
  const timelineItems = selectedSchedules
    .map((schedule) => {
      const p = getPlace(schedule.placeId);
      return {
        schedule,
        place: p,
      };
    })
    .filter((item) => item.place !== undefined);

  return (
    <section className="screen">
      <h1>지도와 추천 장소</h1>

      {/* 2단 세그먼트 제어바 */}
      <div className="map-segment-control">
        <button
          className={subTab === "timeline" ? "active" : ""}
          onClick={() => setSubTab("timeline")}
          type="button"
        >
          📅 오늘 동선
        </button>
        <button
          className={subTab === "all" ? "active" : ""}
          onClick={() => setSubTab("all")}
          type="button"
        >
          📍 전체 장소 ({places.length})
        </button>
      </div>

      {subTab === "timeline" ? (
        <div className="timeline-wrapper">
          {timelineItems.length === 0 ? (
            <article className="empty-state-card list-card" style={{ textAlign: "center", padding: "40px 20px" }}>
              <p className="muted">오늘 일정에 등록된 장소가 없습니다.</p>
              <p className="muted" style={{ fontSize: "12px", marginTop: "4px" }}>일정 탭에서 장소를 연결해 보세요.</p>
            </article>
          ) : (
            timelineItems.map((item, idx) => {
              const place = item.place!;
              const schedule = item.schedule;
              const hasCoords = place.latitude !== undefined && place.longitude !== undefined;
              const showMenu = activeDirections[place.id];

              return (
                <div key={schedule.id}>
                  {/* 장소 카드 */}
                  <article className="place-card" style={{ background: "var(--bg-secondary)", borderRadius: "16px", border: "1px solid var(--border-color)", padding: "20px", display: "grid", gap: "12px" }}>
                    <div>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "8px" }}>
                        <span className="pill subtle">{placeCategoryLabels[place.category]}</span>
                        {schedule.time && <span className="pill subtle" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>{schedule.time}</span>}
                      </div>

                      <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#ffffff", marginBottom: "4px" }}>
                        {place.name}
                      </h2>

                      {/* 중국어 명칭 (존재 시) */}
                      {place.chineseName && (
                        <p style={{ color: "#10b981", fontSize: "14px", fontWeight: 700, margin: "2px 0 6px" }}>
                          {place.chineseName}
                        </p>
                      )}

                      <p className="muted" style={{ fontSize: "13px", lineHeight: 1.4 }}>{place.recommendedReason}</p>

                      {/* 주소 및 지하철역 안내 */}
                      <div style={{ marginTop: "10px", fontSize: "12px", display: "grid", gap: "4px" }}>
                        {place.address && (
                          <div style={{ display: "flex", gap: "4px", color: "var(--c-muted)" }}>
                            <span style={{ color: "var(--c-green)" }}>주소:</span>
                            <span>{place.address}</span>
                          </div>
                        )}
                        {place.chineseAddress && (
                          <div style={{ display: "flex", gap: "4px", color: "#10b981" }}>
                            <span>중국 주소:</span>
                            <span>{place.chineseAddress}</span>
                          </div>
                        )}
                        {place.subwayExit && (
                          <div style={{ display: "flex", gap: "4px", color: "#60a5fa", alignItems: "center" }}>
                            <Train size={12} />
                            <span>{place.subwayExit}</span>
                          </div>
                        )}
                      </div>

                      {/* 경고 알림 (좌표가 없는 경우) */}
                      {!hasCoords && (
                        <div style={{ display: "flex", gap: "6px", alignItems: "center", background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.2)", borderRadius: "8px", padding: "8px 12px", marginTop: "12px" }}>
                          <AlertTriangle size={14} style={{ color: "var(--c-orange)" }} />
                          <span style={{ fontSize: "11px", color: "#fde047" }}>정확한 위치 미등록 상태 (기본 이름 검색 연동)</span>
                        </div>
                      )}
                    </div>

                    <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "12px", marginTop: "4px" }}>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {/* 길찾기 활성화 토글 */}
                        <button
                          className="secondary-button compact-button"
                          onClick={() => toggleDirections(place.id)}
                          type="button"
                          style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                        >
                          <Navigation size={14} />
                          길찾기
                        </button>

                        {/* 복사 및 기사님 카드 */}
                        {(place.address || place.chineseAddress) && (
                          <button
                            className="secondary-button compact-button"
                            onClick={() => handleCopyAddress(place.chineseAddress || place.address || "")}
                            type="button"
                            style={{ padding: "0 10px" }}
                            title="주소 복사"
                          >
                            <Copy size={14} />
                          </button>
                        )}

                        {isChina && (place.chineseName || place.name) && (
                          <button
                            className="secondary-button compact-button"
                            onClick={() => setPhraseModal({
                              open: true,
                              title: place.chineseName || place.name,
                              address: place.chineseAddress || place.address || "주소 정보 없음",
                            })}
                            type="button"
                            style={{ padding: "0 10px", color: "#10b981", borderColor: "rgba(16, 185, 129, 0.3)" }}
                            title="기사님께 크게 보여주기"
                          >
                            <Maximize2 size={14} />
                          </button>
                        )}
                      </div>

                      {/* 길찾기 수단 및 지도 제공자 선택 메뉴 */}
                      {showMenu && (
                        <div style={{ marginTop: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)", padding: "10px", display: "grid", gap: "8px" }}>
                          <span style={{ fontSize: "11px", color: "var(--c-muted)", fontWeight: 700 }}>지도 앱 및 이동 수단 선택</span>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                            {/* 고덕지도 (중국 메인) */}
                            {isChina && (
                              <>
                                <a
                                  href={getDirectionUrl("amap", place, "walking")}
                                  className="primary-button compact-button"
                                  style={{ fontSize: "11px", textAlign: "center", textDecoration: "none", background: "rgba(16, 185, 129, 0.2)", color: "#10b981", borderColor: "#10b981" }}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  🚶 고덕 도보
                                </a>
                                <a
                                  href={getDirectionUrl("amap", place, "driving")}
                                  className="primary-button compact-button"
                                  style={{ fontSize: "11px", textAlign: "center", textDecoration: "none", background: "rgba(16, 185, 129, 0.2)", color: "#10b981", borderColor: "#10b981" }}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  🚗 고덕 차
                                </a>
                              </>
                            )}

                            {/* 구글 지도 (공통/일본 메인) */}
                            <a
                              href={getDirectionUrl("google", place, "walking")}
                              className="secondary-button compact-button"
                              style={{ fontSize: "11px", textAlign: "center", textDecoration: "none" }}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              🚶 구글 도보
                            </a>
                            <a
                              href={getDirectionUrl("google", place, "driving")}
                              className="secondary-button compact-button"
                              style={{ fontSize: "11px", textAlign: "center", textDecoration: "none" }}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              🚗 구글 차
                            </a>

                            {/* 애플 지도 */}
                            <a
                              href={getDirectionUrl("apple", place, "walking")}
                              className="secondary-button compact-button"
                              style={{ fontSize: "11px", textAlign: "center", textDecoration: "none" }}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              🚶 애플 도보
                            </a>
                            <a
                              href={getPlaceMarkerUrl(isChina ? "amap" : "google", place)}
                              className="secondary-button compact-button"
                              style={{ fontSize: "11px", textAlign: "center", textDecoration: "none" }}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              📍 지도 위치만
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </article>

                  {/* 장소 간 연결선 (마지막 카드가 아닐 때 렌더링) */}
                  {idx < timelineItems.length - 1 && (
                    <div className="timeline-connector">
                      <div className="timeline-line"></div>
                      {schedule.transportMemo && (
                        <div className="timeline-arrow">
                          <span>{schedule.transportMemo}</span>
                        </div>
                      )}
                      <div className="timeline-line"></div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* 전체 장소 목록 뷰 */
        <div className="card-stack">
          {places.length === 0 ? (
            <article className="empty-state-card list-card" style={{ textAlign: "center", padding: "40px 20px" }}>
              <p className="muted">등록된 장소가 없습니다.</p>
              <p className="muted" style={{ fontSize: "12px", marginTop: "4px" }}>편집 화면에서 추천 장소를 생성해 보세요.</p>
            </article>
          ) : (
            places.map((place) => {
              const hasCoords = place.latitude !== undefined && place.longitude !== undefined;
              const showMenu = activeDirections[place.id];

              return (
                <article className="place-card" key={place.id} style={{ background: "var(--bg-secondary)", borderRadius: "16px", border: "1px solid var(--border-color)", padding: "20px", display: "grid", gap: "12px" }}>
                  <div>
                    <span className="pill subtle" style={{ marginBottom: "8px", display: "inline-block" }}>{placeCategoryLabels[place.category]}</span>
                    <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#ffffff", marginBottom: "4px" }}>{place.name}</h2>
                    {place.chineseName && (
                      <p style={{ color: "#10b981", fontSize: "14px", fontWeight: 700, margin: "2px 0 6px" }}>{place.chineseName}</p>
                    )}
                    <p className="muted" style={{ fontSize: "13px", lineHeight: 1.4 }}>{place.recommendedReason}</p>

                    <div style={{ marginTop: "10px", fontSize: "12px", display: "grid", gap: "4px" }}>
                      {place.address && (
                        <div style={{ display: "flex", gap: "4px", color: "var(--c-muted)" }}>
                          <span style={{ color: "var(--c-green)" }}>주소:</span>
                          <span>{place.address}</span>
                        </div>
                      )}
                      {place.chineseAddress && (
                        <div style={{ display: "flex", gap: "4px", color: "#10b981" }}>
                          <span>중국 주소:</span>
                          <span>{place.chineseAddress}</span>
                        </div>
                      )}
                      {place.subwayExit && (
                        <div style={{ display: "flex", gap: "4px", color: "#60a5fa", alignItems: "center" }}>
                          <Train size={12} />
                          <span>{place.subwayExit}</span>
                        </div>
                      )}
                    </div>

                    {!hasCoords && (
                      <div style={{ display: "flex", gap: "6px", alignItems: "center", background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.2)", borderRadius: "8px", padding: "8px 12px", marginTop: "12px" }}>
                        <AlertTriangle size={14} style={{ color: "var(--c-orange)" }} />
                        <span style={{ fontSize: "11px", color: "#fde047" }}>정확한 위치 미등록 상태 (이름 검색 연동)</span>
                      </div>
                    )}
                  </div>

                  <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "12px", marginTop: "4px" }}>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <button
                        className="secondary-button compact-button"
                        onClick={() => toggleDirections(place.id)}
                        type="button"
                        style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                      >
                        <Navigation size={14} />
                        길찾기
                      </button>

                      {(place.address || place.chineseAddress) && (
                        <button
                          className="secondary-button compact-button"
                          onClick={() => handleCopyAddress(place.chineseAddress || place.address || "")}
                          type="button"
                          style={{ padding: "0 10px" }}
                          title="주소 복사"
                        >
                          <Copy size={14} />
                        </button>
                      )}

                      {isChina && (place.chineseName || place.name) && (
                        <button
                          className="secondary-button compact-button"
                          onClick={() => setPhraseModal({
                            open: true,
                            title: place.chineseName || place.name,
                            address: place.chineseAddress || place.address || "주소 정보 없음",
                          })}
                          type="button"
                          style={{ padding: "0 10px", color: "#10b981", borderColor: "rgba(16, 185, 129, 0.3)" }}
                          title="기사님께 크게 보여주기"
                        >
                          <Maximize2 size={14} />
                        </button>
                      )}
                    </div>

                    {showMenu && (
                      <div style={{ marginTop: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)", padding: "10px", display: "grid", gap: "8px" }}>
                        <span style={{ fontSize: "11px", color: "var(--c-muted)", fontWeight: 700 }}>지도 앱 및 이동 수단 선택</span>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                          {isChina && (
                            <>
                              <a
                                href={getDirectionUrl("amap", place, "walking")}
                                className="primary-button compact-button"
                                style={{ fontSize: "11px", textAlign: "center", textDecoration: "none", background: "rgba(16, 185, 129, 0.2)", color: "#10b981", borderColor: "#10b981" }}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                🚶 고덕 도보
                              </a>
                              <a
                                href={getDirectionUrl("amap", place, "driving")}
                                className="primary-button compact-button"
                                style={{ fontSize: "11px", textAlign: "center", textDecoration: "none", background: "rgba(16, 185, 129, 0.2)", color: "#10b981", borderColor: "#10b981" }}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                🚗 고덕 차
                              </a>
                            </>
                          )}
                          <a
                            href={getDirectionUrl("google", place, "walking")}
                            className="secondary-button compact-button"
                            style={{ fontSize: "11px", textAlign: "center", textDecoration: "none" }}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            🚶 구글 도보
                          </a>
                          <a
                            href={getDirectionUrl("google", place, "driving")}
                            className="secondary-button compact-button"
                            style={{ fontSize: "11px", textAlign: "center", textDecoration: "none" }}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            🚗 구글 차
                          </a>
                          <a
                            href={getDirectionUrl("apple", place, "walking")}
                            className="secondary-button compact-button"
                            style={{ fontSize: "11px", textAlign: "center", textDecoration: "none" }}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            🚶 애플 도보
                          </a>
                          <a
                            href={getPlaceMarkerUrl(isChina ? "amap" : "google", place)}
                            className="secondary-button compact-button"
                            style={{ fontSize: "11px", textAlign: "center", textDecoration: "none" }}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            📍 지도 위치만
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}

      {/* 초대형 오버레이 모달 (기사님 크게 보여주기) */}
      {phraseModal.open && (
        <div className="taxi-phrase-overlay">
          <div className="taxi-phrase-header">
            <button
              className="taxi-phrase-close"
              onClick={() => setPhraseModal({ open: false, title: "", address: "" })}
              type="button"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="taxi-phrase-content">
            <p className="taxi-phrase-label">🚕 택시 기사님용 지명</p>
            <h2 className="taxi-phrase-title">{phraseModal.title}</h2>
            
            <p className="taxi-phrase-label" style={{ marginTop: "40px" }}>📍 현지 로컬 주소</p>
            <p className="taxi-phrase-address">{phraseModal.address}</p>
          </div>
        </div>
      )}
    </section>
  );
}
