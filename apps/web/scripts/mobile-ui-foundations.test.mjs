import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";

const stylesDirectory = new URL("../src/styles/", import.meta.url);
const styleFiles = readdirSync(stylesDirectory)
  .filter((fileName) => fileName.endsWith(".css"))
  .map((fileName) => readFileSync(new URL(fileName, stylesDirectory), "utf8"));
const styles = styleFiles.join("\n");
const tokens = readFileSync(new URL("../src/styles/tokens.css", import.meta.url), "utf8");
const indexHtml = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const viteConfig = readFileSync(new URL("../vite.config.ts", import.meta.url), "utf8");
const foundationStyles = readFileSync(
  new URL("../src/styles/foundation.css", import.meta.url),
  "utf8",
);
const placeSearchStyles = readFileSync(
  new URL("../src/styles/place-search.css", import.meta.url),
  "utf8",
);
const tripStyles = readFileSync(new URL("../src/styles/trip.css", import.meta.url), "utf8");
const manageStyles = readFileSync(new URL("../src/styles/manage.css", import.meta.url), "utf8");
const travelToolStyles = readFileSync(
  new URL("../src/styles/travel-tools.css", import.meta.url),
  "utf8",
);

const requiredTypeTokens = [
  "--type-display-size",
  "--type-screen-size",
  "--type-title-size",
  "--type-body-size",
  "--type-supporting-size",
  "--type-label-size",
  "--font-weight-body",
  "--font-weight-strong",
  "--font-weight-display",
];

function readHexToken(name) {
  const match = tokens.match(new RegExp(`${name}:\\s*(#[0-9a-f]{6})`, "i"));
  assert.ok(match, `${name} 색상 토큰을 찾을 수 없습니다.`);
  return match[1];
}

function relativeLuminance(hex) {
  const channels = hex
    .slice(1)
    .match(/../g)
    .map((value) => Number.parseInt(value, 16) / 255)
    .map((value) =>
      value <= 0.04045
        ? value / 12.92
        : ((value + 0.055) / 1.055) ** 2.4,
    );
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrastRatio(foreground, background) {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

test("모바일 타이포그래피는 역할 토큰과 12px 최소 크기를 사용한다", () => {
  for (const token of requiredTypeTokens) {
    assert.match(tokens, new RegExp(`${token}:`), `${token}이 필요합니다.`);
  }

  assert.doesNotMatch(styles, /font-size:\s*(?:10|11)px/);
  assert.doesNotMatch(tokens, /letter-spacing:\s*-0\.012em/);
});

test("의미가 있는 텍스트 색상은 일반 글자 기준 4.5대 1 이상이다", () => {
  const surface = readHexToken("--c-surface");
  const pairs = [
    ["본문", readHexToken("--c-text"), readHexToken("--c-bg")],
    ["보조 본문", readHexToken("--c-muted"), readHexToken("--c-bg")],
    ["경로", readHexToken("--c-route"), surface],
    ["목적지", readHexToken("--c-destination"), surface],
    ["경고", readHexToken("--c-warning"), readHexToken("--c-warning-light")],
    ["오류", readHexToken("--c-danger"), readHexToken("--c-danger-light")],
  ];

  for (const [label, foreground, background] of pairs) {
    assert.ok(
      contrastRatio(foreground, background) >= 4.5,
      `${label} 대비가 4.5:1보다 낮습니다.`,
    );
  }
});

test("Pretendard는 앱과 함께 배포되어 오프라인에서도 같은 위계를 유지한다", () => {
  assert.ok(
    existsSync(new URL("../public/fonts/PretendardVariable.woff2", import.meta.url)),
    "로컬 Pretendard Variable 파일이 필요합니다.",
  );
  assert.equal(
    indexHtml.includes('rel="stylesheet"'),
    false,
    "웹 폰트 등 화면 필수 스타일을 외부 stylesheet에 의존하면 안 됩니다.",
  );
  assert.match(viteConfig, /woff2/);
  assert.match(tokens, /@font-face/);
  assert.match(tokens, /font-display:\s*swap/);
});

test("200% 확대에서도 일정과 현지 도구는 한 열로 재배치된다", () => {
  assert.match(
    tripStyles,
    /@media \(max-width: 240px\)[\s\S]*?\.schedule-card\s*{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)/,
  );
  assert.match(
    tripStyles,
    /@media \(max-width: 240px\)[\s\S]*?\.schedule-actions\s*{[\s\S]*?flex-direction:\s*column/,
  );
  assert.match(
    travelToolStyles,
    /@media \(max-width: 240px\)[\s\S]*?\.china-payment-apps\s*{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)/,
  );
});

test("좁은 모바일에서 관리 폼과 장소 검색은 한 열 입력 흐름을 사용한다", () => {
  assert.match(
    foundationStyles,
    /@media \(max-width: 360px\)[\s\S]*?\.form-grid-two\s*{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)/,
  );
  assert.match(
    placeSearchStyles,
    /@media \(max-width: 280px\)[\s\S]*?\.place-search-controls\s*{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)/,
  );
});

test("첫 화면 주요 행동은 문구를 가운데 두고 화살표만 오른쪽에 배치한다", () => {
  assert.match(
    manageStyles,
    /\.start-primary-action\s*{[\s\S]*?position:\s*relative;[\s\S]*?padding-inline:\s*44px;/,
  );
  assert.match(
    manageStyles,
    /\.start-primary-action \.trailing-icon\s*{[\s\S]*?position:\s*absolute;[\s\S]*?right:\s*16px;/,
  );
  assert.doesNotMatch(
    manageStyles,
    /\.start-primary-action \.trailing-icon\s*{[\s\S]*?margin-left:\s*auto;/,
  );
});
