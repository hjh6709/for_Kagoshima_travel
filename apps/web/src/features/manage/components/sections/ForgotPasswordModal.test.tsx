import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendVerificationCode } from "../../../../api/auth";
import { ForgotPasswordModal } from "./ForgotPasswordModal";

vi.mock("../../../../api/auth", () => ({
  forgotPassword: vi.fn(),
  sendVerificationCode: vi.fn(),
}));

describe("ForgotPasswordModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("접근 가능한 dialog 안에 전체 폭 인증 폼을 제공한다", () => {
    render(<ForgotPasswordModal onClose={vi.fn()} onSuccessToast={vi.fn()} />);

    const dialog = screen.getByRole("dialog", { name: "비밀번호 찾기" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("button", { name: "비밀번호 찾기 닫기" })).toBeInTheDocument();
    expect(screen.getByLabelText("계정 이메일")).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("6자리 인증코드")).toHaveAttribute("inputmode", "numeric");
    expect(dialog.querySelector("form")).toHaveClass("auth-form", "forgot-password-form");
  });

  it("가입 이메일로 비밀번호 찾기 인증코드를 요청한다", async () => {
    const user = userEvent.setup();
    vi.mocked(sendVerificationCode).mockResolvedValue({ code: "" });
    render(<ForgotPasswordModal onClose={vi.fn()} onSuccessToast={vi.fn()} />);

    await user.type(screen.getByLabelText("계정 이메일"), "traveler@example.com");
    await user.click(screen.getByRole("button", { name: "인증코드 받기" }));

    expect(sendVerificationCode).toHaveBeenCalledWith("traveler@example.com", "forgot");
    expect(await screen.findByRole("status")).toHaveTextContent(
      "인증코드를 이메일로 보냈습니다",
    );
  });

  it("올바르지 않은 이메일은 외부 요청 전에 안내한다", async () => {
    const user = userEvent.setup();
    vi.mocked(sendVerificationCode).mockResolvedValue({ code: "" });
    render(<ForgotPasswordModal onClose={vi.fn()} onSuccessToast={vi.fn()} />);

    await user.type(screen.getByLabelText("계정 이메일"), "invalid-email");
    await user.click(screen.getByRole("button", { name: "인증코드 받기" }));

    expect(sendVerificationCode).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "올바른 이메일 주소를 입력해 주세요",
    );
  });
});
