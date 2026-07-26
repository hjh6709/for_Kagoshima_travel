import { useState } from "react";
import { Copy, Phone } from "lucide-react";
import { ChinaPaymentHelper } from "../../../manage/components/ChinaPaymentHelper";
import type { TripPageProps } from "../../tripPageTypes";
import { ProfileShortcutButton } from "../cards/ProfileShortcutButton";
import { QuickTravelHelper } from "../helpers/QuickTravelHelper";

// 긴급/여행 정보 탭 렌더링만 담당한다. 주소 복사는 상위 핸들러를 호출한다.
export function ConciergeTab({
  accommodation,
  addressCopied,
  copyAccommodationAddress,
  emergencies,
  trip,
  onNavigateToMyPage,
}: TripPageProps) {
  const [subTab, setSubTab] = useState<"emergency" | "tools">("emergency");

  return (
    <section className="screen">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ margin: 0 }}>긴급과 여행 정보</h1>
        <ProfileShortcutButton onClick={onNavigateToMyPage} />
      </div>

      {/* 2단 세그먼트 메뉴 바 */}
      <div className="segment-control-wrapper" style={{ display: "flex", gap: "2px", background: "var(--c-green-light)", borderRadius: "8px", padding: "3px", marginBottom: "20px" }}>
        <button
          onClick={() => setSubTab("emergency")}
          className={`segment-btn ${subTab === "emergency" ? "active" : ""}`}
          style={{
            flex: 1,
            padding: "10px 0",
            border: 0,
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: 700,
            cursor: "pointer",
            background: subTab === "emergency" ? "rgba(16, 185, 129, 0.15)" : "transparent",
            color: subTab === "emergency" ? "var(--c-green)" : "var(--c-muted)",
            transition: "all 0.2s"
          }}
          type="button"
        >
          🚨 긴급 연락 & 숙소
        </button>
        <button
          onClick={() => setSubTab("tools")}
          className={`segment-btn ${subTab === "tools" ? "active" : ""}`}
          style={{
            flex: 1,
            padding: "10px 0",
            border: 0,
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: 700,
            cursor: "pointer",
            background: subTab === "tools" ? "rgba(16, 185, 129, 0.15)" : "transparent",
            color: subTab === "tools" ? "var(--c-green)" : "var(--c-muted)",
            transition: "all 0.2s"
          }}
          type="button"
        >
          🛠️ 간편 환율 & 생존 회화
        </button>
      </div>

      {subTab === "emergency" ? (
        <>
          <section className="section-block compact">
            <h2>긴급 연락</h2>
            <div className="card-stack">
              {emergencies.map((item) => (
                <article className="emergency-card" key={item.id}>
                  <h2>{item.title}</h2>
                  <p>{item.description}</p>
                  {item.phone ? (
                    <a className="primary-button" href={`tel:${item.phone}`}>
                      <Phone size={18} />
                      전화하기
                    </a>
                  ) : (
                    item.id !== "emergency-passport" && (
                      <span className="pill subtle" style={{ display: "inline-flex", marginTop: "8px", alignSelf: "flex-start" }}>
                        연락처 미등록
                      </span>
                    )
                  )}
                </article>
              ))}
            </div>
          </section>

          <section className="section-block">
            <h2>숙소 정보</h2>
            <article className="info-card">
              <h2>숙소</h2>
              <p>{accommodation.name}</p>
              <p className="muted">{accommodation.address}</p>
              <p>
                체크인 {accommodation.checkIn} · 체크아웃 {accommodation.checkOut}
              </p>
              {accommodation.memo && <p className="muted">{accommodation.memo}</p>}
              <button className="secondary-button" onClick={copyAccommodationAddress}>
                <Copy size={18} />
                {addressCopied ? "복사됨" : "주소 복사"}
              </button>
            </article>
          </section>
        </>
      ) : (
        <>
          {trip.destinationCountry === "CN" && <ChinaPaymentHelper />}

          <section className="section-block">
            <h2>여행 편의 도구</h2>
            {/* 다국어 환율 & 서바이벌 회화 퀵 위젯 탑재 */}
            <QuickTravelHelper destinationCountry={trip.destinationCountry || "JP"} />
          </section>
        </>
      )}
    </section>
  );
}
