import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendVerificationCode, verifyCode } from "../../../../api/auth";
import type { AuthMode } from "../../manageTypes";
import { ManageAuthSection } from "./ManageAuthSection";

vi.mock("../../../../api/auth", () => ({
  sendVerificationCode: vi.fn(),
  verifyCode: vi.fn(),
}));

function AuthHarness() {
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<AuthMode>("register");
  const [password, setPassword] = useState("");

  return (
    <ManageAuthSection
      auth={null}
      authChecked
      authEmail={email}
      authError=""
      authMode={mode}
      authPassword={password}
      authSubmitting={false}
      onAuthEmailChange={setEmail}
      onAuthModeChange={setMode}
      onAuthPasswordChange={setPassword}
      onSubmitAuth={(event) => event.preventDefault()}
    />
  );
}

describe("ManageAuthSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(sendVerificationCode).mockResolvedValue({ code: "" });
    vi.mocked(verifyCode).mockResolvedValue({ verified: true });
  });

  it("숫자 인증코드와 키보드로 조작 가능한 비밀번호 버튼을 제공한다", () => {
    render(<AuthHarness />);

    const codeInput = screen.getByLabelText("이메일 인증 코드 (6자리)");
    expect(codeInput).toHaveAttribute("inputmode", "numeric");
    expect(codeInput).toHaveAttribute("autocomplete", "one-time-code");
    expect(screen.getByRole("button", { name: "비밀번호 보기" })).not.toHaveAttribute("tabindex", "-1");
    expect(screen.queryByText("사람 인증 (수학 퀴즈 방지)")).not.toBeInTheDocument();
  });

  it("인증코드에서 숫자만 유지하고 가입 목적으로 검증한다", async () => {
    const user = userEvent.setup();
    render(<AuthHarness />);

    await user.type(screen.getByLabelText("이메일 주소"), "traveler@example.com");
    await user.click(screen.getByRole("button", { name: "인증코드 전송" }));
    const codeInput = screen.getByLabelText("이메일 인증 코드 (6자리)");
    await user.type(codeInput, "12a34b56");
    expect(codeInput).toHaveValue("123456");
    await user.click(screen.getByRole("button", { name: "코드 확인" }));

    expect(verifyCode).toHaveBeenCalledWith("traveler@example.com", "register", "123456");
    expect(screen.getByText("이메일 인증 완료")).toBeInTheDocument();
  });

  it("로그인으로 전환하면 이전 인증 상태와 코드를 초기화한다", async () => {
    const user = userEvent.setup();
    render(<AuthHarness />);

    await user.type(screen.getByLabelText("이메일 주소"), "traveler@example.com");
    await user.click(screen.getByRole("button", { name: "인증코드 전송" }));
    await user.type(screen.getByLabelText("이메일 인증 코드 (6자리)"), "123456");
    await user.click(screen.getByRole("button", { name: "코드 확인" }));
    expect(screen.getByText("이메일 인증 완료")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "로그인" }));
    await user.click(screen.getByRole("button", { name: "회원가입" }));

    expect(screen.queryByText("이메일 인증 완료")).not.toBeInTheDocument();
    expect(screen.getByLabelText("이메일 인증 코드 (6자리)")).toHaveValue("");
    expect(screen.getByRole("button", { name: "인증코드 전송" })).toBeInTheDocument();
  });
});
