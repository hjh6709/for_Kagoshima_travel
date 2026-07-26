import { MapDirectionsChoice } from "../../../../shared/components/MapDirectionsChoice";
import { formatKoreanDate } from "../../../../shared/date";
import type { Place, ScheduleItem } from "../../../../types/travel";
import { Clock, MapPin } from "lucide-react";

type NextScheduleCardProps = {
  destinationCountry?: string;
  getDisplayDate: (dateStr: string) => string;
  getPlace: (placeId?: string) => Place | undefined;
  nextSchedule: ScheduleItem;
};

// 홈 화면의 다음 일정 카드만 담당한다.
export function NextScheduleCard({ destinationCountry, getDisplayDate, getPlace, nextSchedule }: NextScheduleCardProps) {
  const place = getPlace(nextSchedule.placeId);

  return (
    <article className="hero-card next-schedule-card">
      <div>
        <span className="next-schedule-kicker">
          <MapPin aria-hidden="true" size={14} />
          다음 정류장
        </span>
        <h2>{nextSchedule.title}</h2>
        <p className="next-schedule-time">
          <Clock aria-hidden="true" size={14} />
          {formatKoreanDate(getDisplayDate(nextSchedule.date))} {nextSchedule.time}
        </p>
        <p className="muted">{nextSchedule.guideMemo}</p>
      </div>
      {place && <MapDirectionsChoice destinationCountry={destinationCountry} place={place} />}
    </article>
  );
}
