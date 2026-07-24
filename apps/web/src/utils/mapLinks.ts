export type TravelMode = "walking" | "driving" | "transit";
export type MapTravelMode = TravelMode;

export type MappablePlace = {
  destinationCountry?: string;
  latitude?: number;
  longitude?: number;
  name?: string;
  address?: string;
  googleMapsUrl?: string;
  googlePlaceId?: string;
  chineseName?: string;
  chineseAddress?: string;
  subwayExit?: string;
  taxiPhrase?: string;
};

export type MapLinkParams = MappablePlace & { name: string };

const amapModeByTravelMode: Record<TravelMode, "walk" | "car" | "bus"> = {
  walking: "walk",
  driving: "car",
  transit: "bus",
};

export function hasPlaceCoordinates(place?: MappablePlace): place is MappablePlace & {
  latitude: number;
  longitude: number;
} {
  return Number.isFinite(place?.latitude) && Number.isFinite(place?.longitude);
}

export function getAmapDirectionsUrl(place: MappablePlace, mode: TravelMode = "transit") {
  if (!hasPlaceCoordinates(place)) return undefined;

  const destinationName = place.chineseName || place.name || "目的地";
  const params = new URLSearchParams({
    from: "",
    to: `${place.longitude},${place.latitude},${destinationName}`,
    mode: amapModeByTravelMode[mode],
    src: "map-planner",
    callnative: "1",
  });
  return `https://uri.amap.com/navigation?${params.toString()}`;
}

export function getAmapSearchUrl(place: MappablePlace) {
  const keyword = place.chineseName || place.chineseAddress || place.name || place.address;
  if (!keyword) return undefined;

  const params = new URLSearchParams({
    keyword,
    city: "310000",
    view: "map",
    src: "map-planner",
    callnative: "1",
  });
  return `https://uri.amap.com/search?${params.toString()}`;
}

export function getGoogleDirectionsUrl(place?: MappablePlace, mode: TravelMode = "transit") {
  if (!place) return "https://www.google.com/maps/dir/?api=1";

  const destination = hasPlaceCoordinates(place)
    ? `${place.latitude},${place.longitude}`
    : place.address || place.name;
  if (!destination) return place.googleMapsUrl || "https://www.google.com/maps/dir/?api=1";

  const params = new URLSearchParams({ api: "1", destination, travelmode: mode });
  if (place.googlePlaceId) params.set("destination_place_id", place.googlePlaceId);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/** 국가와 이동 수단에 맞는 외부 지도 URL을 반환한다. 좌표가 없으면 검색 화면으로 안전하게 대체한다. */
export function getDirectionUrl(
  provider: "amap" | "google" | "apple",
  params: MapLinkParams,
  mode: TravelMode
): string {
  if (provider === "amap") {
    return getAmapDirectionsUrl(params, mode) || getAmapSearchUrl(params) || "https://uri.amap.com/search";
  }
  if (provider === "google") return getGoogleDirectionsUrl(params, mode);

  if (!hasPlaceCoordinates(params)) {
    const query = params.address || params.name;
    return `https://maps.apple.com/?q=${encodeURIComponent(query)}`;
  }
  const appleMode = mode === "walking" ? "w" : mode === "driving" ? "d" : "r";
  return `https://maps.apple.com/?daddr=${params.latitude},${params.longitude}&dirflg=${appleMode}`;
}

/** 외부 지도에서 장소 위치를 연다. 좌표가 없으면 동일 제공자의 장소 검색으로 대체한다. */
export function getPlaceMarkerUrl(provider: "amap" | "google" | "apple", params: MapLinkParams): string {
  if (provider === "amap") {
    if (!hasPlaceCoordinates(params)) return getAmapSearchUrl(params) || "https://uri.amap.com/search";
    const markerParams = new URLSearchParams({
      position: `${params.longitude},${params.latitude}`,
      name: params.chineseName || params.name,
      src: "map-planner",
      callnative: "1",
    });
    return `https://uri.amap.com/marker?${markerParams.toString()}`;
  }

  if (provider === "apple") {
    const query = params.address || params.name;
    if (!hasPlaceCoordinates(params)) return `https://maps.apple.com/?q=${encodeURIComponent(query)}`;
    return `https://maps.apple.com/?q=${encodeURIComponent(params.name)}&ll=${params.latitude},${params.longitude}`;
  }

  const query = hasPlaceCoordinates(params)
    ? `${params.latitude},${params.longitude}`
    : params.address || params.name;
  const googleParams = new URLSearchParams({ api: "1", query });
  if (params.googlePlaceId) googleParams.set("query_place_id", params.googlePlaceId);
  return `https://www.google.com/maps/search/?${googleParams.toString()}`;
}

export function getPlaceCopyText(place: MappablePlace, preferChinese = false) {
  const name = preferChinese ? place.chineseName || place.name : place.name || place.chineseName;
  const address = preferChinese ? place.chineseAddress || place.address : place.address || place.chineseAddress;
  return [name, address, place.subwayExit, place.taxiPhrase].filter(Boolean).join("\n");
}
