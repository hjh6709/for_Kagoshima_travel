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

function readRuleBlock(css, selectorSource) {
  // 줄 맨 앞에서 시작하는 선택자만 매칭한다 — ".place-search-controls .compact-button"처럼
  // 다른 선택자의 자손으로 쓰인 동명 클래스와 혼동하지 않기 위함.
  const match = css.match(new RegExp(`^\\s*${selectorSource}\\s*{([^}]*)}`, "m"));
  assert.ok(match, `"${selectorSource}" 규칙을 찾지 못했습니다.`);
  return match[1];
}

function tokenPxValue(varName) {
  const remMatch = tokens.match(new RegExp(`${varName}:\\s*([\\d.]+)rem`));
  if (remMatch) return Number(remMatch[1]) * 16;
  const pxMatch = tokens.match(new RegExp(`${varName}:\\s*([\\d.]+)px`));
  if (pxMatch) return Number(pxMatch[1]);
  assert.fail(`${varName} 크기 토큰을 해석할 수 없습니다.`);
}

function fontSizePx(raw) {
  const trimmed = raw.trim();
  const varMatch = trimmed.match(/^var\((--[\w-]+)\)/);
  if (varMatch) return tokenPxValue(varMatch[1]);
  const remMatch = trimmed.match(/^([\d.]+)rem/);
  if (remMatch) return Number(remMatch[1]) * 16;
  const pxMatch = trimmed.match(/^([\d.]+)px/);
  if (pxMatch) return Number(pxMatch[1]);
  assert.fail(`font-size 값을 해석할 수 없습니다: ${raw}`);
}

function ruleFontSizePx(block) {
  const match = block.match(/font-size:\s*([^;]+);/);
  assert.ok(match, "font-size를 찾을 수 없습니다.");
  return fontSizePx(match[1]);
}

function ruleMinHeightPx(block) {
  const match = block.match(/min-height:\s*([\d.]+)px/);
  assert.ok(match, "min-height(px)를 찾을 수 없습니다.");
  return Number(match[1]);
}

function resolveColorHex(raw) {
  const trimmed = raw.trim();
  const varMatch = trimmed.match(/^var\((--[\w-]+)\)$/);
  if (varMatch) return readHexToken(varMatch[1]);
  const hexMatch = trimmed.match(/^(#[0-9a-fA-F]{6})$/);
  if (hexMatch) return hexMatch[1];
  assert.fail(`색상 값을 해석할 수 없습니다: ${raw}`);
}

function ruleColorHex(block) {
  const match = block.match(/(?:^|[\s;])color:\s*([^;]+);/);
  assert.ok(match, "color를 찾을 수 없습니다.");
  return resolveColorHex(match[1]);
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

test("작은 모바일과 200% 확대에서 일정과 현지 도구는 한 열로 재배치된다", () => {
  assert.match(
    tripStyles,
    /@media \(max-width: 360px\)[\s\S]*?\.schedule-card\s*{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)/,
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
  // 미디어 쿼리 대신 auto-fit으로 접는다. 고정 2칸이던 시절에는 375px에서도
  // 날짜 라벨이 트랙 밖으로 나갔고, 미디어 쿼리 방식은 폭 하나만 겨우 막았다.
  // 핵심은 "자리가 부족하면 한 칸이 된다"이므로 그 형태를 검사한다.
  assert.match(
    foundationStyles,
    /\.form-grid-two\s*{[^}]*?grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(min\(100%,\s*\d+px\),\s*1fr\)\)/,
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
  // [^}]* 로 규칙 블록 안에서만 본다. [\s\S]*? 를 쓰면 파일 뒤쪽 다른 규칙의
  // margin-left: auto까지 삼켜 오탐이 난다.
  assert.doesNotMatch(
    readRuleBlock(manageStyles, String.raw`\.start-primary-action \.trailing-icon`),
    /margin-left:\s*auto/,
  );
});

test("compact · segment · 긴급전화 버튼은 44px 이상의 터치 영역을 갖는다", () => {
  const selectors = [
    String.raw`\.compact-button(?![\w.-])`,
    String.raw`\.segment-btn(?![\w.-])`,
    String.raw`\.emergency-call-button(?![\w.-])`,
  ];
  for (const selector of selectors) {
    const block = readRuleBlock(styles, selector);
    assert.ok(
      ruleMinHeightPx(block) >= 44,
      `${selector}의 최소 높이가 44px 미만입니다.`,
    );
  }
});

test("하단 탭과 세그먼트 텍스트는 12px 이상이며 4.5대 1 이상의 대비를 갖는다", () => {
  const bottomTabBlock = readRuleBlock(styles, String.raw`\.bottom-tabs button(?![\w.-])`);
  assert.ok(
    ruleFontSizePx(bottomTabBlock) >= 12,
    "하단 탭 글자 크기가 12px 미만입니다.",
  );
  assert.ok(
    contrastRatio(ruleColorHex(bottomTabBlock), "#ffffff") >= 4.5,
    "하단 탭 대비가 4.5:1 미만입니다.",
  );

  const segmentBlock = readRuleBlock(styles, String.raw`\.segment-btn(?![\w.-])`);
  assert.ok(
    ruleFontSizePx(segmentBlock) >= 12,
    "세그먼트 글자 크기가 12px 미만입니다.",
  );
  assert.ok(
    contrastRatio(ruleColorHex(segmentBlock), readHexToken("--c-fill-strong")) >= 4.5,
    "세그먼트 대비가 4.5:1 미만입니다.",
  );
});

test(":root는 rem 단위 font-size를 직접 선언하지 않고 body가 기준 크기를 정한다", () => {
  const rootBlock = readRuleBlock(tokens, ":root");
  assert.doesNotMatch(
    rootBlock,
    /font-size:/,
    ":root에 font-size가 있으면 rem 기준이 이중으로 축소됩니다.",
  );
  const bodyBlock = readRuleBlock(tokens, "body");
  assert.match(bodyBlock, /font-size:\s*var\(--type-body-size\)/);
});

test("날짜 탭은 좁은 화면에서 겹치는 대신 가로로 스크롤된다", () => {
  const block = readRuleBlock(styles, String.raw`\.date-tabs(?![\w.-])`);
  assert.match(block, /overflow-x:\s*auto/);
});

test("항공 노선은 grid로 가운데 열의 비율을 고정한다", () => {
  const block = readRuleBlock(styles, String.raw`\.flight-route(?![\w.-])`);
  assert.match(block, /display:\s*grid/);
});

test("첫 여행이 없는 empty-state 카드는 세로로 아이콘 · 제목 · 설명을 쌓는다", () => {
  const block = readRuleBlock(styles, String.raw`\.info-card\.empty-state-card`);
  assert.match(block, /flex-direction:\s*column/);
});

test("체크리스트 카드 그룹은 overflow: hidden을 쓰지 않아 포커스 링이 잘리지 않는다", () => {
  const block = readRuleBlock(styles, String.raw`\.card-stack:has\(> \.check-row\)`);
  assert.doesNotMatch(block, /overflow:\s*hidden/);
});
