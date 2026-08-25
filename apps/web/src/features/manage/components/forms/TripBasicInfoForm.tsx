import { CheckCircle2 } from "lucide-react";
import { destinationCountryOptions } from "../../../../shared/travelOptions";
import type { TripManagePageProps } from "../../manageTypes";

type TripBasicInfoFormProps = Pick<
  TripManagePageProps,
  | "onSubmitTripEdit"
  | "onTripEditEndDateChange"
  | "onTripEditMemoChange"
  | "onTripEditEmergencyContactNameChange"
  | "onTripEditEmergencyContactPhoneChange"
  | "onTripEditStartDateChange"
  | "onTripEditTitleChange"
  | "onTripEditTravelersChange"
  | "onTripEditDestinationCountryChange"
  | "tripEditEndDate"
  | "tripEditError"
  | "tripEditMemo"
  | "tripEditEmergencyContactName"
  | "tripEditEmergencyContactPhone"
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
  onTripEditEmergencyContactNameChange,
  onTripEditEmergencyContactPhoneChange,
  onTripEditStartDateChange,
  onTripEditTitleChange,
  onTripEditTravelersChange,
  onTripEditDestinationCountryChange,
  tripEditEndDate,
  tripEditError,
  tripEditMemo,
  tripEditEmergencyContactName,
  tripEditEmergencyContactPhone,
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
          {!destinationCountryOptions.some(([code]) => code === tripEditDestinationCountry) && tripEditDestinationCountry && (
            <option value={tripEditDestinationCountry}>{tripEditDestinationCountry} · 기존 설정</option>
          )}
          {destinationCountryOptions.map(([code, label]) => (
            <option key={code} value={code}>
              {label}
              {code === "JP" ? " · 엔화/일본어 도구" : ""}
              {code === "CN" ? " · 위안화/중국어·고덕지도" : ""}
            </option>
          ))}
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

      <div className="section-title-row compact-title-row">
        <div>
          <h3>긴급 연락처</h3>
          <p className="section-caption">
            로그인 없이 공유 링크로 보는 동행자도 이 연락처를 볼 수 있습니다. 여행 중 문제가 생겼을 때
            가장 먼저 연락할 가족 정보를 남겨 주세요.
          </p>
        </div>
      </div>

      <div className="form-grid-two">
        <label>
          비상 연락 대상
          <input
            onChange={(event) => onTripEditEmergencyContactNameChange(event.target.value)}
            placeholder="예: 아빠 휴대폰"
            type="text"
            value={tripEditEmergencyContactName}
          />
        </label>
        <label>
          전화번호
          <input
            onChange={(event) => onTripEditEmergencyContactPhoneChange(event.target.value)}
            placeholder="예: 010-1234-5678"
            type="tel"
            value={tripEditEmergencyContactPhone}
          />
        </label>
      </div>

      {tripEditError && <p className="form-error">{tripEditError}</p>}

      <button className="primary-button" disabled={tripEditSubmitting} type="submit">
        <CheckCircle2 size={18} />
        {tripEditSubmitting ? "저장 중" : "기본 정보 저장"}
      </button>
    </form>
  );
}
