import { ArrowDown, ArrowUp, CheckCircle2, MapPin } from "lucide-react";
import { scheduleTypeLabels } from "../../../shared/travelOptions";
import type { Place, ScheduleItem } from "../../../types/travel";
import { MaskedText } from "../../../shared/components/MaskedText";

type ScheduleCardProps = {
  index: number;
  isCompleted: boolean;
  isLast: boolean;
  item: ScheduleItem;
  mapUrl: string;
  onMove: (scheduleID: string, direction: "up" | "down") => void;
  onToggleComplete: (scheduleID: string) => void;
  place?: Place;
};

// 일정 카드 한 개의 렌더링만 담당한다. 완료/순서 변경 동작은 상위 핸들러를 호출한다.
export function ScheduleCard({
  index,
  isCompleted,
  isLast,
  item,
  mapUrl,
  onMove,
  onToggleComplete,
  place,
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
          <div className="muted" style={{ marginTop: "4px", fontSize: "12px" }}>
            <MaskedText text={item.guideMemo} label="안내:" />
          </div>
        )}
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
        <a
          className="secondary-button compact-button map-direction-button"
          href={mapUrl}
          rel="noopener noreferrer"
          target="_blank"
          style={{ width: "100%", justifyContent: "center", marginTop: "12px" }}
        >
          <MapPin size={18} />
          현위치 길찾기
        </a>
      </div>
    </article>
  );
}
