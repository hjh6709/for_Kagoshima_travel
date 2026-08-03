import type { FormEvent } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createChecklistItem,
  deleteChecklistItem,
  listChecklist,
  updateChecklistItem,
} from "../../api/checklist";
import { isOnline } from "../../utils/offlineCache";
import { useTripManageChecklistActions } from "./useTripManageChecklistActions";

vi.mock("../../api/checklist", () => ({
  createChecklistItem: vi.fn(),
  deleteChecklistItem: vi.fn(),
  listChecklist: vi.fn(),
  updateChecklistItem: vi.fn(),
}));

vi.mock("../../utils/offlineCache", () => ({
  isOnline: vi.fn(() => true),
}));

const createdItem = {
  id: "check-1",
  category: "before" as const,
  title: "여권 사본",
  isCompleted: false,
  custom: true,
  scheduledDate: "2026-08-17",
};

describe("useTripManageChecklistActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isOnline).mockReturnValue(true);
    vi.mocked(listChecklist).mockResolvedValue([]);
  });

  it("추가, 완료 토글, 삭제 결과를 화면 상태에 즉시 반영한다", async () => {
    vi.mocked(createChecklistItem).mockResolvedValue(createdItem);
    vi.mocked(updateChecklistItem).mockResolvedValue({ ...createdItem, isCompleted: true });
    vi.mocked(deleteChecklistItem).mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useTripManageChecklistActions({
        accessToken: "owner-token",
        clearOwnerSession: vi.fn(),
        tripID: "trip-1",
      }),
    );

    await waitFor(() => expect(result.current.checklistLoading).toBe(false));

    act(() => result.current.setNewChecklistTitle("  여권 사본  "));
    act(() => result.current.setNewChecklistDate("2026-08-17"));
    await act(async () => {
      await result.current.handleAddChecklistItem({
        preventDefault: vi.fn(),
      } as unknown as FormEvent);
    });
    expect(createChecklistItem).toHaveBeenCalledWith(
      "trip-1",
      "owner-token",
      "before",
      "여권 사본",
      "2026-08-17",
    );
    expect(result.current.checklistItems).toEqual([createdItem]);

    await act(async () => {
      await result.current.handleToggleChecklistItem("check-1", true);
    });
    expect(result.current.checklistItems[0]?.isCompleted).toBe(true);

    await act(async () => {
      await result.current.handleDeleteChecklistItem("check-1");
    });
    expect(result.current.checklistItems).toEqual([]);
  });

  it("오프라인에서는 추가 요청을 보내지 않고 복구 가능한 안내를 보여준다", async () => {
    vi.mocked(isOnline).mockReturnValue(false);
    const { result } = renderHook(() =>
      useTripManageChecklistActions({
        accessToken: "owner-token",
        clearOwnerSession: vi.fn(),
        tripID: "trip-1",
      }),
    );

    await waitFor(() => expect(result.current.checklistLoading).toBe(false));
    act(() => result.current.setNewChecklistTitle("여권 사본"));
    await act(async () => {
      await result.current.handleAddChecklistItem({
        preventDefault: vi.fn(),
      } as unknown as FormEvent);
    });

    expect(createChecklistItem).not.toHaveBeenCalled();
    expect(result.current.checklistError).toContain("오프라인 상태에서는 준비물을 추가할 수 없습니다");
  });

  it("HttpOnly 쿠키로 복원한 세션에서도 준비물을 조회하고 추가한다", async () => {
    vi.mocked(createChecklistItem).mockResolvedValue(createdItem);

    const { result } = renderHook(() =>
      useTripManageChecklistActions({
        accessToken: "",
        clearOwnerSession: vi.fn(),
        tripID: "trip-1",
      }),
    );

    await waitFor(() =>
      expect(listChecklist).toHaveBeenCalledWith("trip-1", ""),
    );
    act(() => result.current.setNewChecklistTitle("여권 사본"));
    await act(async () => {
      await result.current.handleAddChecklistItem({
        preventDefault: vi.fn(),
      } as unknown as FormEvent);
    });

    expect(createChecklistItem).toHaveBeenCalledWith(
      "trip-1",
      "",
      "before",
      "여권 사본",
      "",
    );
  });
});
