import { ArrowDown, ArrowUp, CheckCircle2 } from "lucide-react";
import { MapDirectionsChoice } from "../../../../shared/components/MapDirectionsChoice";
import { MaskedText } from "../../../../shared/components/MaskedText";
import { scheduleTypeLabels } from "../../../../shared/travelOptions";
import type { Place, ScheduleItem } from "../../../../types/travel";

type ScheduleCardProps = {
  index: number;
  isCompleted: boolean;
  isReadOnly?: boolean;
  isLast: boolean;
  item: ScheduleItem;
  destinationCountry?: string;
  onMove: (scheduleID: string, direction: "up" | "down") => void;
  onToggleComplete: (scheduleID: string) => void;
  place?: Place;
  showGuideMemo?: boolean;
};

// 일정 카드 한 개의 렌더링만 담당한다. 완료/순서 변경 동작은 상위 핸들러를 호출한다.
export function ScheduleCard({
  index,
  isCompleted,
  isReadOnly,
  isLast,
  item,
  destinationCountry,
  onMove,
  onToggleComplete,
  place,
  showGuideMemo = false,
}: ScheduleCardProps) {
  return (
    <article className={`schedule-card ${isCompleted ? "completed" : ""}`}>
      <span className="time">{item.time}</span>
      <div className="schedule-content">
        <div className="schedule-meta">
          <span className="pill subtle">{scheduleTypeLabels[item.type]}</span>
          {isCompleted && <span className="pill completed-pill">완료</span>}
          {place && <span className="place-label">{place.name}</span>}
        </div>
        <h2>{item.title}</h2>
        {item.transportMemo && (
          <p className="schedule-detail">
            <strong>이동</strong>
            {item.transportMemo}
          </p>
        )}
        {item.reservationMemo && (
          <p className="schedule-detail">
            <strong style={{ marginRight: "6px" }}>예약</strong>
            <MaskedText text={item.reservationMemo} />
          </p>
        )}
        {item.guideMemo && (
          showGuideMemo ? (
            <p className="schedule-detail muted">
              <strong>안내</strong>
              {item.guideMemo}
            </p>
          ) : (
            <div className="muted" style={{ marginTop: "4px", fontSize: "12px" }}>
              <MaskedText text={item.guideMemo} label="안내:" />
            </div>
          )
        )}
        {!isReadOnly && (
          <div className="schedule-actions">
            <button
              className="secondary-button compact-button"
              onClick={() => onToggleComplete(item.id)}
              type="button"
            >
              <CheckCircle2 size={18} />
              {isCompleted ? "완료 취소" : "완료"}
            </button>
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
          </div>
        )}
        {place && (
          <div style={{ marginTop: "12px" }}>
            <MapDirectionsChoice destinationCountry={destinationCountry} place={place} />
          </div>
        )}
      </div>
    </article>
  );
}
