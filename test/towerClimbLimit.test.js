import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DEFAULT_WEIRD_TOWER_MAX_CLIMB,
  normalizeWeirdTowerMaxClimb,
} from "../src/utils/towerClimbLimit.js";

test("normalizeWeirdTowerMaxClimb defaults to 100 for empty or invalid input", () => {
  assert.equal(DEFAULT_WEIRD_TOWER_MAX_CLIMB, 100);
  assert.equal(normalizeWeirdTowerMaxClimb(""), 100);
  assert.equal(normalizeWeirdTowerMaxClimb("abc"), 100);
  assert.equal(normalizeWeirdTowerMaxClimb(0), 100);
  assert.equal(normalizeWeirdTowerMaxClimb(-3), 100);
});

test("normalizeWeirdTowerMaxClimb accepts positive integer values", () => {
  assert.equal(normalizeWeirdTowerMaxClimb("35"), 35);
  assert.equal(normalizeWeirdTowerMaxClimb(12.9), 12);
  assert.equal(normalizeWeirdTowerMaxClimb("1,200"), 1200);
});
