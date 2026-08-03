import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ChinaPaymentHelper } from "./ChinaPaymentHelper";

describe("ChinaPaymentHelper", () => {
  it("결제 앱 실행과 출국 전 준비 방법을 명확하게 구분한다", async () => {
    const user = userEvent.setup();
    render(<ChinaPaymentHelper />);

    expect(
      screen.getByRole("heading", { name: "알리페이·위챗 준비" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Alipay 열기" })).toBeVisible();
    expect(screen.getByRole("button", { name: "WeChat 열기" })).toBeVisible();

    const tipButton = screen.getByRole("button", {
      name: "해외 결제 카드 연동 방법",
    });
    expect(tipButton).toHaveAttribute("aria-expanded", "false");

    await user.click(tipButton);

    expect(tipButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/사용할 해외 결제 카드를 앱에 등록/)).toBeVisible();
  });
});
