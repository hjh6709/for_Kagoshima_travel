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

describe("MyPageTab 설정 그룹", () => {
  it("아직 준비되지 않은 설정은 눌리지 않게 두고 준비 중임을 알린다", () => {
    render(
      <MyPageTab
        auth={{ accessToken: "token", user: { id: "user-1", email: "traveler@example.com" } }}
        onAuthChanged={vi.fn()}
        onLogout={vi.fn()}
        trip={trip}
      />,
    );

    for (const label of ["여행 알림", "언어", "오프라인 저장"]) {
      const row = screen.getByRole("button", { name: new RegExp(label) });
      expect(row).toBeDisabled();
      expect(row).toHaveTextContent("준비 중");
    }
  });
});
