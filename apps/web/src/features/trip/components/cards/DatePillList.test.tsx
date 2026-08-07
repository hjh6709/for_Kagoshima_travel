import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DatePillList } from "./DatePillList";

const dates = ["2026-08-20", "2026-08-21", "2026-08-22"];

describe("DatePillList", () => {
  it("버튼 이름은 기존과 같은 짧은 날짜 형식을 유지한다", () => {
    render(
      <DatePillList
        dates={dates}
        getDisplayDate={(date) => date}
        onSelectDate={vi.fn()}
        selectedDate="2026-08-20"
      />,
    );

    expect(screen.getByRole("button", { name: "8/20(목)" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "8/21(금)" })).toHaveAttribute("aria-pressed", "false");
  });

  it("각 필에 요일 · 일 · DAY 번호를 함께 보여준다", () => {
    render(
      <DatePillList
        dates={dates}
        getDisplayDate={(date) => date}
        onSelectDate={vi.fn()}
        selectedDate="2026-08-20"
      />,
    );

    const secondPill = screen.getByRole("button", { name: "8/21(금)" });
    expect(secondPill).toHaveTextContent("금");
    expect(secondPill).toHaveTextContent("21");
    expect(secondPill).toHaveTextContent("DAY 2");
  });

  it("날짜를 누르면 해당 날짜로 선택을 바꾼다", async () => {
    const onSelectDate = vi.fn();
    render(
      <DatePillList
        dates={dates}
        getDisplayDate={(date) => date}
        onSelectDate={onSelectDate}
        selectedDate="2026-08-20"
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "8/22(토)" }));

    expect(onSelectDate).toHaveBeenCalledWith("2026-08-22");
  });

  it("4일 이하는 균등 분할, 5일 이상은 가로 스크롤 클래스를 쓴다", () => {
    const { unmount } = render(
      <DatePillList
        dates={dates}
        getDisplayDate={(date) => date}
        onSelectDate={vi.fn()}
        selectedDate="2026-08-20"
      />,
    );
    expect(screen.getByLabelText("여행 날짜 선택")).toHaveClass("fit-tabs");

    unmount();

    render(
      <DatePillList
        dates={[...dates, "2026-08-23", "2026-08-24"]}
        getDisplayDate={(date) => date}
        onSelectDate={vi.fn()}
        selectedDate="2026-08-20"
      />,
    );
    expect(screen.getByLabelText("여행 날짜 선택")).toHaveClass("scroll-tabs");
  });
});
