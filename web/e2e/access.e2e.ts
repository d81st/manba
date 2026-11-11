import { expect, test } from "@playwright/test";
import { E2E_LOGIN } from "../playwright.config";
import { signIn } from "./helpers";

test.describe("access", () => {
  test("every page asks to sign in first", async ({ page }) => {
    for (const path of ["/", "/quran/2", "/admin", "/bookmarks"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
    }
    expect((await page.request.get("/api/quran/search?q=x")).url()).toContain("/login");
    expect((await page.request.get("/api/health")).status()).toBe(200);
  });

  test("a wrong password does not open the site, the right one does", async ({ page }) => {
    await page.goto("/login");
    await page.fill("input[name=login]", E2E_LOGIN);
    await page.fill("input[name=password]", "not-the-password");
    await page.click("button[type=submit]");
    await expect(page.getByRole("alert").or(page.locator("form .text-destructive")).first()).toBeVisible();
    await expect(page).toHaveURL(/\/login/);

    await signIn(page);
    await expect(page.locator("header")).toContainText(E2E_LOGIN);
  });

  test("responses carry the security headers", async ({ page }) => {
    const headers = (await page.request.get("/login")).headers();
    expect(headers["content-security-policy"]).toContain("default-src 'self'");
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["strict-transport-security"]).toContain("max-age=");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-robots-tag"]).toContain("noindex");
    expect(headers["x-powered-by"]).toBeUndefined();
  });

  test("signing out ends the main administrator's sessions on other devices", async ({ browser }) => {
    const first = await (await browser.newContext()).newPage();
    const second = await (await browser.newContext()).newPage();
    await signIn(first);
    await signIn(second);
    await second.goto("/quran");
    await expect(second).toHaveURL(/\/quran$/);

    await first.goto("/");
    await first.getByRole("button", { name: "Выйти" }).click();
    await first.waitForURL(/\/login/);

    await second.goto("/quran");
    await expect(second).toHaveURL(/\/login/);
    // A new sign-in works again.
    await signIn(second);
    await second.goto("/quran");
    await expect(second).toHaveURL(/\/quran$/);
  });

  test("an unknown address shows the not-found page", async ({ page }) => {
    await signIn(page);
    await page.goto("/no-such-page");
    await expect(page.getByRole("heading", { name: "Страница не найдена" })).toBeVisible();
  });
});
