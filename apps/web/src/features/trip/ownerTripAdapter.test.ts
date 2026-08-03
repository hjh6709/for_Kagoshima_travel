import { describe, expect, it } from "vitest";
import type { ChecklistItem } from "../../types/travel";
import { deriveHomeChecklist } from "./ownerTripAdapter";

describe("deriveHomeChecklist", () => {
  it("완료 항목을 숨기지 않고 전체 항목을 기준으로 진행률을 계산한다", () => {
    const checklist: ChecklistItem[] = [
      { id: "done", category: "daily", title: "완료한 공통 항목" },
      { id: "todo", category: "daily", title: "남은 공통 항목" },
      { id: "today", category: "before", title: "오늘 항목", scheduledDate: "2026-08-17" },
      { id: "tomorrow", category: "daily", title: "내일 항목", scheduledDate: "2026-08-18" },
    ];

    const result = deriveHomeChecklist(checklist, { done: true }, ["daily"], "2026-08-17");

    expect(result.totalCount).toBe(3);
    expect(result.completedCount).toBe(1);
    expect(result.items.map((item) => item.id)).toEqual(["today", "todo", "done"]);
  });
});
