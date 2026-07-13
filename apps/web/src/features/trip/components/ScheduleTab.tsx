import { ArrowDown, ArrowUp, CheckCircle2, MapPin } from "lucide-react";
import { formatShortDate } from "../../../shared/date";
import { scheduleTypeLabels } from "../../../shared/travelOptions";
import { ChecklistSection } from "./ChecklistSection";
import type { TripPageProps } from "../tripPageTypes";

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
  getMapUrl,
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
}: TripPageProps) {
  return (
    <section className="screen">
      <h1>일정</h1>
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
      <div className="card-stack">
        {selectedSchedules.map((item, index) => {
          const place = getPlace(item.placeId);
          const isCompleted = completedSchedules[item.id];
          return (
            <article className={`schedule-card ${isCompleted ? "completed" : ""}`} key={item.id}>
              <span className="time">{item.time}</span>
              <div className="schedule-content">
                <div className="schedule-meta">
                  <span className="pill subtle">{scheduleTypeLabels[item.type]}</span>
                  {isCompleted && <span className="pill completed-pill">완료</span>}
                  {place && <span className="place-label">{place.name}</span>}
                </div>
                <h2>{item.title}</h2>
                {item.transportMemo && (
                  <p className="schedule-detail">
                    <strong>이동</strong>
                    {item.transportMemo}
                  </p>
                )}
                {item.reservationMemo && (
                  <p className="schedule-detail">
                    <strong>예약</strong>
                    {item.reservationMemo}
                  </p>
                )}
                {item.guideMemo && <p className="muted">{item.guideMemo}</p>}
                <div className="schedule-actions">
                  <button
                    className="secondary-button compact-button"
                    onClick={() => toggleScheduleComplete(item.id)}
                    type="button"
                  >
                    <CheckCircle2 size={18} />
                    {isCompleted ? "완료 취소" : "완료"}
                  </button>
                  <div className="schedule-move-actions" aria-label={`${item.title} 순서 변경`}>
                    <button
                      aria-label={`${item.title} 위로 이동`}
                      className="icon-button neutral"
                      disabled={index === 0}
                      onClick={() => moveSchedule(item.id, "up")}
                      type="button"
                    >
                      <ArrowUp size={18} />
                    </button>
                    <button
                      aria-label={`${item.title} 아래로 이동`}
                      className="icon-button neutral"
                      disabled={index === selectedSchedules.length - 1}
                      onClick={() => moveSchedule(item.id, "down")}
                      type="button"
                    >
                      <ArrowDown size={18} />
                    </button>
                  </div>
                </div>
                <a
                  className="secondary-button"
                  href={getMapUrl(place)}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <MapPin size={18} />
                  지도
                </a>
              </div>
            </article>
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
