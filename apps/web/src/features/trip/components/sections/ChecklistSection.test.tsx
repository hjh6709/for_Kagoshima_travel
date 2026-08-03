import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ChecklistSection } from "./ChecklistSection";

const baseProps = {
  addChecklistItem: vi.fn(),
  allChecklist: [],
  checkedItems: {},
  checklistDateFilter: "all",
  dates: ["2026-08-17", "2026-08-18"],
  getDisplayDate: (date: string) => date,
  hiddenChecklistIDs: [],
  isChecklistEditing: true,
  isReadOnly: false,
  newChecklistCategory: "before" as const,
  newChecklistDate: "",
  newChecklistTitle: "여권 사본",
  removeChecklistItem: vi.fn(),
  restoreDefaultChecklistItems: vi.fn(),
  setIsChecklistEditing: vi.fn(),
  setChecklistDateFilter: vi.fn(),
  setNewChecklistCategory: vi.fn(),
  setNewChecklistDate: vi.fn(),
  setNewChecklistTitle: vi.fn(),
  toggleCheck: vi.fn(),
};

describe("ChecklistSection", () => {
  it("저장 실패를 사용자에게 보여주고 전송 중 중복 추가를 막는다", () => {
    render(
      <ChecklistSection
        {...baseProps}
        checklistError="네트워크 연결을 확인해 주세요."
        checklistSubmitting={true}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("네트워크 연결을 확인해 주세요.");
    expect(screen.getByRole("button", { name: "추가 중" })).toBeDisabled();
  });

  it("날짜 필터를 선택하면 해당 날짜 항목만 보여주고 추가 시점도 맞춘다", async () => {
    const setChecklistDateFilter = vi.fn();
    const setNewChecklistDate = vi.fn();
    const view = render(
      <ChecklistSection
        {...baseProps}
        allChecklist={[
          { id: "trip-item", category: "before", title: "여권" },
          { id: "day-item", category: "daily", title: "입장권 확인", scheduledDate: "2026-08-17" },
        ]}
        isChecklistEditing={false}
        setChecklistDateFilter={setChecklistDateFilter}
        setNewChecklistDate={setNewChecklistDate}
      />,
    );

    expect(screen.getByText("여권")).toBeVisible();
    expect(screen.getByText("입장권 확인")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "8/17(월)" }));
    expect(setChecklistDateFilter).toHaveBeenCalledWith("2026-08-17");
    expect(setNewChecklistDate).toHaveBeenCalledWith("2026-08-17");

    view.rerender(
      <ChecklistSection
        {...baseProps}
        allChecklist={[
          { id: "trip-item", category: "before", title: "여권" },
          { id: "day-item", category: "daily", title: "입장권 확인", scheduledDate: "2026-08-17" },
        ]}
        checklistDateFilter="2026-08-17"
        isChecklistEditing={false}
        setChecklistDateFilter={setChecklistDateFilter}
        setNewChecklistDate={setNewChecklistDate}
      />,
    );
    expect(screen.queryByText("여권")).not.toBeInTheDocument();
    expect(screen.getByText("입장권 확인")).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "전체" }));
    expect(setNewChecklistDate).toHaveBeenLastCalledWith("");
  });
});
