import { ChevronLeft } from "lucide-react";
import { formatKoreanDate, type TripDates } from "../../../../shared/date";
import { getDestinationCountryLabel } from "../../../../shared/travelOptions";
import type { Trip } from "../../../../types/travel";
import { ProfileShortcutButton } from "../cards/ProfileShortcutButton";

type TodayHeaderSectionProps = {
  travelStatus: { phase: string; label: string; description: string };
  trip: Trip;
  tripDates: TripDates;
  onNavigateToMyPage?: () => void;
};

// 국가 국기 뱃지 헬퍼
function getCountryBadge(countryCode?: string): string {
  const code = (countryCode || "").toUpperCase().trim();
  if (code === "OTHER") return "🌍 기타 국가·지역";
  if (!/^[A-Z]{2}$/.test(code)) return "🌍 여행";

  const flag = String.fromCodePoint(...[...code].map((character) => 127397 + character.charCodeAt(0)));
  return `${flag} ${getDestinationCountryLabel(code)}`;
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
export function TodayHeaderSection({ travelStatus, trip, tripDates, onNavigateToMyPage }: TodayHeaderSectionProps) {
  const countryBadge = getCountryBadge(trip.destinationCountry);
  const dday = getDDayLabel(tripDates.startDate, tripDates.endDate);

  return (
    <div className="trip-header">
      <div className="trip-header-meta">
        <a href="/manage" className="back-to-list-link" aria-label="여행 목록으로 이동">
          <ChevronLeft size={16} />
          <span>목록으로</span>
        </a>
        <div className="trip-badges">
          <span className="badge-item country-badge">{countryBadge}</span>
          <span className={`badge-item dday-badge ${dday.className}`}>{dday.text}</span>
          <ProfileShortcutButton onClick={onNavigateToMyPage} />
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
