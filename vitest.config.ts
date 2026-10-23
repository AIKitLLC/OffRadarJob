import { defineConfig } from "vitest/config";

const sqliteFlag = "--experimental-sqlite";

export default defineConfig({
  test: {
    setupFiles: ["tests/helpers/setup.ts"],
    pool: "forks",
    poolOptions: {
      forks: { execArgv: [sqliteFlag] },
      threads: { execArgv: [sqliteFlag] },
    },
  },
});
