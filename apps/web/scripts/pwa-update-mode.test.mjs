import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const viteConfig = readFileSync(new URL("../vite.config.ts", import.meta.url), "utf8");
const mainEntry = readFileSync(new URL("../src/main.tsx", import.meta.url), "utf8");

test("PWA는 입력 중인 폼을 보호하면서 최신 배포를 자동 적용한다", () => {
  assert.match(viteConfig, /registerType:\s*["']prompt["']/);
  assert.match(mainEntry, /onNeedRefresh/);
  assert.match(mainEntry, /coordinatePwaUpdate/);
});
