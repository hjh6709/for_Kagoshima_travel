import { ArrowDown, ArrowUp, Check, Navigation } from "lucide-react";
import { MaskedText } from "../../../../shared/components/MaskedText";
import { scheduleTypeLabels } from "../../../../shared/travelOptions";
import type { Place, ScheduleItem } from "../../../../types/travel";
import { scheduleTypeIcons } from "../../scheduleTypeIcons";

type ScheduleCardProps = {
  index: number;
  isCompleted: boolean;
  isReadOnly?: boolean;
  isReordering?: boolean;
  isLast: boolean;
  item: ScheduleItem;
  onMove: (scheduleID: string, direction: "up" | "down") => void;
  onOpenPlace?: (place: Place) => void;
  onToggleComplete: (scheduleID: string) => void;
  place?: Place;
  showGuideMemo?: boolean;
};

// 일정 카드 한 개의 렌더링만 담당한다. 완료·순서 변경은 상위 핸들러를 호출한다.
export function ScheduleCard({
  index,
  isCompleted,
  isReadOnly,
  isReordering = false,
  isLast,
  item,
  onMove,
  onOpenPlace,
  onToggleComplete,
  place,
  showGuideMemo = false,
}: ScheduleCardProps) {
  const TypeIcon = scheduleTypeIcons[item.type];

  return (
    <article className={`schedule-card ${isCompleted ? "completed" : ""}`}>
      <div className="schedule-content">
        <div className="schedule-card-meta">
          <span className="time">{item.time}</span>
          <span className="pill subtle schedule-type-pill">
            <TypeIcon aria-hidden="true" size={14} />
            {scheduleTypeLabels[item.type]}
          </span>
          {isCompleted && <span className="pill completed-pill">완료</span>}
          {!isReadOnly && (
            <button
              aria-label={`${item.title} ${isCompleted ? "완료 취소" : "완료"}`}
              className={`schedule-check${isCompleted ? " checked" : ""}`}
              onClick={() => onToggleComplete(item.id)}
              type="button"
            >
              <Check aria-hidden="true" size={20} />
            </button>
          )}
        </div>

        <div className="schedule-headline">
          <div className="schedule-headline-copy">
            <h2>{item.title}</h2>
            {place && <p className="schedule-place">{place.name}</p>}
          </div>
        </div>

        {(item.transportMemo || item.reservationMemo || item.guideMemo) && (
          <div className="schedule-note-list">
            {item.transportMemo && (
              <p className={`schedule-detail${item.type === "move" ? " unlabeled" : ""}`}>
                {item.type !== "move" && <strong>이동</strong>}
                <span>{item.transportMemo}</span>
              </p>
            )}
            {item.reservationMemo && (
              <p className="schedule-detail">
                <strong>예약</strong>
                <MaskedText text={item.reservationMemo} />
              </p>
            )}
            {item.guideMemo && (
              showGuideMemo ? (
                <p className="schedule-detail muted">
                  <strong>안내</strong>
                  <span>{item.guideMemo}</span>
                </p>
              ) : (
                <div className="muted schedule-guide-memo">
                  <MaskedText text={item.guideMemo} label="안내:" />
                </div>
              )
            )}
          </div>
        )}

        {!isReadOnly && isReordering && (
          <div className="schedule-move-actions" aria-label={`${item.title} 순서 변경`}>
            <button
              aria-label={`${item.title} 위로 이동`}
              className="icon-button neutral"
              disabled={index === 0}
              onClick={() => onMove(item.id, "up")}
              type="button"
            >
              <ArrowUp size={18} />
            </button>
            <button
              aria-label={`${item.title} 아래로 이동`}
              className="icon-button neutral"
              disabled={isLast}
              onClick={() => onMove(item.id, "down")}
              type="button"
            >
              <ArrowDown size={18} />
            </button>
          </div>
        )}

        {place && onOpenPlace && (
          <div className="schedule-directions">
            <button
              aria-label={`${place.name} 길찾기`}
              className="schedule-directions-chip"
              onClick={() => onOpenPlace(place)}
              type="button"
            >
              <Navigation aria-hidden="true" size={15} />
              길찾기
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
