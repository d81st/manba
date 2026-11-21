import { expect, test } from "@playwright/test";
import { signIn } from "./helpers";

test("the interface switches to English and back to Russian", async ({ page }) => {
  await signIn(page);
  await expect(page.getByText("Энциклопедия ислама по первоисточникам")).toBeVisible();
  await page.getByRole("button", { name: "English" }).click();
  await expect(page.getByText("An encyclopedia of Islam from primary sources")).toBeVisible();
  await page.goto("/quran/2");
  await expect(page.getByLabel("Ayah").filter({ visible: true })).toBeVisible();
  await page.getByRole("button", { name: "Русский" }).click();
  await expect(page.getByLabel("Аят").filter({ visible: true })).toBeVisible();
});
