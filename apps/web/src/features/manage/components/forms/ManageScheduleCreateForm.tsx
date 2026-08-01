import { CalendarPlus, PlusCircle } from "lucide-react";
import { scheduleTypeOptions } from "../../../../shared/travelOptions";
import type { ScheduleItem } from "../../../../types/travel";
import type { TripManagePageProps } from "../../manageTypes";
import { ShanghaiStarterPlanner } from "../helpers/ShanghaiStarterPlanner";

type ManageScheduleCreateFormProps = Pick<
  TripManagePageProps,
  | "newScheduleDate"
  | "newScheduleGuideMemo"
  | "newSchedulePlaceID"
  | "newScheduleTime"
  | "newScheduleTitle"
  | "newScheduleTransportMemo"
  | "newScheduleType"
  | "onNewScheduleDateChange"
  | "onNewScheduleGuideMemoChange"
  | "onNewSchedulePlaceIDChange"
  | "onNewScheduleTimeChange"
  | "onNewScheduleTitleChange"
  | "onNewScheduleTransportMemoChange"
  | "onNewScheduleTypeChange"
  | "onSubmitNewSchedule"
  | "ownerPlaces"
  | "ownerSchedules"
  | "scheduleCreateError"
  | "scheduleCreateSubmitting"
> & {
  tripEndDate: string;
  tripStartDate: string;
  destinationCountry?: string;
};

// 여행 관리 화면의 일정 추가 폼만 담당한다. 장소 선택 목록과 저장 상태는 상위에서 전달받는다.
export function ManageScheduleCreateForm({
  newScheduleDate,
  newScheduleGuideMemo,
  newSchedulePlaceID,
  newScheduleTime,
  newScheduleTitle,
  newScheduleTransportMemo,
  newScheduleType,
  onNewScheduleDateChange,
  onNewScheduleGuideMemoChange,
  onNewSchedulePlaceIDChange,
  onNewScheduleTimeChange,
  onNewScheduleTitleChange,
  onNewScheduleTransportMemoChange,
  onNewScheduleTypeChange,
  onSubmitNewSchedule,
  ownerPlaces,
  ownerSchedules,
  scheduleCreateError,
  scheduleCreateSubmitting,
  tripEndDate,
  tripStartDate,
  destinationCountry,
}: ManageScheduleCreateFormProps) {
  const applyShanghaiPlanItem = (item: {
    date: string;
    time: string;
    type: ScheduleItem["type"];
    title: string;
    placeID: string;
    transportMemo: string;
    guideMemo: string;
  }) => {
    onNewScheduleDateChange(item.date);
    onNewScheduleTimeChange(item.time);
    onNewScheduleTypeChange(item.type);
    onNewScheduleTitleChange(item.title);
    onNewSchedulePlaceIDChange(item.placeID);
    onNewScheduleTransportMemoChange(item.transportMemo);
    onNewScheduleGuideMemoChange(item.guideMemo);
    requestAnimationFrame(() => document.getElementById("schedule-create-form")?.scrollIntoView({ behavior: "smooth" }));
  };

  return (
    <section className="owner-linked-data-section">
      <div className="section-title-row compact-title-row">
        <div>
          <h3>일정 추가</h3>
          <p className="section-caption">날짜와 시간을 먼저 정하고, 저장한 장소는 필요할 때 연결하세요.</p>
        </div>
      </div>

      <form className="auth-form compact-owner-form" id="schedule-create-form" onSubmit={onSubmitNewSchedule}>
        <div className="form-grid-two">
          <label>
            날짜
            <input
              max={tripEndDate}
              min={tripStartDate}
              onChange={(event) => onNewScheduleDateChange(event.target.value)}
              required
              type="date"
              value={newScheduleDate}
            />
          </label>
          <label>
            시간
            <input
              onChange={(event) => onNewScheduleTimeChange(event.target.value)}
              required
              type="time"
              value={newScheduleTime}
            />
          </label>
        </div>

        {ownerPlaces.length === 0 && (
          <p className="field-help">장소를 아직 저장하지 않아도 일정을 먼저 추가하고 나중에 연결할 수 있습니다.</p>
        )}

        <div className="form-grid-two">
          <label>
            유형
            <select
              onChange={(event) => onNewScheduleTypeChange(event.target.value as ScheduleItem["type"])}
              value={newScheduleType}
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
            <select onChange={(event) => onNewSchedulePlaceIDChange(event.target.value)} value={newSchedulePlaceID}>
              <option value="">장소 연결 안 함</option>
              {ownerPlaces.map((place) => (
                <option key={place.id} value={place.id}>
                  {place.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label>
          일정 제목
          <input
            onChange={(event) => onNewScheduleTitleChange(event.target.value)}
            placeholder="예: 공항 도착 후 렌터카 수령"
            required
            type="text"
            value={newScheduleTitle}
          />
        </label>

        <label>
          이동 메모
          <textarea
            onChange={(event) => onNewScheduleTransportMemoChange(event.target.value)}
            placeholder="예: 택시, 버스, 도보 이동 정보"
            rows={2}
            value={newScheduleTransportMemo}
          />
        </label>

        <label>
          안내 메모
          <textarea
            onChange={(event) => onNewScheduleGuideMemoChange(event.target.value)}
            placeholder="예: 준비물, 현장 주의사항, 가족에게 보여줄 설명"
            rows={2}
            value={newScheduleGuideMemo}
          />
        </label>

        {scheduleCreateError && <p className="form-error">{scheduleCreateError}</p>}

        <button className="primary-button" disabled={scheduleCreateSubmitting} type="submit">
          <PlusCircle size={18} />
          {scheduleCreateSubmitting ? "일정 추가 중" : "일정 추가"}
        </button>
      </form>

      {destinationCountry === "CN" && (
        <details className="schedule-recommendations">
          <summary>
            <CalendarPlus aria-hidden="true" size={18} />
            <span>상하이 추천 일정 보기</span>
            <small>선택 사항</small>
          </summary>
          <ShanghaiStarterPlanner
            onApply={applyShanghaiPlanItem}
            ownerPlaces={ownerPlaces}
            ownerSchedules={ownerSchedules}
            tripEndDate={tripEndDate}
            tripStartDate={tripStartDate}
          />
        </details>
      )}
    </section>
  );
}
