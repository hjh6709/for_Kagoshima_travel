import type { TravelPhase } from "../../../../shared/date";
import type { ScheduleItem } from "../../../../types/travel";
import { getTodayTabCopy } from "../../todayCopy";

type TodayRouteSectionProps = {
  completedSchedules: Record<string, boolean>;
  onOpenSchedule: () => void;
  schedules: ScheduleItem[];
  travelPhase: TravelPhase;
};

// 기준 날짜의 일정을 시간 거터 + 도트 타임라인으로 미리 보여준다. 편집은 일정 탭에서 한다.
export function TodayRouteSection({
  completedSchedules,
  onOpenSchedule,
  schedules,
  travelPhase,
}: TodayRouteSectionProps) {
  if (schedules.length === 0) return null;

  const copy = getTodayTabCopy(travelPhase);

  return (
    <section className="section-block">
      <div className="section-title-row">
        <h2>{copy.routeHeading}</h2>
        <button className="text-link today-route-link" onClick={onOpenSchedule} type="button">
          전체 일정
        </button>
      </div>
      <ol className="today-route-list">
        {schedules.map((schedule) => {
          const isCompleted = Boolean(completedSchedules[schedule.id]);
          return (
            <li className={`today-route-row${isCompleted ? " completed" : ""}`} key={schedule.id}>
              <span className="today-route-time">{schedule.time}</span>
              <span aria-hidden="true" className="today-route-dot" />
              <span className="today-route-title">{schedule.title}</span>
              {/* 완료 여부를 색과 취소선으로만 알리면 화면 읽기 프로그램이 알 수 없다. */}
              <span className="visually-hidden">{isCompleted ? "완료" : "미완료"}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
