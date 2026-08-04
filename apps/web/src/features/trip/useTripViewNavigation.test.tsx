import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useTripViewNavigation } from "./useTripViewNavigation";

describe("useTripViewNavigation", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/demo");
  });

  it("직접 연 URL의 탭과 일정 보기를 첫 화면에 복원한다", () => {
    window.history.replaceState(null, "", "/demo#schedule-checklist");

    const { result } = renderHook(() => useTripViewNavigation());

    expect(result.current.activeTab).toBe("schedule");
    expect(result.current.scheduleView).toBe("checklist");
  });

  it("탭 이동을 새로고침 가능한 URL에 반영한다", async () => {
    const { result } = renderHook(() => useTripViewNavigation());

    act(() => {
      result.current.setScheduleView("checklist");
      result.current.setActiveTab("schedule");
    });

    await waitFor(() => expect(window.location.hash).toBe("#schedule-checklist"));

    act(() => result.current.setActiveTab("today"));

    await waitFor(() => expect(window.location.hash).toBe(""));
  });

  it("브라우저에서 바뀐 해시를 현재 탭 상태에 동기화한다", async () => {
    const { result } = renderHook(() => useTripViewNavigation());

    act(() => {
      window.history.replaceState(null, "", "/demo#flight");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });

    await waitFor(() => expect(result.current.activeTab).toBe("flight"));
    expect(result.current.scheduleView).toBe("itinerary");
  });
});
