import { useState } from "react";
import { PlusCircle, Search, Check, Loader2, Compass, AlertCircle } from "lucide-react";
import { searchTripPlaces, type PlaceSearchResult } from "../../../api/trips";
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
  const handleSelectResult = (result: PlaceSearchResult, idx: number) => {
    setSelectedIdx(idx);

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
      onNewPlaceChineseNameChange(result.chineseName || result.name);
      onNewPlaceChineseAddressChange(result.chineseAddress || result.address || "");
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
  };

  return (
    <section className="owner-linked-data-section">
      <div className="section-title-row compact-title-row">
        <div>
          <h3>장소</h3>
          <p className="section-caption">숙소, 식당, 이동 장소처럼 일정에 연결할 후보를 먼저 저장합니다.</p>
        </div>
      </div>

      {/* 지도 데이터 기반 통합 검색 컴포넌트 추가 */}
      <div style={{ background: "var(--c-green-light)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
        <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--c-text)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
          <Compass size={16} style={{ color: "var(--c-green)" }} />
          지도 통합 검색 (구글 맵스 / 고덕지도 연동)
        </h4>
        <p style={{ fontSize: "12px", color: "var(--c-muted)", marginBottom: "12px" }}>
          지명이나 상호명을 검색해 선택하면 주소와 지도 위치가 자동으로 저장됩니다.
        </p>
        
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleSearch();
              }
            }}
            placeholder={isChinaTrip ? "장소·종류 예: 신천지, 카페, 식당" : "장소·종류 예: 센간엔, 카페, 식당"}
            style={{ flex: 1, padding: "8px 12px", fontSize: "14px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--c-surface)", color: "var(--c-text)" }}
            type="text"
            value={searchQuery}
          />
          <button
            className="secondary-button compact-button"
            disabled={searchLoading}
            onClick={() => void handleSearch()}
            type="button"
            style={{ display: "flex", alignItems: "center", gap: "4px", padding: "0 14px", minWidth: "80px", justifyContent: "center" }}
          >
            {searchLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            검색
          </button>
        </div>

        {/* 검색 결과 리스트 */}
        {searchResults.length > 0 && (
          <div style={{ marginTop: "14px", display: "grid", gap: "8px", maxHeight: "200px", overflowY: "auto", paddingRight: "4px" }}>
            <span style={{ fontSize: "12px", color: "var(--c-muted)", fontWeight: 700 }}>검색된 후보 ({searchResults.length}개)</span>
            {searchResults.map((result, idx) => {
              const isSelected = selectedIdx === idx;
              return (
                <button
                  key={`${result.googlePlaceId ?? "place"}-${result.latitude ?? "x"}-${result.longitude ?? "y"}-${result.name}`}
                  onClick={() => handleSelectResult(result, idx)}
                  type="button"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: isSelected ? "1px solid var(--c-green)" : "1px solid var(--border-color)",
                    background: isSelected ? "var(--c-surface)" : "rgba(255,255,255,0.6)",
                    textAlign: "left",
                    width: "100%",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  <div style={{ flex: 1, paddingRight: "8px" }}>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: isSelected ? "var(--c-green)" : "var(--c-text)" }}>
                      {result.name}
                    </div>
                    {result.address && (
                      <div style={{ fontSize: "12px", color: "var(--c-muted)", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {result.address}
                      </div>
                    )}
                  </div>
                  {isSelected ? (
                    <span style={{ color: "var(--c-green)", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: 500 }}>
                      <Check size={14} />
                      선택됨
                    </span>
                  ) : (
                    <span style={{ fontSize: "12px", color: "var(--c-green)", border: "1px solid var(--c-green)", borderRadius: "4px", padding: "2px 6px" }}>
                      선택
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {searchErrorMsg && (
          <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "12px", color: "var(--c-danger)", fontSize: "12px" }}>
            <AlertCircle size={14} />
            <span>{searchErrorMsg}</span>
          </div>
        )}
      </div>

      <form className="auth-form compact-owner-form" onSubmit={onSubmitNewPlace}>
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

        {placeCreateError && <p className="form-error">{placeCreateError}</p>}

        <button className="primary-button" disabled={placeCreateSubmitting} type="submit">
          <PlusCircle size={18} />
          {placeCreateSubmitting ? "장소 추가 중" : "장소 추가"}
        </button>
      </form>
    </section>
  );
}
