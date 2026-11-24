import assert from "node:assert/strict";
import { chromium } from "playwright";
import data from "../opportunities.json" with { type: "json" };

const base = process.env.APP_URL || "http://127.0.0.1:3000";
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL || "chrome",
});
try {
  const context = await browser.newContext();
  const outside = [];
  await context.route("**/*", (route) => {
    if (new URL(route.request().url()).origin === new URL(base).origin)
      return route.continue();
    outside.push(route.request().url());
    return route.abort();
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base);
  const open = (id) => page.locator(`[data-row="${id}"]`).click();
  const draft = page.getByLabel("Outreach draft");
  const rating = page.getByLabel(/DR ≥/);
  const visible = (n) =>
    page.getByText(`${n} visible`, { exact: true }).waitFor();
  const review = (n) =>
    page
      .locator(".review-count")
      .filter({ hasText: `${n} to review` })
      .waitFor();
  await visible(50);
  await open("op_07");
  await page.getByText("No contact", { exact: true }).waitFor();
  await open("op_01");
  const original = data.find((row) => row.id === "op_01");
  assert.equal(await draft.inputValue(), original.draft);
  assert.equal(
    await page.locator("dd").first().innerText(),
    original.linkingPageUrl,
  );
  assert.equal(await page.locator(".inspector a").count(), 0);
  await page
    .getByText(original.competitorLinked, { exact: true })
    .last()
    .waitFor();
  await rating.check();
  assert.equal(await page.locator('[data-row="op_01"]').count(), 0);
  assert.equal(await draft.count(), 0);
  await page.getByRole("button", { name: "Clear filters" }).first().click();
  await visible(50);
  assert.equal(await draft.count(), 0);
  console.log("PASS: row-specific details, selection clearing, 50 restored");
  if (!process.argv.includes("--inbox-only")) {
    await rating.check();
    await page.getByLabel("Has contact").check();
    await page.getByLabel("Target topics").check();
    await visible(41);
    await review(50);
    await open("op_35");
    const status = page.getByLabel("Review status");
    const edited = "  A custom draft\nwith a second line.  ";
    await draft.fill(edited);
    await status.selectOption("Approved");
    await review(49);
    const otherId = await page
      .locator("[data-row]")
      .nth(1)
      .getAttribute("data-row");
    const other = data.find((row) => row.id === otherId);
    await open(otherId);
    assert.equal(await draft.inputValue(), other.draft);
    assert.equal(await status.inputValue(), "To review");
    await page.reload();
    await open("op_35");
    await page.waitForFunction(
      () => !document.querySelector("textarea")?.disabled,
    );
    assert.equal(await draft.inputValue(), edited);
    assert.equal(await status.inputValue(), "Approved");
    await review(49);
    await open(otherId);
    assert.equal(await draft.inputValue(), other.draft);
    assert.equal(await status.inputValue(), "To review");
    await open("op_35");
    for (const state of ["Skipped", "Done", "To review"])
      await status.selectOption(state);
    await review(50);
    await draft.fill("");
    await page.reload();
    await page.waitForFunction(
      () => document.querySelector("textarea")?.disabled === false,
    );
    assert.equal(await draft.inputValue(), "");
    console.log(
      "PASS: global and filtered counts, isolated drafts, statuses and empty draft after reload",
    );
  }
  assert.deepEqual(outside, []);
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
