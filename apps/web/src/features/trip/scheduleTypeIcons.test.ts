import { describe, expect, it } from "vitest";
import { scheduleTypeLabels } from "../../shared/travelOptions";
import { scheduleTypeIcons } from "./scheduleTypeIcons";

describe("scheduleTypeIcons", () => {
  it("모든 일정 종류에 아이콘이 있다", () => {
    for (const type of Object.keys(scheduleTypeLabels)) {
      expect(scheduleTypeIcons[type as keyof typeof scheduleTypeIcons]).toBeTruthy();
    }
  });

  it("라벨과 아이콘의 종류 목록이 정확히 일치한다", () => {
    expect(Object.keys(scheduleTypeIcons).sort()).toEqual(Object.keys(scheduleTypeLabels).sort());
  });
});
