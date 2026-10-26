import { test } from "node:test";
import assert from "node:assert/strict";
import f1 from "../src/data/floor1-layout.js";
import f2 from "../src/data/floor2-layout.js";
import { mapToWorld, worldToMap } from "../src/data/layout.js";
import { faqs } from "../src/data/faq-data.js";
import { quizzes, scoreAnswers } from "../src/data/quiz-data.js";
import { printCost } from "../src/data/library-content.js";
test("所有區域 ID 唯一且配置位於圖面內", () => {
  const all = [...f1, ...f2];
  assert.equal(new Set(all.map((a) => a.id)).size, all.length);
  for (const a of all) {
    const b = a.mapBounds;
    assert.ok(b.x >= 0 && b.y >= 0 && b.x + b.w <= 1 && b.y + b.h <= 1, a.id);
    assert.equal(a.floor, f1.includes(a) ? 1 : 2);
  }
});
test("圖面方向與關鍵區域相對位置", () => {
  const get = (id) => f1.find((a) => a.id === id).mapBounds;
  assert.ok(get("entrance").y > 0.9);
  assert.ok(get("stairs1").x > 0.8);
  assert.ok(get("discussion1").x < 0.1 && get("discussion1").y < 0.1);
  assert.ok(get("special").x > 0.8 && get("special").y < 0.1);
  assert.ok(get("counter").x < get("office").x);
  assert.ok(get("catalog").y < get("office").y);
  const shelves = f2.filter((a) => a.category === "書庫");
  assert.equal(shelves.length, 10);
  assert.ok(
    shelves.every((a) => a.mapBounds.y < 0.2 && a.mapBounds.h > a.mapBounds.w),
  );
  assert.equal(
    f2.filter((a) => a.id.startsWith("central2") && a.category === "閱讀")
      .length,
    6,
  );
});
test("2D 與 3D 座標可往返且不鏡像", () => {
  for (const [u, v] of [
    [0, 0],
    [1, 1],
    [0.24, 0.78],
  ]) {
    const w = mapToWorld(u, v);
    const m = worldToMap(w.x, w.z);
    assert.ok(Math.abs(m.u - u) < 1e-10 && Math.abs(m.v - v) < 1e-10);
  }
  assert.ok(mapToWorld(0, 0).x < 0 && mapToWorld(0, 0).z < 0);
});
test("完整 FAQ、計分與服務費用", () => {
  assert.equal(faqs.length, 11);
  assert.equal(faqs[10].id, "Q11");
  assert.equal(scoreAnswers(quizzes.map((q) => q.answer)), 100);
  assert.equal(scoreAnswers(quizzes.map(() => -1)), 0);
  assert.equal(printCost(3, "color"), 18);
  assert.equal(printCost(3, "bw"), 6);
  assert.equal(printCost(100, "scan"), 0);
  assert.equal(printCost(-4, "color"), 0);
});
