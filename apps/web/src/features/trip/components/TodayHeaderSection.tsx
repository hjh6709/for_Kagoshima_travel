import { formatKoreanDate, type TripDates } from "../../../shared/date";
import type { Trip } from "../../../types/travel";

type TodayHeaderSectionProps = {
  travelStatus: { phase: string; label: string; description: string };
  trip: Trip;
  tripDates: TripDates;
};

// 여행 홈 상단의 제목, 기간, 현재 여행 상태만 표시한다.
export function TodayHeaderSection({ travelStatus, trip, tripDates }: TodayHeaderSectionProps) {
  return (
    <div className="trip-header">
      <span className="eyebrow">공유 여행 일정</span>
      <h1>{trip.title}</h1>
      <p className="trip-dates">
        {formatKoreanDate(tripDates.startDate)} ~ {formatKoreanDate(tripDates.endDate)}
      </p>
      <article className={`status-card ${travelStatus.phase}`}>
        <span>{travelStatus.label}</span>
        <p>{travelStatus.description}</p>
      </article>
    </div>
  );
}
