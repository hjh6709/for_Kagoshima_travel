import { expect, test as setup } from "@playwright/test";

const API_URL = "http://localhost:8080";
const WEB_ORIGIN = "http://localhost:5173";
const STORAGE_STATE = "e2e/.auth/owner.json";

// 세션은 HttpOnly 쿠키(map_planner_session)라 토큰을 localStorage에 심을 수 없다.
// page.request는 브라우저 컨텍스트와 쿠키 항아리를 공유하므로, 여기서 받은 쿠키가
// 그대로 storageState에 담기고 이후 테스트가 로그인 상태로 시작한다.
setup("계정을 만들고 여행 하나를 시드한다", async ({ page }) => {
  // 서버를 재사용하는 로컬 실행에서 이메일이 겹치지 않도록 매번 다르게 만든다.
  const email = `e2e-${Date.now()}@example.com`;
  const headers = { Origin: WEB_ORIGIN };

  const registered = await page.request.post(`${API_URL}/api/auth/register`, {
    data: { email, password: "password123" },
    headers,
  });
  expect(registered.status(), await registered.text()).toBe(201);

  const created = await page.request.post(`${API_URL}/api/trips`, {
    data: {
      title: "상하이 여행",
      startDate: shiftToday(0),
      endDate: shiftToday(3),
      travelers: ["나"],
      destinationCountry: "CN",
      memo: "",
    },
    headers,
  });
  expect(created.status(), await created.text()).toBe(201);
  const trip = await created.json();

  const placeCreated = await page.request.post(`${API_URL}/api/trips/${trip.id}/places`, {
    data: {
      name: "예원",
      category: "attraction",
      address: "황푸구 안런제 218호",
      googleMapsUrl: "",
      recommendedReason: "",
    },
    headers,
  });
  expect(placeCreated.status(), await placeCreated.text()).toBe(201);
  const place = await placeCreated.json();

  const scheduleCreated = await page.request.post(`${API_URL}/api/trips/${trip.id}/schedules`, {
    data: {
      placeId: place.id,
      date: shiftToday(0),
      time: "10:00",
      type: "attraction",
      title: "예원 산책",
      transportMemo: "",
      guideMemo: "",
    },
    headers,
  });
  expect(scheduleCreated.status(), await scheduleCreated.text()).toBe(201);

  await page.context().storageState({ path: STORAGE_STATE });
});

function shiftToday(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}
