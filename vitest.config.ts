import { defineConfig } from "vitest/config";

const sqliteFlag = "--experimental-sqlite";

export default defineConfig({
  test: {
    setupFiles: ["tests/helpers/setup.ts"],
    // The edge proxy has its own Vitest project under ops/edge-proxy.
    // Keep it out of this suite so the Worker test doubles here do not apply.
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/cypress/**",
      "**/.{idea,git,cache,output,temp}/**",
      "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*",
      "ops/edge-proxy/**",
    ],
    pool: "forks",
    poolOptions: {
      forks: { execArgv: [sqliteFlag] },
      threads: { execArgv: [sqliteFlag] },
    },
  },
});
