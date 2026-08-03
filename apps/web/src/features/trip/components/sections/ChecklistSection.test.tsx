import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChecklistSection } from "./ChecklistSection";

const baseProps = {
  addChecklistItem: vi.fn(),
  allChecklist: [],
  checkedItems: {},
  completedCount: 0,
  groupedChecklist: [],
  hiddenChecklistIDs: [],
  isChecklistEditing: true,
  isReadOnly: false,
  newChecklistCategory: "before" as const,
  newChecklistTitle: "여권 사본",
  removeChecklistItem: vi.fn(),
  restoreDefaultChecklistItems: vi.fn(),
  setIsChecklistEditing: vi.fn(),
  setNewChecklistCategory: vi.fn(),
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
});
