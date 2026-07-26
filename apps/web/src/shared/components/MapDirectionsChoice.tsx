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
    <div style={{ display: "grid", flex: "1 1 180px", gap: "8px", width: "100%" }}>
      <button
        aria-expanded={isOpen}
        className="secondary-button compact-button"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
        style={{ justifyContent: "center", width: "100%" }}
      >
        <Navigation size={16} />
        길찾기 지도 선택
      </button>

      {isOpen && (
        <div
          aria-label="길찾기 지도 선택"
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: "10px",
            display: "grid",
            gap: "8px",
            padding: "10px",
          }}
        >
          <span style={{ color: "var(--c-muted)", fontSize: "11px", fontWeight: 700 }}>
            사용할 지도 앱을 선택하세요
          </span>
          <div style={{ display: "grid", gap: "6px", gridTemplateColumns: amapUrl ? "1fr 1fr" : "1fr" }}>
            {amapUrl && (
              <a
                className="primary-button compact-button"
                href={amapUrl}
                rel="noopener noreferrer"
                style={{ justifyContent: "center", textAlign: "center", textDecoration: "none" }}
                target="_blank"
              >
                <Map size={15} />
                {amapDirectionsUrl ? "고덕지도" : "고덕지도에서 찾기"}
              </a>
            )}
            <a
              className="secondary-button compact-button"
              href={getGoogleDirectionsUrl(place)}
              rel="noopener noreferrer"
              style={{ justifyContent: "center", textAlign: "center", textDecoration: "none" }}
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
