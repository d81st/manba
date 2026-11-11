import { expect, type Page } from "@playwright/test";
import { E2E_LOGIN, E2E_PASSWORD } from "../playwright.config";

export async function signIn(page: Page) {
  await page.goto("/login");
  await page.fill("input[name=login]", E2E_LOGIN);
  await page.fill("input[name=password]", E2E_PASSWORD);
  await page.click("button[type=submit]");
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

// Errors of the page itself: exceptions and console errors (a blocked script
// under the content security policy shows up here too).
export function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
}

// How far the element with this id is from the top of the screen.
export async function topOf(page: Page, id: string) {
  return page.evaluate((target) => Math.round(document.getElementById(target)?.getBoundingClientRect().top ?? Number.NaN), id);
}

// The row a link like "/quran/2#2-255" points at stands at the top of the screen.
export async function expectAtTop(page: Page, id: string) {
  await expect.poll(() => topOf(page, id), { timeout: 10_000 }).toBeLessThan(120);
  expect(await topOf(page, id)).toBeGreaterThanOrEqual(0);
}
