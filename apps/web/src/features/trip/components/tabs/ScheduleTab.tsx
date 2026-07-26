import { formatShortDate } from "../../../../shared/date";
import type { TripPageProps } from "../../tripPageTypes";
import { ProfileShortcutButton } from "../cards/ProfileShortcutButton";
import { ScheduleCard } from "../cards/ScheduleCard";
import { ChecklistSection } from "../sections/ChecklistSection";

// 일정 탭과 체크리스트 렌더링만 담당한다. 완료/순서/추가/삭제는 상위 핸들러를 호출한다.
export function ScheduleTab({
  addChecklistItem,
  allChecklist,
  checkedItems,
  completedCount,
  completedScheduleCount,
  completedSchedules,
  dates,
  getDisplayDate,
  getPlace,
  groupedChecklist,
  hiddenChecklistIDs,
  isChecklistEditing,
  moveSchedule,
  newChecklistCategory,
  newChecklistTitle,
  removeChecklistItem,
  restoreDefaultChecklistItems,
  selectedDate,
  selectedSchedules,
  setIsChecklistEditing,
  setNewChecklistCategory,
  setNewChecklistTitle,
  setSelectedDate,
  toggleCheck,
  toggleScheduleComplete,
  trip,
  onNavigateToMyPage,
}: TripPageProps) {
  return (
    <section className="screen">
      <div className="screen-title-row">
        <h1>일정</h1>
        <ProfileShortcutButton onClick={onNavigateToMyPage} />
      </div>
      <div className="date-tabs">
        {dates.map((date) => (
          <button
            className={date === selectedDate ? "active" : ""}
            key={date}
            onClick={() => setSelectedDate(date)}
          >
            {formatShortDate(getDisplayDate(date))}
          </button>
        ))}
      </div>
      <div className="schedule-summary">
        <span>
          {selectedSchedules.length}개 중 {completedScheduleCount}개 완료
        </span>
        <small>일정 순서는 날짜별로 저장됩니다.</small>
      </div>
      <div className="card-stack timeline-stack">
        {selectedSchedules.map((item, index) => {
          const place = getPlace(item.placeId);
          const isCompleted = completedSchedules[item.id];
          return (
            <ScheduleCard
              index={index}
              isCompleted={Boolean(isCompleted)}
              isLast={index === selectedSchedules.length - 1}
              item={item}
              key={item.id}
              destinationCountry={trip.destinationCountry}
              onMove={moveSchedule}
              onToggleComplete={toggleScheduleComplete}
              place={place}
            />
          );
        })}
      </div>

      <ChecklistSection
        addChecklistItem={addChecklistItem}
        allChecklist={allChecklist}
        checkedItems={checkedItems}
        completedCount={completedCount}
        groupedChecklist={groupedChecklist}
        hiddenChecklistIDs={hiddenChecklistIDs}
        isChecklistEditing={isChecklistEditing}
        newChecklistCategory={newChecklistCategory}
        newChecklistTitle={newChecklistTitle}
        removeChecklistItem={removeChecklistItem}
        restoreDefaultChecklistItems={restoreDefaultChecklistItems}
        setIsChecklistEditing={setIsChecklistEditing}
        setNewChecklistCategory={setNewChecklistCategory}
        setNewChecklistTitle={setNewChecklistTitle}
        toggleCheck={toggleCheck}
      />
    </section>
  );
}
