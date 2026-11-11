import { defineConfig } from "@playwright/test";

// Browser checks of the built site (e2e/*.e2e.ts): the things that were
// checked by hand after every change — signing in, reading pages, anchors,
// searches, graphs, forms. They run against `next start` on a database with
// the migrations applied and the sources loaded, as CI builds it:
//
//   npm run build && npm run db:migrate && npm run db:import && npm run e2e
//
// The login and the password here are for this local server only.
const PORT = 3210;

export const E2E_LOGIN = "e2e-admin";
export const E2E_PASSWORD = "e2e-password-for-local-server";

export default defineConfig({
  testDir: "e2e",
  testMatch: "**/*.e2e.ts",
  // One server and one database: tests that write (reports, bookmarks,
  // sign-out) must not run beside each other.
  workers: 1,
  fullyParallel: false,
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["github"]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "off",
    screenshot: "only-on-failure",
    launchOptions: {
      // Graphs draw with WebGL; a headless browser needs the software renderer.
      args: ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"],
      // A browser already on the machine (the cloud sessions have one).
      executablePath: process.env.E2E_CHROMIUM || undefined,
    },
  },
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      SITE_LOGIN: E2E_LOGIN,
      SITE_PASSWORD: E2E_PASSWORD,
      SESSION_SECRET: "e2e-session-secret-for-the-local-server-only",
    },
  },
});
