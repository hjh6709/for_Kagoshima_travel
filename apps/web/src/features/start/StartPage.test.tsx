import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StartPage } from "./StartPage";

describe("StartPage", () => {
  it("여행 준비 흐름과 다음 행동을 한 화면에서 안내한다", () => {
    render(<StartPage />);

    expect(
      screen.getByRole("heading", { name: "여행의 장소와 시간을 하나의 동선으로" }),
    ).toBeVisible();
    expect(screen.getByLabelText("Map Planner 사용 흐름")).toBeVisible();
    expect(screen.getByText("카페와 식당까지 이름으로 검색")).toBeVisible();
    expect(screen.getByText("날짜와 시간 순서로 연결")).toBeVisible();
    expect(screen.getByText("Google 지도 또는 현지 지도 선택")).toBeVisible();
  });

  it("주요 행동은 로그인, 보조 행동은 샘플 여행으로 연결한다", () => {
    render(<StartPage />);

    expect(screen.getByRole("link", { name: "로그인하고 시작하기" })).toHaveAttribute(
      "href",
      "/manage",
    );
    expect(screen.getByRole("link", { name: "샘플 여행 보기" })).toHaveAttribute("href", "/demo");
  });

  it("한국어 사용 흐름을 방해하는 장식용 영문 문구를 표시하지 않는다", () => {
    render(<StartPage />);

    expect(screen.queryByText("YOUR POCKET ATLAS")).not.toBeInTheDocument();
  });
});
