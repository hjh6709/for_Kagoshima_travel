import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const tripCSS = readFileSync(new URL("../src/styles/trip.css", import.meta.url), "utf8");

test("빈 일정 카드의 행동 버튼은 아이콘 열이 아니라 본문 열에 배치된다", () => {
  assert.match(
    tripCSS,
    /\.next-schedule-empty \.primary-button,\s*\.next-schedule-empty \.secondary-button\s*{[^}]*grid-column:\s*2;/s,
  );
});
