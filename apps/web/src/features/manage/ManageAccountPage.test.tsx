import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { TripManagePageProps } from "./manageTypes";
import { ManageAccountPage } from "./ManageAccountPage";

describe("ManageAccountPage", () => {
  it("여행이 없어도 계정과 보안 설정을 보여준다", async () => {
    const onLogout = vi.fn();
    const props = {
      auth: {
        accessToken: "test-token",
        user: { id: "user-1", email: "traveler@example.com" },
      },
      authChecked: true,
      onLogout,
    } as unknown as TripManagePageProps;

    render(<ManageAccountPage {...props} />);

    expect(screen.getByRole("heading", { name: "마이페이지" })).toBeVisible();
    expect(screen.getByText("traveler@example.com")).toBeVisible();
    expect(screen.getByRole("link", { name: "여행 목록" })).toHaveAttribute("href", "/manage");
    expect(screen.getByText("현재 비밀번호를 확인한 뒤 변경할 수 있습니다.")).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "로그아웃" }));
    expect(onLogout).toHaveBeenCalledOnce();
  });
});
