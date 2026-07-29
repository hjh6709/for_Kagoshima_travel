import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

export type GoogleMapsRuntime = {
  Map: typeof google.maps.Map;
  Marker: typeof google.maps.Marker;
  LatLngBounds: typeof google.maps.LatLngBounds;
  circleSymbolPath: google.maps.SymbolPath;
};

let runtimePromise: Promise<GoogleMapsRuntime> | null = null;

export function loadGoogleMaps(): Promise<GoogleMapsRuntime> {
  if (runtimePromise) return runtimePromise;

  const key = import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY?.trim();
  if (!key) {
    return Promise.reject(new Error("Google Maps browser key is missing"));
  }

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
    Map: maps.Map,
    Marker: marker.Marker,
    LatLngBounds: core.LatLngBounds,
    circleSymbolPath: core.SymbolPath.CIRCLE,
  }));

  return runtimePromise;
}
