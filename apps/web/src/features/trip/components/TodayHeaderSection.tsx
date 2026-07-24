import { formatKoreanDate, type TripDates } from "../../../shared/date";
import type { Trip } from "../../../types/travel";

type TodayHeaderSectionProps = {
  travelStatus: { phase: string; label: string; description: string };
  trip: Trip;
  tripDates: TripDates;
};

// 국가 국기 뱃지 헬퍼
function getCountryBadge(countryCode?: string): string {
  const code = (countryCode || "").toUpperCase().trim();
  if (code === "JP" || code === "JAPAN" || code === "일본") return "🇯🇵 일본";
  if (code === "CN" || code === "CHINA" || code === "중국") return "🇨🇳 중국";
  if (code === "KR" || code === "KOREA" || code === "한국") return "🇰🇷 한국";
  if (code === "US" || code === "USA" || code === "미국") return "🇺🇸 미국";
  return "✈️ 해외여행";
}

// D-Day 라벨 헬퍼
function getDDayLabel(startDateStr: string, endDateStr: string): { text: string; className: string } {
  if (!startDateStr) return { text: "일정 미정", className: "dday-muted" };
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const start = new Date(startDateStr);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(endDateStr || startDateStr);
  end.setHours(0, 0, 0, 0);
  
  const diffTimeStart = start.getTime() - today.getTime();
  const diffDaysStart = Math.ceil(diffTimeStart / (1000 * 60 * 60 * 24));
  
  if (diffDaysStart > 0) {
    return { text: `D-${diffDaysStart}`, className: "dday-upcoming" };
  } else if (today.getTime() >= start.getTime() && today.getTime() <= end.getTime()) {
    return { text: "여행 중 ✈️", className: "dday-active" };
  } else {
    return { text: "추억 기록 📸", className: "dday-past" };
  }
}

// 여행 홈 상단의 제목, 기간, 현재 여행 상태를 더 풍부하게 표시한다.
export function TodayHeaderSection({ travelStatus, trip, tripDates }: TodayHeaderSectionProps) {
  const countryBadge = getCountryBadge(trip.destinationCountry);
  const dday = getDDayLabel(tripDates.startDate, tripDates.endDate);

  return (
    <div className="trip-header">
      <div className="trip-header-meta">
        <span className="eyebrow">공유 여행 일정</span>
        <div className="trip-badges">
          <span className="badge-item country-badge">{countryBadge}</span>
          <span className={`badge-item dday-badge ${dday.className}`}>{dday.text}</span>
        </div>
      </div>
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
