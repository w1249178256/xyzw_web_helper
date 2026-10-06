import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DEFAULT_WEIRD_TOWER_MAX_CLIMB,
  normalizeWeirdTowerMaxClimb,
} from "../src/utils/towerClimbLimit.js";

test("normalizeWeirdTowerMaxClimb defaults to 400 for empty or invalid input", () => {
  assert.equal(DEFAULT_WEIRD_TOWER_MAX_CLIMB, 400);
  assert.equal(normalizeWeirdTowerMaxClimb(""), 400);
  assert.equal(normalizeWeirdTowerMaxClimb("abc"), 400);
  assert.equal(normalizeWeirdTowerMaxClimb(0), 400);
  assert.equal(normalizeWeirdTowerMaxClimb(-3), 400);
});

test("normalizeWeirdTowerMaxClimb accepts positive integer values", () => {
  assert.equal(normalizeWeirdTowerMaxClimb("35"), 35);
  assert.equal(normalizeWeirdTowerMaxClimb(12.9), 12);
  assert.equal(normalizeWeirdTowerMaxClimb("1,200"), 1200);
});
