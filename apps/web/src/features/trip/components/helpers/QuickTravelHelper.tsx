import { ExternalLink, Languages } from "lucide-react";
import { translationLinks } from "../../../../shared/travelOptions";
import { CurrencyExchangeWidget } from "./CurrencyExchangeWidget";
import { SurvivalPhraseWidget } from "./SurvivalPhraseWidget";

interface QuickTravelHelperProps {
  destinationCountry?: string;
}

/**
 * QuickTravelHelper 컴포넌트
 * 환율 계산기(CurrencyExchangeWidget) 및 서바이벌 생존 회화(SurvivalPhraseWidget)를 조합하는 오케스트레이터 컨테이너입니다.
 */
export function QuickTravelHelper({ destinationCountry = "JP" }: QuickTravelHelperProps) {
  const supportsLocalizedTools = destinationCountry === "JP" || destinationCountry === "CN";

  if (!supportsLocalizedTools) {
    const isDomestic = destinationCountry === "KR";
    return (
      <article className="info-card travel-tools-fallback">
        <Languages aria-hidden="true" size={22} />
        <div>
          <h2>{isDomestic ? "국내 여행 편의 도구" : "번역 도구"}</h2>
          <p>
            {isDomestic
              ? "국내 여행에서는 별도의 환율·현지 회화 도구를 표시하지 않습니다."
              : "이 목적지 전용 환율·회화는 준비 중입니다. 아래 번역 서비스를 이용할 수 있습니다."}
          </p>
        </div>
        {!isDomestic && (
          <div className="travel-tools-links">
            {translationLinks.map((link) => (
              <a className="secondary-button compact-button" href={link.href} key={link.id} rel="noreferrer" target="_blank">
                {link.label}
                <ExternalLink aria-hidden="true" size={15} />
              </a>
            ))}
          </div>
        )}
      </article>
    );
  }

  return (
    <div className="quick-helper-container">
      <CurrencyExchangeWidget destinationCountry={destinationCountry} />
      <SurvivalPhraseWidget destinationCountry={destinationCountry} />
    </div>
  );
}
