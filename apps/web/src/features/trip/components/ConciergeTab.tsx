import { Copy, Phone } from "lucide-react";
import type { TripPageProps } from "../tripPageTypes";
import { ChinaPaymentHelper } from "../../manage/components/ChinaPaymentHelper";
import { QuickTravelHelper } from "./QuickTravelHelper";

// 긴급/여행 정보 탭 렌더링만 담당한다. 주소 복사는 상위 핸들러를 호출한다.
export function ConciergeTab({
  accommodation,
  addressCopied,
  copyAccommodationAddress,
  emergencies,
  trip,
}: TripPageProps) {
  return (
    <section className="screen">
      <h1>긴급과 여행 정보</h1>
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

      {trip.destinationCountry === "CN" && <ChinaPaymentHelper />}

      <section className="section-block">
        <h2>여행 정보</h2>
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

        {/* 다국어 환율 & 서바이벌 회화 퀵 위젯 탑재 */}
        <QuickTravelHelper destinationCountry={trip.destinationCountry || "JP"} />
      </section>
    </section>
  );
}
