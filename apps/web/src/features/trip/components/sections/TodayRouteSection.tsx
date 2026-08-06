import type { ScheduleItem } from "../../../../types/travel";

type TodayRouteSectionProps = {
  completedSchedules: Record<string, boolean>;
  onOpenSchedule: () => void;
  schedules: ScheduleItem[];
};

// 오늘 일정을 시간 거터 + 도트 타임라인으로 미리 보여준다. 편집은 일정 탭에서 한다.
export function TodayRouteSection({
  completedSchedules,
  onOpenSchedule,
  schedules,
}: TodayRouteSectionProps) {
  if (schedules.length === 0) return null;

  return (
    <section className="section-block">
      <div className="section-title-row">
        <h2>오늘의 동선</h2>
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
            </li>
          );
        })}
      </ol>
    </section>
  );
}
