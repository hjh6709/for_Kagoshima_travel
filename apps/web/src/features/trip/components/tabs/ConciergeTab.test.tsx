import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { TripPageProps } from "../../tripPageTypes";
import { ConciergeTab } from "./ConciergeTab";

function createProps(destinationCountry: string, overrides: Partial<TripPageProps> = {}): TripPageProps {
  return {
    accommodation: { name: "", address: "" },
    addressCopied: false,
    copyAccommodationAddress: vi.fn(),
    emergencies: [],
    editPlacesHref: "",
    trip: {
      title: "테스트 여행",
      startDate: "2026-08-20",
      endDate: "2026-08-23",
      travelers: ["나"],
      destinationCountry,
    },
    onNavigateToMyPage: vi.fn(),
    ...overrides,
  } as unknown as TripPageProps;
}

async function openToolsTab() {
  await userEvent.click(screen.getByRole("button", { name: "현지 도구" }));
}

describe("ConciergeTab 현지 도구", () => {
  it("일본은 환율과 현지어 문구를 제공한다", async () => {
    render(<ConciergeTab {...createProps("JP")} />);
    await openToolsTab();

    expect(screen.getByRole("button", { name: /환율 계산/ })).toBeVisible();
    expect(screen.getByRole("button", { name: /택시 · 식당 문구/ })).toBeVisible();
  });

  it("현지어 문구를 지원하지 않는 목적지에도 번역 도구를 남긴다", async () => {
    render(<ConciergeTab {...createProps("TH")} />);
    await openToolsTab();

    // 환율은 통화 설정이 있으니 그대로 나온다.
    expect(screen.getByRole("button", { name: /환율 계산/ })).toBeVisible();
    // 문구 위젯이 없는 목적지라도 번역 서비스 링크는 계속 제공해야 한다.
    expect(screen.queryByRole("button", { name: /택시 · 식당 문구/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /번역 도구/ })).toBeVisible();
  });

  it("번역 도구를 열면 번역 서비스 링크를 보여준다", async () => {
    render(<ConciergeTab {...createProps("TH")} />);
    await openToolsTab();
    await userEvent.click(screen.getByRole("button", { name: /번역 도구/ }));

    expect(screen.getByRole("link", { name: /Google 번역 열기/ })).toHaveAttribute(
      "href",
      "https://translate.google.com/?sl=auto&op=translate",
    );
    expect(screen.getByRole("link", { name: /Papago 열기/ })).toHaveAttribute(
      "href",
      "https://papago.naver.com/",
    );
  });

  it("현지어 문구가 있는 목적지에는 번역 도구를 중복해서 넣지 않는다", async () => {
    render(<ConciergeTab {...createProps("JP")} />);
    await openToolsTab();

    expect(screen.queryByRole("button", { name: /번역 도구/ })).not.toBeInTheDocument();
  });

  it("국내 여행처럼 준비된 도구가 없으면 빈 상태를 보여준다", async () => {
    render(<ConciergeTab {...createProps("KR")} />);
    await openToolsTab();

    expect(screen.getByText("이 목적지에는 준비된 도구가 없습니다")).toBeVisible();
  });
});

describe("ConciergeTab 긴급 연락", () => {
  it("전화번호가 있으면 전화 걸기 버튼을 보여준다", () => {
    render(
      <ConciergeTab
        {...createProps("CN", {
          emergencies: [
            { id: "emergency-family", title: "가족 연락", description: "먼저 연락하세요.", phone: "010-1234-5678", callable: true },
          ],
        })}
      />,
    );

    const callLink = screen.getByRole("link", { name: /가족 연락.*010-1234-5678로 전화/ });
    expect(callLink).toHaveAttribute("href", "tel:010-1234-5678");
    expect(screen.queryByText("전화번호가 등록되지 않았습니다")).not.toBeInTheDocument();
  });

  it("전화 가능한 항목인데 번호가 없으면 미등록 상태를 보여준다", () => {
    render(
      <ConciergeTab
        {...createProps("CN", {
          emergencies: [{ id: "emergency-family", title: "가족 연락", description: "먼저 연락하세요.", callable: true }],
        })}
      />,
    );

    expect(screen.getByText("전화번호가 등록되지 않았습니다")).toBeVisible();
  });

  it("원래 전화가 없는 안내형 항목(callable: false)은 전화 줄 자체를 숨긴다", () => {
    render(
      <ConciergeTab
        {...createProps("CN", {
          emergencies: [
            { id: "emergency-passport", title: "여권 분실", description: "경찰서와 영사관 안내를 확인하세요.", callable: false },
          ],
        })}
      />,
    );

    expect(screen.queryByText("전화번호가 등록되지 않았습니다")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /전화/ })).not.toBeInTheDocument();
  });
});
