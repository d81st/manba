import { expect, test } from "@playwright/test";
import { expectAtTop, signIn } from "./helpers";

// What a reader keeps and sends: bookmarks, "continue reading", "report a mistake".
test.describe("reader tools", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("a bookmark remembers the ayah on screen, opens it again and can be removed", async ({ page }) => {
    await page.goto("/quran/2#2-255");
    await expectAtTop(page, "2-255");
    await page.getByRole("button", { name: "Добавить закладку" }).click();
    const dialog = page.locator("dialog[open]");
    await expect(dialog.locator("bdi")).toHaveText("/quran/2#2-255");
    await expect(dialog.locator("input[name=title]")).toHaveValue(/2:255$/);
    await dialog.locator("input[name=title]").fill("e2e: престольный аят");
    await dialog.locator("input[name=note]").fill("e2e: заметка");
    await dialog.locator("button[type=submit]").click();
    await expect(dialog.getByRole("status")).toBeVisible();

    await page.goto("/bookmarks");
    const item = page.locator("main li", { hasText: "e2e: престольный аят" });
    await expect(item).toContainText("e2e: заметка");
    await item.getByRole("link").click();
    await expect(page).toHaveURL(/\/quran\/2#2-255$/);
    await expectAtTop(page, "2-255");

    await page.goto("/bookmarks");
    await page.locator("main li", { hasText: "e2e: престольный аят" }).getByRole("button", { name: "Удалить" }).click();
    await expect(page.locator("main li", { hasText: "e2e: престольный аят" })).toHaveCount(0);
  });

  test("continue reading remembers the place in this browser and forgets it on sign-out", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("region", { name: "Продолжить чтение" })).toHaveCount(0);

    await page.goto("/quran/2#2-255");
    await expectAtTop(page, "2-255");
    await page.mouse.wheel(0, 2500);
    await expect.poll(() => page.evaluate(() => localStorage.getItem("manba:reading")), { timeout: 10_000 }).toContain("/quran/2#2-2");

    await page.goto("/");
    const block = page.getByRole("region", { name: "Продолжить чтение" });
    await expect(block).toContainText("Коран");
    await block.getByRole("link").first().click();
    await expect(page).toHaveURL(/\/quran\/2#2-\d+$/);

    await page.goto("/");
    await page.getByRole("button", { name: "Выйти" }).click();
    await page.waitForURL(/\/login/);
    await expect.poll(() => page.evaluate(() => localStorage.getItem("manba:reading"))).toBeNull();
  });

  test("a report of a mistake reaches the administrator with the page and the selected text", async ({ page }) => {
    const message = `e2e: проверка сообщения ${Date.now()}`;
    // Wait until the page is fully alive: the button keeps the selection only then.
    await page.goto("/quran/1#1-2", { waitUntil: "networkidle" });
    await expectAtTop(page, "1-2");
    await page.evaluate(() => {
      const range = document.createRange();
      range.selectNodeContents(document.querySelector("#\\31 -2 p[lang=ru]")!);
      const selection = getSelection()!;
      selection.removeAllRanges();
      selection.addRange(range);
    });
    await page.getByRole("button", { name: "Сообщить об ошибке" }).click();
    const dialog = page.locator("dialog[open]");
    await expect(dialog.locator("bdi")).toHaveText("/quran/1#1-2");
    await expect(dialog.locator("blockquote")).not.toBeEmpty();
    await dialog.locator("textarea").fill(message);
    await dialog.locator("button[type=submit]").click();
    await expect(dialog.getByRole("status")).toBeVisible();

    await page.goto("/admin/reports");
    const report = page.locator("main li", { hasText: message });
    await expect(report).toContainText("/quran/1#1-2");
    await expect(report.locator("blockquote")).not.toBeEmpty();
    await report.getByRole("button", { name: "Разобрано" }).click();
    await expect(page.locator("main li", { hasText: message })).toHaveCount(0);
    await page.goto("/admin/reports?status=done");
    await expect(page.locator("main li", { hasText: message })).toHaveCount(1);
  });
});
