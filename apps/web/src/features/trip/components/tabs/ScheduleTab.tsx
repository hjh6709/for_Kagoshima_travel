import { CalendarDays, ListChecks } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { TripPageProps } from "../../tripPageTypes";
import { DatePillList } from "../cards/DatePillList";
import { ProfileShortcutButton } from "../cards/ProfileShortcutButton";
import { ScheduleCard } from "../cards/ScheduleCard";
import { ChecklistSection } from "../sections/ChecklistSection";
import { ScheduleSummarySection } from "../sections/ScheduleSummarySection";

// 일정 탭과 체크리스트 렌더링만 담당한다. 완료/순서/추가/삭제는 상위 핸들러를 호출한다.
export function ScheduleTab({
  addChecklistItem,
  allChecklist,
  checkedItems,
  checklistError,
  checklistSubmitting,
  checklistDateFilter,
  completedScheduleCount,
  completedSchedules,
  dates,
  editSchedulesHref,
  getDisplayDate,
  getPlace,
  hiddenChecklistIDs,
  isDemo,
  isReadOnly,
  isChecklistEditing,
  moveSchedule,
  newChecklistCategory,
  newChecklistDate,
  newChecklistTitle,
  removeChecklistItem,
  restoreDefaultChecklistItems,
  scheduleView,
  selectedDate,
  selectedSchedules,
  setIsChecklistEditing,
  setChecklistDateFilter,
  setNewChecklistCategory,
  setNewChecklistDate,
  setNewChecklistTitle,
  setScheduleView,
  setSelectedDate,
  toggleCheck,
  toggleScheduleComplete,
  trip,
  onNavigateToMyPage,
}: TripPageProps) {
  const dateTabsRef = useRef<HTMLDivElement>(null);
  const [isReordering, setIsReordering] = useState(false);

  useEffect(() => {
    if (scheduleView !== "itinerary" || dates.length <= 4) return;

    const selectedDateButton = dateTabsRef.current?.querySelector<HTMLButtonElement>(
      '[aria-pressed="true"]',
    );
    selectedDateButton?.scrollIntoView?.({ block: "nearest", inline: "center" });
  }, [dates.length, scheduleView, selectedDate]);

  return (
    <section className="screen">
      <div className="screen-title-row">
        <h1>일정</h1>
        <div className="screen-title-actions">
          {editSchedulesHref && dates.length > 0 && (
            <a className="secondary-button compact-button" href={editSchedulesHref}>일정 관리</a>
          )}
          <ProfileShortcutButton onClick={onNavigateToMyPage} />
        </div>
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
            <DatePillList
              dates={dates}
              getDisplayDate={getDisplayDate}
              onSelectDate={setSelectedDate}
              ref={dateTabsRef}
              selectedDate={selectedDate}
            />
          )}
          <div className="schedule-summary-row">
            <ScheduleSummarySection
              completedCount={completedScheduleCount}
              totalCount={selectedSchedules.length}
            />
            {!isReadOnly && selectedSchedules.length > 1 && (
              <button
                aria-pressed={isReordering}
                className="text-link schedule-reorder-toggle"
                onClick={() => setIsReordering((current) => !current)}
                type="button"
              >
                {isReordering ? "순서 편집 완료" : "순서 편집"}
              </button>
            )}
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
                    isReadOnly={isReadOnly}
                    isReordering={isReordering}
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
                <p>{isReadOnly ? "이 날짜에는 공유된 일정이 없습니다." : "여행 관리에서 장소를 일정에 연결하면 여기에 표시됩니다."}</p>
                {editSchedulesHref && (
                  <a className="primary-button compact-button empty-state-action" href={editSchedulesHref}>
                    일정 추가
                  </a>
                )}
              </div>
            </article>
          )}
        </>
      ) : (
        <div className="trip-checklist-view">
          <p className="trip-checklist-context">공통 준비물은 여행 전체에서 한 번만, 당일 할 일은 날짜별로 나누어 확인합니다.</p>
          <ChecklistSection
            addChecklistItem={addChecklistItem}
            allChecklist={allChecklist}
            checkedItems={checkedItems}
            checklistError={checklistError}
            checklistSubmitting={checklistSubmitting}
            checklistDateFilter={checklistDateFilter}
            dates={dates}
            getDisplayDate={getDisplayDate}
            hiddenChecklistIDs={hiddenChecklistIDs}
            isChecklistEditing={isChecklistEditing}
            isReadOnly={isReadOnly}
            newChecklistCategory={newChecklistCategory}
            newChecklistDate={newChecklistDate}
            newChecklistTitle={newChecklistTitle}
            removeChecklistItem={removeChecklistItem}
            restoreDefaultChecklistItems={restoreDefaultChecklistItems}
            setIsChecklistEditing={setIsChecklistEditing}
            setChecklistDateFilter={setChecklistDateFilter}
            setNewChecklistCategory={setNewChecklistCategory}
            setNewChecklistDate={setNewChecklistDate}
            setNewChecklistTitle={setNewChecklistTitle}
            toggleCheck={toggleCheck}
          />
        </div>
      )}
    </section>
  );
}
