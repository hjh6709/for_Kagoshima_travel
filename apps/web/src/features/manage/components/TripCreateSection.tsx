import { PlusCircle } from "lucide-react";
import type { TripCreateSectionProps } from "../manageTypes";

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
}: TripCreateSectionProps) {
  return (
    <section className="section-block">
      <div className="section-title-row">
        <div>
          <h2>새 여행 만들기</h2>
          <p className="section-caption">여행명과 기간만 입력하면 먼저 여행 공간을 만들 수 있습니다.</p>
        </div>
      </div>

      <form className="auth-form trip-create-form" onSubmit={onSubmitNewTrip}>
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
          목적지 국가
          <select
            onChange={(event) => onNewTripDestinationCountryChange(event.target.value)}
            value={newTripDestinationCountry}
          >
            <option value="JP">일본 (엔화/일어 지원)</option>
            <option value="CN">중국 (위안화/중국어 지원)</option>
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

        {tripCreateError && <p className="form-error">{tripCreateError}</p>}

        <button className="primary-button" disabled={tripCreateSubmitting} type="submit">
          <PlusCircle size={18} />
          {tripCreateSubmitting ? "만드는 중" : "새 여행 만들기"}
        </button>
      </form>
    </section>
  );
}
