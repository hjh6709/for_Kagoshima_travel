import { test } from "node:test";
import assert from "node:assert/strict";

test("intentional failure to verify pr-check-doctor BLOCK rendering", () => {
  assert.equal(1, 2, "deliberate failure, not a real regression — see PR description");
});
