import type { Page } from "@playwright/test";

// 키 없이 뜨는 지도 경고처럼, 우리가 고칠 수 없고 회귀와 무관한 것만 넣는다.
// 목록을 늘릴 때는 반드시 이유를 주석으로 남긴다. 여기가 넓어지면 이 테스트는 무의미해진다.
const ALLOWED = [
  // CI에는 VITE_GOOGLE_MAPS_BROWSER_KEY가 없다. 지도 SDK 로드 실패는 예상된 상태다.
  /Google Maps/i,
  /InvalidKeyMapError/i,
  /maps\.googleapis\.com/i,
];

function isAllowed(text: string): boolean {
  return ALLOWED.some((pattern) => pattern.test(text));
}

export function watchConsole(page: Page): { errors: string[] } {
  const errors: string[] = [];

  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (!isAllowed(text)) errors.push(`console.error: ${text}`);
  });

  // 처리되지 않은 예외는 콘솔 이벤트로 오지 않으므로 따로 받는다.
  page.on("pageerror", (error) => {
    if (!isAllowed(error.message)) errors.push(`pageerror: ${error.message}`);
  });

  return { errors };
}
