import { expect, test } from "@playwright/test";
import { collectErrors, expectAtTop, signIn, topOf } from "./helpers";

// A place chip opens the quotation on the same page. The site header stays
// above it, so the row is on screen rather than flush with the top.
async function expectInView(page: Parameters<typeof signIn>[0], id: string) {
  const height = page.viewportSize()?.height ?? 720;
  await expect.poll(async () => {
    const top = await topOf(page, id);
    return top >= 0 && top < height;
  }).toBe(true);
}

test.describe("reading", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("the main pages open without errors", async ({ page }) => {
    const errors = collectErrors(page);
    const pages = [
      "/", "/quran", "/quran/1", "/quran/map", "/hadith", "/hadith/bukhari", "/hadith/bukhari/book/1", "/library",
      "/library/ibn_hisham", "/library/umm_shafii", "/library/hidaya", "/library/bidayat_mujtahid", "/library/sarim_maslul", "/library/futuh_buldan", "/library/mughni", "/library/asnam", "/library/mizan_itidal", "/library/furusiyya", "/library/irshad_mufid", "/hadith/musannaf", "/hadith/mustadrak", "/topics", "/glossary", "/sira", "/sira/timeline", "/sira/people", "/history", "/origins",
      "/science", "/tests", "/assistant", "/knowledge", "/galaxy", "/bookmarks", "/debates", "/not-found-in-sources", "/admin",
      "/admin/reports", "/admin/errors", "/admin/topics", "/admin/debates",
    ];
    for (const path of pages) {
      const response = await page.goto(path, { waitUntil: "networkidle" });
      expect(response?.status(), path).toBe(200);
      await expect(page.locator("main h1").first(), path).toBeVisible();
      await expect(page.getByText("Страница сейчас не открывается"), path).toHaveCount(0);
    }
    expect(errors).toEqual([]);
  });

  test("a quotation of a topic opens its place in the source with the words marked", async ({ page }) => {
    const errors = collectErrors(page);
    // A draft built after the books are loaded (DRAFTS_AFTER_IMPORT), so a fresh database has it too.
    await page.goto("/admin/topics");
    await page.getByRole("link", { name: "Райхана", exact: true }).first().click();
    await page.getByRole("button", { name: "Открыть на сайте" }).click();
    await page.waitForURL(/\/topics\/rayhana\?drafts=1/);
    const quote = page.locator("#positions a.quote-link").first();
    await expect(quote).toBeVisible();
    const words = (await quote.innerText()).trim();
    await quote.click();
    await expect(page).toHaveURL(/[?&]hl=/);
    await expect.poll(() => page.evaluate(() => "highlights" in CSS && CSS.highlights.has("quote"))).toBe(true);
    const marked = await page.evaluate(() => {
      const highlight = CSS.highlights.get("quote");
      const range = highlight ? ([...highlight][0] as Range) : null;
      return range ? range.toString() : "";
    });
    expect(marked.replace(/\s+/g, "")).toBe(words.replace(/\s+/g, ""));
    expect(errors).toEqual([]);
  });

  test("a draft topic shows its versions side by side, each quotation opening its source", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/admin/topics");
    await page.getByRole("link", { name: "Райхана", exact: true }).first().click();
    await page.getByRole("button", { name: "Открыть на сайте" }).click();
    await page.waitForURL(/\/topics\/rayhana\?drafts=1/);
    const table = page.locator("#versions table");
    await expect(table).toBeVisible();
    await expect(table.getByRole("rowheader", { name: "Предложение брака" })).toBeVisible();
    await expect(table.getByText("не говорит").first()).toBeVisible();
    await table.locator("a.quote-link").first().click();
    await expect(page).toHaveURL(/[?&]hl=/);
    await expect.poll(() => page.evaluate(() => "highlights" in CSS && CSS.highlights.has("quote"))).toBe(true);
    expect(errors).toEqual([]);
  });

  test("the sura strip keeps the ayahs and opens another sura", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/quran/36");
    const strip = page.getByRole("navigation", { name: "Суры мусхафа" }).filter({ visible: true });
    await expect(strip).toBeVisible();
    await expect(strip.getByRole("link")).toHaveCount(114);
    await expect(strip.getByRole("link", { name: /^36 / })).toHaveAttribute("aria-current", "page");
    const places = await strip.locator("a").evaluateAll((links) =>
      links.slice(0, 2).map((link) => getComputedStyle(link).borderInlineStartColor),
    );
    expect(places[0]).not.toBe(places[1]);
    await strip.getByRole("link", { name: /^112 / }).click();
    await expect(page).toHaveURL(/\/quran\/112$/);
    await expect(page.getByRole("heading", { name: /112/ }).filter({ visible: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "112:1" }).filter({ visible: true })).toBeVisible();
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto("/quran/2");
    const fits = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
    expect(fits).toBe(true);
    expect(errors).toEqual([]);
  });

  test("a sura opens the ayah typed in its jump field", async ({ page }) => {
    await page.goto("/quran/2");
    const jump = page.getByLabel("Аят").filter({ visible: true });
    await jump.fill("255");
    await page.getByRole("button", { name: "Показать" }).filter({ visible: true }).click();
    await expect(page).toHaveURL(/\/quran\/2#2-255$/);
    await expectAtTop(page, "2-255");
    await jump.fill("999");
    await page.getByRole("button", { name: "Показать" }).filter({ visible: true }).click();
    await expect(page.getByText("В этой суре нет такого аята.").filter({ visible: true })).toBeVisible();
    await expect(page).toHaveURL(/\/quran\/2#2-255$/);
  });

  test("a sura shows its ayahs with the translation, and a link to an ayah lands on it", async ({ page }) => {
    await page.goto("/quran/2#2-255");
    await expect(page.locator("main ol > li[id]")).toHaveCount(286);
    await expectAtTop(page, "2-255");
    const ayah = page.locator("#\\32 -255");
    await expect(ayah.locator("p[lang=ar]")).not.toBeEmpty();
    await expect(ayah.locator("p[lang=ru]")).not.toBeEmpty();
    // The places of this sura sit above the text. A press opens the ayah below.
    const rail = page.getByRole("navigation", { name: "Места на этой странице" }).filter({ visible: true });
    await expect(rail.getByRole("link")).toHaveCount(286);
    await rail.getByRole("link", { name: "286", exact: true }).click();
    await expect(page).toHaveURL(/\/quran\/2#2-286$/);
    await expectAtTop(page, "2-286");
  });

  test("a translator note stays beside the line and opens there", async ({ page }) => {
    await page.goto("/quran/2#2-1");
    const ayah = page.locator("#\\32 -1");
    const gloss = ayah.getByRole("note");
    await expect(gloss).toHaveClass(/sr-only/);
    const mark = ayah.getByRole("button", { name: "прим. переводчика" });
    await mark.click();
    await expect(gloss).not.toHaveClass(/sr-only/);
    await expect(gloss).not.toBeEmpty();
    await expect(mark).toHaveAttribute("aria-expanded", "true");
    await mark.click();
    await expect(gloss).toHaveClass(/sr-only/);
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

  test("the home explains the sections, and an empty section points back to all topics", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Сначала текст источника")).toBeVisible();
    await expect(page.getByText("Находит фрагменты по словам вопроса")).toBeVisible();
    await page.goto("/topics?category=hard");
    const empty = page.locator("p", { hasText: "В этом разделе опубликованных тем пока нет" });
    await expect(empty).toBeVisible();
    await empty.getByRole("link", { name: "Все темы" }).click();
    await expect(page).toHaveURL(/\/topics$/);
  });

  test("the first-50 path opens a term, and a term with several places jumps to the quotation", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/glossary");
    // A database built by migrations before the library is loaded has no cards.
    if ((await page.getByRole("button", { name: "Первые 50 терминов" }).count()) === 0) {
      test.skip();
      return;
    }
    await page.getByRole("button", { name: "Первые 50 терминов" }).click();
    const path = page.getByRole("navigation", { name: "Дорожка первых терминов" }).filter({ visible: true });
    await expect(path).toBeVisible();
    await expect(path.locator("li")).toHaveCount(50);
    await path.getByRole("link", { name: /определения/ }).click();
    await expect(page).toHaveURL(/\/glossary\/qadr$/);
    await expect(page.getByRole("heading", { name: "определения" }).filter({ visible: true })).toBeVisible();

    await page.goto("/glossary/hanif");
    const places = page.getByRole("navigation", { name: "Места термина" }).filter({ visible: true });
    await expect(places).toBeVisible();
    await places.getByRole("link", { name: /3:67/ }).click();
    await expect(page).toHaveURL(/#example-quran\.3\.67$/);
    await expectInView(page, "example-quran.3.67");

    await page.goto("/glossary/salat");
    await page.getByRole("navigation", { name: "Места термина" }).filter({ visible: true }).getByRole("link", { name: "аль-Бухари 350" }).click();
    await expect(page).toHaveURL(/#example-bukhari\.350$/);
    await expectInView(page, "example-bukhari.350");

    await page.goto("/glossary/hikmah");
    await expect(page.getByRole("heading", { name: "мудрость" }).filter({ visible: true })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Места термина" }).filter({ visible: true })).toHaveCount(0);
    await expect(page.locator("main")).toContainText("2:269");

    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto("/glossary");
    await page.getByRole("button", { name: "Первые 50 терминов" }).click();
    const fits = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
    expect(fits).toBe(true);
    expect(errors).toEqual([]);
  });
});
