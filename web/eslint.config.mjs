import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Modules (src/modules/<name>) are used only through their public entries:
  // "@/modules/<name>", on the server "@/modules/<name>/server", and the strings
  // "@/modules/<name>/i18n" (for i18n/ru.ts). Inside a
  // module, files reach each other by relative paths.
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^@/modules/[^/]+/(?!(server|i18n)$).+",
              message: "Import a module through its public entry: @/modules/<name>, @/modules/<name>/server or @/modules/<name>/i18n.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
