import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PlaceDetailSheet } from "./PlaceDetailSheet";

const place = {
  id: "place-1",
  name: "센간엔 정원",
  category: "sightseeing" as const,
  address: "가고시마시 요시노초 9700-1",
  latitude: 31.62,
  longitude: 130.57,
  recommendedReason: "사쿠라지마가 정원 너머로 보입니다.",
};

describe("PlaceDetailSheet", () => {
  it("장소 이름과 설명, 주소를 보여준다", () => {
    render(<PlaceDetailSheet onClose={vi.fn()} place={place} />);

    expect(screen.getByRole("heading", { name: "센간엔 정원" })).toBeVisible();
    expect(screen.getByText("사쿠라지마가 정원 너머로 보입니다.")).toBeVisible();
    expect(screen.getByText("가고시마시 요시노초 9700-1")).toBeVisible();
  });

  it("구글 지도 길찾기 링크를 제공한다", () => {
    render(<PlaceDetailSheet onClose={vi.fn()} place={place} />);

    const link = screen.getByRole("link", { name: /Google 지도/ });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("href")).toContain("google.com");
  });

  it("중국 목적지에서는 고덕지도 링크도 함께 제공한다", () => {
    render(<PlaceDetailSheet destinationCountry="CN" onClose={vi.fn()} place={place} />);

    expect(screen.getByRole("link", { name: /고덕지도/ })).toBeVisible();
    expect(screen.getByRole("link", { name: /Google 지도/ })).toBeVisible();
  });

  it("중국이 아니면 고덕지도 링크를 넣지 않는다", () => {
    render(<PlaceDetailSheet destinationCountry="JP" onClose={vi.fn()} place={place} />);

    expect(screen.queryByRole("link", { name: /고덕지도/ })).not.toBeInTheDocument();
  });

  it("닫기 버튼을 누르면 닫힘을 알린다", async () => {
    const onClose = vi.fn();
    render(<PlaceDetailSheet onClose={onClose} place={place} />);

    await userEvent.click(screen.getByRole("button", { name: "닫기" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("Escape 키로도 닫을 수 있다", async () => {
    const onClose = vi.fn();
    render(<PlaceDetailSheet onClose={onClose} place={place} />);

    await userEvent.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("현지어 이름이 있으면 함께 보여준다", () => {
    render(
      <PlaceDetailSheet
        destinationCountry="CN"
        onClose={vi.fn()}
        place={{ ...place, chineseName: "仙巌园" }}
      />,
    );

    expect(screen.getByText("仙巌园")).toBeVisible();
  });
});

describe("PlaceDetailSheet 장소 행동", () => {
  it("주소 복사 버튼을 누르면 클립보드에 주소를 넣는다", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });

    render(<PlaceDetailSheet onClose={vi.fn()} place={place} />);
    await userEvent.click(screen.getByRole("button", { name: "주소 복사" }));

    expect(writeText).toHaveBeenCalledWith("가고시마시 요시노초 9700-1");
  });

  it("클립보드를 쓸 수 없으면 직접 복사하라고 안내한다", async () => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });

    render(<PlaceDetailSheet onClose={vi.fn()} place={place} />);
    await userEvent.click(screen.getByRole("button", { name: "주소 복사" }));

    expect(screen.getByRole("alert")).toHaveTextContent("길게 눌러");
  });

  it("중국 목적지에서는 기사님께 보여줄 큰 글씨 화면을 시트 안에서 연다", async () => {
    render(
      <PlaceDetailSheet
        destinationCountry="CN"
        onClose={vi.fn()}
        place={{ ...place, chineseName: "仙巌园", chineseAddress: "上海市浦东新区" }}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "기사님께 보기" }));

    expect(screen.getByText("택시 기사님께 보여주세요")).toBeVisible();
    expect(screen.getByRole("heading", { name: "仙巌园" })).toBeVisible();
    expect(screen.getByText("上海市浦东新区")).toBeVisible();
  });

  it("기사님께 보기에서 돌아오면 원래 상세로 복귀한다", async () => {
    render(
      <PlaceDetailSheet
        destinationCountry="CN"
        onClose={vi.fn()}
        place={{ ...place, chineseName: "仙巌园" }}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "기사님께 보기" }));
    await userEvent.click(screen.getByRole("button", { name: "장소 정보로 돌아가기" }));

    expect(screen.getByRole("link", { name: /Google 지도/ })).toBeVisible();
  });

  it("중국이 아니면 기사님께 보기를 넣지 않는다", () => {
    render(<PlaceDetailSheet destinationCountry="JP" onClose={vi.fn()} place={place} />);

    expect(screen.queryByRole("button", { name: "기사님께 보기" })).not.toBeInTheDocument();
  });
});
