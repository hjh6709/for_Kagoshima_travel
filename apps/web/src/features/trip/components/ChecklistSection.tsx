import { CheckCircle2, PlusCircle, Trash2 } from "lucide-react";
import { checklistCategories } from "../../../shared/travelOptions";
import type { ChecklistCategory } from "../tripViewState";
import type { TripPageProps } from "../tripPageTypes";

type ChecklistSectionProps = Pick<
  TripPageProps,
  | "addChecklistItem"
  | "allChecklist"
  | "checkedItems"
  | "completedCount"
  | "groupedChecklist"
  | "hiddenChecklistIDs"
  | "isChecklistEditing"
  | "newChecklistCategory"
  | "newChecklistTitle"
  | "removeChecklistItem"
  | "restoreDefaultChecklistItems"
  | "setIsChecklistEditing"
  | "setNewChecklistCategory"
  | "setNewChecklistTitle"
  | "toggleCheck"
>;

// 일정 탭의 체크리스트 영역만 담당한다. 추가/삭제/완료 상태 변경은 상위 핸들러를 호출한다.
export function ChecklistSection({
  addChecklistItem,
  allChecklist,
  checkedItems,
  completedCount,
  groupedChecklist,
  hiddenChecklistIDs,
  isChecklistEditing,
  newChecklistCategory,
  newChecklistTitle,
  removeChecklistItem,
  restoreDefaultChecklistItems,
  setIsChecklistEditing,
  setNewChecklistCategory,
  setNewChecklistTitle,
  toggleCheck,
}: ChecklistSectionProps) {
  return (
    <section className="section-block">
      <div className="section-title-row">
        <h2>준비 체크리스트</h2>
        <button
          className="secondary-button compact-button"
          onClick={() => setIsChecklistEditing(!isChecklistEditing)}
          type="button"
        >
          {isChecklistEditing ? "완료" : "편집"}
        </button>
      </div>
      <div className="check-summary">
        <p className="muted">
          {allChecklist.length}개 중 {completedCount}개 완료
        </p>
        <span>{Math.round((completedCount / Math.max(allChecklist.length, 1)) * 100)}%</span>
      </div>
      {isChecklistEditing && hiddenChecklistIDs.length > 0 && (
        <button className="secondary-button restore-button" onClick={restoreDefaultChecklistItems} type="button">
          기본 체크리스트 {hiddenChecklistIDs.length}개 복원
        </button>
      )}

      <form className="check-add-form" onSubmit={addChecklistItem}>
        <label>
          구분
          <select
            value={newChecklistCategory}
            onChange={(event) => setNewChecklistCategory(event.target.value as ChecklistCategory)}
          >
            {checklistCategories.map(([category, label]) => (
              <option key={category} value={category}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          추가할 항목
          <input
            placeholder="예: 여권 사본 챙기기"
            type="text"
            value={newChecklistTitle}
            onChange={(event) => setNewChecklistTitle(event.target.value)}
          />
        </label>
        <button className="primary-button" type="submit">
          <PlusCircle size={18} />
          추가
        </button>
      </form>

      <div className="check-groups">
        {groupedChecklist.map((group) => (
          <section className="check-group" key={group.category}>
            <h3>{group.label}</h3>
            <div className="card-stack">
              {group.items.map((item) => (
                <div className="check-row" key={item.id}>
                  <button className="check-toggle" onClick={() => toggleCheck(item.id)} type="button">
                    <CheckCircle2 className={checkedItems[item.id] ? "checked" : ""} size={24} />
                    <span>{item.title}</span>
                  </button>
                  {isChecklistEditing && (
                    <button
                      aria-label={`${item.title} 삭제`}
                      className="icon-button"
                      onClick={() => removeChecklistItem(item)}
                      type="button"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
