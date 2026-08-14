import { defineConfig, devices } from "@playwright/test";
import { VIEWPORTS } from "./e2e/fixtures/viewport";

const WEB_PORT = 5173;
const API_PORT = 8080;
const BASE_URL = `http://localhost:${WEB_PORT}`;
const API_URL = `http://localhost:${API_PORT}`;

export default defineConfig({
  testDir: "./e2e",
  // 레이아웃 측정은 병렬 실행과 무관하게 안정적이지만, CI 러너에서 흔들리는 것을 막는다.
  fullyParallel: !process.env.CI,
  workers: process.env.CI ? 1 : undefined,
  forbidOnly: !!process.env.CI,
  // 재시도는 두지 않는다. 스모크가 불안정하면 테스트를 고쳐야지 재시도로 덮으면 안 된다.
  retries: 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: VIEWPORTS.map((viewport) => ({
    name: `demo-${viewport.name}`,
    testMatch: /demo.*\.spec\.ts/,
    use: { ...devices["Desktop Chrome"], viewport: { width: viewport.width, height: viewport.height } },
  })),
  webServer: [
    {
      // 프로덕션 빌드를 그대로 검증한다. 개발 서버는 CSS 주입 순서가 달라
      // theme-ios.css 캐스케이드 회귀를 놓칠 수 있다.
      command: `VITE_API_BASE_URL=${API_URL} npm run build && npm run preview -- --port ${WEB_PORT} --strictPort`,
      url: BASE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
    {
      // DATABASE_URL을 비우면 in-memory 저장소가 뜬다(server.go). 매 실행이 깨끗한 상태다.
      command: "go run ./cmd/api",
      cwd: "../api",
      url: `${API_URL}/healthz`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        DATABASE_URL: "",
        JWT_SECRET: "e2e-secret-not-for-production-0123456789",
        AUTH_TEST_BYPASS: "1",
        PORT: String(API_PORT),
        LOG_LEVEL: "warn",
      },
    },
  ],
});
