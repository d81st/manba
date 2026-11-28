import { expect, test } from "@playwright/test";
import { collectErrors, signIn } from "./helpers";

// «Что проверить»: a new draft shows up with its items; an item marked as
// checked turns «изменено после проверки» once the topic is edited; a remark stays.
test("a draft's item is checked, a remark saved, and an edit sends it back for a check", async ({ page }) => {
  const title = `E2E review ${Date.now().toString(36)}`;
  await signIn(page);
  const errors = collectErrors(page);
  await page.goto("/admin/topics/new");
  const form = page.locator("main").filter({ visible: true });
  await form.locator("#title").fill(title);
  await form.locator("#question").fill("Проверка списка: что отмечается?");
  await form.getByRole("button", { name: "Сохранить" }).click();
  await page.waitForURL(/\/admin\/topics\/\d+/);
  const topicUrl = page.url();

  await page.goto("/admin/review");
  await page.locator("main").filter({ visible: true }).getByRole("link", { name: title }).click();
  await page.waitForURL(/\/admin\/review\/\d+$/);
  const main = page.locator("main").filter({ visible: true });
  await expect(main.getByRole("heading", { name: title })).toBeVisible();
  const question = main.locator("#item-1");
  await expect(question.getByRole("heading", { name: "1. Название и вопрос" })).toBeVisible();
  await expect(question.getByText("не проверено")).toBeVisible();

  await question.getByRole("button", { name: "Проверено" }).click();
  await expect(question.getByText("Отмечено как проверенное.")).toBeVisible();
  await expect(question.getByText("проверено", { exact: true })).toBeVisible();
  await expect(question.getByRole("button", { name: "Снять отметку" })).toBeVisible();

  const texts = main.locator("#item-2");
  await texts.locator("textarea[name=note]").fill("Добавить второй источник.");
  await texts.getByRole("button", { name: "Сохранить замечание" }).click();
  await expect(texts.getByText("Замечание сохранено.")).toBeVisible();

  await page.goto(topicUrl);
  const edit = page.locator("main").filter({ visible: true });
  await edit.locator("#question").fill("Проверка списка: что отмечается после правки?");
  await edit.getByRole("button", { name: "Сохранить", exact: true }).click();
  await expect(edit.getByText("Сохранено.")).toBeVisible();

  await page.goto("/admin/review");
  const row = page.locator("main").filter({ visible: true }).getByRole("row", { name: new RegExp(title) });
  await expect(row.getByText("изменено: 1")).toBeVisible();
  await expect(row.getByText("замечаний: 1")).toBeVisible();
  await row.getByRole("link", { name: title }).click();
  const again = page.locator("main").filter({ visible: true });
  await expect(again.locator("#item-1").getByText("изменено после проверки")).toBeVisible();
  await expect(again.locator("#item-2 textarea[name=note]")).toHaveValue("Добавить второй источник.");
  expect(errors).toEqual([]);
});
