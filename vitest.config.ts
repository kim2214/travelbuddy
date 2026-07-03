import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // 기본은 node(빠름). 컴포넌트/훅 테스트는 파일 상단 `// @vitest-environment jsdom`로 지정해요.
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    globals: true,
    restoreMocks: true,
    unstubGlobals: true,
  },
});
