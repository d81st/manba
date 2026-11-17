import { expect, test } from "@playwright/test";
import { signIn } from "./helpers";

// Accounts and one admin save. The database of these checks has no editorial
// topics, so the draft created here is the test's own and stays a draft.
// Logins and slugs include the time: a failed attempt may already have
// inserted the row, and the retry must still be able to create another one.
test.describe("accounts and the topic form", () => {
  test("a reader signs in and cannot open the admin panel", async ({ browser, page }) => {
    const login = `e2e-reader-${Date.now().toString(36)}`;
    await signIn(page);
    await page.goto("/admin/users");
    await page.fill("#login", login);
    // The header's "sign out" is the first submit button on the page.
    await page.getByRole("button", { name: "Завести" }).click();
    const secret = page.locator("main").filter({ visible: true }).locator("code");
    await expect(secret).toBeVisible();
    const password = (await secret.textContent()) ?? "";
    expect(password.length).toBeGreaterThan(8);

    const reader = await (await browser.newContext()).newPage();
    await reader.goto("/login");
    await reader.fill("input[name=login]", login);
    await reader.fill("input[name=password]", password);
    await reader.getByRole("button", { name: "Войти" }).click();
    await reader.waitForURL(/\/account\/password/);
    await reader.fill("#current", password);
    await reader.fill("#next", "e2e-reader-password");
    await reader.fill("#repeat", "e2e-reader-password");
    // "Sign out" in the header is also a submit button.
    await reader.getByRole("button", { name: "Сменить пароль" }).click();
    // The first password is temporary, so a successful change opens the site.
    await reader.waitForURL((url) => url.pathname === "/");

    await reader.goto("/admin");
    await expect(reader).toHaveURL(/\/$/);
    await reader.goto("/quran");
    await expect(reader).toHaveURL(/\/quran$/);
  });

  test("an administrator can save a draft topic", async ({ page }) => {
    const title = `E2E draft ${Date.now().toString(36)}`;
    await signIn(page);
    await page.goto("/admin/topics/new");
    const form = page.locator("main").filter({ visible: true });
    await form.locator("#title").fill(title);
    await form.locator("#question").fill("Проверка формы: что сохраняется черновик?");
    await form.getByRole("button", { name: "Сохранить" }).click();
    await page.waitForURL(/\/admin\/topics\/\d+/);
    await expect(page.getByText("Сохранено.")).toBeVisible();
    // The new-topic route stays mounted but hidden, so #title exists twice.
    await expect(page.locator("#title").filter({ visible: true })).toHaveValue(title);
  });
});