import { MapDirectionsChoice } from "../../../../shared/components/MapDirectionsChoice";
import { formatKoreanDate, type TravelPhase } from "../../../../shared/date";
import type { Place, ScheduleItem } from "../../../../types/travel";
import { CalendarPlus, Clock, MapPin } from "lucide-react";

type NextScheduleCardProps = {
  destinationCountry?: string;
  editSchedulesHref?: string;
  focusDate: string;
  getDisplayDate: (dateStr: string) => string;
  getPlace: (placeId?: string) => Place | undefined;
  isReadOnly?: boolean;
  nextSchedule: ScheduleItem | null;
  onOpenSchedule: () => void;
  travelPhase: TravelPhase;
};

// 홈 화면의 다음 일정 카드만 담당한다.
export function NextScheduleCard({
  destinationCountry,
  editSchedulesHref,
  focusDate,
  getDisplayDate,
  getPlace,
  isReadOnly,
  nextSchedule,
  onOpenSchedule,
  travelPhase,
}: NextScheduleCardProps) {
  if (travelPhase === "after") return null;

  if (!nextSchedule) {
    return (
      <article className="hero-card next-schedule-empty">
        <CalendarPlus aria-hidden="true" size={22} />
        <div>
          <h2>{travelPhase === "before" ? "첫 일정을 준비해 주세요" : "남은 일정이 없습니다"}</h2>
          <p>
            {travelPhase === "before"
              ? isReadOnly
                ? "출발일에 공유된 일정이 아직 없습니다."
                : "일정을 추가하면 출발일의 첫 장소와 길찾기가 여기에 표시됩니다."
              : "오늘 할 일을 모두 마쳤다면 여유롭게 다음 계획을 확인해 보세요."}
          </p>
        </div>
        {editSchedulesHref && !isReadOnly ? (
          <a className="primary-button compact-button" href={editSchedulesHref}>
            {travelPhase === "before" ? "첫 일정 추가" : "일정 추가"}
          </a>
        ) : (
          <button className="secondary-button compact-button" onClick={onOpenSchedule} type="button">
            일정 보기
          </button>
        )}
      </article>
    );
  }

  const place = getPlace(nextSchedule.placeId);
  const kicker = nextSchedule.date === focusDate ? "다음 정류장" : travelPhase === "before" ? "첫 일정" : "다음 일정";

  return (
    <article className="hero-card next-schedule-card">
      <div>
        <span className="next-schedule-kicker">
          <MapPin aria-hidden="true" size={14} />
          {kicker}
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
