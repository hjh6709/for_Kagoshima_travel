import { Edit3, Save, Trash2, X } from "lucide-react";
import { formatKoreanDate } from "../../../shared/date";
import { getScheduleTypeLabel, scheduleTypeOptions } from "../../../shared/travelOptions";
import type { ScheduleItem } from "../../../types/travel";
import type { TripManagePageProps } from "../manageTypes";

type ManageScheduleListProps = Pick<
  TripManagePageProps,
  | "deletingScheduleID"
  | "editingScheduleDate"
  | "editingScheduleGuideMemo"
  | "editingScheduleID"
  | "editingSchedulePlaceID"
  | "editingScheduleTime"
  | "editingScheduleTitle"
  | "editingScheduleTransportMemo"
  | "editingScheduleType"
  | "isScheduleListEditing"
  | "onCancelScheduleEdit"
  | "onDeleteSchedule"
  | "onEditingScheduleDateChange"
  | "onEditingScheduleGuideMemoChange"
  | "onEditingSchedulePlaceIDChange"
  | "onEditingScheduleTimeChange"
  | "onEditingScheduleTitleChange"
  | "onEditingScheduleTransportMemoChange"
  | "onEditingScheduleTypeChange"
  | "onScheduleListEditingChange"
  | "onStartScheduleEdit"
  | "onSubmitScheduleEdit"
  | "ownerDetailDataError"
  | "ownerDetailDataLoading"
  | "ownerPlaces"
  | "ownerSchedules"
  | "scheduleDeleteError"
  | "scheduleEditError"
  | "scheduleEditSubmitting"
  | "selectedOwnerTrip"
>;

// 서버에 저장되어 공유 화면에 노출되는 일정 목록만 담당한다. 삭제/수정 액션은 상위 콜백으로 위임한다.
export function ManageScheduleList({
  deletingScheduleID,
  editingScheduleDate,
  editingScheduleGuideMemo,
  editingScheduleID,
  editingSchedulePlaceID,
  editingScheduleTime,
  editingScheduleTitle,
  editingScheduleTransportMemo,
  editingScheduleType,
  isScheduleListEditing,
  onCancelScheduleEdit,
  onDeleteSchedule,
  onEditingScheduleDateChange,
  onEditingScheduleGuideMemoChange,
  onEditingSchedulePlaceIDChange,
  onEditingScheduleTimeChange,
  onEditingScheduleTitleChange,
  onEditingScheduleTransportMemoChange,
  onEditingScheduleTypeChange,
  onScheduleListEditingChange,
  onStartScheduleEdit,
  onSubmitScheduleEdit,
  ownerDetailDataError,
  ownerDetailDataLoading,
  ownerPlaces,
  ownerSchedules,
  scheduleDeleteError,
  scheduleEditError,
  scheduleEditSubmitting,
  selectedOwnerTrip,
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
                      className="secondary-button compact-button"
                      onClick={() => onStartScheduleEdit(schedule)}
                      type="button"
                    >
                      <Edit3 size={16} />
                      수정
                    </button>
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
                {isScheduleListEditing && editingScheduleID === schedule.id && selectedOwnerTrip && (
                  <form className="auth-form compact-owner-form owner-inline-edit-form" onSubmit={onSubmitScheduleEdit}>
                    <div className="form-grid-two">
                      <label>
                        날짜
                        <input
                          max={selectedOwnerTrip.endDate}
                          min={selectedOwnerTrip.startDate}
                          onChange={(event) => onEditingScheduleDateChange(event.target.value)}
                          required
                          type="date"
                          value={editingScheduleDate}
                        />
                      </label>
                      <label>
                        시간
                        <input
                          onChange={(event) => onEditingScheduleTimeChange(event.target.value)}
                          required
                          type="text"
                          value={editingScheduleTime}
                        />
                      </label>
                    </div>

                    <div className="form-grid-two">
                      <label>
                        유형
                        <select
                          onChange={(event) => onEditingScheduleTypeChange(event.target.value as ScheduleItem["type"])}
                          value={editingScheduleType}
                        >
                          {scheduleTypeOptions.map(([type, label]) => (
                            <option key={type} value={type}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        연결 장소
                        <select
                          onChange={(event) => onEditingSchedulePlaceIDChange(event.target.value)}
                          value={editingSchedulePlaceID}
                        >
                          <option value="">장소 연결 안 함</option>
                          {ownerPlaces.map((placeOption) => (
                            <option key={placeOption.id} value={placeOption.id}>
                              {placeOption.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <label>
                      일정 제목
                      <input
                        onChange={(event) => onEditingScheduleTitleChange(event.target.value)}
                        required
                        type="text"
                        value={editingScheduleTitle}
                      />
                    </label>

                    <label>
                      이동 메모
                      <textarea
                        onChange={(event) => onEditingScheduleTransportMemoChange(event.target.value)}
                        rows={2}
                        value={editingScheduleTransportMemo}
                      />
                    </label>

                    <label>
                      안내 메모
                      <textarea
                        onChange={(event) => onEditingScheduleGuideMemoChange(event.target.value)}
                        rows={2}
                        value={editingScheduleGuideMemo}
                      />
                    </label>

                    {scheduleEditError && <p className="form-error">{scheduleEditError}</p>}

                    <div className="owner-linked-actions">
                      <button className="primary-button compact-button" disabled={scheduleEditSubmitting} type="submit">
                        <Save size={16} />
                        {scheduleEditSubmitting ? "저장 중" : "수정 저장"}
                      </button>
                      <button
                        className="secondary-button compact-button"
                        disabled={scheduleEditSubmitting}
                        onClick={onCancelScheduleEdit}
                        type="button"
                      >
                        <X size={16} />
                        취소
                      </button>
                    </div>
                  </form>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
