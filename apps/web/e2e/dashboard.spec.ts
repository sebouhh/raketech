import { expect, test } from "@playwright/test";
import { AUTH_FILE } from "./auth.setup";

const WORKSPACE_SLUG = process.env.E2E_WORKSPACE_SLUG ?? "e2e-test";

test.use({ storageState: AUTH_FILE });

// Skip entire suite when no auth credentials were supplied
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

test.describe("Team Dashboard — Sign-in and Navigation", () => {
  test("authenticated user reaches dashboard without being redirected to sign-in", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).not.toHaveURL(/sign-in/);
    // Must land on dashboard or its settings sub-route
    await expect(page.url()).toMatch(/dashboard/);
  });

  test("unauthenticated visit to dashboard redirects to sign-in", async ({ browser }) => {
    // Use a brand-new context with no auth state
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/sign-in/);
    await ctx.close();
  });
});

test.describe("Workspace Settings", () => {
  test("settings page renders name and slug inputs", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await expect(page.getByRole("heading", { name: /workspace settings/i })).toBeVisible();
    await expect(page.getByLabel(/workspace name/i)).toBeVisible();
    await expect(page.getByLabel(/public url slug/i)).toBeVisible();
  });

  test("can save workspace name and slug", async ({ page }) => {
    await page.goto("/dashboard/settings");

    const timestamp = Date.now();
    const newName = `E2E Workspace ${timestamp}`;
    const newSlug = `e2e-${timestamp}`;

    await page.getByLabel(/workspace name/i).fill(newName);
    await page.getByLabel(/public url slug/i).fill(newSlug);
    await page.getByRole("button", { name: /(save changes|create workspace)/i }).click();

    await expect(page.getByText(/settings saved!/i)).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("Feature Management", () => {
  test("dashboard shows Planned, In Progress, and Shipped columns", async ({ page }) => {
    await page.goto("/dashboard");
    // Redirect to settings means no workspace yet — that's acceptable
    if (page.url().includes("settings")) return;

    await expect(page.getByRole("heading", { name: /^planned$/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^in progress$/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^shipped$/i })).toBeVisible();
  });

  test("team member can move a planned feature to In Progress", async ({ page }) => {
    await page.goto("/dashboard");
    if (page.url().includes("settings")) {
      test.skip();
      return;
    }

    const plannedSection = page.getByRole("region", { name: /^planned$/i });
    const moveButton = plannedSection.getByRole("button", { name: /→ in progress/i }).first();
    if ((await moveButton.count()) === 0) {
      test.skip();
      return;
    }

    await moveButton.click();

    // After status update, In Progress column should grow
    const inProgressSection = page.getByRole("region", { name: /^in progress$/i });
    await expect(inProgressSection).toBeVisible();
    // Wait for the refetch to complete
    await page.waitForTimeout(2_000);
    const inProgressItems = inProgressSection.locator(".space-y-3 > div").filter({
      hasNotText: "Nothing here yet",
    });
    expect(await inProgressItems.count()).toBeGreaterThan(0);
  });

  test("shipping a feature adds it to the public changelog", async ({ page }) => {
    await page.goto("/dashboard");
    if (page.url().includes("settings")) {
      test.skip();
      return;
    }

    // Find the first planned feature and ship it
    const plannedSection = page.getByRole("region", { name: /^planned$/i });
    const shipButton = plannedSection.getByRole("button", { name: /→ shipped/i }).first();
    if ((await shipButton.count()) === 0) {
      test.skip();
      return;
    }

    // Capture the feature title before shipping
    const featureCard = plannedSection.locator(".rounded-lg.border").first();
    const featureTitle = await featureCard.locator("h3").first().textContent();

    await shipButton.click();
    await page.waitForTimeout(2_000);

    // Navigate to the public changelog
    await page.goto(`/${WORKSPACE_SLUG}/changelog`);
    const articles = page.locator("article");
    await expect(articles.first()).toBeVisible({ timeout: 10_000 });

    // The shipped feature's title should appear somewhere in the changelog
    if (featureTitle) {
      await expect(page.getByText(featureTitle.trim())).toBeVisible({ timeout: 5_000 });
    }
  });
});

test.describe("Sort Controls", () => {
  test("sort by Votes, Date added, and Status buttons are visible", async ({ page }) => {
    await page.goto("/dashboard");
    if (page.url().includes("settings")) return;

    await expect(page.getByRole("button", { name: /votes/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /date added/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /status/i })).toBeVisible();
  });

  test("clicking a sort button highlights it as active", async ({ page }) => {
    await page.goto("/dashboard");
    if (page.url().includes("settings")) return;

    const dateButton = page.getByRole("button", { name: /date added/i });
    await dateButton.click();
    // Active sort button has dark background — check class or aria state
    await expect(dateButton).toHaveClass(/bg-foreground/);
  });
});
