import { expect, test } from "@playwright/test";
import { signIn } from "./helpers";

test("the interface switches to English and back to Russian", async ({ page }) => {
  await signIn(page);
  // The login card stays in the document after the move to the home page, so the
  // same tagline exists twice. The check is about the one on screen.
  await expect(page.getByText("Энциклопедия ислама по первоисточникам").filter({ visible: true })).toBeVisible();
  await page.getByRole("button", { name: "English" }).click();
  await expect(page.getByText("An encyclopedia of Islam from primary sources").filter({ visible: true })).toBeVisible();
  await page.goto("/quran/2");
  await expect(page.getByLabel("Ayah").filter({ visible: true })).toBeVisible();
  await page.getByRole("button", { name: "Русский" }).click();
  await expect(page.getByLabel("Аят").filter({ visible: true })).toBeVisible();
});
