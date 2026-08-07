export type MappableLocation = {
  id: string;
  name: string;
  latitude?: number;
  longitude?: number;
};

export type MapPoint = Pick<MappableLocation, "id" | "name"> & {
  latitude: number;
  longitude: number;
};

export function getMappablePlaces<T extends MappableLocation>(
  places: T[],
): Array<T & { latitude: number; longitude: number }> {
  return places.filter(
    (place): place is T & { latitude: number; longitude: number } =>
      typeof place.latitude === "number" &&
      typeof place.longitude === "number" &&
      Number.isFinite(place.latitude) &&
      Number.isFinite(place.longitude) &&
      place.latitude >= -90 &&
      place.latitude <= 90 &&
      place.longitude >= -180 &&
      place.longitude <= 180,
  );
}

export function getMapCenter(points: MapPoint[]): { latitude: number; longitude: number } | null {
  if (points.length === 0) return null;

  return {
    latitude: points.reduce((sum, point) => sum + point.latitude, 0) / points.length,
    longitude: points.reduce((sum, point) => sum + point.longitude, 0) / points.length,
  };
}

/**
 * 지도 핀은 Google Maps에 문자열로 넘겨야 해서 CSS 변수를 쓸 수 없다.
 * tokens.css의 --c-destination / --c-route / --c-text와 값을 맞춰 둔다.
 * 팔레트를 바꿀 때 여기도 함께 고쳐야 지도만 옛 색으로 남지 않는다.
 */
export const MARKER_COLORS = {
  destination: "#437033",
  route: "#2e4374",
  currentLocation: "#191b1f",
} as const;

export function getMarkerAppearance(placeID: string, selectedPlaceID: string) {
  const selected = placeID === selectedPlaceID;
  return {
    background: selected ? "destination" : "route",
    color: selected ? MARKER_COLORS.destination : MARKER_COLORS.route,
    scale: selected ? 1.15 : 1,
    selected,
  } as const;
}
