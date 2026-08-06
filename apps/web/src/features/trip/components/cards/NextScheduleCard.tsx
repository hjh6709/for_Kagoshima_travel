import { MapDirectionsChoice } from "../../../../shared/components/MapDirectionsChoice";
import { formatKoreanDate, type TravelPhase } from "../../../../shared/date";
import type { Place, ScheduleItem } from "../../../../types/travel";
import { CalendarPlus, Check, Clock, MapPin } from "lucide-react";

type NextScheduleCardProps = {
  destinationCountry?: string;
  editSchedulesHref?: string;
  focusDate: string;
  getDisplayDate: (dateStr: string) => string;
  getPlace: (placeId?: string) => Place | undefined;
  hasSchedules: boolean;
  isReadOnly?: boolean;
  nextSchedule: ScheduleItem | null;
  onOpenSchedule: () => void;
  onToggleComplete: (id: string) => void;
  travelPhase: TravelPhase;
};

// 홈 화면의 다음 일정 카드만 담당한다.
export function NextScheduleCard({
  destinationCountry,
  editSchedulesHref,
  focusDate,
  getDisplayDate,
  getPlace,
  hasSchedules,
  isReadOnly,
  nextSchedule,
  onOpenSchedule,
  onToggleComplete,
  travelPhase,
}: NextScheduleCardProps) {
  if (travelPhase === "after") return null;

  if (!nextSchedule) {
    const isBeforeTrip = travelPhase === "before";
    const emptyTitle = isBeforeTrip
      ? "첫 일정을 준비해 주세요"
      : hasSchedules
        ? "남은 일정이 없습니다"
        : "아직 일정이 없습니다";
    const emptyDescription = isBeforeTrip
      ? isReadOnly
        ? "출발일에 공유된 일정이 아직 없습니다."
        : "일정을 추가하면 출발일의 첫 장소와 길찾기가 여기에 표시됩니다."
      : hasSchedules
        ? "오늘 할 일을 모두 마쳤다면 여유롭게 다음 계획을 확인해 보세요."
        : isReadOnly
          ? "공유된 일정이 아직 없습니다."
          : "일정을 추가하면 오늘 계획과 다음 이동을 바로 확인할 수 있습니다.";

    return (
      <article className="hero-card next-schedule-empty">
        <CalendarPlus aria-hidden="true" size={22} />
        <div>
          <h2>{emptyTitle}</h2>
          <p>{emptyDescription}</p>
        </div>
        {editSchedulesHref && !isReadOnly ? (
          <a className="primary-button compact-button" href={editSchedulesHref}>
            {isBeforeTrip ? "첫 일정 추가" : "일정 추가"}
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
      <span className="next-schedule-kicker">
        <MapPin aria-hidden="true" size={14} />
        {kicker}
      </span>
      <h2>{nextSchedule.title}</h2>
      <p className="next-schedule-time">
        <Clock aria-hidden="true" size={14} />
        {formatKoreanDate(getDisplayDate(nextSchedule.date))} {nextSchedule.time}
      </p>
      {nextSchedule.guideMemo && <p className="next-schedule-memo">{nextSchedule.guideMemo}</p>}
      <div className="next-schedule-actions">
        {place && <MapDirectionsChoice destinationCountry={destinationCountry} place={place} />}
        {!isReadOnly && (
          <button
            aria-label="완료"
            className="next-schedule-complete"
            onClick={() => onToggleComplete(nextSchedule.id)}
            type="button"
          >
            <Check aria-hidden="true" size={20} />
          </button>
        )}
      </div>
    </article>
  );
}
