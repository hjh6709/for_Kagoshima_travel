import { ChevronLeft, Share2 } from "lucide-react";
import { formatKoreanDate, type TravelPhase, type TripDates } from "../../../../shared/date";
import { getDestinationCountryLabel } from "../../../../shared/travelOptions";
import type { Trip } from "../../../../types/travel";
import { getTodayTabCopy } from "../../todayCopy";
import { ProfileShortcutButton } from "../cards/ProfileShortcutButton";

type TodayHeaderSectionProps = {
  focusDate: string;
  travelStatus: { phase: TravelPhase; label: string; description: string };
  trip: Trip;
  tripDates: TripDates;
  isReadOnly?: boolean;
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

// 여행 홈 상단. 여행 단계와 오늘 날짜를 키커 한 줄로 묶고 타이틀은 "오늘"로 고정한다.
export function TodayHeaderSection({
  focusDate,
  travelStatus,
  trip,
  tripDates,
  isReadOnly,
  onNavigateToMyPage,
}: TodayHeaderSectionProps) {
  const countryBadge = getCountryBadge(trip.destinationCountry);
  const dday = getDDayLabel(tripDates.startDate, tripDates.endDate);
  const copy = getTodayTabCopy(travelStatus.phase);

  return (
    <div className={`trip-header${isReadOnly ? " shared-trip-header" : ""}`}>
      <div className="trip-header-meta">
        <a
          href={isReadOnly ? "/" : "/manage"}
          className="back-to-list-link"
          aria-label={isReadOnly ? "서비스 홈으로 이동" : "여행 목록으로 이동"}
        >
          <ChevronLeft size={16} />
          <span>{isReadOnly ? "홈으로" : "목록으로"}</span>
        </a>
        <div className="trip-badges">
          <span className="badge-item country-badge">{countryBadge}</span>
          <span className={`badge-item dday-badge ${dday.className}`}>{dday.text}</span>
          {isReadOnly && (
            <span className="badge-item shared-view-badge">
              <Share2 aria-hidden="true" size={14} />
              공유 보기
            </span>
          )}
          <ProfileShortcutButton onClick={onNavigateToMyPage} />
        </div>
      </div>
      <p className="today-kicker">
        {travelStatus.label} · {copy.dayLabel} {formatKoreanDate(focusDate)}
      </p>
      <h1>{copy.screenTitle}</h1>
      <p className="today-trip-title">{trip.title}</p>
    </div>
  );
}
