import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ManageChecklistSection } from "./ManageChecklistSection";

describe("ManageChecklistSection", () => {
  it("여행 전체와 날짜별 항목을 나누고 여행 기간의 날짜만 추가 선택지로 제공한다", async () => {
    const setNewChecklistDate = vi.fn();
    render(
      <ManageChecklistSection
        checklistError=""
        checklistItems={[
          { id: "trip-item", category: "before", title: "여권", isCompleted: false, custom: false },
          {
            id: "date-item",
            category: "daily",
            title: "입장권 확인",
            isCompleted: false,
            custom: true,
            scheduledDate: "2026-08-17",
          },
        ]}
        checklistLoading={false}
        checklistSubmitting={false}
        handleAddChecklistItem={vi.fn()}
        handleDeleteChecklistItem={vi.fn()}
        handleToggleChecklistItem={vi.fn()}
        newChecklistCategory="before"
        newChecklistDate=""
        newChecklistTitle=""
        setNewChecklistCategory={vi.fn()}
        setNewChecklistDate={setNewChecklistDate}
        setNewChecklistTitle={vi.fn()}
        tripEndDate="2026-08-18"
        tripStartDate="2026-08-17"
      />,
    );

    expect(screen.getByRole("heading", { name: "여행 전체" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "8월 17일(월)" })).toBeVisible();
    const scopeSelect = screen.getByRole("combobox", { name: "확인 시점" });
    expect(scopeSelect).toHaveTextContent("8월 17일(월)");
    expect(scopeSelect).toHaveTextContent("8월 18일(화)");

    await userEvent.selectOptions(scopeSelect, "2026-08-17");
    expect(setNewChecklistDate).toHaveBeenCalledWith("2026-08-17");
  });
});
