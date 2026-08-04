import { useEffect, useRef, useState } from "react";
import { PlusCircle, Search, Check, Loader2, Compass, AlertCircle } from "lucide-react";
import { searchTripPlaces, type PlaceSearchResult } from "../../../../api/trips";
import { placeCategoryOptions } from "../../../../shared/travelOptions";
import type { PlaceCategory } from "../../../../types/travel";
import type { TripManagePageProps } from "../../manageTypes";

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
  | "auth"
  | "onNewPlaceAddressChange"
  | "onNewPlaceCategoryChange"
  | "onNewPlaceGoogleMapsURLChange"
  | "onNewPlaceNameChange"
  | "onNewPlaceRecommendedReasonChange"
  | "onNewPlaceChineseNameChange"
  | "onNewPlaceChineseAddressChange"
  | "onNewPlaceSubwayExitChange"
  | "onNewPlaceTaxiPhraseChange"
  | "onNewPlaceSearchSelectionChange"
  | "onSubmitNewPlace"
  | "placeCreateError"
  | "placeCreateSubmitting"
  | "selectedOwnerTrip"
> & { destinationCountry?: string };

function inferPlaceCategory(query: string): PlaceCategory | null {
  const normalized = query.trim().toLowerCase();
  if (["카페", "커피", "커피숍", "cafe", "coffee", "咖啡", "咖啡店"].includes(normalized)) {
    return "cafe";
  }
  if (["식당", "음식점", "맛집", "레스토랑", "restaurant", "food", "餐厅"].includes(normalized)) {
    return "meal";
  }
  return null;
}

// 여행 관리 화면의 장소 추가 폼 및 지도 검색(Amap/Google) 연동 영역
export function ManagePlaceCreateForm({
  auth,
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
  onNewPlaceSearchSelectionChange,
  onSubmitNewPlace,
  placeCreateError,
  placeCreateSubmitting,
  selectedOwnerTrip,
  destinationCountry,
}: ManagePlaceCreateFormProps) {
  const isChinaTrip = destinationCountry === "CN";
  const tripID = selectedOwnerTrip?.id;

  // 검색 상태 관리
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchErrorMsg, setSearchErrorMsg] = useState("");
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const wasCreateSubmitting = useRef(placeCreateSubmitting);

  useEffect(() => {
    const createFinished = wasCreateSubmitting.current && !placeCreateSubmitting;
    wasCreateSubmitting.current = placeCreateSubmitting;
    if (!createFinished || placeCreateError || newPlaceName.trim()) return;

    setSearchQuery("");
    setSearchResults([]);
    setSearchErrorMsg("");
    setSelectedIdx(null);
  }, [newPlaceName, placeCreateError, placeCreateSubmitting]);

  // 통합 검색 트리거
  const handleSearch = async () => {
    const query = searchQuery.trim();
    if (!tripID || !query) return;
    if (!auth) {
      setSearchErrorMsg("로그인 정보를 확인한 뒤 다시 검색해 주세요.");
      return;
    }

    setSearchLoading(true);
    setSearchErrorMsg("");
    setSearchResults([]);
    setSelectedIdx(null);

    try {
      const data = await searchTripPlaces(auth.accessToken, tripID, query);
      setSearchResults(data);
      if (data.length === 0) {
        setSearchErrorMsg("검색 결과가 없습니다. 오타를 확인하거나 직접 입력해 주세요.");
      }
    } catch (error) {
      setSearchErrorMsg(error instanceof Error ? error.message : "검색 중 네트워크 오류가 발생했습니다.");
    } finally {
      setSearchLoading(false);
    }
  };

  // 선택 결과 자동 대입 (Auto-fill)
  const handleSelectResult = (result: PlaceSearchResult) => {
    setSearchResults([result]);
    setSelectedIdx(0);

    // 1. 기본 이름 및 주소
    onNewPlaceNameChange(result.name);
    onNewPlaceAddressChange(result.address || "");

    // 2. 구글 맵스 링크 완성
    if (result.latitude !== undefined && result.longitude !== undefined) {
      const baseUrl = `https://www.google.com/maps/search/?api=1&query=${result.latitude},${result.longitude}`;
      const urlWithPlaceId = result.googlePlaceId 
        ? `${baseUrl}&query_place_id=${result.googlePlaceId}` 
        : baseUrl;
      onNewPlaceGoogleMapsURLChange(urlWithPlaceId);
    } else {
      onNewPlaceGoogleMapsURLChange("");
    }

    // 3. 중국(상하이) 여행인 경우 상세 특화 필드 대입
    if (isChinaTrip) {
      onNewPlaceChineseNameChange(result.chineseName || "");
      onNewPlaceChineseAddressChange(result.chineseAddress || "");
      onNewPlaceSubwayExitChange(result.subwayExit || "");
      onNewPlaceTaxiPhraseChange(result.taxiPhrase || "");
    }

    const inferredCategory = inferPlaceCategory(searchQuery);
    if (inferredCategory) {
      onNewPlaceCategoryChange(inferredCategory);
    }

    onNewPlaceSearchSelectionChange({
      latitude: result.latitude,
      longitude: result.longitude,
      googlePlaceId: result.googlePlaceId,
    });

    requestAnimationFrame(() =>
      document.getElementById("place-create-form")?.scrollIntoView?.({ behavior: "smooth", block: "start" }),
    );
  };

  return (
    <section className="owner-linked-data-section">
      <div className="section-title-row compact-title-row">
        <div>
          <h3>장소</h3>
          <p className="section-caption">숙소, 식당, 이동 장소처럼 일정에 연결할 후보를 먼저 저장합니다.</p>
        </div>
      </div>

      <section
        aria-busy={searchLoading}
        aria-labelledby="place-search-title"
        className="place-search-panel"
      >
        <div className="place-search-heading">
          <span className="place-search-icon" aria-hidden="true">
            <Compass size={18} />
          </span>
          <div>
            <h4 id="place-search-title">장소 검색</h4>
            <p>
              장소를 선택하면 이름·주소·지도 위치를 자동으로 채웁니다. 저장 후
              목적지에 맞는 지도로 길찾기할 수 있습니다.
            </p>
          </div>
        </div>

        <div className="place-search-controls">
          <input
            aria-label="장소 검색어"
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleSearch();
              }
            }}
            placeholder={isChinaTrip ? "장소·종류 예: 신천지, 카페, 식당" : "장소·종류 예: 센간엔, 카페, 식당"}
            type="text"
            value={searchQuery}
          />
          <button
            className="secondary-button compact-button"
            disabled={searchLoading}
            onClick={() => void handleSearch()}
            type="button"
          >
            {searchLoading ? (
              <>
                <Loader2 aria-hidden="true" className="animate-spin" size={16} />
                검색 중
              </>
            ) : (
              <>
                <Search aria-hidden="true" size={16} />
                검색
              </>
            )}
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="place-search-results">
            <div className="place-search-results-header">
              <span>
                {selectedIdx === null ? `검색된 후보 (${searchResults.length}개)` : "선택한 장소"}
              </span>
              <a
                href="https://maps.google.com"
                rel="noreferrer"
                target="_blank"
              >
                Google Maps 제공
              </a>
            </div>
            {searchResults.map((result, idx) => {
              const isSelected = selectedIdx === idx;
              return (
                <button
                  aria-pressed={isSelected}
                  className={`place-search-result${isSelected ? " selected" : ""}`}
                  key={`${result.googlePlaceId ?? "place"}-${result.latitude ?? "x"}-${result.longitude ?? "y"}-${result.name}`}
                  onClick={() => handleSelectResult(result)}
                  type="button"
                >
                  <div className="place-search-result-copy">
                    <strong>{result.name}</strong>
                    {result.address && (
                      <span>{result.address}</span>
                    )}
                  </div>
                  {isSelected ? (
                    <span className="place-search-result-state selected">
                      <Check aria-hidden="true" size={15} />
                      선택됨
                    </span>
                  ) : (
                    <span className="place-search-result-state">선택</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {searchErrorMsg && (
          <div className="place-search-error" role="alert">
            <AlertCircle aria-hidden="true" size={16} />
            <span>{searchErrorMsg}</span>
          </div>
        )}
      </section>

      <form className="auth-form compact-owner-form" id="place-create-form" onSubmit={onSubmitNewPlace}>
        <div className="form-grid-two">
          <label>
            장소 이름
            <input
              onChange={(event) => {
                setSelectedIdx(null);
                onNewPlaceSearchSelectionChange(null);
                onNewPlaceNameChange(event.target.value);
              }}
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
            onChange={(event) => {
              setSelectedIdx(null);
              onNewPlaceSearchSelectionChange(null);
              onNewPlaceAddressChange(event.target.value);
            }}
            placeholder="예: 공항 1층 또는 숙소 주소"
            type="text"
            value={newPlaceAddress}
          />
        </label>

        <details className="place-advanced-fields">
          <summary>지도 링크·현지 정보·메모</summary>
          <div className="place-advanced-fields-body">
            <label>
              Google Maps 링크
              <input
                inputMode="url"
                onChange={(event) => {
                  setSelectedIdx(null);
                  onNewPlaceSearchSelectionChange(null);
                  onNewPlaceGoogleMapsURLChange(event.target.value);
                }}
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
          </div>
        </details>

        {placeCreateError && <p className="form-error">{placeCreateError}</p>}

        <button className="primary-button" disabled={placeCreateSubmitting} type="submit">
          <PlusCircle size={18} />
          {placeCreateSubmitting ? "장소 추가 중" : selectedIdx === null ? "장소 추가" : "선택한 장소 저장"}
        </button>
      </form>
    </section>
  );
}
