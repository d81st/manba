import { expect, test } from "@playwright/test";
import { collectErrors, signIn } from "./helpers";

// The admin adds a question to «Версии рядом» of a draft topic: a quotation
// that is not in the position is refused, the right one is saved, and the
// question is deleted again. The label includes the time so a retry does not
// collide with a row left by a failed run.
test("the admin adds, checks and deletes a question of the versions table", async ({ page }) => {
  const errors = collectErrors(page);
  const label = `E2E вопрос ${Date.now().toString(36)}`;
  await signIn(page);
  await page.goto("/admin/topics");
  await page.getByRole("link", { name: "Райхана", exact: true }).first().click();

  const section = page.locator("#versions");
  const form = section.locator("form").last();
  await form.locator("input[name=label]").fill(label);
  const row = form.locator("li").filter({ hasText: "Аль-Вакиди, «аль-Магази»" });
  await row.locator("textarea[name=quote]").fill("نص ليس في الموضع");
  await row.locator("input[name=ref]").fill("Вакиди 2:520");
  await form.getByRole("button", { name: "Добавить вопрос" }).click();
  await expect(form.getByText("Аль-Вакиди, «аль-Магази»: Этой цитаты нет в тексте позиции.")).toBeVisible();

  await row.locator("textarea[name=quote]").fill("فأسلمي يصطفيك رسول الله صلى الله عليه وسلم لنفسه");
  await form.getByRole("button", { name: "Добавить вопрос" }).click();
  const saved = section.locator("form").filter({ has: page.locator(`input[name=label][value="${label}"]`) });
  await expect(saved).toHaveCount(1);

  await saved.getByRole("button", { name: "Удалить вопрос" }).click();
  await expect(saved).toHaveCount(0);
  expect(errors).toEqual([]);
});
