import { CheckCircle2 } from "lucide-react";
import type { ChecklistItem } from "../../../types/travel";
import type { Tab } from "../tripViewState";

type HomeChecklistSectionProps = {
  checkedItems: Record<string, boolean>;
  focusCompletedScheduleCount: number;
  focusScheduleCount: number;
  homeChecklistCompletedCount: number;
  homeChecklistItems: ChecklistItem[];
  setActiveTab: (tab: Tab) => void;
  toggleCheck: (id: string) => void;
};

// 오늘 확인해야 할 체크리스트 요약과 전체 일정 이동 버튼을 표시한다.
export function HomeChecklistSection({
  checkedItems,
  focusCompletedScheduleCount,
  focusScheduleCount,
  homeChecklistCompletedCount,
  homeChecklistItems,
  setActiveTab,
  toggleCheck,
}: HomeChecklistSectionProps) {
  const totalItems = focusScheduleCount + homeChecklistItems.length;
  const completedItems = focusCompletedScheduleCount + homeChecklistCompletedCount;
  const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <section className="section-block">
      <div className="section-title-row">
        <div>
          <h2>오늘 확인</h2>
          <p className="section-caption">
            일정 {focusScheduleCount}개 중 {focusCompletedScheduleCount}개 완료 · 체크 {homeChecklistItems.length}개 중{" "}
            {homeChecklistCompletedCount}개 완료
          </p>
        </div>
        <button className="secondary-button compact-button" onClick={() => setActiveTab("schedule")} type="button">
          전체 보기
        </button>
      </div>

      {totalItems > 0 && (
        <div className="progress-container">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${percentage}%` }} />
          </div>
          <span className="progress-percentage">{percentage}% 달성</span>
        </div>
      )}

      <div className="home-checklist-card">
        {homeChecklistItems.length > 0 ? (
          homeChecklistItems.map((item) => (
            <button className="home-check-item" key={item.id} onClick={() => toggleCheck(item.id)} type="button">
              <CheckCircle2 className={checkedItems[item.id] ? "checked" : ""} size={22} />
              <span>{item.title}</span>
            </button>
          ))
        ) : (
          <p className="muted">오늘 확인할 체크리스트가 없습니다.</p>
        )}
      </div>
    </section>
  );
}
