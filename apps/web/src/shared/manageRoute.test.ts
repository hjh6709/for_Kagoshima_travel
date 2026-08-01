import { expect, it } from "vitest";
import { getManageTripEditorPath, getManageTripReturnPath, parseManageRoute } from "./manageRoute";

it("새 여행의 편집 허브 경로를 안전하게 만든다", () => {
  const path = getManageTripEditorPath("trip/상하이");

  expect(path).toBe("/manage/trips/trip%2F%EC%83%81%ED%95%98%EC%9D%B4/edit");
  expect(parseManageRoute(path)).toEqual({ view: "editHub", tripId: "trip/상하이" });
});

it("편집한 항목에 맞는 여행 탭으로 돌아간다", () => {
  expect(getManageTripReturnPath("trip/상하이", "schedules")).toBe(
    "/manage/trips/trip%2F%EC%83%81%ED%95%98%EC%9D%B4#schedule",
  );
  expect(getManageTripReturnPath("trip-1", "places")).toBe("/manage/trips/trip-1#map");
  expect(getManageTripReturnPath("trip-1", "flights")).toBe("/manage/trips/trip-1#flight");
});
