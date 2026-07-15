import { CheckCircle2 } from "lucide-react";
import type { TripManagePageProps } from "../manageTypes";

type TripBasicInfoFormProps = Pick<
  TripManagePageProps,
  | "onSubmitTripEdit"
  | "onTripEditEndDateChange"
  | "onTripEditMemoChange"
  | "onTripEditStartDateChange"
  | "onTripEditTitleChange"
  | "onTripEditTravelersChange"
  | "onTripEditDestinationCountryChange"
  | "tripEditEndDate"
  | "tripEditError"
  | "tripEditMemo"
  | "tripEditStartDate"
  | "tripEditSubmitting"
  | "tripEditTitle"
  | "tripEditTravelers"
  | "tripEditDestinationCountry"
>;

// 선택된 여행의 기본 정보 수정 폼만 담당한다. 저장 로직과 상태 변경은 상위 콜백으로 위임한다.
export function TripBasicInfoForm({
  onSubmitTripEdit,
  onTripEditEndDateChange,
  onTripEditMemoChange,
  onTripEditStartDateChange,
  onTripEditTitleChange,
  onTripEditTravelersChange,
  onTripEditDestinationCountryChange,
  tripEditEndDate,
  tripEditError,
  tripEditMemo,
  tripEditStartDate,
  tripEditSubmitting,
  tripEditTitle,
  tripEditTravelers,
  tripEditDestinationCountry,
}: TripBasicInfoFormProps) {
  return (
    <form className="auth-form trip-edit-form" onSubmit={onSubmitTripEdit}>
      <div className="section-title-row compact-title-row">
        <div>
          <h3>기본 정보 수정</h3>
          <p className="section-caption">여행명, 기간, 여행자, 메모를 수정합니다.</p>
        </div>
      </div>

      <label>
        여행명
        <input
          onChange={(event) => onTripEditTitleChange(event.target.value)}
          required
          type="text"
          value={tripEditTitle}
        />
      </label>

      <label>
        목적지 국가
        <select
          onChange={(event) => onTripEditDestinationCountryChange(event.target.value)}
          value={tripEditDestinationCountry}
        >
          <option value="JP">일본 (엔화/일어 지원)</option>
          <option value="CN">중국 (위안화/중국어 지원)</option>
        </select>
      </label>

      <div className="form-grid-two">
        <label>
          시작일
          <input
            onChange={(event) => onTripEditStartDateChange(event.target.value)}
            required
            type="date"
            value={tripEditStartDate}
          />
        </label>
        <label>
          종료일
          <input
            min={tripEditStartDate || undefined}
            onChange={(event) => onTripEditEndDateChange(event.target.value)}
            required
            type="date"
            value={tripEditEndDate}
          />
        </label>
      </div>

      <label>
        여행자
        <textarea
          onChange={(event) => onTripEditTravelersChange(event.target.value)}
          placeholder="쉼표 또는 줄바꿈으로 입력"
          rows={3}
          value={tripEditTravelers}
        />
      </label>

      <label>
        메모
        <textarea
          onChange={(event) => onTripEditMemoChange(event.target.value)}
          placeholder="여행 목적, 주의사항, 준비 메모"
          rows={3}
          value={tripEditMemo}
        />
      </label>

      {tripEditError && <p className="form-error">{tripEditError}</p>}

      <button className="primary-button" disabled={tripEditSubmitting} type="submit">
        <CheckCircle2 size={18} />
        {tripEditSubmitting ? "저장 중" : "기본 정보 저장"}
      </button>
    </form>
  );
}
