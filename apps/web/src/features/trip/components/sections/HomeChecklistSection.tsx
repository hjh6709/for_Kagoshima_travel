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
          {scheduleSummary && <p className="section-caption">{scheduleSummary}</p>}
        </div>
        <button
          aria-label={`준비물 전체 보기, ${homeChecklistTotalCount}개 중 ${homeChecklistCompletedCount}개 완료`}
          className="today-check-count"
          onClick={onOpenChecklist}
          type="button"
        >
          {homeChecklistCompletedCount} / {homeChecklistTotalCount}
        </button>
      </div>

      <div className="card-stack today-check-group">
        {homeChecklistItems.length > 0 ? (
          homeChecklistItems.map((item) => {
            const isChecked = Boolean(checkedItems[item.id]);
            const content = (
              <>
                <CheckCircle2 className={isChecked ? "checked" : ""} size={23} />
                <span>{item.title}</span>
              </>
            );
            const className = `check-row${isChecked ? " completed" : ""}`;
            return isReadOnly ? (
              <div className={className} key={item.id}>
                <span className="check-toggle">{content}</span>
                <span className="visually-hidden">{isChecked ? "완료" : "미완료"}</span>
              </div>
            ) : (
              <div className={className} key={item.id}>
                <button
                  aria-pressed={isChecked}
                  className="check-toggle"
                  onClick={() => toggleCheck(item.id)}
                  type="button"
                >
                  {content}
                </button>
              </div>
            );
          })
        ) : (
          <p className="muted today-check-empty">지금 확인할 준비 항목이 없습니다.</p>
        )}
      </div>
    </section>
  );
}
