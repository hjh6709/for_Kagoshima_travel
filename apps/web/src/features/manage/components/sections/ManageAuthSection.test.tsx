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

  it("회원가입을 이메일 인증부터 한 단계씩 안내한다", () => {
    render(<AuthHarness />);

    expect(screen.getByLabelText("이메일 주소")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "인증코드 받기" })).toBeInTheDocument();
    expect(screen.queryByLabelText("6자리 인증코드")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("비밀번호")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "계정 만들고 여행 시작" })).not.toBeInTheDocument();
    expect(screen.queryByText("사람 인증 (수학 퀴즈 방지)")).not.toBeInTheDocument();
  });

  it("인증코드에서 숫자만 유지하고 가입 목적으로 검증한다", async () => {
    const user = userEvent.setup();
    render(<AuthHarness />);

    await user.type(screen.getByLabelText("이메일 주소"), "traveler@example.com");
    await user.click(screen.getByRole("button", { name: "인증코드 받기" }));
    const codeInput = screen.getByLabelText("6자리 인증코드");
    expect(codeInput).toHaveAttribute("inputmode", "numeric");
    expect(codeInput).toHaveAttribute("autocomplete", "one-time-code");
    await user.type(codeInput, "12a34b56");
    expect(codeInput).toHaveValue("123456");
    await user.click(screen.getByRole("button", { name: "코드 확인" }));

    expect(verifyCode).toHaveBeenCalledWith("traveler@example.com", "register", "123456");
    expect(screen.getByText("이메일 인증 완료")).toBeInTheDocument();
    expect(screen.getByLabelText("비밀번호")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "비밀번호 보기" })).not.toHaveAttribute("tabindex", "-1");
    const submitButton = screen.getByRole("button", { name: "계정 만들고 여행 시작" });
    expect(submitButton).toBeInTheDocument();
    expect(new FormData(submitButton.closest("form")!).get("code")).toBe("123456");
  });

  it("로그인으로 전환하면 이전 인증 상태와 코드를 초기화한다", async () => {
    const user = userEvent.setup();
    render(<AuthHarness />);

    await user.type(screen.getByLabelText("이메일 주소"), "traveler@example.com");
    await user.click(screen.getByRole("button", { name: "인증코드 받기" }));
    await user.type(screen.getByLabelText("6자리 인증코드"), "123456");
    await user.click(screen.getByRole("button", { name: "코드 확인" }));
    expect(screen.getByText("이메일 인증 완료")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "로그인" }));
    await user.click(screen.getByRole("button", { name: "회원가입" }));

    expect(screen.queryByText("이메일 인증 완료")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("6자리 인증코드")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "인증코드 받기" })).toBeInTheDocument();
  });

  it("서버 응답에 인증코드가 포함돼도 화면에 코드를 노출하지 않는다", async () => {
    vi.mocked(sendVerificationCode).mockResolvedValue({ code: "123456" });
    const user = userEvent.setup();
    render(<AuthHarness />);

    await user.type(screen.getByLabelText("이메일 주소"), "traveler@example.com");
    await user.click(screen.getByRole("button", { name: "인증코드 받기" }));

    expect(screen.queryByText("가상 이메일 수신 시뮬레이터")).not.toBeInTheDocument();
    expect(screen.queryByText("123456")).not.toBeInTheDocument();
    expect(screen.getByText("인증 메일 발송 완료")).toBeInTheDocument();
  });
});
