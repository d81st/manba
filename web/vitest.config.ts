import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Tests resolve "@/..." the same way as the site (tsconfig "paths"); the
// "server-only" guard is replaced with an empty module (vitest.server-only.ts).
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./vitest.server-only.ts", import.meta.url)),
    },
  },
});
