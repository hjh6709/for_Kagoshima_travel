import { MapDirectionsChoice } from "../../../shared/components/MapDirectionsChoice";
import { formatKoreanDate } from "../../../shared/date";
import type { Place, ScheduleItem } from "../../../types/travel";

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
    <article className="hero-card">
      <div>
        <span className="pill">다음 일정</span>
        <h2>{nextSchedule.title}</h2>
        <p>
          {formatKoreanDate(getDisplayDate(nextSchedule.date))} {nextSchedule.time}
        </p>
        <p className="muted">{nextSchedule.guideMemo}</p>
      </div>
      {place && <MapDirectionsChoice destinationCountry={destinationCountry} place={place} />}
    </article>
  );
}
