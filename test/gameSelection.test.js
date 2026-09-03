import assert from "node:assert/strict";
import test from "node:test";

const selection = await import("../src/utils/gameSelection.js").catch(() => ({}));

test("toggleTokenSelection returns a new set without mutating the current selection", () => {
  assert.equal(typeof selection.toggleTokenSelection, "function");
  const current = new Set(["a"]);
  const added = selection.toggleTokenSelection(current, "b", true);
  const removed = selection.toggleTokenSelection(added, "a", false);

  assert.deepEqual([...current], ["a"]);
  assert.deepEqual([...added], ["a", "b"]);
  assert.deepEqual([...removed], ["b"]);
});

test("selectAllTokenIds and pruneTokenSelection follow the displayed token list", () => {
  const tokens = [{ id: "b" }, { id: "a" }];
  assert.deepEqual([...selection.selectAllTokenIds(tokens)], ["b", "a"]);
  assert.deepEqual(
    [...selection.pruneTokenSelection(new Set(["missing", "a"]), tokens)],
    ["a"],
  );
});
