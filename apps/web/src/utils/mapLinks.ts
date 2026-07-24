export type TravelMode = "walking" | "driving" | "transit";

export interface MapLinkParams {
  destinationCountry?: string;
  latitude?: number;
  longitude?: number;
  name: string;
}

/**
 * 국가 코드 및 사용자 조작 목적에 맞는 지도 서비스 URL(길찾기 또는 위치 보기)을 반환합니다.
 */
export function getDirectionUrl(
  provider: "amap" | "google" | "apple",
  params: MapLinkParams,
  mode: TravelMode
): string {
  const { latitude, longitude, name } = params;
  if (latitude === undefined || longitude === undefined) {
    return "";
  }

  const encodedName = encodeURIComponent(name);

  switch (provider) {
    case "amap": {
      // 고덕지도는 경도, 위도 (lon, lat) 순서입니다.
      // mode: walk, car, bus
      let amapMode = "walk";
      if (mode === "driving") amapMode = "car";
      if (mode === "transit") amapMode = "bus";
      return `https://uri.amap.com/navigation?to=${longitude},${latitude},${encodedName}&mode=${amapMode}&src=mapplanner`;
    }
    case "apple": {
      // Apple Maps: dirflg w(도보), d(자동차), r(대중교통)
      let appleMode = "w";
      if (mode === "driving") appleMode = "d";
      if (mode === "transit") appleMode = "r";
      return `https://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=${appleMode}`;
    }
    case "google":
    default: {
      // Google Maps: walking, driving, transit
      return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=${mode}`;
    }
  }
}

/**
 * 단순히 지도에서 특정 장소의 위치 핀을 띄우는 URL을 반환합니다.
 */
export function getPlaceMarkerUrl(
  provider: "amap" | "google" | "apple",
  params: MapLinkParams
): string {
  const { latitude, longitude, name } = params;
  if (latitude === undefined || longitude === undefined) {
    // 좌표가 없으면 주소/지명 기반의 검색 URL을 구글 맵으로 리턴합니다.
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;
  }

  const encodedName = encodeURIComponent(name);

  switch (provider) {
    case "amap":
      return `https://uri.amap.com/marker?position=${longitude},${latitude}&name=${encodedName}&src=mapplanner`;
    case "apple":
      return `https://maps.apple.com/?q=${encodedName}&ll=${latitude},${longitude}`;
    case "google":
    default:
      return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  }
}
