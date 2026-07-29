export type MappableLocation = {
  id: string;
  name: string;
  latitude?: number;
  longitude?: number;
};

export type MapPoint = Required<Pick<MappableLocation, "id" | "name" | "latitude" | "longitude">>;

export function getMappablePlaces<T extends MappableLocation>(
  places: T[],
): Array<T & Required<Pick<T, "latitude" | "longitude">>> {
  return places.filter(
    (place): place is T & Required<Pick<T, "latitude" | "longitude">> =>
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
