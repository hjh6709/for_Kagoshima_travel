import { useState } from "react";
import { AlertTriangle, Check, Copy, Maximize2, Train, X } from "lucide-react";
import { MapDirectionsChoice } from "../../../../shared/components/MapDirectionsChoice";
import { placeCategoryLabels } from "../../../../shared/travelOptions";
import type { TripPageProps } from "../../tripPageTypes";
import { ProfileShortcutButton } from "../cards/ProfileShortcutButton";

export function MapTab({ selectedSchedules, getPlace, places, trip, onNavigateToMyPage }: TripPageProps) {
  const [subTab, setSubTab] = useState<"timeline" | "all">("timeline");
  const [copiedPlaceID, setCopiedPlaceID] = useState("");
  
  // 택시 제시용 큰 글씨 모달
  const [phraseModal, setPhraseModal] = useState<{ open: boolean; title: string; address: string }>({
    open: false,
    title: "",
    address: "",
  });

  const isChina = trip.destinationCountry === "CN";

  // 클립보드 복사 헬퍼
  const handleCopyAddress = async (placeID: string, address: string) => {
    if (!navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopiedPlaceID(placeID);
      window.setTimeout(() => setCopiedPlaceID(""), 2000);
    } catch {
      setCopiedPlaceID("");
    }
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ margin: 0 }}>지도와 추천 장소</h1>
        <ProfileShortcutButton onClick={onNavigateToMyPage} />
      </div>

      {/* 2단 세그먼트 제어바 */}
      <div className="map-segment-control">
        <button
          aria-pressed={subTab === "timeline"}
          className={subTab === "timeline" ? "active" : ""}
          onClick={() => setSubTab("timeline")}
          type="button"
        >
          📅 오늘 동선
        </button>
        <button
          aria-pressed={subTab === "all"}
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

              return (
                <div key={schedule.id}>
                  {/* 장소 카드 */}
                  <article className="place-card" style={{ background: "var(--c-surface)", borderRadius: "16px", border: "1px solid rgba(15, 23, 42, 0.08)", boxShadow: "0 4px 16px rgba(15, 23, 42, 0.04)", padding: "20px", display: "grid", gap: "12px" }}>
                    <div>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "8px" }}>
                        <span className="pill subtle">{placeCategoryLabels[place.category]}</span>
                        {schedule.time && <span className="pill subtle" style={{ background: "var(--c-green-light)", color: "var(--c-green)" }}>{schedule.time}</span>}
                      </div>

                      <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--c-text)", marginBottom: "4px" }}>
                        {place.name}
                      </h2>

                      {/* 중국어 명칭 (존재 시) */}
                      {place.chineseName && (
                        <p style={{ color: "var(--c-green)", fontSize: "14px", fontWeight: 700, margin: "2px 0 6px" }}>
                          {place.chineseName}
                        </p>
                      )}

                      <p className="muted" style={{ fontSize: "14px", lineHeight: 1.4 }}>{place.recommendedReason}</p>

                      {/* 주소 및 지하철역 안내 */}
                      <div style={{ marginTop: "10px", fontSize: "12px", display: "grid", gap: "4px" }}>
                        {place.address && (
                          <div style={{ display: "flex", gap: "4px", color: "var(--c-muted)" }}>
                            <span style={{ color: "var(--c-green)" }}>주소:</span>
                            <span>{place.address}</span>
                          </div>
                        )}
                        {place.chineseAddress && (
                          <div style={{ display: "flex", gap: "4px", color: "var(--c-green)" }}>
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
                          <span style={{ fontSize: "12px", color: "var(--c-danger)" }}>정확한 위치 미등록 상태 (기본 이름 검색 연동)</span>
                        </div>
                      )}
                    </div>

                    <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "12px", marginTop: "4px" }}>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <MapDirectionsChoice destinationCountry={trip.destinationCountry} place={place} />

                        {/* 복사 및 기사님 카드 */}
                        {(place.address || place.chineseAddress) && (
                          <button
                            className="secondary-button compact-button"
                            onClick={() => void handleCopyAddress(place.id, place.chineseAddress || place.address || "")}
                            type="button"
                            style={{ padding: "0 10px" }}
                            title={copiedPlaceID === place.id ? "주소 복사 완료" : "주소 복사"}
                            aria-label={copiedPlaceID === place.id ? `${place.name} 주소 복사 완료` : `${place.name} 주소 복사`}
                          >
                            {copiedPlaceID === place.id ? <Check size={14} /> : <Copy size={14} />}
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
                            style={{ padding: "0 10px", color: "var(--c-green)", borderColor: "var(--border-color)" }}
                            title="기사님께 크게 보여주기"
                          >
                            <Maximize2 size={14} />
                          </button>
                        )}
                      </div>

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

              return (
                <article className="place-card" key={place.id} style={{ background: "var(--c-surface)", borderRadius: "16px", border: "1px solid rgba(15, 23, 42, 0.08)", boxShadow: "0 4px 16px rgba(15, 23, 42, 0.04)", padding: "20px", display: "grid", gap: "12px" }}>
                  <div>
                    <span className="pill subtle" style={{ marginBottom: "8px", display: "inline-block" }}>{placeCategoryLabels[place.category]}</span>
                    <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--c-text)", marginBottom: "4px" }}>{place.name}</h2>
                    {place.chineseName && (
                      <p style={{ color: "var(--c-green)", fontSize: "14px", fontWeight: 700, margin: "2px 0 6px" }}>{place.chineseName}</p>
                    )}
                    <p className="muted" style={{ fontSize: "14px", lineHeight: 1.4 }}>{place.recommendedReason}</p>

                    <div style={{ marginTop: "10px", fontSize: "12px", display: "grid", gap: "4px" }}>
                      {place.address && (
                        <div style={{ display: "flex", gap: "4px", color: "var(--c-muted)" }}>
                          <span style={{ color: "var(--c-green)" }}>주소:</span>
                          <span>{place.address}</span>
                        </div>
                      )}
                      {place.chineseAddress && (
                        <div style={{ display: "flex", gap: "4px", color: "var(--c-green)" }}>
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
                        <span style={{ fontSize: "12px", color: "var(--c-danger)" }}>정확한 위치 미등록 상태 (이름 검색 연동)</span>
                      </div>
                    )}
                  </div>

                  <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "12px", marginTop: "4px" }}>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <MapDirectionsChoice destinationCountry={trip.destinationCountry} place={place} />

                      {(place.address || place.chineseAddress) && (
                        <button
                          className="secondary-button compact-button"
                          onClick={() => void handleCopyAddress(place.id, place.chineseAddress || place.address || "")}
                          type="button"
                          style={{ padding: "0 10px" }}
                          title={copiedPlaceID === place.id ? "주소 복사 완료" : "주소 복사"}
                          aria-label={copiedPlaceID === place.id ? `${place.name} 주소 복사 완료` : `${place.name} 주소 복사`}
                        >
                          {copiedPlaceID === place.id ? <Check size={14} /> : <Copy size={14} />}
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
                          style={{ padding: "0 10px", color: "var(--c-green)", borderColor: "var(--border-color)" }}
                          title="기사님께 크게 보여주기"
                        >
                          <Maximize2 size={14} />
                        </button>
                      )}
                    </div>

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
