import { PlusCircle } from "lucide-react";
import { placeCategoryOptions } from "../../../shared/travelOptions";
import type { PlaceCategory } from "../../../types/travel";
import type { TripManagePageProps } from "../manageTypes";

type ManagePlaceCreateFormProps = Pick<
  TripManagePageProps,
  | "newPlaceAddress"
  | "newPlaceCategory"
  | "newPlaceGoogleMapsURL"
  | "newPlaceName"
  | "newPlaceRecommendedReason"
  | "newPlaceChineseName"
  | "newPlaceChineseAddress"
  | "newPlaceSubwayExit"
  | "newPlaceTaxiPhrase"
  | "onNewPlaceAddressChange"
  | "onNewPlaceCategoryChange"
  | "onNewPlaceGoogleMapsURLChange"
  | "onNewPlaceNameChange"
  | "onNewPlaceRecommendedReasonChange"
  | "onNewPlaceChineseNameChange"
  | "onNewPlaceChineseAddressChange"
  | "onNewPlaceSubwayExitChange"
  | "onNewPlaceTaxiPhraseChange"
  | "onSubmitNewPlace"
  | "placeCreateError"
  | "placeCreateSubmitting"
> & { destinationCountry?: string };

// 여행 관리 화면의 장소 추가 폼만 담당한다. 생성 요청과 입력 상태 변경은 상위 콜백으로 위임한다.
export function ManagePlaceCreateForm({
  newPlaceAddress,
  newPlaceCategory,
  newPlaceGoogleMapsURL,
  newPlaceName,
  newPlaceRecommendedReason,
  newPlaceChineseName,
  newPlaceChineseAddress,
  newPlaceSubwayExit,
  newPlaceTaxiPhrase,
  onNewPlaceAddressChange,
  onNewPlaceCategoryChange,
  onNewPlaceGoogleMapsURLChange,
  onNewPlaceNameChange,
  onNewPlaceRecommendedReasonChange,
  onNewPlaceChineseNameChange,
  onNewPlaceChineseAddressChange,
  onNewPlaceSubwayExitChange,
  onNewPlaceTaxiPhraseChange,
  onSubmitNewPlace,
  placeCreateError,
  placeCreateSubmitting,
  destinationCountry,
}: ManagePlaceCreateFormProps) {
  const isChinaTrip = destinationCountry === "CN";

  return (
    <section className="owner-linked-data-section">
      <div className="section-title-row compact-title-row">
        <div>
          <h3>장소</h3>
          <p className="section-caption">숙소, 식당, 이동 장소처럼 일정에 연결할 후보를 먼저 저장합니다.</p>
        </div>
      </div>

      <form className="auth-form compact-owner-form" onSubmit={onSubmitNewPlace}>
        <div className="form-grid-two">
          <label>
            장소 이름
            <input
              onChange={(event) => onNewPlaceNameChange(event.target.value)}
              placeholder="예: 공항 렌터카 센터"
              required
              type="text"
              value={newPlaceName}
            />
          </label>
          <label>
            분류
            <select
              onChange={(event) => onNewPlaceCategoryChange(event.target.value as PlaceCategory)}
              value={newPlaceCategory}
            >
              {placeCategoryOptions.map(([category, label]) => (
                <option key={category} value={category}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label>
          주소
          <input
            onChange={(event) => onNewPlaceAddressChange(event.target.value)}
            placeholder="예: 공항 1층 또는 숙소 주소"
            type="text"
            value={newPlaceAddress}
          />
        </label>

        <label>
          Google Maps 링크
          <input
            inputMode="url"
            onChange={(event) => onNewPlaceGoogleMapsURLChange(event.target.value)}
            placeholder="https://www.google.com/maps/..."
            type="url"
            value={newPlaceGoogleMapsURL}
          />
        </label>
        {isChinaTrip && (
          <p className="field-help">
            고덕지도에서는 중국어 장소명과 주소로 검색하므로 현지 표기를 함께 저장해주세요.
          </p>
        )}

        {isChinaTrip && (
          <fieldset className="local-place-fieldset">
            <legend>상하이 현지 사용 정보</legend>
            <label>
              중국어 장소명
              <input
                onChange={(event) => onNewPlaceChineseNameChange(event.target.value)}
                placeholder="예: 上海博物馆"
                type="text"
                value={newPlaceChineseName}
              />
            </label>
            <label>
              중국어 주소
              <input
                onChange={(event) => onNewPlaceChineseAddressChange(event.target.value)}
                placeholder="현지 지도 검색 또는 기사님께 보여줄 주소"
                type="text"
                value={newPlaceChineseAddress}
              />
            </label>
            <div className="form-grid-two">
              <label>
                가까운 지하철 출구
                <input
                  onChange={(event) => onNewPlaceSubwayExitChange(event.target.value)}
                  placeholder="예: 1호선 3번 출구"
                  type="text"
                  value={newPlaceSubwayExit}
                />
              </label>
              <label>
                택시 문구
                <input
                  onChange={(event) => onNewPlaceTaxiPhraseChange(event.target.value)}
                  placeholder="예: 请带我去上海博物馆"
                  type="text"
                  value={newPlaceTaxiPhrase}
                />
              </label>
            </div>
          </fieldset>
        )}

        <label>
          추천/안내 메모
          <textarea
            onChange={(event) => onNewPlaceRecommendedReasonChange(event.target.value)}
            placeholder="예: 도착 후 바로 이동할 장소, 운영시간 확인 필요"
            rows={2}
            value={newPlaceRecommendedReason}
          />
        </label>

        {placeCreateError && <p className="form-error">{placeCreateError}</p>}

        <button className="primary-button" disabled={placeCreateSubmitting} type="submit">
          <PlusCircle size={18} />
          {placeCreateSubmitting ? "장소 추가 중" : "장소 추가"}
        </button>
      </form>
    </section>
  );
}
