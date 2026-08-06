import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { HomeChecklistSection } from "./HomeChecklistSection";

const items = [
  { id: "item-1", title: "여권", category: "before" as const },
  { id: "item-2", title: "보조배터리", category: "before" as const },
];

describe("HomeChecklistSection", () => {
  it("완료 개수를 n / m 카운트로 보여주고 누르면 전체 준비물로 이동한다", async () => {
    const onOpenChecklist = vi.fn();
    render(
      <HomeChecklistSection
        checkedItems={{ "item-1": true }}
        focusCompletedScheduleCount={0}
        focusScheduleCount={0}
        homeChecklistCompletedCount={1}
        homeChecklistItems={items}
        homeChecklistTotalCount={2}
        onOpenChecklist={onOpenChecklist}
        toggleCheck={vi.fn()}
        travelPhase="before"
      />,
    );

    const countButton = screen.getByRole("button", { name: "준비물 전체 보기, 2개 중 1개 완료" });
    await userEvent.click(countButton);

    expect(onOpenChecklist).toHaveBeenCalledTimes(1);
  });

  it("항목을 누르면 해당 ID로 체크를 토글한다", async () => {
    const toggleCheck = vi.fn();
    render(
      <HomeChecklistSection
        checkedItems={{}}
        focusCompletedScheduleCount={0}
        focusScheduleCount={0}
        homeChecklistCompletedCount={0}
        homeChecklistItems={items}
        homeChecklistTotalCount={2}
        onOpenChecklist={vi.fn()}
        toggleCheck={toggleCheck}
        travelPhase="before"
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "보조배터리" }));

    expect(toggleCheck).toHaveBeenCalledWith("item-2");
  });

  it("공유 보기에서는 체크 항목을 버튼이 아니라 읽기 전용으로 보여준다", () => {
    render(
      <HomeChecklistSection
        checkedItems={{ "item-1": true }}
        focusCompletedScheduleCount={0}
        focusScheduleCount={0}
        homeChecklistCompletedCount={1}
        homeChecklistItems={items}
        homeChecklistTotalCount={2}
        isReadOnly
        onOpenChecklist={vi.fn()}
        toggleCheck={vi.fn()}
        travelPhase="before"
      />,
    );

    expect(screen.queryByRole("button", { name: "보조배터리" })).not.toBeInTheDocument();
    expect(screen.getByText("보조배터리")).toBeVisible();
  });
});
