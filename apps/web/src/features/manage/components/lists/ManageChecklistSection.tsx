import { CalendarDays, ListChecks, Trash2 } from "lucide-react";
import type { ChecklistItemResponse } from "../../../../api/checklist";
import { formatKoreanDate, getTripDateRange } from "../../../../shared/date";
import { checklistCategories, checklistCategoryLabels } from "../../../../shared/travelOptions";

type ManageChecklistSectionProps = {
  checklistItems: ChecklistItemResponse[];
  checklistLoading: boolean;
  checklistError: string;
  newChecklistTitle: string;
  setNewChecklistTitle: (value: string) => void;
  newChecklistCategory: ChecklistItemResponse["category"];
  setNewChecklistCategory: (value: ChecklistItemResponse["category"]) => void;
  newChecklistDate: string;
  setNewChecklistDate: (value: string) => void;
  checklistSubmitting: boolean;
  tripStartDate: string;
  tripEndDate: string;
  handleAddChecklistItem: (event: React.FormEvent) => void;
  handleToggleChecklistItem: (itemID: string, isCompleted: boolean) => void;
  handleDeleteChecklistItem: (itemID: string) => void;
};

export function ManageChecklistSection({
  checklistItems,
  checklistLoading,
  checklistError,
  newChecklistTitle,
  setNewChecklistTitle,
  newChecklistCategory,
  setNewChecklistCategory,
  newChecklistDate,
  setNewChecklistDate,
  checklistSubmitting,
  tripStartDate,
  tripEndDate,
  handleAddChecklistItem,
  handleToggleChecklistItem,
  handleDeleteChecklistItem,
}: ManageChecklistSectionProps) {
  const tripDates = getTripDateRange(tripStartDate, tripEndDate);
  const scopeDates = Array.from(
    new Set([...tripDates, ...checklistItems.flatMap((item) => item.scheduledDate ? [item.scheduledDate] : [])]),
  ).sort();
  const completedCount = checklistItems.filter((item) => item.isCompleted).length;
  const scopeGroups = [
    {
      key: "trip",
      label: "여행 전체",
      description: "날짜와 관계없이 여행에서 한 번만 확인합니다.",
      items: checklistItems.filter((item) => !item.scheduledDate),
    },
    ...scopeDates.map((date) => ({
      key: date,
      label: formatKoreanDate(date),
      description: tripDates.includes(date)
        ? "이 날짜의 오늘 화면과 체크리스트에 표시됩니다."
        : "현재 여행 기간 밖의 항목입니다. 삭제하거나 여행 기간을 확인해 주세요.",
      items: checklistItems.filter((item) => item.scheduledDate === date),
    })),
  ].filter((group) => group.items.length > 0);

  return (
    <section className="section-block manage-checklist-section">
      <div className="section-title-row">
        <div>
          <h2>준비 체크리스트</h2>
          <p className="section-caption">
            공통 준비물은 여행 전체에, 예약 확인이나 당일 할 일은 날짜를 지정해 추가하세요.
          </p>
        </div>
        <span className="pill subtle">
          {checklistItems.length}개 중 {completedCount}개 완료
        </span>
      </div>

      {checklistError && <p className="form-error" role="alert">{checklistError}</p>}

      <form className="check-add-form manage-check-add-form" onSubmit={handleAddChecklistItem}>
        <div className="check-scope-guide">
          {newChecklistDate ? <CalendarDays aria-hidden="true" size={20} /> : <ListChecks aria-hidden="true" size={20} />}
          <div>
            <strong>{newChecklistDate ? formatKoreanDate(newChecklistDate) : "여행 전체"}</strong>
            <span>{newChecklistDate ? "선택한 날짜에만 표시합니다." : "여행에서 한 번만 확인합니다."}</span>
          </div>
        </div>
        <label>
          확인 시점
          <select value={newChecklistDate} onChange={(event) => setNewChecklistDate(event.target.value)}>
            <option value="">여행 전체</option>
            {tripDates.map((date) => (
              <option key={date} value={date}>{formatKoreanDate(date)}</option>
            ))}
          </select>
        </label>
        <label>
          구분
          <select
            value={newChecklistCategory}
            onChange={(event) => setNewChecklistCategory(event.target.value as ChecklistItemResponse["category"])}
          >
            {checklistCategories.map(([category, label]) => (
              <option key={category} value={category}>{label}</option>
            ))}
          </select>
        </label>
        <label>
          추가할 항목
          <input
            maxLength={120}
            placeholder={newChecklistDate ? "예: 디즈니랜드 입장권 확인" : "예: 여권 사본 챙기기"}
            type="text"
            value={newChecklistTitle}
            onChange={(event) => setNewChecklistTitle(event.target.value)}
          />
        </label>
        <button className="primary-button" disabled={checklistSubmitting || !newChecklistTitle.trim()} type="submit">
          {checklistSubmitting ? "추가 중" : newChecklistDate ? "이 날짜에 추가" : "여행 전체에 추가"}
        </button>
      </form>

      {checklistLoading ? (
        <p className="muted text-center">준비물을 불러오는 중...</p>
      ) : checklistItems.length === 0 ? (
        <article className="empty-state-card list-card">
          <p className="muted">등록된 준비물 항목이 없습니다. 위에서 첫 항목을 추가해 보세요.</p>
        </article>
      ) : (
        <div className="checklist-scope-stack">
          {scopeGroups.map((group) => (
            <section className="checklist-scope-section" key={group.key}>
              <div className="checklist-scope-heading">
                <h3>{group.label}</h3>
                <p>{group.description}</p>
              </div>
              <div className="checklist-item-list">
                {group.items.map((item) => (
                  <div className={`checklist-item-row${item.isCompleted ? " completed" : ""}`} key={item.id}>
                    <label className="checkbox-container">
                      <input
                        checked={item.isCompleted}
                        onChange={(event) => handleToggleChecklistItem(item.id, event.target.checked)}
                        type="checkbox"
                      />
                      <span className="checkmark" />
                      <span className="checklist-item-copy">
                        <span className="item-title">{item.title}</span>
                        <span className="checklist-category-label">{checklistCategoryLabels[item.category]}</span>
                      </span>
                    </label>
                    <button
                      aria-label={`${item.title} 삭제`}
                      className="delete-item-button"
                      onClick={() => handleDeleteChecklistItem(item.id)}
                      type="button"
                    >
                      <Trash2 aria-hidden="true" size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
