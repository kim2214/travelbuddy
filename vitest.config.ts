import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // lib 순수 로직 테스트라 DOM이 필요 없어요.
    environment: "node",
    include: ["src/**/*.test.ts"],
    restoreMocks: true,
    unstubGlobals: true,
  },
});
