import assert from "node:assert/strict";
import { test } from "node:test";
import { readStyleEntry } from "./style-test-utils.mjs";

const tripCSS = readStyleEntry("trip.css");

test("빈 일정 카드의 행동 버튼은 아이콘 열이 아니라 본문 열에 배치된다", () => {
  assert.match(
    tripCSS,
    /\.next-schedule-empty \.primary-button,\s*\.next-schedule-empty \.secondary-button\s*{[^}]*grid-column:\s*2;/s,
  );
});
