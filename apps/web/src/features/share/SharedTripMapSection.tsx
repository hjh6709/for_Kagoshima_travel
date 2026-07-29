import { AlertTriangle, Check, Copy, MapPin, Maximize2, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { SharedTripResponse } from "../../api/trips";
import { MapDirectionsChoice } from "../../shared/components/MapDirectionsChoice";
import { TravelMap } from "../../shared/components/TravelMap";
import { placeCategoryLabels } from "../../shared/travelOptions";
import { getPlaceCopyText } from "../../utils/mapLinks";

type SharedTripMapSectionProps = {
  sharedTrip: SharedTripResponse;
};

export function SharedTripMapSection({ sharedTrip }: SharedTripMapSectionProps) {
  const [selectedPlaceID, setSelectedPlaceID] = useState(sharedTrip.places[0]?.id ?? "");
  const [copiedPlaceID, setCopiedPlaceID] = useState("");
  const [copyError, setCopyError] = useState("");
  const [zoomedPlaceID, setZoomedPlaceID] = useState("");
  const selectedPlace =
    sharedTrip.places.find((place) => place.id === selectedPlaceID) ?? sharedTrip.places[0];
  const zoomedPlace = sharedTrip.places.find((place) => place.id === zoomedPlaceID);
  const isChina = sharedTrip.trip.destinationCountry === "CN";

  useEffect(() => {
    if (!selectedPlaceID && sharedTrip.places[0]) {
      setSelectedPlaceID(sharedTrip.places[0].id);
    }
  }, [selectedPlaceID, sharedTrip.places]);

  const copyPlaceInfo = async (placeID: string) => {
    const place = sharedTrip.places.find((item) => item.id === placeID);
    const copyText = place ? getPlaceCopyText(place, isChina) : "";
    if (!copyText || !navigator.clipboard) {
      setCopyError("이 브라우저에서는 장소 정보를 복사할 수 없습니다.");
      return;
    }

    try {
      await navigator.clipboard.writeText(copyText);
      setCopyError("");
      setCopiedPlaceID(placeID);
      window.setTimeout(() => setCopiedPlaceID(""), 2000);
    } catch {
      setCopiedPlaceID("");
      setCopyError("장소 정보를 복사하지 못했습니다. 주소를 길게 눌러 복사해 주세요.");
    }
  };

  return (
    <section aria-labelledby="shared-map-title" className="shared-section shared-map-section">
      <div className="shared-section-heading">
        <div>
          <h2 id="shared-map-title">여행 지도</h2>
          <p>현재 위치와 저장 장소를 함께 확인하세요.</p>
        </div>
        <span className="shared-count">{sharedTrip.places.length}</span>
      </div>

      <TravelMap
        onSelectPlace={setSelectedPlaceID}
        places={sharedTrip.places}
        selectedPlaceID={selectedPlace?.id ?? ""}
      />

      {sharedTrip.places.length === 0 ? (
        <div className="shared-empty-state">
          <MapPin aria-hidden="true" size={22} />
          <strong>공유된 장소가 없습니다</strong>
          <p>여행 관리자가 장소를 추가하면 여기에 표시됩니다.</p>
        </div>
      ) : (
        <>
          <div className="shared-place-browser">
            <h3>저장한 장소</h3>
            <ul>
              {sharedTrip.places.map((place, index) => {
                const selected = place.id === selectedPlace?.id;
                const category =
                  placeCategoryLabels[place.category as keyof typeof placeCategoryLabels] ?? place.category;
                return (
                  <li key={place.id}>
                    <button
                      aria-pressed={selected}
                      className={selected ? "selected" : ""}
                      onClick={() => setSelectedPlaceID(place.id)}
                      type="button"
                    >
                      <span className="shared-place-index" aria-hidden="true">
                        {index + 1}
                      </span>
                      <span>
                        <small>{category}</small>
                        <strong>{place.name}</strong>
                        {place.address && <span>{place.address}</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {selectedPlace && (
            <article className="shared-selected-place">
              <div className="shared-selected-place-heading">
                <div>
                  <span className="shared-place-label">
                    <MapPin aria-hidden="true" size={14} />
                    선택한 장소
                  </span>
                  <h3>{selectedPlace.name}</h3>
                  {isChina && selectedPlace.chineseName && (
                    <p className="shared-place-local-name">{selectedPlace.chineseName}</p>
                  )}
                </div>
              </div>

              {(selectedPlace.chineseAddress || selectedPlace.address) && (
                <p className="shared-place-address">
                  {selectedPlace.chineseAddress || selectedPlace.address}
                </p>
              )}
              {selectedPlace.recommendedReason && (
                <p className="shared-place-reason">{selectedPlace.recommendedReason}</p>
              )}

              <div className="shared-place-actions">
                <MapDirectionsChoice
                  destinationCountry={sharedTrip.trip.destinationCountry}
                  place={selectedPlace}
                />
                {isChina && (
                  <div className="shared-place-secondary-actions">
                    <button
                      className="secondary-button compact-button"
                      onClick={() => void copyPlaceInfo(selectedPlace.id)}
                      type="button"
                    >
                      {copiedPlaceID === selectedPlace.id ? (
                        <Check aria-hidden="true" size={16} />
                      ) : (
                        <Copy aria-hidden="true" size={16} />
                      )}
                      {copiedPlaceID === selectedPlace.id ? "복사됨" : "현지정보 복사"}
                    </button>
                    <button
                      className="secondary-button compact-button"
                      onClick={() => setZoomedPlaceID(selectedPlace.id)}
                      type="button"
                    >
                      <Maximize2 aria-hidden="true" size={16} />
                      크게 보기
                    </button>
                  </div>
                )}
              </div>
            </article>
          )}
        </>
      )}

      {copyError && (
        <p className="shared-copy-error" role="alert">
          <AlertTriangle aria-hidden="true" size={15} />
          {copyError}
        </p>
      )}

      {zoomedPlace && (
        <div
          aria-label="현지에서 보여줄 장소 정보"
          aria-modal="true"
          className="shared-place-dialog"
          role="dialog"
        >
          <button
            aria-label="장소 크게 보기 닫기"
            className="shared-place-dialog-close"
            onClick={() => setZoomedPlaceID("")}
            type="button"
          >
            <X aria-hidden="true" size={22} />
          </button>
          <p>현지 직원에게 보여주세요</p>
          <strong>{zoomedPlace.chineseName || zoomedPlace.name}</strong>
          <span>{zoomedPlace.chineseAddress || zoomedPlace.address}</span>
          {zoomedPlace.taxiPhrase && <em>{zoomedPlace.taxiPhrase}</em>}
        </div>
      )}
    </section>
  );
}
