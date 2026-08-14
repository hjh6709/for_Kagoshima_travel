import type { Page } from "@playwright/test";

// 허용 목록은 두지 않는다.
//
// 처음에는 지도 SDK 경고를 미리 걸러 두려고 목록을 뒀지만, 실제로는 한 건도
// 발생하지 않았다. VITE_GOOGLE_MAPS_BROWSER_KEY가 없으면 loadGoogleMaps가
// 스크립트를 넣기 전에 reject하고 앱이 폴백 화면을 그리기 때문이다
// (apps/web/src/shared/map/googleMapsLoader.ts). 목록을 비우고 전체를 돌려
// 30건 모두 통과하는 것을 확인한 뒤 지웠다.
//
// 나중에 정말 우리가 고칠 수 없는 에러가 나오면, 그때 실제 메시지를 보고
// 그 한 건만 좁게 예외로 둔다. 미리 넓게 열어 두면 이 검사는 아무것도 막지 못한다.
export function watchConsole(page: Page): { errors: string[] } {
  const errors: string[] = [];

  page.on("console", (message) => {
    if (message.type() !== "error") return;
    errors.push(`console.error: ${message.text()}`);
  });

  // 처리되지 않은 예외는 콘솔 이벤트로 오지 않으므로 따로 받는다.
  page.on("pageerror", (error) => {
    errors.push(`pageerror: ${error.message}`);
  });

  return { errors };
}
