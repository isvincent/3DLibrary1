import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || (process.env.CI ? undefined : "/usr/bin/chromium"),
  headless: true,
  args: [
    "--no-sandbox",
    "--enable-unsafe-swiftshader",
    "--use-gl=angle",
    "--use-angle=swiftshader",
  ],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(process.env.BASE_URL || "http://127.0.0.1:5173");
await page.waitForSelector("canvas");
await page.waitForTimeout(2500);
assert.equal(await page.locator(".webgl-error").count(), 0);
await page.screenshot({ path: "/tmp/library-desktop.png", fullPage: true });
await page.getByRole("button", { name: "2F 書海與閱讀" }).click();
assert.equal(await page.locator('[data-area^="shelf"]').count(), 10);
await page.locator('[data-area="shelf4"]').click();
await page.getByRole("button", { name: "2D / 3D 對照" }).click();
await page.locator('[data-map="stairs2"]').click();
assert.match(await page.locator("#room-info h2").textContent(), /往 1F/);
await page.getByRole("button", { name: "配置驗證", exact: true }).click();
await page.waitForTimeout(600);
await page.locator("#adjust-x").fill(".85");
await page.locator("#apply-adjust").click();
await page.locator("#reset-adjust").click();
await page.locator('[data-tab="faq"]').click();
assert.equal(await page.locator("details").count(), 11);
await page.locator("#faq-search").fill("午休");
assert.equal(await page.locator("details").count(), 1);
await page.locator("summary").click();
assert.match(await page.locator("#faq-list").textContent(), /同意文件/);
await page.locator("#close-modal").click();
await page.getByRole("button", { name: "1F 探索與交流" }).click();
await page.locator('[data-area="printer"]').click();
await page.locator("#room-action").click();
await page.locator("#pages").fill("3");
await page.locator("#print-type").selectOption("color");
assert.match(await page.locator("#cost").textContent(), /18/);
await page.locator("#print-service").selectOption({ label: "掃描" });
assert.match(await page.locator("#cost").textContent(), /0/);
await page.locator("#close-modal").click();
await page.locator('[data-area="counter"]').click();
await page.locator("#room-action").click();
for (let i = 0; i < 4; i++) await page.locator("#borrow-next").click();
await page.locator("#borrow-next").click();
assert.equal(await page.locator("#student-card").count(), 1);
await page.locator("#student-card").check();
await page.locator("#borrow-next").click();
assert.match(await page.locator("#modal-body").textContent(), /借閱完成/);
await page.locator("#close-modal").click();
await page.locator('[data-tab="faq"]').click();
await page.locator("#quiz-tab").click();
const { quizzes } = await import("../src/data/quiz-data.js");
for (let i = 0; i < quizzes.length; i++)
  await page
    .locator(`input[name="q${i}"][value="${quizzes[i].answer}"]`)
    .check();
await page.getByRole("button", { name: "送出答案" }).click();
assert.match(await page.locator(".score").textContent(), /100/);
await page.locator("#close-modal").click();
await page.locator("#settings").click();
await page.locator('[data-pref="font"]').selectOption("大");
await page.locator('[data-pref="performance"]').selectOption("省電");
await page.locator('[data-pref="layout"]').selectOption("專注");
assert.equal(await page.locator("body").getAttribute("data-layout"), "專注");
await page.locator('[data-pref="layout"]').selectOption("標準");
await page.locator('[data-pref="font"]').selectOption("標準");
await page.locator("#close-modal").click();
await page.reload();
await page.waitForSelector("canvas");
const saved = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("ym-progress")),
);
assert.equal(saved.score, 100);
assert.ok(saved.completed.includes(3));
await page.getByRole("button", { name: "1F 探索與交流" }).click();
await page.locator('[data-area="special"]').click();
await page.locator('[data-area="catalog"]').click();
await page.locator('[data-tab="missions"]').click();
assert.equal(await page.locator(".mission-card.done").count(), 6);
assert.equal(await page.locator(".badge").count(), 1);
await page.locator("#close-modal").click();
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(1000);
assert.ok(
  await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
);
await page.screenshot({ path: "/tmp/library-mobile.png", fullPage: true });
await page.locator('[data-tab="missions"]').click();
assert.equal(await page.locator(".mission-card").count(), 6);
assert.equal(errors.length, 0, errors.join("\n"));
console.log(
  "Browser checks passed: WebGL, floor maps, FAQ, printer, borrow, quiz, settings, persistence, mobile.",
);
await browser.close();
