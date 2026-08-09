import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { OwnerTrip } from "../../api/trips";
import type { TripManagePageProps } from "./manageTypes";
import { TripManagePage } from "./TripManagePage";

const existingTrip: OwnerTrip = {
  id: "trip-1",
  title: "상하이 여행",
  startDate: "2026-08-03",
  endDate: "2026-08-06",
  travelers: ["나"],
  destinationCountry: "CN",
};

function createProps(
  ownerTrips: OwnerTrip[],
  overrides: Partial<TripManagePageProps> = {},
): TripManagePageProps {
  return {
    auth: { accessToken: "token", user: { id: "user-1", email: "traveler@example.com" } },
    authChecked: true,
    ownerTrips,
    ownerTripsError: "",
    ownerTripsLoading: false,
    deletingTripID: "",
    onDeleteTrip: vi.fn(),
    newTripTitle: "",
    newTripDestinationCountry: "",
    newTripStartDate: "",
    newTripEndDate: "",
    newTripTravelers: "",
    newTripMemo: "",
    onNewTripTitleChange: vi.fn(),
    onNewTripDestinationCountryChange: vi.fn(),
    onNewTripStartDateChange: vi.fn(),
    onNewTripEndDateChange: vi.fn(),
    onNewTripTravelersChange: vi.fn(),
    onNewTripMemoChange: vi.fn(),
    onSubmitNewTrip: vi.fn(),
    tripCreateError: "",
    tripCreateSubmitting: false,
    ...overrides,
  } as unknown as TripManagePageProps;
}

describe("TripManagePage creation flow", () => {
  it("헤더의 새 여행 버튼이 생성 폼을 열고 화면과 포커스를 이동한다", async () => {
    const originalScrollIntoView = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "scrollIntoView",
    );
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });

    try {
      render(<TripManagePage {...createProps([existingTrip])} />);

      await userEvent.click(screen.getByRole("button", { name: "새 여행" }));

      await waitFor(() => expect(scrollIntoView).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "start",
      }));
      expect(screen.getByLabelText("새 여행 추가 닫기").closest("details")).toHaveAttribute("open");
      expect(screen.getByLabelText("여행명")).toHaveFocus();
    } finally {
      if (originalScrollIntoView) {
        Object.defineProperty(HTMLElement.prototype, "scrollIntoView", originalScrollIntoView);
      } else {
        delete (HTMLElement.prototype as { scrollIntoView?: unknown }).scrollIntoView;
      }
    }
  });

  it("기존 여행이 있으면 생성 폼을 접고 필요할 때 같은 화면에서 연다", async () => {
    render(<TripManagePage {...createProps([existingTrip])} />);

    const disclosure = screen.getByLabelText("새 여행 추가 열기").closest("details");
    expect(disclosure).not.toHaveAttribute("open");
    const existingTripHeading = screen.getByRole("heading", { name: "상하이 여행" });
    expect(existingTripHeading).toBeVisible();
    expect(screen.getByRole("link", { name: "여행 열기" })).toBeVisible();
    expect(screen.getByRole("link", { name: "여행 편집" })).toHaveAttribute(
      "href",
      "/manage/trips/trip-1/edit",
    );
    expect(screen.getByRole("group", { name: "상하이 여행 관리 메뉴" })).toBeInTheDocument();
    expect(
      existingTripHeading.compareDocumentPosition(disclosure as Node) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    await userEvent.click(screen.getByLabelText("새 여행 추가 열기"));

    expect(disclosure).toHaveAttribute("open");
    expect(screen.getByLabelText("여행명")).toBeVisible();
    expect(screen.getByLabelText("여행자")).not.toBeVisible();

    await userEvent.click(screen.getByText(/여행자와 메모/));
    expect(screen.getByLabelText("여행자")).toBeVisible();
  });

  it("첫 사용자에게는 접이식 없이 생성 폼을 바로 보여 준다", () => {
    render(<TripManagePage {...createProps([])} />);

    expect(screen.queryByRole("heading", { name: "여행 목록" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "첫 여행 만들기" })).toBeVisible();
    expect(screen.queryByLabelText("새 여행 추가 닫기")).not.toBeInTheDocument();
    expect(screen.getByLabelText("여행명")).toBeVisible();
  });

  it("첫 사용자도 헤더의 새 여행 버튼으로 생성 폼 위치와 입력 포커스를 확인한다", async () => {
    const originalScrollIntoView = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "scrollIntoView",
    );
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });

    try {
      render(<TripManagePage {...createProps([])} />);

      await userEvent.click(screen.getByRole("button", { name: "새 여행" }));

      await waitFor(() => expect(scrollIntoView).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "start",
      }));
      expect(screen.getByRole("heading", { name: "첫 여행 만들기" })).toBeVisible();
      expect(screen.getByLabelText("여행명")).toHaveFocus();
    } finally {
      if (originalScrollIntoView) {
        Object.defineProperty(HTMLElement.prototype, "scrollIntoView", originalScrollIntoView);
      } else {
        delete (HTMLElement.prototype as { scrollIntoView?: unknown }).scrollIntoView;
      }
    }
  });

  it("여행 목록 오류가 있으면 생성 폼을 숨기고 복구 안내에 집중한다", () => {
    render(<TripManagePage {...createProps([], { ownerTripsError: "여행 목록을 불러오지 못했습니다." })} />);

    expect(screen.getByText("여행 목록을 불러오지 못했습니다.")).toBeVisible();
    expect(screen.queryByLabelText("새 여행 추가 열기")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "첫 여행 만들기" })).not.toBeInTheDocument();
  });

  it("여행 목록을 불러오는 동안 생성 흐름을 함께 노출하지 않는다", () => {
    render(<TripManagePage {...createProps([], { ownerTripsLoading: true })} />);

    expect(screen.getByText("여행 목록을 불러오는 중입니다.")).toBeVisible();
    expect(screen.queryByLabelText("새 여행 추가 열기")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "첫 여행 만들기" })).not.toBeInTheDocument();
  });
});
