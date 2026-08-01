import { expect, it } from "vitest";
import { getManageTripEditorPath, parseManageRoute } from "./manageRoute";

it("새 여행의 편집 허브 경로를 안전하게 만든다", () => {
  const path = getManageTripEditorPath("trip/상하이");

  expect(path).toBe("/manage/trips/trip%2F%EC%83%81%ED%95%98%EC%9D%B4/edit");
  expect(parseManageRoute(path)).toEqual({ view: "editHub", tripId: "trip/상하이" });
});
