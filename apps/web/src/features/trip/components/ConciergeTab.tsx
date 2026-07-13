import { Copy, ExternalLink, Languages, Phone } from "lucide-react";
import { translationLinks } from "../../../shared/travelOptions";
import type { TripPageProps } from "../tripPageTypes";

// 긴급/여행 정보 탭 렌더링만 담당한다. 주소 복사는 상위 핸들러를 호출한다.
export function ConciergeTab({
  accommodation,
  addressCopied,
  copyAccommodationAddress,
  emergencies,
  phrases,
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
              {item.phone && (
                <a className="primary-button" href={`tel:${item.phone}`}>
                  <Phone size={18} />
                  전화하기
                </a>
              )}
            </article>
          ))}
        </div>
      </section>

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
        <article className="info-card">
          <h2>일본어 문장</h2>
          {phrases.map((phrase) => (
            <p key={phrase.id}>
              <strong>{phrase.situation}</strong>
              <br />
              {phrase.korean} · {phrase.japanese}
            </p>
          ))}
          <div className="translation-actions" aria-label="번역 서비스 바로가기">
            {translationLinks.map((link) => (
              <a
                className="secondary-button translation-button"
                href={link.href}
                key={link.id}
                rel="noopener noreferrer"
                target="_blank"
              >
                <Languages size={18} />
                <span>{link.label}</span>
                <ExternalLink className="trailing-icon" size={16} />
              </a>
            ))}
          </div>
        </article>
      </section>
    </section>
  );
}
