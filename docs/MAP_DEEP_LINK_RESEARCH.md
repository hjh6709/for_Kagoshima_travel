# 외부 지도 딥링크 조사

조사일: 2026-08-04
범위: 현재 PWA에서 사용하는 고덕지도(Amap) Web URI와 Google Maps URLs. 아래 내용은 각 서비스의 공식 문서만 근거로 한다.

## 결론

- Google 지도는 현재 구현처럼 `origin`을 생략하고 목적지와 Google Place ID를 함께 전달하면 된다. Google Maps 앱이 없을 때도 같은 HTTPS URL이 브라우저 지도로 연결된다.
- Google Places가 제공한 WGS84 좌표는 고덕지도의 **장소 표시** URI에서 `coordinate=wgs84`로 안전하게 사용할 수 있다.
- 고덕지도의 **Web 길찾기** URI에는 좌표계를 지정하는 공식 파라미터가 없다. WGS84 좌표를 그대로 전달해 직접 길찾기를 보장하면 안 된다.
- 따라서 현재 PWA에서는 고덕지도를 `정확한 장소 표시 -> 고덕지도 안에서 길찾기 선택`으로 제공하는 것이 가장 안전하다. OS별 네이티브 URI는 앱 패키징 이후에 별도 fallback과 함께 검토한다.

## 고덕지도(Amap)

### Web URI

Amap URI API는 API Key 없이 바로 사용할 수 있고, HTTPS URI로 H5 지도 기능을 열 수 있다([Amap 공식 FAQ](https://lbs.amap.com/faq/js-api/url-js-api/create-project/46361), [URI API 개요](https://lbs.amap.com/api/uri-api/summary)).

| 기능 | 주소 | 핵심 파라미터 | 확인 사항 |
| --- | --- | --- | --- |
| 검색 | `https://uri.amap.com/search` | `keyword` 필수, `center`, `city`, `view=map\|list`, `src`, `callnative` | `center`는 `lon,lat`; 모바일에서만 유효하다([검색 공식 문서](https://lbs.amap.com/api/uri-api/guide/search/search)). |
| 장소 표시 | `https://uri.amap.com/marker` | `position=lon,lat`, `name`, `coordinate`, `src`, `callnative` | `coordinate=gaode`는 GCJ-02, `coordinate=wgs84`는 GPS 원시 좌표이며 기본값은 `gaode`다. 좌표 대신 Amap POI ID를 쓰는 방식도 있다([단일 장소 표시 공식 문서](https://lbs.amap.com/api/uri-api/guide/mobile-web/point)). |
| 경로 계획 | `https://uri.amap.com/navigation` | `from`, `to`, `via`, `mode`, `policy`, `src`, `callnative` | `from`/`to` 형식은 `lon,lat[,name]`; 모바일에서 빈 `from`은 현재 위치로 채운다. `mode`는 `car`, `bus`, `walk`, `ride`다([경로 계획 공식 문서](https://lbs.amap.com/api/uri-api/guide/travel/route)). |

`callnative=1`은 모바일에서 Amap 앱 실행을 **시도**한다. 공식 문서는 앱 설치가 필요하고 WeChat·QQ 같은 일부 내장 브라우저에서는 실행이 실패할 수 있다고 명시한다([경로 계획 공식 문서](https://lbs.amap.com/api/uri-api/guide/travel/route)). HTTPS URI 자체는 H5 지도용이지만, 앱 미설치 시 언제나 자동으로 H5 화면에 남는다는 보장 문구는 확인되지 않았다. 따라서 제품 문구에서 이를 확정적으로 약속하지 않고 실제 iOS·Android·PWA 설치 상태별 검증이 필요하다.

### 좌표계

Amap은 GCJ-02를 Amap 좌표로 설명하고 WGS84를 GPS·Google Maps 등이 사용하는 국제 표준 좌표로 설명한다. 비-Amap 좌표는 정확도를 위해 Amap 좌표로 변환하도록 안내한다([좌표 변환 공식 문서](https://lbs.amap.com/api/javascript-api-v2/guide/transform/convertfrom)). 별도의 Web Service 좌표 변환 API도 GPS 좌표를 Amap 좌표로 변환하지만, 이 API에는 Web Service Key가 필요하다([좌표 변환 Web Service 공식 문서](https://lbs.amap.com/api/webservice/guide/api/convert)).

장소 표시 URI는 `coordinate=wgs84`를 공식 지원하지만, Web 경로 계획 URI에는 같은 좌표계 파라미터가 문서화되어 있지 않다. 따라서 현재 데이터의 `coordinateSystem`이 `gcj02`로 확인된 경우에만 Web 경로 계획 좌표로 보내는 기존 안전장치는 유지해야 한다.

Android와 iOS의 네이티브 길찾기 URI는 `dev=1`로 좌표 변환이 필요한 입력임을 표시할 수 있다([Android 길찾기 URI](https://lbs.amap.com/api/amap-mobile/guide/android/route), [iOS 길찾기 URI](https://lbs.amap.com/api/amap-mobile/guide/ios/route)). 그러나 `amapuri://`·`iosamap://`는 앱 전용이며, 웹/PWA에서 설치 여부를 신뢰성 있게 판별하고 fallback하는 방법은 해당 문서가 보장하지 않는다.

## Google Maps URLs

길찾기 기본 주소는 `https://www.google.com/maps/dir/?api=1`이며 `api=1`이 없으면 다른 파라미터가 무시된다. Maps URLs 자체에는 API Key가 필요 없다([Google Maps URLs 공식 문서](https://developers.google.com/maps/documentation/urls/get-started)).

- `destination`: 장소명, 주소 또는 `lat,lng`를 받는다. 생략하면 사용자가 목적지를 입력하는 빈 폼이 표시될 수 있으므로 앱의 길찾기 링크에는 항상 넣는다.
- `destination_place_id`: 특정 시설을 정확히 지정하는 가장 확실한 방법이다. 단독으로 쓸 수 없고 `destination`도 함께 전달해야 한다.
- `origin`: 선택값이다. 생략하면 가능한 경우 기기 위치 같은 가장 적절한 출발지를 쓰고, 사용할 수 없으면 사용자가 출발지를 입력하는 폼을 표시한다. 앱 자체에서 현재 위치 권한을 거부해도 Google 지도 쪽 흐름은 독립적으로 계속할 수 있다.
- `dir_action=navigate`: 출발지가 현재 위치로 사용 가능하면 턴바이턴 안내를, 그렇지 않으면 경로 미리보기를 연다. 모든 제품·목적지에서 지원되는 것은 아니므로 일반 `길찾기` 버튼에는 필수가 아니다.

동일한 HTTPS Maps URL은 Android·iOS에서 Google Maps 앱이 설치되어 있으면 앱을, 설치되지 않았으면 브라우저를 연다. 그 외 기기에서도 브라우저로 열린다([Google Maps URLs 공식 문서](https://developers.google.com/maps/documentation/urls/get-started)).

## 현재 앱 권장안

1. Google 지도는 `destination=<좌표 또는 표시값>`과, 존재할 때 `destination_place_id=<Google Place ID>`를 함께 유지한다. `origin`은 생략해 현재 위치 또는 사용자 입력을 Google 지도에 맡긴다.
2. Google Places의 WGS84 좌표를 고덕지도에서 표시할 때는 검색어 fallback보다 `marker?position=<lon,lat>&coordinate=wgs84`를 우선한다. 이는 공식 좌표 변환 지원 범위다.
3. 고덕지도 버튼은 WGS84 장소에 대해 `고덕지도에서 장소 보기`처럼 실제 동작을 표현하고, 화면 안에서 길찾기를 한 번 더 선택하도록 안내한다.
4. `coordinateSystem=gcj02`로 출처가 확인된 장소만 Web `navigation`으로 바로 연결한다. 자체 수식 변환이나 문서화되지 않은 `coordinate` 파라미터를 Web 경로 계획 URI에 추가하지 않는다.
5. 향후 네이티브 앱에서는 OS별 Amap URI의 `dev=1`과 앱 설치 확인·HTTPS marker fallback을 함께 설계한 뒤 실기기에서 검증한다.

## 남은 불확실성

- `callnative=1`에서 Amap 앱이 없거나 내장 브라우저가 실행을 차단할 때의 UX는 공식 문서가 일관된 자동 fallback으로 보장하지 않는다.
- Amap Web `navigation`이 WGS84를 내부 변환하는지는 공식 문서로 확인되지 않았다. 명시적 지원으로 간주하지 않는다.
- 중국 현지의 대중교통·도보 경로 품질과 앱 간 화면 전환은 지역, OS, 설치 버전, 브라우저에 따라 달라질 수 있으므로 출국 전 중국 현지 좌표와 실기기로 최종 검증해야 한다.
