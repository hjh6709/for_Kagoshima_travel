import { CheckCircle2, ListChecks, PlusCircle, Trash2 } from "lucide-react";
import { formatShortDate } from "../../../../shared/date";
import { checklistCategories } from "../../../../shared/travelOptions";
import type { TripPageProps } from "../../tripPageTypes";
import type { ChecklistCategory } from "../../tripViewState";

type ChecklistSectionProps = Pick<
  TripPageProps,
  | "addChecklistItem"
  | "allChecklist"
  | "checkedItems"
  | "checklistError"
  | "checklistSubmitting"
  | "checklistDateFilter"
  | "dates"
  | "getDisplayDate"
  | "hiddenChecklistIDs"
  | "isChecklistEditing"
  | "isReadOnly"
  | "newChecklistCategory"
  | "newChecklistDate"
  | "newChecklistTitle"
  | "removeChecklistItem"
  | "restoreDefaultChecklistItems"
  | "setIsChecklistEditing"
  | "setChecklistDateFilter"
  | "setNewChecklistCategory"
  | "setNewChecklistDate"
  | "setNewChecklistTitle"
  | "toggleCheck"
>;

// 일정 탭의 체크리스트 영역만 담당한다. 추가/삭제/완료 상태 변경은 상위 핸들러를 호출한다.
export function ChecklistSection({
  addChecklistItem,
  allChecklist,
  checkedItems,
  checklistError = "",
  checklistSubmitting = false,
  checklistDateFilter,
  dates,
  getDisplayDate,
  hiddenChecklistIDs,
  isChecklistEditing,
  isReadOnly,
  newChecklistCategory,
  newChecklistDate,
  newChecklistTitle,
  removeChecklistItem,
  restoreDefaultChecklistItems,
  setIsChecklistEditing,
  setChecklistDateFilter,
  setNewChecklistCategory,
  setNewChecklistDate,
  setNewChecklistTitle,
  toggleCheck,
}: ChecklistSectionProps) {
  const visibleChecklist = allChecklist.filter((item) => {
    if (checklistDateFilter === "all") return true;
    if (checklistDateFilter === "") return !item.scheduledDate;
    return item.scheduledDate === checklistDateFilter;
  });
  const visibleCompletedCount = visibleChecklist.filter((item) => checkedItems[item.id]).length;
  const visibleGroups = checklistCategories
    .map(([category, label]) => {
      const items = visibleChecklist.filter((item) => item.category === category);
      return {
        category,
        label,
        items,
        completedCount: items.filter((item) => checkedItems[item.id]).length,
      };
    })
    .filter((group) => group.items.length > 0);
  const filterLabel =
    checklistDateFilter === "all"
      ? "전체"
      : checklistDateFilter === ""
        ? "여행 전체"
        : formatShortDate(getDisplayDate(checklistDateFilter));

  function selectChecklistDate(value: string) {
    setChecklistDateFilter(value);
    if (!isReadOnly) setNewChecklistDate(value === "all" ? "" : value);
  }

  return (
    <section className="section-block">
      <div className="section-title-row">
        <h2>준비 체크리스트</h2>
        {!isReadOnly && (
          <button
            className="secondary-button compact-button"
            onClick={() => setIsChecklistEditing(!isChecklistEditing)}
            type="button"
          >
            {isChecklistEditing ? "완료" : "편집"}
          </button>
        )}
      </div>
      <div className="check-summary">
        <p className="muted">
          {filterLabel} · {visibleChecklist.length}개 중 {visibleCompletedCount}개 완료
        </p>
        <span>{Math.round((visibleCompletedCount / Math.max(visibleChecklist.length, 1)) * 100)}%</span>
      </div>
      <div className="checklist-date-filter" aria-label="체크리스트 표시 날짜" role="group">
        <button
          aria-pressed={checklistDateFilter === "all"}
          className={checklistDateFilter === "all" ? "active" : ""}
          onClick={() => selectChecklistDate("all")}
          type="button"
        >
          전체
        </button>
        <button
          aria-pressed={checklistDateFilter === ""}
          className={checklistDateFilter === "" ? "active" : ""}
          onClick={() => selectChecklistDate("")}
          type="button"
        >
          여행 전체
        </button>
        {dates.map((date) => (
          <button
            aria-pressed={checklistDateFilter === date}
            className={checklistDateFilter === date ? "active" : ""}
            key={date}
            onClick={() => selectChecklistDate(date)}
            type="button"
          >
            {formatShortDate(getDisplayDate(date))}
          </button>
        ))}
      </div>
      {isChecklistEditing && hiddenChecklistIDs.length > 0 && (
        <button className="secondary-button restore-button" onClick={restoreDefaultChecklistItems} type="button">
          기본 체크리스트 {hiddenChecklistIDs.length}개 복원
        </button>
      )}

      {checklistError && (
        <p className="form-error" role="alert">
          {checklistError}
        </p>
      )}

      {isChecklistEditing && (
        <form className="check-add-form" onSubmit={addChecklistItem}>
          <label>
            확인 시점
            <select value={newChecklistDate} onChange={(event) => setNewChecklistDate(event.target.value)}>
              <option value="">여행 전체</option>
              {dates.map((date) => (
                <option key={date} value={date}>{formatShortDate(getDisplayDate(date))}</option>
              ))}
            </select>
          </label>
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
              maxLength={120}
              type="text"
              value={newChecklistTitle}
              onChange={(event) => setNewChecklistTitle(event.target.value)}
            />
          </label>
          <button
            className="primary-button"
            disabled={checklistSubmitting || !newChecklistTitle.trim()}
            type="submit"
          >
            <PlusCircle aria-hidden="true" size={18} />
            {checklistSubmitting ? "추가 중" : newChecklistDate ? "이 날짜에 추가" : "여행 전체에 추가"}
          </button>
        </form>
      )}

      <div className="check-groups">
        {visibleGroups.length > 0 ? (
          visibleGroups.map((group) => (
            <section className="check-group" key={group.category}>
              <div className="check-group-header">
                <h3>{group.label}</h3>
                <span className="check-group-count">
                  {group.completedCount} / {group.items.length}
                </span>
              </div>
              <div className="card-stack">
                {group.items.map((item) => (
                  <div className={`check-row${checkedItems[item.id] ? " completed" : ""}`} key={item.id}>
                    {isReadOnly ? (
                      <div className="check-toggle">
                        <CheckCircle2 className={checkedItems[item.id] ? "checked" : ""} size={24} />
                        <span className="check-item-copy">
                          <span>{item.title}</span>
                          {checklistDateFilter === "all" && (
                            <small>{item.scheduledDate ? formatShortDate(getDisplayDate(item.scheduledDate)) : "여행 전체"}</small>
                          )}
                        </span>
                        <span className="visually-hidden">{checkedItems[item.id] ? "완료" : "미완료"}</span>
                      </div>
                    ) : (
                      <button
                        aria-pressed={Boolean(checkedItems[item.id])}
                        className="check-toggle"
                        onClick={() => toggleCheck(item.id)}
                        type="button"
                      >
                        <CheckCircle2 className={checkedItems[item.id] ? "checked" : ""} size={24} />
                        <span className="check-item-copy">
                          <span>{item.title}</span>
                          {checklistDateFilter === "all" && (
                            <small>{item.scheduledDate ? formatShortDate(getDisplayDate(item.scheduledDate)) : "여행 전체"}</small>
                          )}
                        </span>
                      </button>
                    )}
                    {isChecklistEditing && (
                      <button
                        aria-label={`${item.title} 삭제`}
                        className="icon-button"
                        onClick={() => removeChecklistItem(item)}
                        type="button"
                      >
                        <Trash2 aria-hidden="true" size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))
        ) : (
          <article className="empty-state-card list-card checklist-empty-state">
            <ListChecks aria-hidden="true" size={22} />
            <div>
              <strong>준비 항목이 없습니다</strong>
              <p>
                {isReadOnly
                  ? `${filterLabel}에 공유된 준비 항목이 없습니다.`
                  : `${filterLabel}에 필요한 항목을 편집에서 추가해 보세요.`}
              </p>
            </div>
          </article>
        )}
      </div>
    </section>
  );
}
