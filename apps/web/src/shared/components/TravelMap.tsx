import { AlertTriangle, LocateFixed, MapPin } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { loadGoogleMaps, type GoogleMapsRuntime } from "../map/googleMapsLoader";
import {
  MARKER_COLORS,
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

type RemovableMarker = {
  remove: () => void;
};

type CreateMarkerOptions = {
  background: string;
  glyphText?: string;
  legacyStrokeWeight: number;
  map: google.maps.Map;
  onClick?: () => void;
  position: google.maps.LatLngLiteral;
  runtime: GoogleMapsRuntime;
  scale: number;
  title: string;
  zIndex: number;
};

function createMapMarker({
  background,
  glyphText,
  legacyStrokeWeight,
  map,
  onClick,
  position,
  runtime,
  scale,
  title,
  zIndex,
}: CreateMarkerOptions): RemovableMarker {
  if (runtime.mapID) {
    const pin = new runtime.PinElement({
      background,
      borderColor: "#FFFFFF",
      glyphColor: "#FFFFFF",
      glyphText,
      scale,
    });
    const marker = new runtime.AdvancedMarkerElement({
      gmpClickable: Boolean(onClick),
      map,
      position,
      title,
      zIndex,
    });
    marker.append(pin);
    if (onClick) marker.addListener("click", onClick);

    return {
      remove: () => {
        marker.map = null;
      },
    };
  }

  const marker = new runtime.LegacyMarker({
    map,
    position,
    title,
    icon: {
      path: runtime.circleSymbolPath,
      fillColor: background,
      fillOpacity: 1,
      strokeColor: "#FFFFFF",
      strokeWeight: legacyStrokeWeight,
      scale: 8 * scale,
    },
    zIndex,
  });
  if (onClick) marker.addListener("click", onClick);

  return {
    remove: () => marker.setMap(null),
  };
}

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
  const markersRef = useRef<RemovableMarker[]>([]);
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
          ...(runtime.mapID ? { mapId: runtime.mapID } : {}),
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
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      runtimeRef.current = null;
      mapRef.current = null;
    };
  }, [initialCenter]);

  useEffect(() => {
    const map = mapRef.current;
    const runtime = runtimeRef.current;
    if (loadState !== "ready" || !map || !runtime) return;

    markersRef.current.forEach((marker) => marker.remove());
    const bounds = new runtime.LatLngBounds();
    const nextMarkers = mappablePlaces.map((place) => {
      const appearance = getMarkerAppearance(place.id, selectedPlaceID);
      const position = { lat: place.latitude, lng: place.longitude };
      const marker = createMapMarker({
        background: appearance.color,
        legacyStrokeWeight: appearance.selected ? 4 : 3,
        map,
        onClick: () => onSelectPlace(place.id),
        position,
        runtime,
        scale: appearance.scale,
        title: place.name,
        zIndex: appearance.selected ? 20 : 10,
      });
      bounds.extend(position);
      return marker;
    });

    if (currentLocation) {
      const position = { lat: currentLocation.latitude, lng: currentLocation.longitude };
      nextMarkers.push(
        createMapMarker({
          background: MARKER_COLORS.currentLocation,
          glyphText: "●",
          legacyStrokeWeight: 4,
          map,
          position,
          runtime,
          scale: 0.9,
          title: "현재 위치",
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
      nextMarkers.forEach((marker) => marker.remove());
    };
  }, [currentLocation, loadState, mappablePlaces, onSelectPlace, selectedPlaceID]);

  const requestCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("이 브라우저에서는 현재 위치를 지원하지 않습니다.");
      return;
    }

    setLocating(true);
    setLocationError("");
    const handleSuccess: PositionCallback = (position) => {
      setCurrentLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setLocating(false);
    };
    const handleFallbackError: PositionErrorCallback = (error) => {
      setLocationError(getLocationErrorMessage(error));
      setLocating(false);
    };
    const handleHighAccuracyError: PositionErrorCallback = (error) => {
      if (error.code === error.PERMISSION_DENIED) {
        handleFallbackError(error);
        return;
      }

      navigator.geolocation.getCurrentPosition(handleSuccess, handleFallbackError, {
        enableHighAccuracy: false,
        maximumAge: 300_000,
        timeout: 10_000,
      });
    };

    navigator.geolocation.getCurrentPosition(handleSuccess, handleHighAccuracyError, {
      enableHighAccuracy: true,
      maximumAge: 30_000,
      timeout: 10_000,
    });
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
