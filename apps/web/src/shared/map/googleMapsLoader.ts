import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

export type GoogleMapsRuntime = {
  AdvancedMarkerElement: typeof google.maps.marker.AdvancedMarkerElement;
  Map: typeof google.maps.Map;
  LegacyMarker: typeof google.maps.Marker;
  LatLngBounds: typeof google.maps.LatLngBounds;
  PinElement: typeof google.maps.marker.PinElement;
  circleSymbolPath: google.maps.SymbolPath;
  mapID: string;
};

let runtimePromise: Promise<GoogleMapsRuntime> | null = null;

export function loadGoogleMaps(): Promise<GoogleMapsRuntime> {
  if (runtimePromise) return runtimePromise;

  const key = import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY?.trim();
  if (!key) {
    return Promise.reject(new Error("Google Maps browser key is missing"));
  }
  const mapID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID?.trim() ?? "";

  setOptions({
    key,
    language: "ko",
    region: "KR",
    v: "weekly",
    authReferrerPolicy: "origin",
  });

  runtimePromise = Promise.all([
    importLibrary("maps"),
    importLibrary("marker"),
    importLibrary("core"),
  ]).then(([maps, marker, core]) => ({
    AdvancedMarkerElement: marker.AdvancedMarkerElement,
    Map: maps.Map,
    LegacyMarker: marker.Marker,
    LatLngBounds: core.LatLngBounds,
    PinElement: marker.PinElement,
    circleSymbolPath: core.SymbolPath.CIRCLE,
    mapID,
  }));

  return runtimePromise;
}
