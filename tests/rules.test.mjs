import test from "node:test";
import assert from "node:assert/strict";
import data from "../opportunities.json" with { type: "json" };
import { CLEAR, rank, filterRows, count } from "../lib/rules.ts";
test("supplied fixture and ranking", () => {
  assert.equal(data.length, 50);
  assert.equal(new Set(data.map((row) => row.id)).size, 50);
  const ranked = rank(Object.freeze([...data]));
  assert.equal(ranked[0].id, "op_35");
  assert.deepEqual(
    rank([
      { ...data[0], id: "b" },
      { ...data[0], id: "a" },
    ]).map((row) => row.id),
    ["a", "b"],
  );
  assert.equal(count(filterRows(ranked, CLEAR)), 50);
  assert.equal(
    count(filterRows(ranked, { rating: true, contact: true, topic: true })),
    41,
  );
});
test("each filter operates independently and rating 30 passes", () => {
  const row = {
    ...data[0],
    domainRating: 30,
    contactName: "  ",
    topic: "Travel",
  };
  assert.equal(filterRows([row], { ...CLEAR, rating: true }).length, 1);
  assert.equal(
    filterRows([{ ...row, domainRating: 29 }], { ...CLEAR, rating: true })
      .length,
    0,
  );
  for (const contactName of [null, "", "  "])
    assert.equal(
      filterRows([{ ...row, contactName }], { ...CLEAR, contact: true }).length,
      0,
    );
  assert.equal(filterRows([row], { ...CLEAR, topic: true }).length, 0);
});
