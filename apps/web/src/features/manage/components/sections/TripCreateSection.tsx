import { ChevronDown, PlusCircle } from "lucide-react";
import { destinationCountryOptions } from "../../../../shared/travelOptions";
import type { TripCreateSectionProps } from "../../manageTypes";

type TripCreateDisclosureProps = TripCreateSectionProps & {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

// 새 여행 생성 폼만 담당한다. 생성 후 목록 갱신은 상위 상태 흐름을 따른다.
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
  isOpen,
  onOpenChange,
}: TripCreateDisclosureProps) {
  return (
    <section className="section-block">
      <details
        className="trip-create-disclosure"
        onToggle={(event) => onOpenChange(event.currentTarget.open)}
        open={isOpen}
      >
        <summary
          aria-disabled={tripCreateSubmitting}
          aria-label={isOpen ? "새 여행 만들기 닫기" : "새 여행 만들기 열기"}
          onClick={(event) => {
            if (tripCreateSubmitting) event.preventDefault();
          }}
        >
          <span className="trip-create-summary-icon" aria-hidden="true">
            <PlusCircle size={20} />
          </span>
          <span className="trip-create-summary-copy">
            <strong>새 여행 만들기</strong>
            <span>목적지와 기간을 입력해 여행 공간을 만듭니다.</span>
          </span>
          <ChevronDown className="trip-create-summary-chevron" aria-hidden="true" size={20} />
        </summary>

        <form className="auth-form trip-create-form" noValidate onSubmit={onSubmitNewTrip}>
          <label>
            여행명
            <input
              onChange={(event) => onNewTripTitleChange(event.target.value)}
              placeholder="예: 여름 가족 여행"
              required
              type="text"
              value={newTripTitle}
            />
          </label>

          <label>
            목적지 국가 <span aria-hidden="true">*</span>
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
              종료일
              <input
                min={newTripStartDate || undefined}
                onChange={(event) => onNewTripEndDateChange(event.target.value)}
                required
                type="date"
                value={newTripEndDate}
              />
            </label>
          </div>

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

          {tripCreateError && <p className="form-error">{tripCreateError}</p>}

          <button className="primary-button" disabled={tripCreateSubmitting} type="submit">
            <PlusCircle size={18} />
            {tripCreateSubmitting ? "만드는 중" : "새 여행 만들기"}
          </button>
        </form>
      </details>
    </section>
  );
}
