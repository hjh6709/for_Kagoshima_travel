import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { trip } from "../../../../data/sampleTrip";
import { MyPageTab } from "./MyPageTab";

describe("MyPageTab demo", () => {
  it("검증된 핵심 기능과 짧은 로그인 행동을 안내한다", () => {
    render(
      <MyPageTab
        isDemo
        onAuthChanged={vi.fn()}
        onLogout={vi.fn()}
        trip={trip}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "계정을 만들고 여행 계획을 저장하세요",
      }),
    ).toBeVisible();
    expect(screen.getByText("장소 검색과 지도 확인")).toBeVisible();
    expect(screen.getByText("날짜별 일정과 준비물")).toBeVisible();
    expect(screen.getByText("읽기 전용 여행 공유")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "내 여행 만들기" }),
    ).toHaveAttribute("href", "/manage");
    expect(screen.queryByText(/평생 무료/)).not.toBeInTheDocument();
  });
});
