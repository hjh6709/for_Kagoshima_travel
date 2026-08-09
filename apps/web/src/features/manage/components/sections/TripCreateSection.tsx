import { ChevronDown, PlusCircle, Route } from "lucide-react";
import type { RefObject } from "react";
import { destinationCountryOptions } from "../../../../shared/travelOptions";
import type { TripCreateSectionProps } from "../../manageTypes";

type TripCreateDisclosureProps = TripCreateSectionProps & {
  isFirstTrip: boolean;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  sectionRef?: RefObject<HTMLElement | null>;
};

// 첫 여행은 곧바로 입력할 수 있게 보여 주고, 기존 사용자의 추가 여행만 접이식으로 표시한다.
export function TripCreateSection({
  newTripEndDate,
  newTripMemo,
  newTripStartDate,
  newTripTitle,
  newTripTravelers,
  newTripDestinationCountry,
  onNewTripEndDateChange,
  onNewTripMemoChange,
  onNewTripStartDateChange,
  onNewTripTitleChange,
  onNewTripTravelersChange,
  onNewTripDestinationCountryChange,
  onSubmitNewTrip,
  tripCreateError,
  tripCreateSubmitting,
  isFirstTrip,
  isOpen,
  onOpenChange,
  sectionRef,
}: TripCreateDisclosureProps) {
  const submitLabel = tripCreateSubmitting
    ? "여행 만드는 중"
    : isFirstTrip
      ? "첫 여행 만들기"
      : "새 여행 추가하기";

  const createForm = (
    <form
      className={`auth-form trip-create-form${isFirstTrip ? " first-trip-create-form" : ""}`}
      noValidate
      onSubmit={onSubmitNewTrip}
    >
      <label>
        여행명
        <input
          autoComplete="off"
          onChange={(event) => onNewTripTitleChange(event.target.value)}
          placeholder="예: 상하이 가족 여행"
          required
          type="text"
          value={newTripTitle}
        />
      </label>

      <label>
        목적지 국가
        <select
          onChange={(event) => onNewTripDestinationCountryChange(event.target.value)}
          required
          value={newTripDestinationCountry}
        >
          <option disabled value="">목적지 국가를 선택하세요</option>
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
            onChange={(event) => onNewTripStartDateChange(event.target.value)}
            required
            type="date"
            value={newTripStartDate}
          />
        </label>
        <label>
          <span className="form-label-row">
            종료일
            <small>선택</small>
          </span>
          <input
            aria-describedby="trip-end-date-hint"
            min={newTripStartDate || undefined}
            onChange={(event) => onNewTripEndDateChange(event.target.value)}
            type="date"
            value={newTripEndDate}
          />
        </label>
      </div>
      <p className="trip-end-date-hint" id="trip-end-date-hint">
        종료일을 비워 두면 당일 여행으로 만듭니다.
      </p>

      <details className="trip-create-optional-fields">
        <summary>여행자와 메모 <span>선택</span></summary>
        <div>
          <label>
            여행자
            <textarea
              onChange={(event) => onNewTripTravelersChange(event.target.value)}
              placeholder="쉼표 또는 줄바꿈으로 입력&#10;예: 나, 가족"
              rows={3}
              value={newTripTravelers}
            />
          </label>

          <label>
            메모
            <textarea
              onChange={(event) => onNewTripMemoChange(event.target.value)}
              placeholder="여행 목적, 주의사항, 준비 메모"
              rows={3}
              value={newTripMemo}
            />
          </label>
        </div>
      </details>

      {tripCreateError && <p className="form-error" role="alert">{tripCreateError}</p>}

      <button className="primary-button" disabled={tripCreateSubmitting} type="submit">
        <PlusCircle aria-hidden="true" size={18} />
        {submitLabel}
      </button>
    </form>
  );

  if (isFirstTrip) {
    return (
      <section className="section-block first-trip-create" ref={sectionRef}>
        <header className="first-trip-intro">
          <span className="first-trip-route-mark" aria-hidden="true">
            <Route size={22} />
          </span>
          <div>
            <span className="first-trip-kicker">첫 여행 설정</span>
            <h2>첫 여행 만들기</h2>
            <p>여행명, 목적지와 출발일을 입력하면 일정과 장소를 담을 공간이 생깁니다.</p>
          </div>
        </header>
        {createForm}
      </section>
    );
  }

  return (
    <section className="section-block" ref={sectionRef}>
      <details
        className="trip-create-disclosure"
        onToggle={(event) => onOpenChange(event.currentTarget.open)}
        open={isOpen}
      >
        <summary
          aria-disabled={tripCreateSubmitting}
          aria-label={isOpen ? "새 여행 추가 닫기" : "새 여행 추가 열기"}
          onClick={(event) => {
            if (tripCreateSubmitting) event.preventDefault();
          }}
        >
          <span className="trip-create-summary-icon" aria-hidden="true">
            <PlusCircle size={20} />
          </span>
          <span className="trip-create-summary-copy">
            <strong>새 여행 추가</strong>
            <span>다른 목적지나 기간의 여행을 만듭니다.</span>
          </span>
          <ChevronDown className="trip-create-summary-chevron" aria-hidden="true" size={20} />
        </summary>
        {createForm}
      </details>
    </section>
  );
}
