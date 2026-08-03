import { CheckCircle2 } from "lucide-react";
import type { TravelPhase } from "../../../../shared/date";
import type { ChecklistItem } from "../../../../types/travel";

type HomeChecklistSectionProps = {
  checkedItems: Record<string, boolean>;
  focusCompletedScheduleCount: number;
  focusScheduleCount: number;
  homeChecklistCompletedCount: number;
  homeChecklistItems: ChecklistItem[];
  homeChecklistTotalCount: number;
  isReadOnly?: boolean;
  onOpenChecklist: () => void;
  toggleCheck: (id: string) => void;
  travelPhase: TravelPhase;
};

// 오늘 확인해야 할 체크리스트 요약과 전체 일정 이동 버튼을 표시한다.
export function HomeChecklistSection({
  checkedItems,
  focusCompletedScheduleCount,
  focusScheduleCount,
  homeChecklistCompletedCount,
  homeChecklistItems,
  homeChecklistTotalCount,
  isReadOnly,
  onOpenChecklist,
  toggleCheck,
  travelPhase,
}: HomeChecklistSectionProps) {
  const percentage =
    homeChecklistTotalCount > 0 ? Math.round((homeChecklistCompletedCount / homeChecklistTotalCount) * 100) : 0;
  const heading =
    travelPhase === "before" ? "출발 전 준비" : travelPhase === "during" ? "오늘 할 일" : "귀가 후 확인";
  const scheduleSummary =
    travelPhase === "before"
      ? `첫날 일정 ${focusScheduleCount}개`
      : travelPhase === "during"
        ? `오늘 일정 ${focusCompletedScheduleCount}/${focusScheduleCount}`
        : null;

  return (
    <section className="section-block">
      <div className="section-title-row">
        <div>
          <h2>{heading}</h2>
          <p className="section-caption">여행 단계에 맞는 항목만 모아 보여드려요.</p>
        </div>
        <button className="secondary-button compact-button" onClick={onOpenChecklist} type="button">
          준비물 전체
        </button>
      </div>

      {(scheduleSummary || homeChecklistTotalCount > 0) && (
        <div className="home-task-summary" aria-label="현재 할 일 요약">
          {scheduleSummary && <span>{scheduleSummary}</span>}
          {homeChecklistTotalCount > 0 && (
            <span>
              확인 항목 {homeChecklistCompletedCount}/{homeChecklistTotalCount}
            </span>
          )}
        </div>
      )}

      {homeChecklistTotalCount > 0 && (
        <div className="progress-container">
          <div
            aria-label={`${heading} 달성률`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={percentage}
            className="progress-track"
            role="progressbar"
          >
            <div className="progress-fill" style={{ transform: `scaleX(${percentage / 100})` }} />
          </div>
          <span className="progress-percentage">{percentage}% 달성</span>
        </div>
      )}

      <div className="home-checklist-card">
        {homeChecklistItems.length > 0 ? (
          homeChecklistItems.map((item) => {
            const content = (
              <>
                <CheckCircle2 className={checkedItems[item.id] ? "checked" : ""} size={22} />
                <span>{item.title}</span>
              </>
            );
            const className = `home-check-item${checkedItems[item.id] ? " completed" : ""}`;
            return isReadOnly ? (
              <div className={className} key={item.id}>
                {content}
                <span className="visually-hidden">{checkedItems[item.id] ? "완료" : "미완료"}</span>
              </div>
            ) : (
              <button
                aria-pressed={Boolean(checkedItems[item.id])}
                className={className}
                key={item.id}
                onClick={() => toggleCheck(item.id)}
                type="button"
              >
                {content}
              </button>
            );
          })
        ) : (
          <p className="muted">지금 확인할 준비 항목이 없습니다.</p>
        )}
      </div>
    </section>
  );
}
