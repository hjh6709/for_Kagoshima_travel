import { expect, type Page } from "@playwright/test";

export { watchConsole } from "./consoleGuard";

export function expectNoConsoleErrors(errors: string[]): void {
  expect(errors, `브라우저 콘솔 에러 ${errors.length}건:\n${errors.join("\n")}`).toEqual([]);
}

// body 기준으로 검사하면 안 된다 — .phone-frame이 overflow: hidden이라
// 카드가 밖으로 삐져나가도 body에는 가로 스크롤이 생기지 않는다.
// 실제로 내용이 넘친 컨테이너를 직접 찾는다.
export async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const overflowing = await page.evaluate(() => {
    const offenders: Array<{ selector: string; scrollWidth: number; clientWidth: number }> = [];

    for (const element of Array.from(document.querySelectorAll<HTMLElement>("body *"))) {
      const style = window.getComputedStyle(element);
      // 가로 스크롤을 의도한 요소는 제외한다(날짜 필 트랙 등).
      if (style.overflowX === "auto" || style.overflowX === "scroll") continue;
      // 스크린리더 전용 요소(.visually-hidden)는 1px 상자에 내용을 clip 해 두는 게 정상이다.
      if (style.clip !== "auto") continue;
      // 소수점 반올림 오차를 흡수한다.
      if (element.scrollWidth - element.clientWidth <= 1) continue;

      const classes = String(element.className || "").trim();
      const selector = element.tagName.toLowerCase() + (classes ? `.${classes.split(/\s+/).join(".")}` : "");
      offenders.push({ selector, scrollWidth: element.scrollWidth, clientWidth: element.clientWidth });
    }

    return offenders;
  });

  const detail = overflowing.map((item) => `${item.selector} ${item.scrollWidth}px > ${item.clientWidth}px`).join("\n");
  expect(overflowing, `가로로 넘친 컨테이너 ${overflowing.length}개:\n${detail}`).toEqual([]);
}

type TouchTargetOptions = {
  minPx?: number;
  // 하단 탭바처럼 뷰포트를 n등분하는 요소는 195px에서 폭 44px을 물리적으로 만족할 수 없다
  // (195 / 5 = 39px). 그런 경우에만 높이로 판정한다.
  dimension?: "both" | "height";
};

// 44px는 iOS 휴먼 인터페이스 가이드라인의 최소 터치 영역이며,
// scripts/mobile-ui-foundations.test.mjs가 CSS에서 검사하는 값과 같다.
// 여기서는 CSS 규칙이 아니라 실제로 렌더된 박스를 잰다.
export async function expectTouchTargets(page: Page, selector: string, options: TouchTargetOptions = {}): Promise<void> {
  const { minPx = 44, dimension = "both" } = options;

  const tooSmall = await page.locator(selector).evaluateAll((elements, config) => {
    return elements
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          text: (element.textContent ?? "").trim().slice(0, 20),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      })
      .filter((box) => box.width > 0 && box.height > 0)
      .filter((box) => (config.dimension === "height" ? box.height < config.minPx : box.width < config.minPx || box.height < config.minPx));
  }, { minPx, dimension });

  const detail = tooSmall.map((box) => `"${box.text}" ${box.width}x${box.height}`).join("\n");
  expect(tooSmall, `${minPx}px 미만 터치 영역 ${tooSmall.length}개:\n${detail}`).toEqual([]);
}
