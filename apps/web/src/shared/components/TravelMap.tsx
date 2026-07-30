import { AlertTriangle, LocateFixed, MapPin } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { loadGoogleMaps, type GoogleMapsRuntime } from "../map/googleMapsLoader";
import {
  getMapCenter,
  getMappablePlaces,
  getMarkerAppearance,
  type MappableLocation,
} from "../map/mapModel";

type TravelMapProps<T extends MappableLocation> = {
  places: T[];
  selectedPlaceID: string;
  onSelectPlace: (placeID: string) => void;
};

type CurrentLocation = {
  latitude: number;
  longitude: number;
};

type MapLoadState = "idle" | "loading" | "ready" | "error";

function getLocationErrorMessage(error: GeolocationPositionError) {
  if (error.code === error.PERMISSION_DENIED) {
    return "위치 권한을 허용하지 않았습니다. 저장한 장소는 계속 확인할 수 있습니다.";
  }
  if (error.code === error.TIMEOUT) {
    return "현재 위치 확인 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.";
  }
  return "현재 위치를 확인하지 못했습니다. 네트워크와 위치 설정을 확인해 주세요.";
}

export function TravelMap<T extends MappableLocation>({
  places,
  selectedPlaceID,
  onSelectPlace,
}: TravelMapProps<T>) {
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const runtimeRef = useRef<GoogleMapsRuntime | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [loadState, setLoadState] = useState<MapLoadState>("idle");
  const [currentLocation, setCurrentLocation] = useState<CurrentLocation | null>(null);
  const [locationError, setLocationError] = useState("");
  const [locating, setLocating] = useState(false);
  const mappablePlaces = useMemo(() => getMappablePlaces(places), [places]);
  const missingCoordinateCount = places.length - mappablePlaces.length;
  const initialCenter = useMemo(() => getMapCenter(mappablePlaces), [mappablePlaces]);

  useEffect(() => {
    if (!mapElementRef.current || !initialCenter) {
      setLoadState("idle");
      return;
    }

    let active = true;
    setLoadState("loading");

    void loadGoogleMaps()
      .then((runtime) => {
        if (!active || !mapElementRef.current) return;

        const map = new runtime.Map(mapElementRef.current, {
          center: { lat: initialCenter.latitude, lng: initialCenter.longitude },
          zoom: 13,
          clickableIcons: false,
          disableDefaultUI: true,
          gestureHandling: "cooperative",
          zoomControl: true,
        });

        runtimeRef.current = runtime;
        mapRef.current = map;
        setLoadState("ready");
      })
      .catch(() => {
        if (!active) return;
        runtimeRef.current = null;
        mapRef.current = null;
        setLoadState("error");
      });

    return () => {
      active = false;
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      runtimeRef.current = null;
      mapRef.current = null;
    };
  }, [initialCenter]);

  useEffect(() => {
    const map = mapRef.current;
    const runtime = runtimeRef.current;
    if (loadState !== "ready" || !map || !runtime) return;

    markersRef.current.forEach((marker) => marker.setMap(null));
    const bounds = new runtime.LatLngBounds();
    const nextMarkers = mappablePlaces.map((place) => {
      const appearance = getMarkerAppearance(place.id, selectedPlaceID);
      const position = { lat: place.latitude, lng: place.longitude };
      const marker = new runtime.Marker({
        map,
        position,
        title: place.name,
        icon: {
          path: runtime.circleSymbolPath,
          fillColor: appearance.background === "destination" ? "#C94F3D" : "#0B6F6A",
          fillOpacity: 1,
          strokeColor: "#FFFFFF",
          strokeWeight: appearance.selected ? 4 : 3,
          scale: 8 * appearance.scale,
        },
        zIndex: appearance.selected ? 20 : 10,
      });
      marker.addListener("click", () => onSelectPlace(place.id));
      bounds.extend(position);
      return marker;
    });

    if (currentLocation) {
      const position = { lat: currentLocation.latitude, lng: currentLocation.longitude };
      nextMarkers.push(
        new runtime.Marker({
          map,
          position,
          title: "현재 위치",
          icon: {
            path: runtime.circleSymbolPath,
            fillColor: "#17333D",
            fillOpacity: 1,
            strokeColor: "#FFFFFF",
            strokeWeight: 4,
            scale: 7,
          },
          zIndex: 30,
        }),
      );
      bounds.extend(position);
    }

    markersRef.current = nextMarkers;
    const totalPointCount = mappablePlaces.length + (currentLocation ? 1 : 0);
    if (totalPointCount === 1) {
      const point = currentLocation
        ? { lat: currentLocation.latitude, lng: currentLocation.longitude }
        : { lat: mappablePlaces[0].latitude, lng: mappablePlaces[0].longitude };
      map.setCenter(point);
      map.setZoom(14);
    } else if (totalPointCount > 1) {
      map.fitBounds(bounds, 48);
    }

    return () => {
      nextMarkers.forEach((marker) => marker.setMap(null));
    };
  }, [currentLocation, loadState, mappablePlaces, onSelectPlace, selectedPlaceID]);

  const requestCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("이 브라우저에서는 현재 위치를 지원하지 않습니다.");
      return;
    }

    setLocating(true);
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocating(false);
      },
      (error) => {
        setLocationError(getLocationErrorMessage(error));
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 30_000,
        timeout: 10_000,
      },
    );
  };

  return (
    <section aria-label="저장 장소 지도" className="travel-map">
      <div className="travel-map-toolbar">
        <div>
          <span className="travel-map-kicker">
            <MapPin aria-hidden="true" size={15} />
            저장한 위치
          </span>
          <strong>{mappablePlaces.length}개 장소</strong>
        </div>
        {loadState === "ready" && (
          <button
            className="secondary-button compact-button travel-map-location-button"
            disabled={locating}
            onClick={requestCurrentLocation}
            type="button"
          >
            <LocateFixed aria-hidden="true" size={17} />
            {locating ? "위치 확인 중" : currentLocation ? "현재 위치 갱신" : "현재 위치 표시"}
          </button>
        )}
      </div>

      <div className="travel-map-stage">
        <div aria-hidden="true" className="travel-map-canvas" ref={mapElementRef} />

        {!initialCenter && (
          <div className="travel-map-state" role="status">
            <MapPin aria-hidden="true" size={22} />
            <strong>지도에 표시할 위치가 없습니다</strong>
            <p>장소를 검색해서 추가하면 저장된 좌표가 여기에 표시됩니다.</p>
          </div>
        )}

        {initialCenter && loadState === "loading" && (
          <div aria-live="polite" className="travel-map-state" role="status">
            <span aria-hidden="true" className="travel-map-loading-dot" />
            <strong>저장한 장소를 지도에 표시하는 중입니다</strong>
          </div>
        )}

        {initialCenter && loadState === "error" && (
          <div className="travel-map-state travel-map-error" role="status">
            <AlertTriangle aria-hidden="true" size={22} />
            <strong>지도를 준비하지 못했습니다</strong>
            <p>저장한 장소 목록과 길찾기는 계속 사용할 수 있습니다.</p>
          </div>
        )}
      </div>

      {missingCoordinateCount > 0 && (
        <p className="travel-map-coordinate-note">
          <AlertTriangle aria-hidden="true" size={14} />
          지도에 표시할 수 없는 장소 {missingCoordinateCount}개
        </p>
      )}

      {currentLocation && !locationError && (
        <p
          aria-label="현재 위치 표시 상태"
          aria-live="polite"
          className="travel-map-location-success"
          role="status"
        >
          <LocateFixed aria-hidden="true" size={14} />
          현재 위치를 지도에 표시했습니다.
        </p>
      )}

      {locationError && (
        <p className="travel-map-location-error" role="alert">
          {locationError}
        </p>
      )}
    </section>
  );
}
