import { useRef } from "react";
import { Map, X } from "lucide-react";
import { placeCategoryIcons } from "../../features/trip/placeCategoryIcons";
import type { Place } from "../../types/travel";
import { getAmapDirectionsUrl, getGoogleDirectionsUrl, getPlaceMarkerUrl } from "../../utils/mapLinks";
import { placeCategoryLabels } from "../travelOptions";
import { useDialogFocusTrap } from "../useDialogFocusTrap";

type PlaceDetailSheetProps = {
  destinationCountry?: string;
  onClose: () => void;
  place: Place;
};

// 장소 상세 바텀 시트. 지도·일정 어디서 열어도 같은 정보와 같은 길찾기 흐름을 준다.
export function PlaceDetailSheet({ destinationCountry, onClose, place }: PlaceDetailSheetProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  useDialogFocusTrap({ dialogRef, initialFocusRef: closeButtonRef, isOpen: true, onClose });

  const CategoryIcon = placeCategoryIcons[place.category];
  const displayAddress = place.chineseAddress || place.address;
  const isChina = destinationCountry === "CN";
  const amapDirectionsUrl = isChina ? getAmapDirectionsUrl(place) : undefined;
  const amapUrl = isChina ? amapDirectionsUrl || getPlaceMarkerUrl("amap", place) : undefined;

  return (
    <div className="place-sheet-backdrop">
      <div
        aria-label={`${place.name} 상세`}
        aria-modal="true"
        className="place-sheet"
        ref={dialogRef}
        role="dialog"
      >
        <span aria-hidden="true" className="place-sheet-handle" />

        <div className="place-sheet-heading">
          <span aria-hidden="true" className="place-sheet-tile">
            <CategoryIcon size={22} />
          </span>
          <div className="place-sheet-title-copy">
            <h2>{place.name}</h2>
            <p className="place-sheet-category">{placeCategoryLabels[place.category]}</p>
            {place.chineseName && <p className="place-sheet-local">{place.chineseName}</p>}
          </div>
        </div>

        {place.recommendedReason && <p className="place-sheet-description">{place.recommendedReason}</p>}

        {displayAddress && (
          <div className="place-sheet-address">
            <span className="place-sheet-address-label">주소</span>
            <p>{displayAddress}</p>
          </div>
        )}

        <div className="place-sheet-actions">
          {amapUrl && (
            <a
              className="primary-button place-sheet-action"
              href={amapUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Map aria-hidden="true" size={16} />
              {amapDirectionsUrl ? "고덕지도" : "고덕지도 위치 보기"}
            </a>
          )}
          <a
            className={`${amapUrl ? "secondary-button" : "primary-button"} place-sheet-action`}
            href={getGoogleDirectionsUrl(place)}
            rel="noopener noreferrer"
            target="_blank"
          >
            <Map aria-hidden="true" size={16} />
            Google 지도
          </a>
        </div>

        <button className="place-sheet-close" onClick={onClose} ref={closeButtonRef} type="button">
          <X aria-hidden="true" size={16} />
          닫기
        </button>
      </div>
    </div>
  );
}
