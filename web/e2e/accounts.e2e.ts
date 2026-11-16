import { expect, test } from "@playwright/test";
import { signIn } from "./helpers";

// Accounts and one admin save. The database of these checks has no editorial
// topics, so the draft created here is the test's own and stays a draft.
test.describe("accounts and the topic form", () => {
  test("a reader signs in and cannot open the admin panel", async ({ browser, page }) => {
    await signIn(page);
    await page.goto("/admin/users");
    await page.fill("#login", "e2e-reader");
    await page.click("button[type=submit]");
    const secret = page.locator("code").first();
    await expect(secret).toBeVisible();
    const password = (await secret.textContent()) ?? "";
    expect(password.length).toBeGreaterThan(8);

    const reader = await (await browser.newContext()).newPage();
    await reader.goto("/login");
    await reader.fill("input[name=login]", "e2e-reader");
    await reader.fill("input[name=password]", password);
    await reader.click("button[type=submit]");
    await reader.waitForURL(/\/account\/password/);
    await reader.fill("#current", password);
    await reader.fill("#next", "e2e-reader-password");
    await reader.fill("#repeat", "e2e-reader-password");
    await reader.click("button[type=submit]");
    // The first password is temporary, so a successful change opens the site.
    await reader.waitForURL((url) => url.pathname === "/");

    await reader.goto("/admin");
    await expect(reader).toHaveURL(/\/$/);
    await reader.goto("/quran");
    await expect(reader).toHaveURL(/\/quran$/);
  });

  test("an administrator can save a draft topic", async ({ page }) => {
    await signIn(page);
    await page.goto("/admin/topics/new");
    await page.fill("#title", "E2E draft");
    await page.fill("#question", "Проверка формы: что сохраняется черновик?");
    await page.getByRole("button", { name: "Сохранить" }).click();
    await page.waitForURL(/\/admin\/topics\/\d+/);
    await expect(page.getByText("Сохранено.")).toBeVisible();
    await expect(page.locator("#title")).toHaveValue("E2E draft");
  });
});