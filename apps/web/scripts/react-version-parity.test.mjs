import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const packageJson = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);
const packageLock = JSON.parse(
  readFileSync(new URL("../package-lock.json", import.meta.url), "utf8"),
);

test("react와 react-dom은 선언 버전과 설치 버전이 모두 정확히 일치한다", () => {
  const declaredReact = packageJson.dependencies.react;
  const declaredReactDOM = packageJson.dependencies["react-dom"];
  const installedReact = packageLock.packages["node_modules/react"].version;
  const installedReactDOM = packageLock.packages["node_modules/react-dom"].version;

  assert.match(declaredReact, /^\d+\.\d+\.\d+$/);
  assert.equal(declaredReact, declaredReactDOM);
  assert.equal(installedReact, installedReactDOM);
  assert.equal(declaredReact, installedReact);
});
