import { MapPin } from "lucide-react";
import { formatKoreanDate } from "../../../shared/date";
import type { Place, ScheduleItem } from "../../../types/travel";

type NextScheduleCardProps = {
  getDisplayDate: (dateStr: string) => string;
  getMapUrl: (place?: Place) => string;
  getPlace: (placeId?: string) => Place | undefined;
  nextSchedule: ScheduleItem;
};

// 홈 화면의 다음 일정 카드만 담당한다. 지도 URL 계산은 상위에서 받은 함수를 사용한다.
export function NextScheduleCard({ getDisplayDate, getMapUrl, getPlace, nextSchedule }: NextScheduleCardProps) {
  return (
    <article className="hero-card">
      <div>
        <span className="pill">다음 일정</span>
        <h2>{nextSchedule.title}</h2>
        <p>
          {formatKoreanDate(getDisplayDate(nextSchedule.date))} {nextSchedule.time}
        </p>
        <p className="muted">{nextSchedule.guideMemo}</p>
      </div>
      <a
        className="primary-button"
        href={getMapUrl(getPlace(nextSchedule.placeId))}
        rel="noopener noreferrer"
        target="_blank"
      >
        <MapPin size={20} />
        지도 열기
      </a>
    </article>
  );
}
