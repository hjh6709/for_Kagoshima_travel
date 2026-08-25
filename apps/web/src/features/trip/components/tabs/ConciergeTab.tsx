import { useState } from "react";
import {
  Building2,
  ChevronRight,
  Coins,
  Copy,
  CreditCard,
  ExternalLink,
  Languages,
  MapPin,
  MapPinned,
  Phone,
} from "lucide-react";
import { ChinaPaymentHelper } from "../../../manage/components";
import { BottomSheet } from "../../../../shared/components/BottomSheet";
import { getCurrencyConfig } from "../../../../shared/currency";
import { getDestinationCountryLabel, translationLinks } from "../../../../shared/travelOptions";
import type { TripPageProps } from "../../tripPageTypes";
import { ProfileShortcutButton } from "../cards/ProfileShortcutButton";
import { CurrencyExchangeWidget } from "../helpers/CurrencyExchangeWidget";
import { SurvivalPhraseWidget } from "../helpers/SurvivalPhraseWidget";

// 긴급/여행 정보 탭 렌더링만 담당한다. 주소 복사는 상위 핸들러를 호출한다.
export function ConciergeTab({
  accommodation,
  addressCopied,
  copyAccommodationAddress,
  emergencies,
  editPlacesHref,
  trip,
  onNavigateToMyPage,
}: TripPageProps) {
  const [subTab, setSubTab] = useState<"emergency" | "tools">("emergency");
  const [openTool, setOpenTool] = useState<"currency" | "phrase" | "payment" | "translation" | null>(null);
  const currency = getCurrencyConfig(trip.destinationCountry);
  const supportsPhrases = trip.destinationCountry === "JP" || trip.destinationCountry === "CN";
  const isChina = trip.destinationCountry === "CN";
  // 국내 여행은 환전·번역 준비가 필요 없다(기존 QuickTravelHelper와 같은 판단).
  const isDomestic = trip.destinationCountry === "KR";

  const tools = [
    currency && {
      id: "currency" as const,
      icon: Coins,
      title: "환율 계산",
      description: `${currency.label} ↔ 원 환산`,
    },
    supportsPhrases
      ? {
          id: "phrase" as const,
          icon: Languages,
          title: "택시 · 식당 문구",
          description: "상황별 현지어 문장",
        }
      : isDomestic
        ? null
        : // 문구 위젯이 없는 목적지라도 번역 서비스로는 이어 줘야 한다.
          // (5단계에서 이 폴백을 빠뜨려 일본·중국 외 목적지가 번역 링크를 잃었다)
          {
            id: "translation" as const,
            icon: Languages,
            title: "번역 도구",
            description: `${getDestinationCountryLabel(trip.destinationCountry)} 번역 서비스 열기`,
          },
    isChina && {
      id: "payment" as const,
      icon: CreditCard,
      title: "현지 결제 안내",
      description: "알리페이 · 위챗페이 준비",
    },
  ].filter(
    (
      tool,
    ): tool is {
      id: "currency" | "phrase" | "payment" | "translation";
      icon: typeof Coins;
      title: string;
      description: string;
    } => Boolean(tool),
  );
  const hasAccommodation = Boolean(
    accommodation.name || accommodation.address || accommodation.phone || accommodation.checkIn || accommodation.checkOut || accommodation.memo,
  );

  return (
    <section className="screen concierge-screen">
      <div className="screen-title-row">
        <div>
          <h1>긴급</h1>
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
              <div className="emergency-contact-grid">
                {emergencies.map((item) => (
                  <article className="emergency-contact" key={item.id}>
                    <span aria-hidden="true" className="emergency-contact-tile">
                      <Phone size={18} />
                    </span>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                    {item.address && (
                      <span className="emergency-contact-address">
                        <MapPin aria-hidden="true" size={14} />
                        {item.address}
                      </span>
                    )}
                    {item.callable &&
                      (item.phone ? (
                        <a
                          aria-label={`${item.title} ${item.phone}로 전화`}
                          className="emergency-call-button"
                          href={`tel:${item.phone}`}
                        >
                          <Phone aria-hidden="true" size={17} />
                          <span>{item.phone}</span>
                        </a>
                      ) : (
                        <span className="emergency-unregistered">전화번호가 등록되지 않았습니다</span>
                      ))}
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
              {editPlacesHref && <a className="text-link" href={editPlacesHref}>숙소 관리</a>}
            </div>

            {!hasAccommodation ? (
              <article className="concierge-empty-state">
                <Building2 aria-hidden="true" size={21} />
                <div>
                  <strong>등록된 숙소가 없습니다</strong>
                  <p>숙소 이름과 주소를 등록하면 현지에서 바로 확인할 수 있어요.</p>
                  {editPlacesHref && <a className="text-link" href={editPlacesHref}>숙소 정보 관리</a>}
                </div>
              </article>
            ) : (
              <article className="accommodation-summary">
                <header>
                  <Building2 aria-hidden="true" size={20} />
                  <div>
                    <h3>{accommodation.name || "숙소 이름 미등록"}</h3>
                    <p className="accommodation-subtitle">
                      체크아웃 {accommodation.checkOut || "미등록"}
                    </p>
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

                {accommodation.address && (
                  <div className="accommodation-driver-address">
                    <span className="accommodation-driver-label">기사님께 보여주는 주소</span>
                    <p>{accommodation.address}</p>
                  </div>
                )}
                {accommodation.phone && <a className="accommodation-phone" href={`tel:${accommodation.phone}`}><Phone aria-hidden="true" size={16} />{accommodation.phone}</a>}
                {accommodation.memo && <p className="accommodation-memo">{accommodation.memo}</p>}
                {accommodation.address && (
                  <button className="secondary-button accommodation-copy" onClick={copyAccommodationAddress} type="button">
                    <Copy aria-hidden="true" size={18} />
                    {addressCopied ? "주소 복사 완료" : "주소 복사"}
                  </button>
                )}
              </article>
            )}
          </section>
        </>
      ) : (
        <section className="section-block">
          <div className="section-title-row">
            <div>
              <h2>현지에서 바로</h2>
              <p className="section-caption">필요한 도구만 눌러서 크게 봅니다.</p>
            </div>
          </div>

          {tools.length === 0 ? (
            <article className="concierge-empty-state">
              <MapPinned aria-hidden="true" size={21} />
              <div>
                <strong>이 목적지에는 준비된 도구가 없습니다</strong>
                <p>환전이나 현지어 준비 없이 일정과 지도에 집중할 수 있습니다.</p>
              </div>
            </article>
          ) : (
            <div className="concierge-tool-list">
              {tools.map((tool) => {
                const ToolIcon = tool.icon;
                return (
                  <button
                    className="concierge-tool-row"
                    key={tool.id}
                    onClick={() => setOpenTool(tool.id)}
                    type="button"
                  >
                    <span aria-hidden="true" className="concierge-tool-tile">
                      <ToolIcon size={18} />
                    </span>
                    <span className="concierge-tool-copy">
                      <strong>{tool.title}</strong>
                      <small>{tool.description}</small>
                    </span>
                    <ChevronRight aria-hidden="true" size={18} />
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {openTool === "currency" && currency && (
        <BottomSheet ariaLabel="환율 계산" onClose={() => setOpenTool(null)}>
          <CurrencyExchangeWidget config={currency} />
        </BottomSheet>
      )}
      {openTool === "phrase" && (
        <BottomSheet ariaLabel="택시 · 식당 문구" onClose={() => setOpenTool(null)}>
          <SurvivalPhraseWidget destinationCountry={trip.destinationCountry} />
        </BottomSheet>
      )}
      {openTool === "translation" && (
        <BottomSheet ariaLabel="번역 도구" onClose={() => setOpenTool(null)}>
          <div className="concierge-translation-sheet">
            <p className="concierge-translation-intro">
              현지어 문장과 발음은 번역 서비스에서 바로 확인할 수 있습니다.
            </p>
            {translationLinks.map((link) => (
              <a
                className="secondary-button place-sheet-action"
                href={link.href}
                key={link.id}
                rel="noreferrer"
                target="_blank"
              >
                {link.label}
                <ExternalLink aria-hidden="true" size={15} />
              </a>
            ))}
          </div>
        </BottomSheet>
      )}
      {openTool === "payment" && (
        <BottomSheet ariaLabel="현지 결제 안내" onClose={() => setOpenTool(null)}>
          <ChinaPaymentHelper />
        </BottomSheet>
      )}
    </section>
  );
}
