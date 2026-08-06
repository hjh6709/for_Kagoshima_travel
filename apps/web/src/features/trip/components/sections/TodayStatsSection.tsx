import { CalendarCheck, Coins, Plane } from "lucide-react";
import { getCurrencyConfig } from "../../../../shared/currency";
import { readCachedRate } from "../../../../shared/exchangeRateCache";

type TodayStatsSectionProps = {
  completedScheduleCount: number;
  destinationCountry?: string;
  onOpenCurrency: () => void;
  scheduleCount: number;
  statusLabel: string;
};

// 오늘 탭 상단 스탯 행. 값은 전부 이미 계산된 실제 데이터만 쓴다.
export function TodayStatsSection({
  completedScheduleCount,
  destinationCountry,
  onOpenCurrency,
  scheduleCount,
  statusLabel,
}: TodayStatsSectionProps) {
  const currencyConfig = getCurrencyConfig(destinationCountry);
  const cachedRate = currencyConfig ? readCachedRate(currencyConfig.code) : null;

  return (
    <div className="today-stats" aria-label="오늘 요약">
      <article className="today-stat-card">
        <Plane aria-hidden="true" size={16} />
        <strong>{statusLabel}</strong>
        <span>여행 단계</span>
      </article>

      <article className="today-stat-card">
        <CalendarCheck aria-hidden="true" size={16} />
        <strong>
          {completedScheduleCount}/{scheduleCount}
        </strong>
        <span>오늘 일정</span>
      </article>

      {currencyConfig && (
        <article className="today-stat-card">
          <Coins aria-hidden="true" size={16} />
          {cachedRate ? (
            <>
              <strong>{Math.round(cachedRate.rate).toLocaleString("ko-KR")}원</strong>
              <span>
                {currencyConfig.rateUnit.toLocaleString("ko-KR")}
                {currencyConfig.label}
              </span>
            </>
          ) : (
            <button className="today-stat-action" onClick={onOpenCurrency} type="button">
              환율 보기
            </button>
          )}
        </article>
      )}
    </div>
  );
}
