import { Trash2 } from "lucide-react";
import { formatKoreanDate } from "../../../shared/date";
import { getScheduleTypeLabel } from "../../../shared/travelOptions";
import type { TripManagePageProps } from "../manageTypes";

type ManageScheduleListProps = Pick<
  TripManagePageProps,
  | "deletingScheduleID"
  | "isScheduleListEditing"
  | "onDeleteSchedule"
  | "onScheduleListEditingChange"
  | "ownerDetailDataError"
  | "ownerDetailDataLoading"
  | "ownerPlaces"
  | "ownerSchedules"
  | "scheduleDeleteError"
>;

// 서버에 저장되어 공유 화면에 노출되는 일정 목록만 담당한다. 삭제와 편집 모드 전환은 상위 콜백으로 위임한다.
export function ManageScheduleList({
  deletingScheduleID,
  isScheduleListEditing,
  onDeleteSchedule,
  onScheduleListEditingChange,
  ownerDetailDataError,
  ownerDetailDataLoading,
  ownerPlaces,
  ownerSchedules,
  scheduleDeleteError,
}: ManageScheduleListProps) {
  const ownerPlaceByID = new Map(ownerPlaces.map((place) => [place.id, place]));

  return (
    <section className="owner-linked-data-section">
      <div className="section-title-row compact-title-row">
        <div>
          <h3>공유되는 일정</h3>
          <p className="section-caption">현재 서버에 저장되어 공유 화면에 표시되는 일정입니다.</p>
        </div>
        <div className="section-actions">
          <span className="pill subtle">{ownerSchedules.length}개</span>
          <button
            className="secondary-button compact-button"
            disabled={ownerSchedules.length === 0}
            onClick={() => onScheduleListEditingChange(!isScheduleListEditing)}
            type="button"
          >
            {isScheduleListEditing ? "완료" : "편집"}
          </button>
        </div>
      </div>

      {ownerDetailDataLoading && <p className="muted">일정과 장소를 불러오는 중입니다.</p>}
      {ownerDetailDataError && <p className="form-error">{ownerDetailDataError}</p>}
      {scheduleDeleteError && <p className="form-error">{scheduleDeleteError}</p>}

      {!ownerDetailDataLoading && !ownerDetailDataError && ownerSchedules.length === 0 && (
        <article className="empty-state-card list-card">
          <p className="muted">아직 서버에 저장된 일정이 없습니다.</p>
        </article>
      )}

      {!ownerDetailDataLoading && !ownerDetailDataError && ownerSchedules.length > 0 && (
        <div className="card-stack compact-card-stack">
          {ownerSchedules.map((schedule) => {
            const place = ownerPlaceByID.get(schedule.placeId ?? "");
            return (
              <article className="owner-linked-card" key={schedule.id}>
                <div>
                  <span className="muted-label">
                    {formatKoreanDate(schedule.date)} · {schedule.time || "시간 미정"}
                  </span>
                  <h2>{schedule.title}</h2>
                  <p className="section-caption">
                    {getScheduleTypeLabel(schedule.type)}
                    {place ? ` · ${place.name}` : ""}
                  </p>
                </div>
                {schedule.guideMemo && <p className="muted">{schedule.guideMemo}</p>}
                {isScheduleListEditing && (
                  <div className="owner-linked-actions">
                    <button
                      className="danger-button compact-button"
                      disabled={deletingScheduleID === schedule.id}
                      onClick={() => onDeleteSchedule(schedule.id)}
                      type="button"
                    >
                      <Trash2 size={16} />
                      {deletingScheduleID === schedule.id ? "삭제 중" : "삭제"}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
