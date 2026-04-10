import { expect, test } from "@playwright/test";
import { AUTH_FILE } from "./auth.setup";

const WORKSPACE_SLUG = process.env.E2E_WORKSPACE_SLUG ?? "e2e-test";

// ---------------------------------------------------------------------------
// Public roadmap — no authentication required
// ---------------------------------------------------------------------------
test.describe("Public Roadmap Board", () => {
  test("loads without login and does not redirect to sign-in", async ({ page }) => {
    await page.goto(`/${WORKSPACE_SLUG}`);
    await expect(page).not.toHaveURL(/sign-in/);
    await expect(page.getByText("Public roadmap")).toBeVisible();
  });

  test("shows all three kanban columns", async ({ page }) => {
    await page.goto(`/${WORKSPACE_SLUG}`);
    await expect(page.getByRole("heading", { name: /^planned$/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^in progress$/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^shipped$/i })).toBeVisible();
  });

  test("shows 'Submit a request' button", async ({ page }) => {
    await page.goto(`/${WORKSPACE_SLUG}`);
    await expect(page.getByRole("button", { name: /submit a request/i })).toBeVisible();
  });

  test("unauthenticated visitor sees sign-in prompt in submit modal", async ({ page }) => {
    await page.goto(`/${WORKSPACE_SLUG}`);
    await page.getByRole("button", { name: /submit a request/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText(/sign in to submit/i)).toBeVisible();
  });

  test("vote button increments count on first click", async ({ page }) => {
    await page.goto(`/${WORKSPACE_SLUG}`);

    const voteButton = page.getByRole("button", { name: /upvote this feature/i }).first();
    if ((await voteButton.count()) === 0) {
      test.skip();
      return;
    }

    const before = Number.parseInt((await voteButton.textContent())?.match(/\d+/)?.[0] ?? "0", 10);
    await voteButton.click();

    // After voting, button becomes "Already voted"
    const afterButton = page.getByRole("button", { name: /already voted/i }).first();
    await expect(afterButton).toBeVisible();
    const after = Number.parseInt((await afterButton.textContent())?.match(/\d+/)?.[0] ?? "0", 10);
    expect(after).toBe(before + 1);
  });

  test("second click in same session shows already-voted and disables button", async ({ page }) => {
    await page.goto(`/${WORKSPACE_SLUG}`);

    const voteButton = page.getByRole("button", { name: /upvote this feature/i }).first();
    if ((await voteButton.count()) === 0) {
      test.skip();
      return;
    }

    await voteButton.click();

    const alreadyVotedButton = page.getByRole("button", { name: /already voted/i }).first();
    await expect(alreadyVotedButton).toBeVisible();
    await expect(alreadyVotedButton).toBeDisabled();
  });

  test("second page load from same IP returns already-voted state from server", async ({
    browser,
  }) => {
    // Open two independent contexts to simulate same-IP re-visit
    const ctx1 = await browser.newContext();
    const ctx2 = await browser.newContext();

    const page1 = await ctx1.newPage();
    await page1.goto(`/${WORKSPACE_SLUG}`);
    const voteBtn = page1.getByRole("button", { name: /upvote this feature/i }).first();
    if ((await voteBtn.count()) === 0) {
      await ctx1.close();
      await ctx2.close();
      test.skip();
      return;
    }
    await voteBtn.click();
    await expect(page1.getByRole("button", { name: /already voted/i }).first()).toBeVisible();

    // Second context (same server IP = 127.0.0.1) — server dedup should kick in
    const page2 = await ctx2.newPage();
    await page2.goto(`/${WORKSPACE_SLUG}`);
    const voteBtn2 = page2.getByRole("button", { name: /upvote this feature/i }).first();
    if ((await voteBtn2.count()) > 0) {
      await voteBtn2.click();
      // Server returns alreadyVoted:true → "Already voted" message appears
      await expect(page2.getByRole("status")).toContainText(/already voted/i, { timeout: 5_000 });
    }

    await ctx1.close();
    await ctx2.close();
  });
});

// ---------------------------------------------------------------------------
// Authenticated roadmap actions
// ---------------------------------------------------------------------------
test.describe("Authenticated Roadmap Actions", () => {
  test.use({ storageState: AUTH_FILE });

  test.beforeEach(async () => {
    const { readFileSync } = await import("node:fs");
    let state: { cookies: unknown[] } = { cookies: [] };
    try {
      state = JSON.parse(readFileSync(AUTH_FILE, "utf-8"));
    } catch {
      // file doesn't exist yet
    }
    if (state.cookies.length === 0) {
      test.skip();
    }
  });

  test("signed-in visitor sees feature request form (not sign-in prompt)", async ({ page }) => {
    await page.goto(`/${WORKSPACE_SLUG}`);
    await page.getByRole("button", { name: /submit a request/i }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    // Form inputs visible — sign-in prompt is NOT shown
    await expect(dialog.getByLabel(/title/i)).toBeVisible();
  });

  test("signed-in visitor can submit a feature request", async ({ page }) => {
    await page.goto(`/${WORKSPACE_SLUG}`);
    await page.getByRole("button", { name: /submit a request/i }).click();

    const timestamp = Date.now();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel(/title/i).fill(`E2E feature request ${timestamp}`);
    await dialog.getByRole("button", { name: /submit request/i }).click();

    // Modal closes after successful submission
    await expect(dialog).not.toBeVisible({ timeout: 10_000 });
  });
});
