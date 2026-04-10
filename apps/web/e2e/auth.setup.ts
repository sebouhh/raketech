import fs from "node:fs";
import path from "node:path";
import { test as setup } from "@playwright/test";

export const AUTH_FILE = path.join(__dirname, "../playwright/.clerk/user.json");

setup("authenticate as team member", async ({ page }) => {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;

  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

  if (!email || !password) {
    // Write empty auth state — authenticated tests skip themselves when cookies are absent
    fs.writeFileSync(AUTH_FILE, JSON.stringify({ cookies: [], origins: [] }));
    console.log("[auth.setup] No E2E credentials set — writing empty auth state.");
    return;
  }

  await page.goto("/sign-in");
  await page.waitForLoadState("networkidle");

  // Clerk renders a multi-step sign-in: email → Continue → password → Continue
  const emailInput = page
    .getByLabel(/email address/i)
    .or(page.getByLabel(/email/i))
    .or(page.getByPlaceholder(/email/i))
    .first();
  await emailInput.fill(email);
  await page.getByRole("button", { name: /continue/i }).click();

  // Wait for password step to render
  const passwordInput = page.getByLabel(/password/i).first();
  await passwordInput.waitFor({ state: "visible", timeout: 10_000 });
  await passwordInput.fill(password);
  await page.getByRole("button", { name: /continue/i }).click();

  // Wait until we leave the sign-in page
  await page.waitForURL(/(?!.*sign-in).*/, { timeout: 15_000 });

  await page.context().storageState({ path: AUTH_FILE });
  console.log("[auth.setup] Auth state saved to", AUTH_FILE);
});
