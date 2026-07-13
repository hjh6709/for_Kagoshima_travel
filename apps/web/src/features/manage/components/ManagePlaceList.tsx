import { Edit3, ExternalLink, Save, Trash2, X } from "lucide-react";
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
  | "isPlaceListEditing"
  | "onCancelPlaceEdit"
  | "onDeletePlace"
  | "onEditingPlaceAddressChange"
  | "onEditingPlaceCategoryChange"
  | "onEditingPlaceGoogleMapsURLChange"
  | "onEditingPlaceNameChange"
  | "onEditingPlaceRecommendedReasonChange"
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

// 서버에 저장되어 일정에서 참조되는 장소 목록만 담당한다. 수정/삭제 버튼은 편집 모드에서만 노출한다.
export function ManagePlaceList({
  deletingPlaceID,
  editingPlaceAddress,
  editingPlaceCategory,
  editingPlaceGoogleMapsURL,
  editingPlaceID,
  editingPlaceName,
  editingPlaceRecommendedReason,
  isPlaceListEditing,
  onCancelPlaceEdit,
  onDeletePlace,
  onEditingPlaceAddressChange,
  onEditingPlaceCategoryChange,
  onEditingPlaceGoogleMapsURLChange,
  onEditingPlaceNameChange,
  onEditingPlaceRecommendedReasonChange,
  onPlaceListEditingChange,
  onStartPlaceEdit,
  onSubmitPlaceEdit,
  ownerDetailDataError,
  ownerDetailDataLoading,
  ownerPlaces,
  placeDeleteError,
  placeEditError,
  placeEditSubmitting,
}: ManagePlaceListProps) {
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
                {place.address && <p className="section-caption">{place.address}</p>}
              </div>
              <div className="owner-linked-actions">
                {place.googleMapsUrl && (
                  <a className="secondary-button compact-button" href={place.googleMapsUrl} rel="noreferrer" target="_blank">
                    <ExternalLink size={16} />
                    지도 열기
                  </a>
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
    </section>
  );
}
