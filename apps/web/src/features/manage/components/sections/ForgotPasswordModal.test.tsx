import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { forgotPassword, sendVerificationCode } from "../../../../api/auth";
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

  it("인증코드 전송 오류를 입력값과 함께 유지한다", async () => {
    const user = userEvent.setup();
    vi.mocked(sendVerificationCode).mockRejectedValue(
      new Error("하루에 최대 3회까지만 인증코드를 요청할 수 있습니다"),
    );
    render(<ForgotPasswordModal onClose={vi.fn()} onSuccessToast={vi.fn()} />);

    const emailInput = screen.getByLabelText("계정 이메일");
    await user.type(emailInput, "traveler@example.com");
    await user.click(screen.getByRole("button", { name: "인증코드 받기" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "하루에 최대 3회까지만 인증코드를 요청할 수 있습니다",
    );
    expect(emailInput).toHaveValue("traveler@example.com");
    expect(screen.getByRole("button", { name: "인증코드 받기" })).toBeEnabled();
  });

  it("숫자 6자리 인증코드로 임시 비밀번호를 발급하고 표시한다", async () => {
    const user = userEvent.setup();
    vi.mocked(forgotPassword).mockResolvedValue({ temporaryPassword: "Ab12!xyz", delivered: false });
    render(<ForgotPasswordModal onClose={vi.fn()} onSuccessToast={vi.fn()} />);

    await user.type(screen.getByLabelText("계정 이메일"), "traveler@example.com");
    await user.type(screen.getByLabelText("6자리 인증코드"), "12a34b56");
    await user.click(screen.getByRole("button", { name: "임시 비밀번호 생성" }));

    expect(forgotPassword).toHaveBeenCalledWith("traveler@example.com", "123456");
    expect(await screen.findByText("Ab12!xyz")).toBeInTheDocument();
  });

  it("클립보드를 지원하지 않으면 임시 비밀번호를 유지하고 직접 복사를 안내한다", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    vi.mocked(forgotPassword).mockResolvedValue({ temporaryPassword: "Ab12!xyz", delivered: false });
    render(<ForgotPasswordModal onClose={onClose} onSuccessToast={vi.fn()} />);

    await user.type(screen.getByLabelText("계정 이메일"), "traveler@example.com");
    await user.type(screen.getByLabelText("6자리 인증코드"), "123456");
    await user.click(screen.getByRole("button", { name: "임시 비밀번호 생성" }));
    await screen.findByText("Ab12!xyz");

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });
    await user.click(
      screen.getByRole("button", { name: "임시 비밀번호 복사하고 닫기" }),
    );

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "임시 비밀번호를 직접 복사해 주세요",
    );
    expect(screen.getByText("Ab12!xyz")).toBeInTheDocument();
  });

  it("이메일로 발송됐으면 임시 비밀번호를 화면에 노출하지 않는다", async () => {
    const user = userEvent.setup();
    vi.mocked(forgotPassword).mockResolvedValue({ temporaryPassword: "", delivered: true });
    const onSuccessToast = vi.fn();
    render(<ForgotPasswordModal onClose={vi.fn()} onSuccessToast={onSuccessToast} />);

    await user.type(screen.getByLabelText("계정 이메일"), "traveler@example.com");
    await user.type(screen.getByLabelText("6자리 인증코드"), "123456");
    await user.click(screen.getByRole("button", { name: "임시 비밀번호 생성" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "이메일로 임시 비밀번호를 보내드렸습니다",
    );
    expect(onSuccessToast).toHaveBeenCalledWith("임시 비밀번호를 이메일로 보냈습니다!");
    expect(screen.queryByText("새로 발급된 임시 비밀번호")).not.toBeInTheDocument();
  });
});
