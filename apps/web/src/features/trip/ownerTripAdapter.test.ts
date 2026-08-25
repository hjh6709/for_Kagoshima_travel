import { describe, expect, it } from "vitest";
import type { ChecklistItem, Place } from "../../types/travel";
import { deriveEmergencies, deriveHomeChecklist } from "./ownerTripAdapter";

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

describe("deriveEmergencies", () => {
  it("전화번호가 없는 안내형 항목(여권 분실)은 callable을 false로 둔다", () => {
    const [, , passport] = deriveEmergencies([]);

    expect(passport.id).toBe("emergency-passport");
    expect(passport.callable).toBe(false);
    expect(passport.phone).toBeUndefined();
  });

  it("긴급 연락처를 등록하지 않으면 전화 걸 수 있는 상태지만 번호는 비어 있다", () => {
    const [family] = deriveEmergencies([]);

    expect(family.title).toBe("가족 연락");
    expect(family.callable).toBe(true);
    expect(family.phone).toBeUndefined();
  });

  it("긴급 연락처를 등록하면 제목과 전화번호에 반영된다", () => {
    const [family] = deriveEmergencies([], { name: "아빠 휴대폰", phone: "010-1234-5678" });

    expect(family.title).toBe("가족 연락 (아빠 휴대폰)");
    expect(family.phone).toBe("010-1234-5678");
  });

  it("숙소에 전화번호가 있으면 숙소 연락 항목에도 반영된다", () => {
    const hotel: Place = { id: "hotel-1", name: "아스톤 호텔", category: "hotel", phone: "021-1234-5678" };

    const [, hotelInfo] = deriveEmergencies([hotel]);

    expect(hotelInfo.id).toBe("emergency-hotel");
    expect(hotelInfo.phone).toBe("021-1234-5678");
    expect(hotelInfo.callable).toBe(true);
  });
});
