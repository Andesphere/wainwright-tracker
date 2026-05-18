import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { configDefaults, defineConfig, defineProject } from "vitest/config";

const repoRoot = fileURLToPath(new URL(".", import.meta.url));
const fromRepoRoot = (...segments: string[]) => path.join(repoRoot, ...segments);

export default defineConfig({
  test: {
    projects: [
      defineProject({
        plugins: [react()],
        resolve: {
          dedupe: ["react", "react-dom"],
          alias: {
            "@": fromRepoRoot("apps/web"),
            "@wainwrights/backend": fromRepoRoot("packages/backend"),
            "@wainwrights/catalog/wainwrights": fromRepoRoot(
              "packages/catalog/src/wainwrights.ts",
            ),
          },
        },
        test: {
          name: "web-unit",
          root: fromRepoRoot("apps/web"),
          globals: true,
          environment: "jsdom",
          setupFiles: [fromRepoRoot("test/setup/dom.ts")],
          include: ["**/*.test.ts", "**/*.test.tsx"],
          exclude: configDefaults.exclude,
          restoreMocks: true,
          clearMocks: true,
        },
      }),
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
    },
  },
});
