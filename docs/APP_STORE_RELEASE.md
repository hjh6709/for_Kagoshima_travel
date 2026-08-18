# App Store 출시 구조

현재 React/Vite 웹 앱과 Go API는 App Store 출시에서도 재사용한다. 다만 웹 주소를 그대로 제출하거나 프로덕션 사이트만 띄우는 얇은 WebView 앱으로 배포하지 않는다. iOS 앱은 빌드된 웹 자산을 포함하는 Capacitor 컨테이너를 두고, 네이티브 권한과 플랫폼 동작을 명시적으로 연결한다.

## 권장 저장소 구조

```text
apps/
  api/                 기존 Go API와 데이터 접근 계층
  web/                 기존 React/Vite UI와 PWA
    capacitor.config.ts
    ios/               Capacitor가 생성하는 Xcode 프로젝트
```

`apps/web`을 단일 UI 소스로 유지하고 `dist` 결과를 iOS 앱 번들에 동기화한다. iOS 앱은 API를 HTTPS로 호출하며, 웹과 앱이 같은 응답 구조와 인증 정책을 사용한다. 네이티브 프로젝트를 별도의 화면 구현으로 복제하지 않는다.

## iOS 전용으로 추가할 것

- Apple Developer Program, Bundle ID, 서명 인증서와 프로비저닝
- 앱 아이콘, 시작 화면, 버전과 빌드 번호
- 위치 권한 설명과 거부 상태, 안전 영역, 상태 표시줄, 키보드 대응
- Google 지도와 현지 지도 딥 링크 및 앱 미설치 시 웹 fallback
- Universal Link 또는 앱 딥 링크, 오프라인·네트워크 복구 동작
- `PrivacyInfo.xcprivacy`, App Store 개인정보 라벨과 개인정보 처리방침
- 앱에서 계정을 만드는 경우 앱 안의 계정 삭제 흐름
- 심사용 데모 계정과 TestFlight 실기기 검증

## 출시 단계

1. 별도 기능 PR에서 Capacitor와 iOS 프로젝트를 추가한다.
2. 웹 빌드 → Capacitor 동기화 → Xcode 빌드를 자동화한다.
3. 실제 iPhone에서 로그인, 여행 생성, 장소 검색, 지도 핀, 위치 권한, 외부 길찾기, 공유 링크를 검증한다.
4. TestFlight 내부 테스트 후 App Store Connect의 개인정보·심사 정보를 채운다.
5. Xcode에서 아카이브를 만들고 App Store Connect로 업로드한다.

Apple은 단순히 웹사이트를 다시 포장한 앱보다 앱다운 유용성과 완성도를 요구한다. 따라서 네이티브 컨테이너 추가는 포장 작업이 아니라 위치·딥 링크·안전 영역·키보드·오프라인 상태를 iOS 방식으로 다듬는 출시 단계로 본다.

## 공식 참고 자료

- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Capacitor 공식 문서](https://capacitorjs.com/docs)
- [Xcode 앱 배포와 TestFlight](https://developer.apple.com/documentation/xcode/distributing-your-app-for-beta-testing-and-releases)
- [Apple Privacy Manifest](https://developer.apple.com/documentation/bundleresources/adding-a-privacy-manifest-to-your-app-or-third-party-sdk)
