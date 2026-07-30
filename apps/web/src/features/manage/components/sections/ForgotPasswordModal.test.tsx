import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ForgotPasswordModal } from "./ForgotPasswordModal";

describe("ForgotPasswordModal", () => {
  it("접근 가능한 dialog 안에 전체 폭 인증 폼을 제공한다", () => {
    render(<ForgotPasswordModal onClose={vi.fn()} onSuccessToast={vi.fn()} />);

    const dialog = screen.getByRole("dialog", { name: "비밀번호 찾기" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("button", { name: "비밀번호 찾기 닫기" })).toBeInTheDocument();
    expect(screen.getByLabelText("계정 이메일")).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("6자리 인증코드")).toHaveAttribute("inputmode", "numeric");
    expect(dialog.querySelector("form")).toHaveClass("auth-form", "forgot-password-form");
  });
});
