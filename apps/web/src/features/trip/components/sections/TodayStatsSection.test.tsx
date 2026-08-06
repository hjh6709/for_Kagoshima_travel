import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TodayStatsSection } from "./TodayStatsSection";

// 이 테스트 환경의 전역 localStorage에는 호출 가능한 메서드가 없어서
// (Node의 --localstorage-file 미설정) 매 테스트마다 메모리 저장소를 심어 준다.
function installMemoryStorage() {
  const store = new Map<string, string>();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
      removeItem: (key: string) => void store.delete(key),
      clear: () => store.clear(),
    },
  });
}

describe("TodayStatsSection", () => {
  beforeEach(() => {
    installMemoryStorage();
  });

  it("여행 단계와 오늘 일정 진행 상황을 실제 값으로 보여준다", () => {
    render(
      <TodayStatsSection
        completedScheduleCount={1}
        destinationCountry="JP"
        onOpenCurrency={vi.fn()}
        scheduleCount={3}
        statusLabel="여행 2일차"
      />,
    );

    expect(screen.getByText("여행 2일차")).toBeVisible();
    expect(screen.getByText("1/3")).toBeVisible();
  });

  it("저장된 환율이 있으면 100엔 기준 원화를 보여준다", () => {
    localStorage.setItem(
      "map-planner:exchange-rate:JPY",
      JSON.stringify({ rate: 928.4, savedAt: Date.now() }),
    );

    render(
      <TodayStatsSection
        completedScheduleCount={0}
        destinationCountry="JP"
        onOpenCurrency={vi.fn()}
        scheduleCount={0}
        statusLabel="출발 D-3"
      />,
    );

    expect(screen.getByText("928원")).toBeVisible();
    expect(screen.getByText("100엔")).toBeVisible();
  });

  it("저장된 환율이 없으면 값 대신 환율 보기를 띄우고 눌러서 이동한다", async () => {
    const onOpenCurrency = vi.fn();
    render(
      <TodayStatsSection
        completedScheduleCount={0}
        destinationCountry="JP"
        onOpenCurrency={onOpenCurrency}
        scheduleCount={0}
        statusLabel="출발 D-3"
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /환율 보기/ }));

    expect(onOpenCurrency).toHaveBeenCalledTimes(1);
  });

  it("환율을 지원하지 않는 목적지에서는 환율 칸을 빼고 두 칸만 보여준다", () => {
    render(
      <TodayStatsSection
        completedScheduleCount={0}
        destinationCountry="OTHER"
        onOpenCurrency={vi.fn()}
        scheduleCount={2}
        statusLabel="여행 1일차"
      />,
    );

    expect(screen.queryByText(/환율/)).not.toBeInTheDocument();
    expect(screen.getByText("0/2")).toBeVisible();
  });
});
