import { ExternalLink, Trash2 } from "lucide-react";
import type { TripManagePageProps } from "../manageTypes";

type ManagePlaceListProps = Pick<
  TripManagePageProps,
  | "deletingPlaceID"
  | "isPlaceListEditing"
  | "onDeletePlace"
  | "onPlaceListEditingChange"
  | "ownerDetailDataError"
  | "ownerDetailDataLoading"
  | "ownerPlaces"
  | "placeDeleteError"
>;

// 서버에 저장되어 일정에서 참조되는 장소 목록만 담당한다. 삭제 버튼은 편집 모드에서만 노출한다.
export function ManagePlaceList({
  deletingPlaceID,
  isPlaceListEditing,
  onDeletePlace,
  onPlaceListEditingChange,
  ownerDetailDataError,
  ownerDetailDataLoading,
  ownerPlaces,
  placeDeleteError,
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
                  <button
                    className="danger-button compact-button"
                    disabled={deletingPlaceID === place.id}
                    onClick={() => onDeletePlace(place.id)}
                    type="button"
                  >
                    <Trash2 size={16} />
                    {deletingPlaceID === place.id ? "삭제 중" : "삭제"}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
