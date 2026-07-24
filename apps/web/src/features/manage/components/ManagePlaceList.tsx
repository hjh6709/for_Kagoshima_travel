import { useState } from "react";
import { Check, Copy, Edit3, ExternalLink, Maximize2, Navigation, Save, Trash2, X } from "lucide-react";
import { getAmapDirectionsUrl, getAmapSearchUrl, getPlaceCopyText } from "../../../utils/mapLinks";
import { placeCategoryOptions } from "../../../shared/travelOptions";
import type { PlaceCategory } from "../../../types/travel";
import type { TripManagePageProps } from "../manageTypes";

type ManagePlaceListProps = Pick<
  TripManagePageProps,
  | "deletingPlaceID"
  | "editingPlaceAddress"
  | "editingPlaceCategory"
  | "editingPlaceGoogleMapsURL"
  | "editingPlaceID"
  | "editingPlaceName"
  | "editingPlaceRecommendedReason"
  | "editingPlaceChineseName"
  | "editingPlaceChineseAddress"
  | "editingPlaceSubwayExit"
  | "editingPlaceTaxiPhrase"
  | "isPlaceListEditing"
  | "onCancelPlaceEdit"
  | "onDeletePlace"
  | "onEditingPlaceAddressChange"
  | "onEditingPlaceCategoryChange"
  | "onEditingPlaceGoogleMapsURLChange"
  | "onEditingPlaceNameChange"
  | "onEditingPlaceRecommendedReasonChange"
  | "onEditingPlaceChineseNameChange"
  | "onEditingPlaceChineseAddressChange"
  | "onEditingPlaceSubwayExitChange"
  | "onEditingPlaceTaxiPhraseChange"
  | "onPlaceListEditingChange"
  | "onStartPlaceEdit"
  | "onSubmitPlaceEdit"
  | "ownerDetailDataError"
  | "ownerDetailDataLoading"
  | "ownerPlaces"
  | "placeDeleteError"
  | "placeEditError"
  | "placeEditSubmitting"
>;

type ExtraManagePlaceListProps = {
  destinationCountry?: string;
};

// 서버에 저장되어 일정에서 참조되는 장소 목록만 담당한다. 수정/삭제 버튼은 편집 모드에서만 노출한다.
export function ManagePlaceList({
  deletingPlaceID,
  editingPlaceAddress,
  editingPlaceCategory,
  editingPlaceGoogleMapsURL,
  editingPlaceID,
  editingPlaceName,
  editingPlaceRecommendedReason,
  editingPlaceChineseName,
  editingPlaceChineseAddress,
  editingPlaceSubwayExit,
  editingPlaceTaxiPhrase,
  isPlaceListEditing,
  onCancelPlaceEdit,
  onDeletePlace,
  onEditingPlaceAddressChange,
  onEditingPlaceCategoryChange,
  onEditingPlaceGoogleMapsURLChange,
  onEditingPlaceNameChange,
  onEditingPlaceRecommendedReasonChange,
  onEditingPlaceChineseNameChange,
  onEditingPlaceChineseAddressChange,
  onEditingPlaceSubwayExitChange,
  onEditingPlaceTaxiPhraseChange,
  onPlaceListEditingChange,
  onStartPlaceEdit,
  onSubmitPlaceEdit,
  ownerDetailDataError,
  ownerDetailDataLoading,
  ownerPlaces,
  placeDeleteError,
  placeEditError,
  placeEditSubmitting,
  destinationCountry,
}: ManagePlaceListProps & ExtraManagePlaceListProps) {
  const [copiedPlaceID, setCopiedPlaceID] = useState("");
  const [zoomedPlace, setZoomedPlace] = useState<{
    name: string;
    address?: string;
    chineseName?: string;
    chineseAddress?: string;
    taxiPhrase?: string;
  } | null>(null);

  async function copyPlaceInfo(placeID: string) {
    const place = ownerPlaces.find((item) => item.id === placeID);
    const copyText = place ? getPlaceCopyText(place, destinationCountry === "CN") : "";
    if (!copyText || !navigator.clipboard) return;

    try {
      await navigator.clipboard.writeText(copyText);
      setCopiedPlaceID(placeID);
      window.setTimeout(() => setCopiedPlaceID(""), 2000);
    } catch {
      setCopiedPlaceID("");
    }
  }

  return (
    <section className="owner-linked-data-section">
      <div className="section-title-row compact-title-row">
        <div>
          <h3>공유되는 장소</h3>
          <p className="section-caption">일정에서 참조하거나 공유 화면에 표시되는 장소입니다.</p>
        </div>
        <div className="section-actions">
          <span className="pill subtle">{ownerPlaces.length}개</span>
          <button
            className="secondary-button compact-button"
            disabled={ownerPlaces.length === 0}
            onClick={() => onPlaceListEditingChange(!isPlaceListEditing)}
            type="button"
          >
            {isPlaceListEditing ? "완료" : "편집"}
          </button>
        </div>
      </div>

      {placeDeleteError && <p className="form-error">{placeDeleteError}</p>}

      {!ownerDetailDataLoading && !ownerDetailDataError && ownerPlaces.length === 0 && (
        <article className="empty-state-card list-card">
          <p className="muted">아직 서버에 저장된 장소가 없습니다.</p>
        </article>
      )}

      {!ownerDetailDataLoading && !ownerDetailDataError && ownerPlaces.length > 0 && (
        <div className="card-stack compact-card-stack">
          {ownerPlaces.map((place) => (
            <article className="owner-linked-card" key={place.id}>
              <div>
                <span className="muted-label">{place.category}</span>
                <h2>{place.name}</h2>
                {destinationCountry === "CN" && place.chineseName && <p className="place-local-name">{place.chineseName}</p>}
                {place.address && <p className="section-caption">{place.address}</p>}
                {destinationCountry === "CN" && place.chineseAddress && (
                  <p className="place-local-address">{place.chineseAddress}</p>
                )}
              </div>
              <div className="owner-linked-actions">
                {place.googleMapsUrl && (
                  <a className="secondary-button compact-button" href={place.googleMapsUrl} rel="noreferrer" target="_blank">
                    <ExternalLink size={16} />
                    지도 열기
                  </a>
                )}
                
                {/* 중국 여행은 저장된 좌표와 현지 정보를 그대로 활용해 고덕지도 길찾기와 복사를 제공한다. */}
                {destinationCountry === "CN" && (
                  <>
                    {(getAmapDirectionsUrl(place) || getAmapSearchUrl(place)) && (
                      <a
                        className="primary-button compact-button"
                        href={getAmapDirectionsUrl(place) || getAmapSearchUrl(place)}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <Navigation size={16} />
                        {getAmapDirectionsUrl(place) ? "고덕지도 길찾기" : "고덕지도 장소 검색"}
                      </a>
                    )}
                    <button
                      className="secondary-button compact-button"
                      onClick={() => void copyPlaceInfo(place.id)}
                      type="button"
                    >
                      {copiedPlaceID === place.id ? <Check size={16} /> : <Copy size={16} />}
                      {copiedPlaceID === place.id ? "복사됨" : "현지정보 복사"}
                    </button>
                    <button
                      className="secondary-button compact-button"
                      onClick={() => setZoomedPlace({
                        name: place.name,
                        address: place.address,
                        chineseName: place.chineseName,
                        chineseAddress: place.chineseAddress,
                        taxiPhrase: place.taxiPhrase,
                      })}
                      type="button"
                      title="큰 글씨로 보기"
                    >
                      <Maximize2 size={14} /> 큰 글씨
                    </button>
                  </>
                )}

                {isPlaceListEditing && (
                  <>
                    <button className="secondary-button compact-button" onClick={() => onStartPlaceEdit(place)} type="button">
                      <Edit3 size={16} />
                      수정
                    </button>
                    <button
                      className="danger-button compact-button"
                      disabled={deletingPlaceID === place.id}
                      onClick={() => onDeletePlace(place.id)}
                      type="button"
                    >
                      <Trash2 size={16} />
                      {deletingPlaceID === place.id ? "삭제 중" : "삭제"}
                    </button>
                  </>
                )}
              </div>
              {isPlaceListEditing && editingPlaceID === place.id && (
                <form className="auth-form compact-owner-form owner-inline-edit-form" onSubmit={onSubmitPlaceEdit}>
                  <div className="form-grid-two">
                    <label>
                      장소 이름
                      <input
                        onChange={(event) => onEditingPlaceNameChange(event.target.value)}
                        required
                        type="text"
                        value={editingPlaceName}
                      />
                    </label>
                    <label>
                      분류
                      <select
                        onChange={(event) => onEditingPlaceCategoryChange(event.target.value as PlaceCategory)}
                        value={editingPlaceCategory}
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
                      onChange={(event) => onEditingPlaceAddressChange(event.target.value)}
                      type="text"
                      value={editingPlaceAddress}
                    />
                  </label>

                  <label>
                    Google Maps 링크
                    <input
                      onChange={(event) => onEditingPlaceGoogleMapsURLChange(event.target.value)}
                      type="url"
                      value={editingPlaceGoogleMapsURL}
                    />
                  </label>

                  {destinationCountry === "CN" && (
                    <fieldset className="local-place-fieldset">
                      <legend>상하이 현지 사용 정보</legend>
                      <label>
                        중국어 장소명
                        <input
                          onChange={(event) => onEditingPlaceChineseNameChange(event.target.value)}
                          type="text"
                          value={editingPlaceChineseName}
                        />
                      </label>
                      <label>
                        중국어 주소
                        <input
                          onChange={(event) => onEditingPlaceChineseAddressChange(event.target.value)}
                          type="text"
                          value={editingPlaceChineseAddress}
                        />
                      </label>
                      <div className="form-grid-two">
                        <label>
                          가까운 지하철 출구
                          <input
                            onChange={(event) => onEditingPlaceSubwayExitChange(event.target.value)}
                            type="text"
                            value={editingPlaceSubwayExit}
                          />
                        </label>
                        <label>
                          택시 문구
                          <input
                            onChange={(event) => onEditingPlaceTaxiPhraseChange(event.target.value)}
                            type="text"
                            value={editingPlaceTaxiPhrase}
                          />
                        </label>
                      </div>
                    </fieldset>
                  )}

                  <label>
                    추천 이유
                    <textarea
                      onChange={(event) => onEditingPlaceRecommendedReasonChange(event.target.value)}
                      rows={2}
                      value={editingPlaceRecommendedReason}
                    />
                  </label>

                  {placeEditError && <p className="form-error">{placeEditError}</p>}

                  <div className="owner-linked-actions">
                    <button className="primary-button compact-button" disabled={placeEditSubmitting} type="submit">
                      <Save size={16} />
                      {placeEditSubmitting ? "저장 중" : "수정 저장"}
                    </button>
                    <button
                      className="secondary-button compact-button"
                      disabled={placeEditSubmitting}
                      onClick={onCancelPlaceEdit}
                      type="button"
                    >
                      <X size={16} />
                      취소
                    </button>
                  </div>
                </form>
              )}
            </article>
          ))}
        </div>
      )}

      {/* 대화면 텍스트 줌 모달 */}
      {zoomedPlace && (
        <div className="modal-overlay" onClick={() => setZoomedPlace(null)}>
          <div className="zoom-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setZoomedPlace(null)}>
              <X size={24} />
            </button>
            <div className="zoom-modal-content">
              <span className="zoom-korean">목적지 안내</span>
              <span className="zoom-korean">{zoomedPlace.name}</span>
              <span className="zoom-foreign">{zoomedPlace.chineseName || zoomedPlace.name}</span>
              {(zoomedPlace.chineseAddress || zoomedPlace.address) && (
                <span className="zoom-pronun" style={{ fontSize: "16px", marginTop: "12px", color: "var(--c-muted)", wordBreak: "break-all" }}>
                  {zoomedPlace.chineseAddress || zoomedPlace.address}
                </span>
              )}
              {zoomedPlace.taxiPhrase && <span className="zoom-taxi-phrase">{zoomedPlace.taxiPhrase}</span>}
            </div>
            <p className="zoom-instruction">현지 직원에게 스마트폰 화면을 직접 보여주세요!</p>
          </div>
        </div>
      )}
    </section>
  );
}
