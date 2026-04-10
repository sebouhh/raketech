import { expect, test } from "@playwright/test";

const WORKSPACE_SLUG = process.env.E2E_WORKSPACE_SLUG ?? "e2e-test";

test.describe("Public Changelog Page", () => {
  test("loads without login and does not redirect to sign-in", async ({ page }) => {
    await page.goto(`/${WORKSPACE_SLUG}/changelog`);
    await expect(page).not.toHaveURL(/sign-in/);
    await expect(page.getByText("Changelog")).toBeVisible();
  });

  test("shows a back-to-roadmap link", async ({ page }) => {
    await page.goto(`/${WORKSPACE_SLUG}/changelog`);
    await expect(page.getByRole("link", { name: /back to roadmap/i })).toBeVisible();
  });

  test("back-to-roadmap link navigates to the public board", async ({ page }) => {
    await page.goto(`/${WORKSPACE_SLUG}/changelog`);
    await page.getByRole("link", { name: /back to roadmap/i }).click();
    await expect(page).toHaveURL(`/${WORKSPACE_SLUG}`);
  });

  test("shows either empty state or shipped feature articles", async ({ page }) => {
    await page.goto(`/${WORKSPACE_SLUG}/changelog`);
    const emptyState = page.getByText(/no shipped features yet/i);
    const articles = page.locator("article");
    // One of these must be present
    const [emptyCount, articleCount] = await Promise.all([emptyState.count(), articles.count()]);
    expect(emptyCount > 0 || articleCount > 0).toBeTruthy();
  });

  test("shipped feature articles display a Shipped badge", async ({ page }) => {
    await page.goto(`/${WORKSPACE_SLUG}/changelog`);
    const articles = page.locator("article");
    if ((await articles.count()) === 0) {
      // Empty changelog — acceptable; test is not applicable
      return;
    }
    await expect(articles.first().getByText("Shipped")).toBeVisible();
  });

  test("shipped feature articles display a date", async ({ page }) => {
    await page.goto(`/${WORKSPACE_SLUG}/changelog`);
    const articles = page.locator("article");
    if ((await articles.count()) === 0) return;
    await expect(articles.first().locator("time")).toBeVisible();
  });
});
