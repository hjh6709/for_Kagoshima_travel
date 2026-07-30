import { CalendarDays, ListChecks } from "lucide-react";
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
  isDemo,
  isChecklistEditing,
  moveSchedule,
  newChecklistCategory,
  newChecklistTitle,
  removeChecklistItem,
  restoreDefaultChecklistItems,
  scheduleView,
  selectedDate,
  selectedSchedules,
  setIsChecklistEditing,
  setNewChecklistCategory,
  setNewChecklistTitle,
  setScheduleView,
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

      <div className="segment-control-wrapper schedule-view-switch" aria-label="일정 화면 보기 방식">
        <button
          aria-pressed={scheduleView === "itinerary"}
          className={`segment-btn${scheduleView === "itinerary" ? " active" : ""}`}
          onClick={() => setScheduleView("itinerary")}
          type="button"
        >
          <CalendarDays aria-hidden="true" size={17} />
          날짜별 일정
        </button>
        <button
          aria-pressed={scheduleView === "checklist"}
          className={`segment-btn${scheduleView === "checklist" ? " active" : ""}`}
          onClick={() => setScheduleView("checklist")}
          type="button"
        >
          <ListChecks aria-hidden="true" size={17} />
          여행 준비
        </button>
      </div>

      {scheduleView === "itinerary" ? (
        <>
          {dates.length > 0 && (
            <div className="date-tabs">
              {dates.map((date) => (
                <button
                  className={date === selectedDate ? "active" : ""}
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  type="button"
                >
                  {formatShortDate(getDisplayDate(date))}
                </button>
              ))}
            </div>
          )}
          <div className="schedule-summary">
            <span>
              {selectedSchedules.length}개 중 {completedScheduleCount}개 완료
            </span>
            <small>선택한 날짜의 일정만 표시합니다.</small>
          </div>
          {selectedSchedules.length > 0 ? (
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
                    showGuideMemo={isDemo}
                  />
                );
              })}
            </div>
          ) : (
            <article className="empty-state-card list-card schedule-empty-state">
              <CalendarDays aria-hidden="true" size={22} />
              <div>
                <strong>이 날짜에 등록된 일정이 없습니다</strong>
                <p>여행 관리에서 장소를 일정에 연결하면 여기에 표시됩니다.</p>
              </div>
            </article>
          )}
        </>
      ) : (
        <div className="trip-checklist-view">
          <p className="trip-checklist-context">여행 전체에서 한 번만 관리하는 준비 목록입니다. 날짜를 바꿔도 반복되지 않아요.</p>
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
        </div>
      )}
    </section>
  );
}
