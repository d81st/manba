import { expect, test } from "@playwright/test";
import { collectErrors, expectAtTop, signIn } from "./helpers";

test.describe("reading", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("the main pages open without errors", async ({ page }) => {
    const errors = collectErrors(page);
    const pages = [
      "/", "/quran", "/quran/1", "/quran/map", "/hadith", "/hadith/bukhari", "/hadith/bukhari/book/1", "/library",
      "/library/ibn_hisham", "/library/umm_shafii", "/topics", "/glossary", "/sira", "/sira/timeline", "/sira/people", "/history", "/origins",
      "/science", "/tests", "/assistant", "/knowledge", "/galaxy", "/bookmarks", "/not-found-in-sources", "/admin",
      "/admin/reports", "/admin/topics",
    ];
    for (const path of pages) {
      const response = await page.goto(path, { waitUntil: "networkidle" });
      expect(response?.status(), path).toBe(200);
      await expect(page.locator("main h1").first(), path).toBeVisible();
      await expect(page.getByText("Страница сейчас не открывается"), path).toHaveCount(0);
    }
    expect(errors).toEqual([]);
  });

  test("a sura shows its ayahs with the translation, and a link to an ayah lands on it", async ({ page }) => {
    await page.goto("/quran/2#2-255");
    await expect(page.locator("main ol > li[id]")).toHaveCount(286);
    await expectAtTop(page, "2-255");
    const ayah = page.locator("#\\32 -255");
    await expect(ayah.locator("p[lang=ar]")).not.toBeEmpty();
    await expect(ayah.locator("p[lang=ru]")).not.toBeEmpty();
    // The last ayah too: rows off the screen keep an estimated height until then.
    await page.goto("/quran/2#2-286");
    await expectAtTop(page, "2-286");
  });

  test("the Quran search finds a word and opens an address", async ({ page }) => {
    await page.goto(`/quran/search?q=${encodeURIComponent("موسى")}`);
    await expect(page.locator("main li.long-row").first()).toBeVisible();
    expect(await page.locator("main li.long-row").count()).toBeGreaterThan(20);
    await page.goto(`/quran/search?q=${encodeURIComponent("2:255")}`);
    await expect(page.locator("main")).toContainText("2:255");
  });

  test("a hadith number opens its book on that hadith; similar texts draw as a graph", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/hadith/ibn_majah/833");
    await expect(page).toHaveURL(/\/hadith\/ibn_majah\/book\/\d+/);
    const row = page.locator("li:target");
    await expect(row).toContainText("Ибн Маджа 833");
    await row.locator("details > summary").click();
    await row.getByRole("button", { name: "Показать связи графом" }).click();
    await expect(row.locator("canvas").first()).toBeVisible({ timeout: 20_000 });
    await expect(row.getByText("Этот хадис")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("the hadith search and a book of the library open their texts", async ({ page }) => {
    await page.goto(`/hadith/search?q=${encodeURIComponent("الصلاة")}`);
    await expect(page.locator("main li.long-row").first()).toBeVisible();
    await page.goto("/library/ibn_hisham/1.235");
    await expect(page).toHaveURL(/\/library\/ibn_hisham\//);
    await expect(page.locator("main [lang=ar]").first()).toBeVisible();
  });

  test("graphs draw: the map of the Quran, the knowledge map and the galaxy in 2D and 3D", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/quran/map", { waitUntil: "networkidle" });
    await expect(page.locator("main canvas").first()).toBeVisible();
    await page.goto("/galaxy", { waitUntil: "networkidle" });
    await expect(page.locator("main canvas").first()).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: "3D", exact: true }).click();
    await expect(page).toHaveURL(/view=3d/);
    await expect(page.locator("main canvas").first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("не может показать 3D")).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test("the search in the header leads to the assistant, which finds texts and books", async ({ page }) => {
    await page.goto("/quran");
    await page.fill("header input[name=q]", "2:255");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/assistant\?q=/);
    await expect(page.locator("main")).toContainText("2:255");

    await page.goto(`/assistant?q=${encodeURIComponent("الصلاة")}`);
    await expect(page.getByRole("heading", { name: "Хадисы" })).toBeVisible();
    const books = page.locator('main a[href*="/library/"][href*="/search?q="]');
    await expect(books.first()).toBeVisible({ timeout: 20_000 });
    // The number on a book is the number of fragments its own search finds.
    const count = (await books.first().locator("span").last().innerText()).trim();
    await books.first().click();
    await expect(page).toHaveURL(/\/library\/.+\/search/);
    await expect(page.getByText(`Найдено: ${count}`)).toBeVisible();
  });
});
