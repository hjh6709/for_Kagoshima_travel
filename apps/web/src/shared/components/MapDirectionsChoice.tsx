import { useState } from "react";
import { Map, Navigation } from "lucide-react";
import {
  getAmapDirectionsUrl,
  getAmapSearchUrl,
  getGoogleDirectionsUrl,
  type MappablePlace,
} from "../../utils/mapLinks";

type MapDirectionsChoiceProps = {
  destinationCountry?: string;
  place: MappablePlace & { name: string };
};

// 길찾기 진입점마다 같은 지도 선택 흐름을 제공한다.
export function MapDirectionsChoice({ destinationCountry, place }: MapDirectionsChoiceProps) {
  const [isOpen, setIsOpen] = useState(false);
  const amapDirectionsUrl = destinationCountry === "CN" ? getAmapDirectionsUrl(place) : undefined;
  const amapUrl = destinationCountry === "CN" ? amapDirectionsUrl || getAmapSearchUrl(place) : undefined;

  return (
    <div className="directions-choice">
      <button
        aria-expanded={isOpen}
        className="destination-button compact-button directions-trigger"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <Navigation size={16} />
        길찾기 지도 선택
      </button>

      {isOpen && (
        <div
          aria-label="길찾기 지도 선택"
          className="directions-options"
          role="group"
        >
          <span>
            사용할 지도 앱을 선택하세요
          </span>
          <div className={amapUrl ? "directions-grid two-options" : "directions-grid"}>
            {amapUrl && (
              <a
                className="primary-button compact-button directions-link"
                href={amapUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                <Map size={15} />
                {amapDirectionsUrl ? "고덕지도" : "고덕지도에서 찾기"}
              </a>
            )}
            <a
              className="secondary-button compact-button directions-link"
              href={getGoogleDirectionsUrl(place)}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Map size={15} />
              Google 지도
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
