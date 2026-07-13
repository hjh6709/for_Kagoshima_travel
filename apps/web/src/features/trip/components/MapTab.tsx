import { MapPin } from "lucide-react";
import { placeCategoryLabels } from "../../../shared/travelOptions";
import type { TripPageProps } from "../tripPageTypes";

// 지도 탭 렌더링만 담당한다. 지도 링크 생성은 상위에서 전달한 헬퍼를 사용한다.
export function MapTab({ getMapUrl, places }: TripPageProps) {
  return (
    <section className="screen">
      <h1>지도와 추천 장소</h1>
      <div className="map-preview">
        {places.map((place, index) => (
          <a
            className={`map-pin pin-${index + 1}`}
            href={getMapUrl(place)}
            key={place.id}
            rel="noopener noreferrer"
            target="_blank"
            title={place.name}
          >
            <MapPin size={18} />
          </a>
        ))}
      </div>
      <div className="card-stack">
        {places.map((place) => (
          <article className="place-card" key={place.id}>
            <div>
              <span className="pill subtle">{placeCategoryLabels[place.category]}</span>
              <h2>{place.name}</h2>
              <p>{place.recommendedReason}</p>
              {place.address && <p className="muted">{place.address}</p>}
              {place.cautionMemo && <p className="schedule-detail danger-note">{place.cautionMemo}</p>}
            </div>
            <div className="card-footer">
              <span>{placeCategoryLabels[place.category]}</span>
              <a
                className="secondary-button compact-button"
                href={getMapUrl(place)}
                rel="noopener noreferrer"
                target="_blank"
              >
                <MapPin size={18} />
                보기
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
