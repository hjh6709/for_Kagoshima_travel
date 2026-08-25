import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const styleEntry = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

const expectedImports = [
  ["tokens.css", "tokens"],
  ["foundation.css", "foundation"],
  ["manage.css", "features"],
  ["place-search.css", "features"],
  ["share.css", "features"],
  ["trip.css", "features"],
  ["map.css", "features"],
  ["travel-components.css", "features"],
  ["feedback.css", "feedback"],
  ["travel-tools.css", "features"],
  ["theme-ios.css", "theme"],
  ["ios-alert.css", "alert"],
];

test("전역 CSS는 고정된 cascade layer 순서를 선언한다", () => {
  assert.match(
    styleEntry,
    /^@layer tokens, foundation, features, feedback, theme, alert;$/m,
  );
});

test("모든 전역 stylesheet import는 책임에 맞는 layer에 속한다", () => {
  const allImports = [...styleEntry.matchAll(/^@import\s+[^;]+;$/gm)];
  const layeredImports = [
    ...styleEntry.matchAll(
      /^@import\s+["']\.\/styles\/([^"']+)["']\s+layer\(([^)]+)\);$/gm,
    ),
  ].map((match) => [match[1], match[2]]);

  assert.equal(
    layeredImports.length,
    allImports.length,
    "명명된 layer 밖의 전역 stylesheet import가 있으면 안 됩니다.",
  );
  assert.deepEqual(layeredImports, expectedImports);
});
