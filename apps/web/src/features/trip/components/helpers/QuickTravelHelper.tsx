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
  return (
    <div style={{ display: "grid", gap: "16px" }}>
      <CurrencyExchangeWidget destinationCountry={destinationCountry} />
      <SurvivalPhraseWidget destinationCountry={destinationCountry} />
    </div>
  );
}
