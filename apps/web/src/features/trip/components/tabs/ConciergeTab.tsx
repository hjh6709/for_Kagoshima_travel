import { useState } from "react";
import { Building2, Copy, MapPin, Phone } from "lucide-react";
import { ChinaPaymentHelper } from "../../../manage/components";
import type { TripPageProps } from "../../tripPageTypes";
import { ProfileShortcutButton } from "../cards/ProfileShortcutButton";
import { QuickTravelHelper } from "../helpers/QuickTravelHelper";

// 긴급/여행 정보 탭 렌더링만 담당한다. 주소 복사는 상위 핸들러를 호출한다.
export function ConciergeTab({
  accommodation,
  addressCopied,
  copyAccommodationAddress,
  emergencies,
  editTripHref,
  trip,
  onNavigateToMyPage,
}: TripPageProps) {
  const [subTab, setSubTab] = useState<"emergency" | "tools">("emergency");
  const hasAccommodation = Boolean(
    accommodation.name || accommodation.address || accommodation.phone || accommodation.checkIn || accommodation.checkOut || accommodation.memo,
  );

  return (
    <section className="screen concierge-screen">
      <div className="screen-title-row">
        <div>
          <h1>여행 도우미</h1>
          <p className="screen-intro">급할 때 필요한 연락처와 현지 도구를 한곳에 모았습니다.</p>
        </div>
        <ProfileShortcutButton onClick={onNavigateToMyPage} />
      </div>

      {/* 2단 세그먼트 메뉴 바 */}
      <div className="segment-control-wrapper">
        <button
          onClick={() => setSubTab("emergency")}
          className={`segment-btn ${subTab === "emergency" ? "active" : ""}`}
          aria-pressed={subTab === "emergency"}
          type="button"
        >
          긴급 · 숙소
        </button>
        <button
          onClick={() => setSubTab("tools")}
          className={`segment-btn ${subTab === "tools" ? "active" : ""}`}
          aria-pressed={subTab === "tools"}
          type="button"
        >
          현지 도구
        </button>
      </div>

      {subTab === "emergency" ? (
        <>
          <section className="section-block compact">
            <div className="section-title-row">
              <div>
                <h2>긴급 연락</h2>
                <p className="section-caption">전화 연결 전 번호와 대상을 한 번 더 확인하세요.</p>
              </div>
              {editTripHref && <a className="text-link" href={editTripHref}>관리</a>}
            </div>

            {emergencies.length === 0 ? (
              <article className="concierge-empty-state">
                <Phone aria-hidden="true" size={21} />
                <div>
                  <strong>등록된 긴급 연락처가 없습니다</strong>
                  <p>대사관, 보험사 등 여행 중 필요한 연락처를 미리 등록하세요.</p>
                </div>
              </article>
            ) : (
              <div className="emergency-contact-list">
                {emergencies.map((item) => (
                  <article className="emergency-contact" key={item.id}>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                      {item.address && <span><MapPin aria-hidden="true" size={14} />{item.address}</span>}
                    </div>
                    {item.phone ? (
                      <a aria-label={`${item.title} ${item.phone}로 전화`} className="emergency-call-button" href={`tel:${item.phone}`}>
                        <Phone aria-hidden="true" size={17} />
                        <span>{item.phone}</span>
                      </a>
                    ) : (
                      <span className="emergency-unregistered">연락처 미등록</span>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="section-block">
            <div className="section-title-row">
              <div>
                <h2>숙소 정보</h2>
                <p className="section-caption">체크인과 이동 중 바로 꺼내 보는 정보입니다.</p>
              </div>
            </div>

            {!hasAccommodation ? (
              <article className="concierge-empty-state">
                <Building2 aria-hidden="true" size={21} />
                <div>
                  <strong>등록된 숙소가 없습니다</strong>
                  <p>숙소 이름과 주소를 등록하면 현지에서 바로 확인할 수 있어요.</p>
                  {editTripHref && <a className="text-link" href={editTripHref}>숙소 정보 관리</a>}
                </div>
              </article>
            ) : (
              <article className="accommodation-summary">
                <header>
                  <Building2 aria-hidden="true" size={20} />
                  <div>
                    <span>숙소</span>
                    <h3>{accommodation.name || "숙소 이름 미등록"}</h3>
                  </div>
                </header>

                <dl>
                  <div>
                    <dt>체크인</dt>
                    <dd>{accommodation.checkIn || "미등록"}</dd>
                  </div>
                  <div>
                    <dt>체크아웃</dt>
                    <dd>{accommodation.checkOut || "미등록"}</dd>
                  </div>
                </dl>

                {accommodation.address && <p className="accommodation-address"><MapPin aria-hidden="true" size={16} />{accommodation.address}</p>}
                {accommodation.phone && <a className="accommodation-phone" href={`tel:${accommodation.phone}`}><Phone aria-hidden="true" size={16} />{accommodation.phone}</a>}
                {accommodation.memo && <p className="accommodation-memo">{accommodation.memo}</p>}
                {accommodation.address && (
                  <button className="secondary-button" onClick={copyAccommodationAddress} type="button">
                    <Copy aria-hidden="true" size={18} />
                    {addressCopied ? "주소 복사 완료" : "주소 복사"}
                  </button>
                )}
              </article>
            )}
          </section>
        </>
      ) : (
        <>
          {trip.destinationCountry === "CN" && <ChinaPaymentHelper />}

          <section className="section-block">
            <div className="section-title-row">
              <div>
                <h2>현지에서 바로 사용</h2>
                <p className="section-caption">목적지에 맞는 통화와 번역 도구를 제공합니다.</p>
              </div>
            </div>
            <QuickTravelHelper destinationCountry={trip.destinationCountry} />
          </section>
        </>
      )}
    </section>
  );
}
