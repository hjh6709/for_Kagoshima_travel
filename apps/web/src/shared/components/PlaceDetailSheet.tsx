import { useState } from "react";
import { ArrowLeft, Check, Copy, Map, Maximize2, Phone } from "lucide-react";
import { placeCategoryIcons } from "../../features/trip/placeCategoryIcons";
import type { Place } from "../../types/travel";
import { getAmapDirectionsUrl, getGoogleDirectionsUrl, getPlaceMarkerUrl } from "../../utils/mapLinks";
import { placeCategoryLabels } from "../travelOptions";
import { BottomSheet } from "./BottomSheet";

type PlaceDetailSheetProps = {
  destinationCountry?: string;
  onClose: () => void;
  place: Place;
};

// 장소 상세 바텀 시트. 지도·일정 어디서 열어도 같은 정보와 같은 길찾기 흐름을 준다.
export function PlaceDetailSheet({ destinationCountry, onClose, place }: PlaceDetailSheetProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const [isPhraseMode, setIsPhraseMode] = useState(false);

  const CategoryIcon = placeCategoryIcons[place.category];
  const displayAddress = place.chineseAddress || place.address;
  const isChina = destinationCountry === "CN";
  const amapDirectionsUrl = isChina ? getAmapDirectionsUrl(place) : undefined;
  const amapUrl = isChina ? amapDirectionsUrl || getPlaceMarkerUrl("amap", place) : undefined;
  const copyTarget = place.chineseAddress || place.address || "";

  const handleCopyAddress = async () => {
    if (!navigator.clipboard) {
      setCopyError("이 브라우저에서는 주소 복사를 지원하지 않습니다. 주소를 길게 눌러 직접 복사해 주세요.");
      return;
    }
    try {
      await navigator.clipboard.writeText(copyTarget);
      setCopyError("");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      setCopyError("주소를 복사하지 못했습니다. 주소를 길게 눌러 직접 복사해 주세요.");
    }
  };

  return (
    <BottomSheet ariaLabel={`${place.name} 상세`} onClose={onClose}>
        {isPhraseMode ? (
          <div className="place-sheet-phrase">
            <p className="place-sheet-phrase-label">택시 기사님께 보여주세요</p>
            <h2 className="place-sheet-phrase-title">{place.chineseName || place.name}</h2>
            <p className="place-sheet-phrase-label">현지 주소</p>
            <p className="place-sheet-phrase-address">
              {place.chineseAddress || place.address || "주소 정보 없음"}
            </p>
            <button
              className="secondary-button place-sheet-action"
              onClick={() => setIsPhraseMode(false)}
              type="button"
            >
              <ArrowLeft aria-hidden="true" size={16} />
              장소 정보로 돌아가기
            </button>
          </div>
        ) : (
          <>
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

        {/* 숙소 연락처는 긴급 탭에서도 이 place.phone을 그대로 쓴다 — 지도에서 장소를
            찾은 김에 바로 전화도 걸 수 있어야 하는데, 이 시트에는 빠져 있었다. */}
        {place.phone && (
          <a className="place-sheet-phone" href={`tel:${place.phone}`}>
            <Phone aria-hidden="true" size={16} />
            {place.phone}
          </a>
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

        <div className="place-sheet-utilities">
          {copyTarget && (
            <button
              className="secondary-button place-sheet-action"
              onClick={() => void handleCopyAddress()}
              type="button"
            >
              {copied ? <Check aria-hidden="true" size={16} /> : <Copy aria-hidden="true" size={16} />}
              주소 복사
            </button>
          )}
          {isChina && (
            <button
              className="secondary-button place-sheet-action"
              onClick={() => setIsPhraseMode(true)}
              type="button"
            >
              <Maximize2 aria-hidden="true" size={16} />
              기사님께 보기
            </button>
          )}
        </div>

        {copyError && (
          <p className="place-sheet-copy-error" role="alert">
            {copyError}
          </p>
        )}
          </>
        )}

    </BottomSheet>
  );
}
