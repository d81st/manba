import { expect, test } from "@playwright/test";
import { collectErrors, signIn } from "./helpers";

// Two people, one quotation, a moderator's check and a published outcome.
// The question text includes the time so a retry does not collide with a row
// left by a failed run.
test("a debate is accepted, cited, checked and published beside the ayah", async ({ browser, page }) => {
  const stamp = Date.now().toString(36);
  const login = `e2e-debate-${stamp}`;
  const question = `E2E спор ${stamp}: что в аяте престола?`;
  const ask = `e2e-вопрос ${stamp}`;
  const answer = `e2e-ответ ${stamp}`;

  await signIn(page);
  await page.goto("/admin/users");
  const admin = page.locator("main").filter({ visible: true });
  await admin.locator("#login").fill(login);
  await admin.getByRole("button", { name: "Завести" }).click();
  const password = (await admin.locator("code").textContent()) ?? "";
  expect(password.length).toBeGreaterThan(8);

  await page.goto("/debates/new");
  const propose = page.locator("main").filter({ visible: true });
  await propose.locator("#question").fill(question);
  await propose.locator("#partner").fill(login);
  await propose.getByRole("button", { name: "Предложить спор" }).click();
  await page.waitForURL(/\/debates\/\d+$/);
  const debateUrl = page.url();

  const reader = await (await browser.newContext()).newPage();
  await reader.goto("/login");
  await reader.fill("input[name=login]", login);
  await reader.fill("input[name=password]", password);
  await reader.getByRole("button", { name: "Войти" }).click();
  await reader.waitForURL(/\/account\/password/);
  await reader.fill("#current", password);
  await reader.fill("#next", "e2e-reader-password");
  await reader.fill("#repeat", "e2e-reader-password");
  await reader.getByRole("button", { name: "Сменить пароль" }).click();
  await reader.waitForURL((url) => url.pathname === "/");

  await reader.goto("/debates");
  await reader.getByRole("link", { name: question }).click();
  await reader.getByRole("button", { name: "Принять" }).click();
  await expect(reader.getByText("идёт")).toBeVisible();

  const askForm = page.locator("main").filter({ visible: true });
  await page.goto(debateUrl);
  await askForm.locator("#body").fill(ask);
  await askForm.getByRole("button", { name: "Отправить ход" }).click();
  await expect(askForm.locator("p", { hasText: ask })).toBeVisible();

  await askForm.locator("input[name=kind][value=answer]").check();
  await askForm.locator("#parent").selectOption({ index: 1 });
  await askForm.locator("#address").fill("2:255");
  await askForm.locator("#body").fill("Свой вопрос автор не отвечает.");
  await askForm.getByRole("button", { name: "Отправить ход" }).click();
  await expect(page.getByText("На этот вопрос отвечает другой участник.")).toBeVisible();

  const reply = reader.locator("main").filter({ visible: true });
  await reader.goto(debateUrl);
  await reply.locator("input[name=kind][value=answer]").check();
  await reply.locator("#parent").selectOption({ index: 1 });
  await reply.locator("#body").fill(answer);
  await reply.getByRole("button", { name: "Отправить ход" }).click();
  await expect(reader.getByText("Нужен один адрес фрагмента")).toBeVisible();
  await reply.locator("#address").fill("2:255");
  await reply.getByRole("button", { name: "Отправить ход" }).click();
  await expect(reply.locator("p", { hasText: answer })).toBeVisible();

  await page.goto(debateUrl);
  const main = page.locator("main").filter({ visible: true });
  await main.locator("select[name=verdict]").selectOption("supports");
  await main.getByRole("button", { name: "Сохранить проверку" }).click();
  await expect(main.getByText("цитата подтверждает сказанное").first()).toBeVisible();

  await page.getByRole("button", { name: "Предложить закончить" }).click();
  await reader.goto(debateUrl);
  await reader.getByRole("button", { name: "Закончить спор" }).click();
  await expect(reader.getByText("закрыт, ждёт редактора")).toBeVisible();

  await page.goto(debateUrl);
  await page.getByRole("button", { name: "Опубликовать итог" }).click();
  await expect(page.getByText("итог опубликован")).toBeVisible();
  await expect(reader.getByRole("button", { name: "Опубликовать итог" })).toHaveCount(0);

  const id = debateUrl.match(/\/debates\/(\d+)/)?.[1];
  const exported = await page.request.get(`/api/debates/${id}/export`);
  expect(exported.ok()).toBeTruthy();
  const data = (await exported.json()) as { moves: { address: string | null; verdict: string | null }[] };
  expect(data.moves).toContainEqual(expect.objectContaining({ address: "quran.2.255", verdict: "supports" }));

  await page.goto("/quran/2#2-255");
  await expect(page.getByRole("link", { name: question })).toBeVisible();
  await page.goto("/");
  await expect(page.locator("main").getByRole("link", { name: "Дебаты" })).toBeVisible();

  // A badge is a div. Nested in a paragraph, the browser rewrites the markup
  // and React reports a hydration error. These pages must stay quiet.
  const errors = collectErrors(page);
  await page.goto("/debates");
  await page.goto("/admin/debates");
  await page.goto(debateUrl);
  await expect(page.getByText("итог опубликован").filter({ visible: true })).toBeVisible();
  expect(errors).toEqual([]);
});
