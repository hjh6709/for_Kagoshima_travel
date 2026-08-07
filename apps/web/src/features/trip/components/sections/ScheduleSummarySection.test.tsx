import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ScheduleSummarySection } from "./ScheduleSummarySection";

describe("ScheduleSummarySection", () => {
  it("선택한 날짜의 완료 진행 상황을 보여준다", () => {
    render(<ScheduleSummarySection completedCount={1} totalCount={3} />);

    expect(screen.getByText("3개 중 1개 완료")).toBeVisible();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "33");
  });

  it("일정이 없으면 0으로 나누지 않고 0%로 처리한다", () => {
    render(<ScheduleSummarySection completedCount={0} totalCount={0} />);

    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });

  it("모두 완료하면 100%가 된다", () => {
    render(<ScheduleSummarySection completedCount={4} totalCount={4} />);

    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  });
});
