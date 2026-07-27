import { ExternalLink, Languages, MapPinned } from "lucide-react";
import { getCurrencyConfig } from "../../../../shared/currency";
import { getDestinationCountryLabel, translationLinks } from "../../../../shared/travelOptions";
import { CurrencyExchangeWidget } from "./CurrencyExchangeWidget";
import { SurvivalPhraseWidget } from "./SurvivalPhraseWidget";

interface QuickTravelHelperProps {
  destinationCountry?: string;
}

/**
 * QuickTravelHelper 컴포넌트
 * 환율 계산기(CurrencyExchangeWidget) 및 서바이벌 생존 회화(SurvivalPhraseWidget)를 조합하는 오케스트레이터 컨테이너입니다.
 */
function TranslationLinks({ destinationCountry }: { destinationCountry?: string }) {
  const destinationLabel = getDestinationCountryLabel(destinationCountry);

  return (
    <article className="info-card travel-tools-fallback">
      <Languages aria-hidden="true" size={22} />
      <div>
        <h2>{destinationLabel} 번역</h2>
        <p>현지어 문장과 발음은 번역 서비스에서 바로 확인할 수 있습니다.</p>
      </div>
      <div className="travel-tools-links">
        {translationLinks.map((link) => (
          <a className="secondary-button compact-button" href={link.href} key={link.id} rel="noreferrer" target="_blank">
            {link.label}
            <ExternalLink aria-hidden="true" size={15} />
          </a>
        ))}
      </div>
    </article>
  );
}

export function QuickTravelHelper({ destinationCountry }: QuickTravelHelperProps) {
  const currency = getCurrencyConfig(destinationCountry);
  const supportsPhrases = destinationCountry === "JP" || destinationCountry === "CN";
  const isDomestic = destinationCountry === "KR";

  if (isDomestic) {
    return (
      <article className="info-card travel-tools-fallback">
        <MapPinned aria-hidden="true" size={22} />
        <div>
          <h2>국내 여행</h2>
          <p>환전이나 현지어 준비 없이 일정과 지도에 집중할 수 있습니다.</p>
        </div>
      </article>
    );
  }

  return (
    <div className="quick-helper-container">
      {currency && <CurrencyExchangeWidget config={currency} />}
      {supportsPhrases ? <SurvivalPhraseWidget destinationCountry={destinationCountry} /> : <TranslationLinks destinationCountry={destinationCountry} />}
    </div>
  );
}
